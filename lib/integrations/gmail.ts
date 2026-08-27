import "server-only"

import type { EmailProvider, NormalizedEmail } from "./types"

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"
const USERINFO_API = "https://www.googleapis.com/oauth2/v3/userinfo"

/// Read-only mail plus the user's email address for the account label.
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
]

type StoredTokens = {
  accessToken: string
  refreshToken: string | null
  expiresAt: number
  scope?: string
}

type GmailTokensResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
}

function requireEnv(name: "GMAIL_CLIENT_ID" | "GMAIL_CLIENT_SECRET"): string {
  const altKey = name === "GMAIL_CLIENT_ID" ? "GOOGLE_CLIENT_ID" : "GOOGLE_CLIENT_SECRET"
  const value = process.env[name] || process.env[altKey]
  if (!value) {
    throw new Error(`${name} or ${altKey} is not set. Copy .env.example to .env.`)
  }
  return value
}

/**
 * Resolves the public, external redirect URI regardless of reverse proxies.
 */
export function getPublicRedirectUri(
  request: Request,
  path: string = "/api/integrations/gmail/callback"
): string {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const hostHeader = request.headers.get("host")
  const urlHost = new URL(request.url).host

  const host = forwardedHost || hostHeader || urlHost
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1")
  const proto = isLocal ? "http" : "https"
  const cleanPath = path.startsWith("/") ? path : `/${path}`

  return `${proto}://${host}${cleanPath}`
}

/**
 * Builds the Google consent URL.
 *
 * `state` carries the workspace slug so the callback knows which tenant to
 * attach the resulting integration to; it is not a security token, so callers
 * must still verify membership on return (done in the callback route).
 */
export function gmailAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GMAIL_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  })

  return `${AUTH_ENDPOINT}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<StoredTokens> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requireEnv("GMAIL_CLIENT_ID"),
      client_secret: requireEnv("GMAIL_CLIENT_SECRET"),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!res.ok) {
    throw new Error(`Gmail token exchange failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as GmailTokensResponse
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: number }> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GMAIL_CLIENT_ID"),
      client_secret: requireEnv("GMAIL_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) {
    throw new Error(`Gmail token refresh failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as GmailTokensResponse
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

export async function fetchUserInfo(accessToken: string): Promise<{
  email?: string
  name?: string
}> {
  const res = await fetch(USERINFO_API, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return {}
  return (await res.json()) as { email?: string; name?: string }
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

type GmailHeader = { name: string; value: string }
type GmailBody = { data?: string }
type GmailPart = { mimeType?: string; body?: GmailBody; parts?: GmailPart[] }
type GmailPayload = { headers?: GmailHeader[]; parts?: GmailPart[]; body?: GmailBody }
type GmailMessage = {
  id: string
  threadId: string
  snippet?: string
  payload?: GmailPayload
  internalDate?: string
}

function headerValue(headers: GmailHeader[] | undefined, name: string): string | undefined {
  const header = headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())
  return header?.value
}

function decodeBase64Url(data?: string): string {
  if (!data) return ""
  return Buffer.from(data, "base64url").toString("utf8")
}

/// Recursively pulls the most useful body: plain text preferred, HTML as a
/// fallback (tags intact — good enough for extraction, and the raw text stays
/// in the EmailMessage row for later).
function extractBody(part?: GmailPart): string {
  if (!part) return ""

  if (part.body?.data) {
    return decodeBase64Url(part.body.data)
  }

  const sub = part.parts ?? []
  const plain = sub.find((p) => p.mimeType === "text/plain")
  if (plain) return extractBody(plain)

  const html = sub.find((p) => p.mimeType === "text/html")
  if (html) return extractBody(html)

  // Unknown multipart: try children in order.
  return sub.map(extractBody).find((text) => text.length > 0) ?? ""
}

function splitAddress(value: string | undefined):
  | { name?: string; email?: string }
  | undefined {
  if (!value) return undefined
  const match = value.match(/^(?:(.+?)\s*)?<(.+?)>$/)
  if (match) {
    return {
      name: match[1]?.trim() || undefined,
      email: match[2]?.trim().toLowerCase(),
    }
  }
  return { email: value.trim().toLowerCase() }
}

/// Pure transform from a Gmail message to the normalized shape. Exported so it
/// can be unit-tested without touching the network.
export function normalizeGmailMessage(msg: GmailMessage): NormalizedEmail {
  const headers = msg.payload?.headers ?? []
  const from = splitAddress(headerValue(headers, "From"))
  const to = (headerValue(headers, "To") ?? "")
    .split(",")
    .map((value) => splitAddress(value)?.email)
    .filter((email): email is string => Boolean(email))

  const dateHeader = headerValue(headers, "Date")
  const receivedAt = msg.internalDate
    ? new Date(Number(msg.internalDate))
    : dateHeader
      ? new Date(dateHeader)
      : new Date()

  return {
    externalId: msg.id,
    threadId: msg.threadId,
    subject: headerValue(headers, "Subject"),
    fromName: from?.name,
    fromEmail: from?.email,
    toEmails: to,
    snippet: msg.snippet,
    body: extractBody(msg.payload),
    receivedAt,
  }
}

async function gmailGet(accessToken: string, externalId: string): Promise<NormalizedEmail> {
  const res = await fetch(`${GMAIL_API}/messages/${externalId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Gmail get message failed: ${res.status}`)
  }
  const msg = (await res.json()) as GmailMessage
  return normalizeGmailMessage(msg)
}

async function gmailList(
  accessToken: string,
  cursor?: string
): Promise<{ messages: NormalizedEmail[]; nextCursor?: string }> {
  const url = new URL(`${GMAIL_API}/messages`)
  url.searchParams.set("maxResults", "30")
  url.searchParams.set(
    "q",
    "category:primary -category:promotions -category:social -category:spam -category:forums -label:spam -label:trash"
  )
  if (cursor) url.searchParams.set("pageToken", cursor)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Gmail list failed: ${res.status}`)
  }

  const data = (await res.json()) as {
    messages?: { id: string; threadId: string }[]
    nextPageToken?: string
  }

  const messages = await Promise.all(
    (data.messages ?? []).map((ref) => gmailGet(accessToken, ref.id))
  )

  return { messages, nextCursor: data.nextPageToken }
}

export const gmailProvider: EmailProvider = {
  listMessages: gmailList,
  getMessage: (accessToken, externalId) => gmailGet(accessToken, externalId),
}

export type { StoredTokens }
