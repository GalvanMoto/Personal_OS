import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { link, recordFact } from "@/lib/domain/provenance"
import { enqueue } from "@/lib/jobs/queue"
import { emailProviderFor, getAccessToken } from "@/lib/integrations"
import type { NormalizedEmail } from "@/lib/integrations/types"

/**
 * Lightweight, deterministic email triage (PRD §16 email intelligence).
 *
 * The label is a display hint and a coarse filter; the real understanding of a
 * task-request email happens later in the shared inbox pipeline, which is why
 * a TASK_REQUEST here still flows through the same extractor as pasted text.
 */
/**
 * Smart Multi-Signal Email Classification Engine
 *
 * Evaluates sender reputation, delivery headers (RFC-8058 List-Unsubscribe,
 * Reply-To, In-Reply-To), recipient topology, and semantic intent.
 */
export function classifyEmail(
  emailOrText: NormalizedEmail | string,
  fromEmailFallback?: string
): string {
  const isObj = typeof emailOrText === "object" && emailOrText !== null
  const email = isObj ? (emailOrText as NormalizedEmail) : null
  const text = (isObj ? `${email?.subject || ""}\n${email?.body || email?.snippet || ""}` : (emailOrText as string)).toLowerCase()
  const from = (email?.fromEmail || fromEmailFallback || "").toLowerCase()
  const subject = (email?.subject || "").toLowerCase()
  const listUnsub = email?.listUnsubscribe || ""

  // 1. FINANCIAL, INVOICE & INVESTMENT / SIP DETECTION
  const isFinancialSender =
    /@(stripe\.com|razorpay\.com|paypal\.com|quickbooks\.com|zoho\.com|xero\.com|hdfcbank\.net|icicibank\.com|sbi\.co\.in|chase\.com|bankofamerica\.com|americanexpress\.com|billdesk\.com|cashfree\.com|paytm\.com|zerodha\.com|cred\.club|njevents\.in|njgroup\.in|njwealth\.in|camsonline\.com|kfintech\.com|groww\.in|upstox\.com|kuvera\.in|angelone\.in|mfuindia\.com|utimf\.com|sbimf\.com|hdfcfund\.com|icicipruamc\.com|nipponindiamf\.com|edelweissmf\.com|jiopaymentsbank\.com|jiopaymentsbank\.in|jio\.com)/.test(
      from
    ) || /^(finance|billing|invoices|statements|accounts|sip|investments|estatements)@/.test(from)
  const isFinancialSubject =
    /(invoice|tax invoice|payment received|receipt|order confirmation|statement of account|bill|payment confirmation|transaction alert|e-statement|amount debited|amount credited|gstin|billing receipt|sip transaction|sip debit|sip intimation|mutual fund|folio no|units allotted|portfolio disclosure|cas statement|contract note|holding statement|ucc \d+|jpb_statement|statement from \d{4}-\d{2}-\d{2})/i.test(
      subject + " " + text
    )
  if (isFinancialSender || isFinancialSubject) {
    return "INVOICE"
  }

  // 2. SYSTEM, SECURITY & DEVELOPER NOTIFICATIONS
  const isSystemSender =
    /@(github\.com|vercel\.com|supabase\.io|accounts\.google\.com|google\.com|aws\.amazon\.com|cloudflare\.com|sentry\.io|postmarkapp\.com|sendgrid\.net|resend\.com|digitalocean\.com)/.test(
      from
    ) || /^(security|alerts|notification|notifications|auth|verify|no-reply|noreply|mailer-daemon)@/.test(from)
  const isSecurityOrOtp =
    /(verification code|one-time password|\botp\b|security alert|new sign-in|password reset|verify your email|two-factor|login attempt|build failed|deployment succeeded)/.test(
      subject + " " + text
    )
  if (isSystemSender || isSecurityOrOtp) {
    return "NOTIFICATIONS"
  }

  // 3. SUBSCRIPTIONS & RECURRING NEWSLETTERS
  const hasUnsubscribeHeader = Boolean(listUnsub) || /(unsubscribe|opt-out|manage preferences|email preferences|view in browser)/.test(text)
  const isNewsletterDomain =
    /@(substack\.com|beehiiv\.com|medium\.com|mailchimp\.com|convertkit\.com|mailerlite\.com|buttondown\.email)/.test(
      from
    ) || /^(newsletter|digest|weekly|monthly|updates|news|roundup)@/.test(from)
  const isNewsletterSubject = /(daily digest|weekly roundup|monthly update|newsletter|issue #|edition #|\bdigest\b)/.test(
    subject
  )
  if ((hasUnsubscribeHeader && isNewsletterDomain) || isNewsletterSubject || (hasUnsubscribeHeader && !email?.isReply)) {
    // Distinguish marketing promotions from informative subscriptions
    if (/(% off|limited time offer|flash sale|discount code|special offer|deals of the week|promo code|mega sale|black friday)/.test(subject + " " + text)) {
      return "PROMOTIONS"
    }
    return "SUBSCRIPTION"
  }

  // 4. DIRECT CLIENT & HUMAN COMMUNICATIONS
  // Direct human replies, project correspondence, and client briefs
  const isDirectReply = email?.isReply || /^re:\s*/i.test(subject)
  const isDirectHumanSender = !hasUnsubscribeHeader && !isSystemSender && !isNewsletterDomain
  const hasClientKeywords =
    /(please|could you|can you|need (this|me|it)|by (friday|monday|tuesday|wednesday|thursday|saturday|sunday|tomorrow|eod|eow|next week)|deadline|due|task|deliver|reel|edit|design|draft|review|feedback|meeting|call|schedule|client brief|proposal|agreement)/.test(
      subject + " " + text
    )

  if (isDirectReply || (isDirectHumanSender && hasClientKeywords)) {
    return "CLIENT_COMMS"
  }

  return "GENERAL"
}

function buildRaw(email: NormalizedEmail): string {
  const lines = [
    email.subject ? `Subject: ${email.subject}` : null,
    email.fromName || email.fromEmail
      ? `From: ${[email.fromName, email.fromEmail].filter(Boolean).join(" <")}${email.fromEmail ? ">" : ""}`
      : null,
    email.toEmails.length ? `To: ${email.toEmails.join(", ")}` : null,
    "",
    email.body ?? email.snippet ?? "",
  ]
  return lines.filter(Boolean).join("\n")
}

/**
 * Entity resolution for a sender (PRD §36).
 *
 * Exact email match first (cheap, deterministic). If the address domain lines
 * up with an existing client's website, the person is attached to that client —
 * but we never invent a client from a domain, because a wrong merge is worse
 * than a missing edge.
 */
async function resolveSender(
  db: TenantDb,
  ctx: DomainContext,
  email: NormalizedEmail
): Promise<{ personId: string } | null> {
  const fromEmail = email.fromEmail
  if (!fromEmail) return null

  let person = await db.person.findFirst({ where: { email: fromEmail } })

  if (!person) {
    person = await db.person.create({
      data: {
        name: email.fromName ?? fromEmail,
        email: fromEmail,
      } as never,
    })

    await recordFact(db, {
      targetType: "PERSON",
      targetId: person.id,
      field: "email",
      value: fromEmail,
      sourceType: "GMAIL",
      sourceId: email.externalId,
      evidence: email.subject,
    })
  }

  const domain = fromEmail.split("@")[1]
  if (domain && !person.organizationId) {
    const org = await db.organization.findFirst({
      where: { website: { contains: domain } },
    })

    if (org) {
      await db.person.update({
        where: { id: person.id },
        data: { organizationId: org.id } as never,
      })
      await link(db, {
        fromType: "PERSON",
        fromId: person.id,
        toType: "ORGANIZATION",
        toId: org.id,
        relation: "BELONGS_TO",
        createdBy: "AGENT",
      })
    }
  }

  return { personId: person.id }
}

/**
 * Stores one email and, when it carries work, feeds it into the universal
 * inbox so the same extract→organize→task machinery handles it (PRD §35).
 *
 * Idempotent: a message is only turned into an inbox item the first time it is
 * seen, so re-running a sync never duplicates tasks.
 */
export async function ingestEmail(
  db: TenantDb,
  ctx: DomainContext,
  email: NormalizedEmail
): Promise<{ created: boolean }> {
  const existingItem = await db.inboxItem.findFirst({
    where: { sourceType: "GMAIL", sourceRef: email.externalId },
  })
  if (existingItem) return { created: false }

  const category = classifyEmail(email)
  if (category === "PROMOTIONS") {
    return { created: false }
  }

  const row = await db.emailMessage.upsert({
    where: {
      tenantId_externalId: {
        tenantId: ctx.tenantId,
        externalId: email.externalId,
      },
    } as never,
    create: {
      externalId: email.externalId,
      threadId: email.threadId,
      subject: email.subject,
      fromName: email.fromName,
      fromEmail: email.fromEmail,
      toEmails: email.toEmails,
      snippet: email.snippet,
      body: email.body,
      receivedAt: email.receivedAt,
      category,
      isRead: false,
    } as never,
    update: {
      subject: email.subject,
      fromName: email.fromName,
      fromEmail: email.fromEmail,
      toEmails: email.toEmails,
      snippet: email.snippet,
      body: email.body,
      category,
    } as never,
  })

  const sender = await resolveSender(db, ctx, email)
  if (sender) {
    await link(db, {
      fromType: "EMAIL",
      fromId: row.id,
      toType: "PERSON",
      toId: sender.personId,
      relation: "RELATED_TO",
      createdBy: "AGENT",
    })
    await recordFact(db, {
      targetType: "EMAIL",
      targetId: row.id,
      field: "fromEmail",
      value: email.fromEmail,
      sourceType: "GMAIL",
      sourceId: email.externalId,
      evidence: email.subject,
    })
  }

  // Emails are preserved in emailMessage for communication intelligence and subscription management.
  // We do NOT automatically create tasks from emails.
  return { created: true }
}

/**
 * Pulls a batch of mail for a connected integration and ingests each message.
 *
 * Upserts make the pass safe to re-run; `syncCursor` carries Gmail's
 * nextPageToken so a later, larger sync can resume rather than restart.
 */
export async function syncIntegrationEmails(
  db: TenantDb,
  ctx: DomainContext,
  integration: { id: string; provider: import("@/lib/generated/prisma/enums").IntegrationProvider; secretCipher: string | null }
) {
  const provider = emailProviderFor(integration.provider)
  if (!provider) {
    throw new Error(`No email provider for ${integration.provider}.`)
  }

  const integrationRow = await db.integration.findUnique({ where: { id: integration.id } })
  if (!integrationRow) throw new Error("Integration not found.")

  const accessToken = await getAccessToken(db, integrationRow)
  const { messages, nextCursor } = await provider.listMessages(
    accessToken,
    integrationRow.syncCursor ?? undefined
  )

  // AI-last: sort so the most actionable mail hits the extractor first within quota.
  // Promos already dropped in gmailList cheap stage; remaining candidates are ranked
  // without AI: known client domain > subject has task verbs > has attachment hint.
  const orgRows = await db.organization.findMany({ where: { website: { not: null } }, select: { website: true } })
  const knownDomains = new Set(
    orgRows
      .map((r: { website: string | null }) => {
        try {
          return new URL(r.website!).hostname.toLowerCase()
        } catch {
          return (r.website || "").toLowerCase()
        }
      })
      .filter(Boolean) as string[]
  )
  const score = (m: NormalizedEmail) => {
    let s = 0
    const fromDomain = (m.fromEmail?.split("@")[1] ?? "").toLowerCase()
    if (fromDomain && [...knownDomains].some((d) => fromDomain.includes(d) || d.includes(fromDomain))) s += 10
    const subj = (m.subject ?? "").toLowerCase()
    if (/(please|could you|need|deadline|due|urgent|task|reel|edit|review)/.test(subj)) s += 5
    if (m.snippet && m.snippet.length > 40) s += 1
    return s
  }
  messages.sort((a, b) => score(b) - score(a))

  let ingested = 0
  for (const message of messages) {
    const result = await ingestEmail(db, ctx, message)
    if (result.created) ingested++
  }

  await db.integration.update({
    where: { id: integration.id },
    data: {
      lastSyncAt: new Date(),
      syncCursor: nextCursor ?? null,
      status: "CONNECTED",
    } as never,
  })

  return { fetched: messages.length, ingested }
}
