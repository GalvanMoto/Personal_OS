import { getCurrentSession } from "@/lib/auth/dal"
import { signState } from "@/lib/auth/session"
import { calendarAuthUrl } from "@/lib/integrations/calendar"
import { getPublicRedirectUri } from "@/lib/integrations/gmail"

export async function GET(request: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return Response.json({ error: "Sign in to connect Google Calendar." }, { status: 401 })
  }

  const workspace = new URL(request.url).searchParams.get("workspace")
  if (!workspace) {
    return Response.json({ error: "workspace is required." }, { status: 400 })
  }

  const redirectUri = getPublicRedirectUri(request, "/api/integrations/calendar/callback")

  try {
    const state = signState(workspace)
    const authUrl = calendarAuthUrl(redirectUri, state)
    return new Response(null, {
      status: 302,
      headers: { Location: authUrl },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start Calendar auth."
    return Response.json({ error: message }, { status: 500 })
  }
}
