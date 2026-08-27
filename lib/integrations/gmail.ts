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
  const envBase = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
  const cleanPath = path.startsWith("/") ? path : `/${path}`

  if (envBase) {
    return `${envBase.replace(/\/$/, "")}${cleanPath}`
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host")
  const hostHeader = request.headers.get("host")
  const urlHost = new URL(request.url).host

  const rawHost = (forwardedHost || hostHeader || urlHost).split(",")[0].trim()
  const host = rawHost.replace(/:80$/, "").replace(/:443$/, "")
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1")
  const proto = forwardedProto || (isLocal ? "http" : "https")

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
type GmailBody = { data?: string; attachmentId?: string; size?: number }
type GmailPart = {
  mimeType?: string
  filename?: string
  body?: GmailBody
  parts?: GmailPart[]
}
type GmailPayload = {
  headers?: GmailHeader[]
  filename?: string
  parts?: GmailPart[]
  body?: GmailBody
}
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
  cursor?: string,
  searchQuery?: string
): Promise<{ messages: NormalizedEmail[]; nextCursor?: string }> {
  const url = new URL(`${GMAIL_API}/messages`)
  url.searchParams.set("maxResults", searchQuery ? "50" : "30")

  // If user searched for something specific, search across ALL mail excluding only trash/spam
  if (searchQuery && searchQuery.trim()) {
    url.searchParams.set("q", `-label:spam -label:trash (${searchQuery.trim()})`)
  } else {
    // General sync: include all categories (primary, updates, promotions where bank alerts often land)
    url.searchParams.set(
      "q",
      "-label:spam -label:trash -category:social -category:forums"
    )
  }
  if (cursor && !searchQuery) url.searchParams.set("pageToken", cursor)

  const res = await fetch(url.toString(), {
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

  // If user explicitly queried something, fetch ALL matching messages without cheap filtering
  if (searchQuery && searchQuery.trim()) {
    const fetched = await Promise.all(
      refs.slice(0, 30).map((ref) => gmailGet(accessToken, ref.id).catch(() => null))
    )
    return {
      messages: fetched.filter((m): m is NormalizedEmail => Boolean(m)),
      nextCursor: data.nextPageToken,
    }
  }

  // Otherwise, cheap filter for general background sync
  const metas = await Promise.all(refs.map((ref) => gmailGetMeta(accessToken, ref.id).catch(() => null)))
  const candidates: { id: string }[] = []
  for (let i = 0; i < refs.length; i++) {
    const meta = metas[i]
    if (!meta) continue
    const cheap = cheapClassifyMeta({ headers: meta.headers, snippet: meta.snippet, internalDate: meta.internalDate }, meta.snippet)
    if (cheap.verdict === "CANDIDATE") candidates.push({ id: refs[i].id })
  }

  const fetched = await Promise.all(candidates.map((ref) => gmailGet(accessToken, ref.id).catch(() => null)))

  return {
    messages: fetched.filter((m): m is NormalizedEmail => Boolean(m)),
    nextCursor: data.nextPageToken,
  }
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

/**
 * A file hanging off a Gmail message.
 *
 * Gmail never returns attachment bytes with the message — the payload carries
 * only an `attachmentId` per part, redeemed separately. Listing is therefore
 * cheap and downloading is explicit, which is what lets the statement pipeline
 * decide whether a file is worth pulling before it pulls it.
 */
export type GmailAttachmentRef = {
  attachmentId: string
  filename: string
  mimeType: string
  sizeBytes: number
}

/// Walks the MIME tree for parts that are real files. A part is an attachment
/// when it has both a filename and an attachment id; body alternatives have
/// neither, and inline images have both — so they are collected here and left
/// for the caller to filter on mime type or size.
function collectAttachments(part: GmailPart | undefined, into: GmailAttachmentRef[]) {
  if (!part) return

  if (part.filename && part.body?.attachmentId) {
    into.push({
      attachmentId: part.body.attachmentId,
      filename: part.filename,
      mimeType: part.mimeType ?? "application/octet-stream",
      sizeBytes: part.body.size ?? 0,
    })
  }

  for (const child of part.parts ?? []) collectAttachments(child, into)
}

/// Pure transform, exported so attachment discovery can be tested without the
/// network — same reasoning as `normalizeGmailMessage`.
export function attachmentsOf(msg: {
  payload?: GmailPayload
}): GmailAttachmentRef[] {
  const found: GmailAttachmentRef[] = []
  collectAttachments(msg.payload, found)
  return found
}

/// Fetches a message purely to read its MIME tree.
export async function listGmailAttachments(
  accessToken: string,
  externalId: string
): Promise<GmailAttachmentRef[]> {
  const res = await fetch(
    `${GMAIL_API}/messages/${encodeURIComponent(externalId)}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) {
    throw new Error(`Gmail get message failed: ${res.status}`)
  }
  return attachmentsOf((await res.json()) as GmailMessage)
}

/**
 * Redeems one attachment id for its bytes.
 *
 * Gmail answers with base64url inside a JSON envelope rather than a binary
 * stream, so the decoded file necessarily lands in memory in one piece. Callers
 * check the advertised `sizeBytes` from the listing first, which makes skipping
 * an oversized file free.
 */
export async function fetchGmailAttachment(
  accessToken: string,
  externalId: string,
  attachmentId: string
): Promise<Buffer> {
  const res = await fetch(
    `${GMAIL_API}/messages/${encodeURIComponent(externalId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) {
    throw new Error(`Gmail attachment fetch failed: ${res.status}`)
  }

  const payload = (await res.json()) as { data?: string; size?: number }
  if (!payload.data) {
    throw new Error("Gmail returned an attachment with no data.")
  }

  return Buffer.from(payload.data, "base64url")
}

export const gmailProvider: EmailProvider = {
  listMessages: gmailList,
  getMessage: (accessToken, externalId) => gmailGet(accessToken, externalId),
}

export type { StoredTokens }

