import "server-only"

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
const CALENDAR_API = "https://www.googleapis.com/calendar/v3"

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
]

export type CalendarEvent = {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  htmlLink?: string
  status?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
}

export type CreateEventInput = {
  summary: string
  description?: string
  location?: string
  start: { dateTime: string; timeZone?: string } | { date: string }
  end: { dateTime: string; timeZone?: string } | { date: string }
  attendees?: Array<{ email: string }>
}

/**
 * Builds Google Calendar OAuth consent URL.
 */
export function calendarAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GMAIL_CLIENT_ID
  if (!clientId) {
    throw new Error("GOOGLE_CALENDAR_CLIENT_ID or GMAIL_CLIENT_ID must be set.")
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  })

  return `${AUTH_ENDPOINT}?${params.toString()}`
}

/**
 * Lists calendar events within a time range.
 */
export async function listCalendarEvents(
  accessToken: string,
  options: {
    calendarId?: string
    timeMin?: Date
    timeMax?: Date
    maxResults?: number
  } = {}
): Promise<CalendarEvent[]> {
  const calendarId = encodeURIComponent(options.calendarId ?? "primary")
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(options.maxResults ?? 50),
  })

  if (options.timeMin) {
    params.set("timeMin", options.timeMin.toISOString())
  }
  if (options.timeMax) {
    params.set("timeMax", options.timeMax.toISOString())
  }

  const res = await fetch(
    `${CALENDAR_API}/calendars/${calendarId}/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Google Calendar API error (${res.status}): ${errorText}`)
  }

  const data = (await res.json()) as { items?: CalendarEvent[] }
  return data.items ?? []
}

/**
 * Creates a new event in Google Calendar (e.g. focused execution block or client deadline).
 */
export async function createCalendarEvent(
  accessToken: string,
  event: CreateEventInput,
  calendarId = "primary"
): Promise<CalendarEvent> {
  const encodedCalId = encodeURIComponent(calendarId)

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodedCalId}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Failed to create Calendar event (${res.status}): ${errorText}`)
  }

  return (await res.json()) as CalendarEvent
}
