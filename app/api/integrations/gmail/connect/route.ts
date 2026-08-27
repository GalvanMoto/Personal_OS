import { getCurrentSession } from "@/lib/auth/dal"
import { signState } from "@/lib/auth/session"
import { gmailAuthUrl, getPublicRedirectUri } from "@/lib/integrations/gmail"

/**
 * Kicks off the Gmail OAuth flow.
 *
 * The workspace slug is passed as `state` so the callback can attach the
 * resulting integration to the right tenant; membership is re-checked there.
 */
export async function GET(request: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return Response.json({ error: "Sign in to connect Gmail." }, { status: 401 })
  }

  const workspace = new URL(request.url).searchParams.get("workspace")
  if (!workspace) {
    return Response.json({ error: "workspace is required." }, { status: 400 })
  }

  const redirectUri = getPublicRedirectUri(request, "/api/integrations/gmail/callback")

  try {
    const state = signState(workspace)
    const authUrl = gmailAuthUrl(redirectUri, state)
    return new Response(null, {
      status: 302,
      headers: { Location: authUrl },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start Gmail auth."
    return Response.json({ error: message }, { status: 500 })
  }
}
