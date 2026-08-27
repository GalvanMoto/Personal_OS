import "server-only"

import type { EmailProvider, NormalizedEmail } from "./types"

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"
const USERINFO_API = "https://www.googleapis.com/oauth2/v3/userinfo"

/// Modify mail (read, mark read, trash/bin) plus the user's email address for the account label.
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
]

export async function trashGmailMessage(
  accessToken: string,
  externalId: string
): Promise<boolean> {
  try {
    const res = await fetch(`${GMAIL_API}/messages/${encodeURIComponent(externalId)}/trash`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })
    return res.ok
  } catch {
    return false
  }
}

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
  labelIds?: string[]
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

  const listUnsubscribe = headerValue(headers, "List-Unsubscribe")
  const inReplyTo = headerValue(headers, "In-Reply-To")
  const references = headerValue(headers, "References")
  const subject = headerValue(headers, "Subject")
  const isReply = Boolean(inReplyTo || references || /^re:\s*/i.test(subject || ""))

  return {
    externalId: msg.id,
    threadId: msg.threadId,
    subject,
    fromName: from?.name,
    fromEmail: from?.email,
    toEmails: to,
    snippet: msg.snippet,
    body: extractBody(msg.payload),
    receivedAt,
    listUnsubscribe,
    labels: msg.labelIds,
    isReply,
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

// Cheap metadata fetch (headers + snippet, no body) for AI-last classification.
// Uses format=metadata to avoid downloading full body for promos that will be skipped.
async function gmailGetMeta(
  accessToken: string,
  externalId: string
): Promise<{ id: string; threadId: string; snippet?: string; headers?: GmailHeader[]; internalDate?: string }> {
  const url = new URL(`${GMAIL_API}/messages/${externalId}`)
  url.searchParams.set("format", "metadata")
  url.searchParams.set("metadataHeaders", "From,Subject,To,Date,List-Unsubscribe,X-GM-LABELS")
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Gmail get meta failed: ${res.status}`)
  }
  return (await res.json()) as { id: string; threadId: string; snippet?: string; payload?: { headers?: GmailHeader[] }; internalDate?: string }
}

function cheapClassifyMeta(
  meta: { snippet?: string; headers?: GmailHeader[]; internalDate?: string },
  rawSnippet?: string
): { verdict: "NOISE" | "CANDIDATE"; reason: string } {
  const headers = meta.headers ?? []
  const from = (headerValue(headers, "From") ?? "").toLowerCase()
  const subject = (headerValue(headers, "Subject") ?? "").toLowerCase()
  const text = `${subject}\n${meta.snippet ?? rawSnippet ?? ""}`.toLowerCase()
  const hasUnsub = headers.some((h) => h.name.toLowerCase() === "list-unsubscribe")
  // Wealth, Mutual Funds, and Financial transactions are always prioritized candidates
  const isFinance = /(sip|statement|transaction|invoice|receipt|fund|holding|folio|ucc \d+|nj ewealth|njgroup|cams|kfintech|zerodha|groww|bank)/.test(text)
  if (isFinance) {
    return { verdict: "CANDIDATE", reason: "financial_investment" }
  }

  const labels = (headerValue(headers, "X-GM-LABELS") ?? "").toLowerCase()
  if (labels.includes("category_social") || labels.includes("category_forums")) {
    return { verdict: "NOISE", reason: "gmail_label" }
  }
  // Spam & cold marketing blasts with heavy promotional keywords
  if (/(% off|limited time offer|flash sale|discount code|deals of the week|promo code|mega sale|buy now)/.test(text)) {
    return { verdict: "NOISE", reason: "promo_keywords" }
  }
  return { verdict: "CANDIDATE", reason: "needs_full" }
}

async function gmailList(
  accessToken: string,
  cursor?: string
): Promise<{ messages: NormalizedEmail[]; nextCursor?: string }> {
  const url = new URL(`${GMAIL_API}/messages`)
  url.searchParams.set("maxResults", "15")
  // Keep Gmail-side filters, but also do cheap client-side promo filter to save AI quota
  url.searchParams.set(
    "q",
    "in:inbox category:primary -category:promotions -category:social -category:spam -category:forums -label:spam -label:trash"
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

  const refs = data.messages ?? []
  if (refs.length === 0) return { messages: [], nextCursor: data.nextPageToken }

  // Stage 1: cheap metadata for all 30 (no body) — ~1 quota unit vs 5 for full
  const metas = await Promise.all(refs.map((ref) => gmailGetMeta(accessToken, ref.id).catch(() => null)))
  const candidates: { id: string }[] = []
  for (let i = 0; i < refs.length; i++) {
    const meta = metas[i]
    if (!meta) continue
    const cheap = cheapClassifyMeta({ headers: meta.headers, snippet: meta.snippet, internalDate: meta.internalDate }, meta.snippet)
    if (cheap.verdict === "CANDIDATE") candidates.push({ id: refs[i].id })
    // NOISE promos are skipped entirely — no full fetch, no AI, no storage
  }

  // Stage 2: fetch full body ONLY for candidates that passed cheap filter
  // This is where AI quota is spent: at most ~30% of the batch in practice
  const messages = await Promise.all(candidates.map((ref) => gmailGet(accessToken, ref.id)))

  return { messages, nextCursor: data.nextPageToken }
}

export const gmailProvider: EmailProvider = {
  listMessages: gmailList,
  getMessage: (accessToken, externalId) => gmailGet(accessToken, externalId),
}

export type { StoredTokens }
