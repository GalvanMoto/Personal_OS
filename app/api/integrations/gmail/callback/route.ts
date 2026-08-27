import { getCurrentSession } from "@/lib/auth/dal"
import { verifyState } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { tenantDb } from "@/lib/db/tenant"
import { encryptSecret } from "@/lib/security/secret"
import {
  exchangeCodeForTokens,
  fetchUserInfo,
  getPublicRedirectUri,
  GMAIL_SCOPES,
} from "@/lib/integrations/gmail"
import { enqueue } from "@/lib/jobs/queue"

/**
 * Google's OAuth redirect target.
 *
 * Exchanges the code for tokens, stores them encrypted against the workspace
 * named in `state` (after confirming the signed-in user is a member), then
 * kicks off an initial sync. Tokens never leave this server as plaintext.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const workspace = url.searchParams.get("state")
  const oauthError = url.searchParams.get("error")

  const session = await getCurrentSession()
  if (!session) {
    return Response.json({ error: "Sign in to connect Gmail." }, { status: 401 })
  }

  if (oauthError) {
    return Response.json({ error: `Google refused: ${oauthError}` }, { status: 400 })
  }
  if (!code || !workspace) {
    return Response.json({ error: "Missing code or state." }, { status: 400 })
  }

  const verifiedWorkspace = verifyState(workspace)
  if (!verifiedWorkspace) {
    return Response.json({ error: "Invalid OAuth state (CSRF)." }, { status: 403 })
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, tenant: { slug: verifiedWorkspace } },
    include: { tenant: true },
  })
  if (!membership) {
    return Response.json({ error: "Workspace access denied." }, { status: 403 })
  }

  const tenantId = membership.tenant.id
  const workspaceSlug = verifiedWorkspace
  const db = tenantDb(tenantId)
  const redirectUri = getPublicRedirectUri(request, "/api/integrations/gmail/callback")

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    let accountRef: string | undefined
    try {
      const info = await fetchUserInfo(tokens.accessToken)
      accountRef = info.email
    } catch {
      // Account label is best-effort; absence does not block the connection.
    }

    const secretCipher = encryptSecret(
      JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
      })
    )

    await db.integration.upsert({
      where: { tenantId_provider: { tenantId, provider: "GMAIL" } },
      create: {
        provider: "GMAIL",
        status: "CONNECTED",
        secretCipher,
        accountRef: accountRef ?? null,
        scopes: GMAIL_SCOPES,
        lastSyncAt: new Date(),
      } as never,
      update: {
        status: "CONNECTED",
        secretCipher,
        accountRef: accountRef ?? null,
        scopes: GMAIL_SCOPES,
        lastSyncAt: new Date(),
      } as never,
    })

    const integration = await db.integration.findUnique({
      where: { tenantId_provider: { tenantId, provider: "GMAIL" } },
    })
    if (integration) {
      await enqueue(db, "email.sync", { integrationId: integration.id })

      // No standing worker in the self-hosted setup: run the queue now so the
      // initial sync completes before we redirect the user back.
      const { drain } = await import("@/lib/jobs/runner")
      await drain(2)
    }

    return new Response(null, {
      status: 302,
      headers: { Location: new URL(`/w/${workspaceSlug}/settings/integrations`, request.url).toString() },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail connection failed."
    return Response.json({ error: message }, { status: 502 })
  }
}
