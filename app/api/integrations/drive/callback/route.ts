import { getCurrentSession } from "@/lib/auth/dal"
import { verifyState } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { tenantDb } from "@/lib/db/tenant"
import { encryptSecret } from "@/lib/security/secret"
import {
  exchangeCodeForDriveTokens,
  DRIVE_SCOPES,
} from "@/lib/integrations/drive"
import { fetchUserInfo, getPublicRedirectUri } from "@/lib/integrations/gmail"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const workspace = url.searchParams.get("state")
  const oauthError = url.searchParams.get("error")

  const session = await getCurrentSession()
  if (!session) {
    return Response.json({ error: "Sign in to connect Google Drive." }, { status: 401 })
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
  const redirectUri = getPublicRedirectUri(request, "/api/integrations/drive/callback")

  try {
    const tokens = await exchangeCodeForDriveTokens(code, redirectUri)

    let accountRef: string | undefined
    try {
      const info = await fetchUserInfo(tokens.accessToken)
      accountRef = info.email?.toLowerCase()
    } catch {
      // Non-fatal
    }
    const resolvedAccountRef = accountRef || `drive-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const secretCipher = encryptSecret(
      JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
      })
    )

    await db.integration.upsert({
      where: { tenantId_provider_accountRef: { tenantId, provider: "GOOGLE_DRIVE", accountRef: resolvedAccountRef } },
      create: {
        provider: "GOOGLE_DRIVE",
        status: "CONNECTED",
        secretCipher,
        accountRef: resolvedAccountRef,
        scopes: DRIVE_SCOPES,
        lastSyncAt: new Date(),
      } as never,
      update: {
        status: "CONNECTED",
        secretCipher,
        scopes: DRIVE_SCOPES,
        lastSyncAt: new Date(),
      } as never,
    })

    return new Response(null, {
      status: 302,
      headers: { Location: `/w/${workspaceSlug}/settings/integrations` },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Drive connection failed."
    return Response.json({ error: message }, { status: 502 })
  }
}
