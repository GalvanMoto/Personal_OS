import "server-only"

import { extractText } from "@/lib/ai/extract-text"
import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { ingestEmailAttachments } from "@/lib/domain/attachments"
import { readStoredFile } from "@/lib/domain/files"
import { importTransactions } from "@/lib/domain/finance"
import { formatMoney, money } from "@/lib/domain/money"
import { categorize } from "@/lib/domain/categorize"
import {
  detectBank,
  parseBankStatement,
  statementToTransactionInputs,
  type StatementParseResult,
} from "@/lib/domain/statements"
import { describePasswordCandidates, getVaultMap } from "@/lib/domain/vault"
import { syncIntegrationEmails } from "@/lib/domain/email"
import { parseWithPython } from "@/lib/domain/python-statement-parser"

/**
 * Mail → statement → ledger, end to end.
 *
 * The chain the user actually describes when they say "get my bank statements":
 * find the mail, pull the PDF off it, unlock it with what the vault knows,
 * parse the rows, and put them in the ledger. Every link already existed on its
 * own; this is the module that runs them in order and reports honestly at each
 * step, because a silent failure three links deep is indistinguishable from an
 * empty inbox.
 *
 * Two modes. `preview` parses and counts but writes no transactions, so the
 * assistant can say what it found and let the user decide. `apply` performs the
 * import. Both are safe to re-run: `recordTransaction` dedupes on the bank's own
 * reference and again on a date/amount/description fingerprint, so overlapping
 * statements settle rather than double up.
 */

/// Senders and subjects that carry statements. Used to narrow a mailbox search
/// when the user has not named one, and as the Gmail query for a live fetch.
const STATEMENT_HINTS = [
  "statement",
  "e-statement",
  "account statement",
  "transaction history",
  "passbook",
]

export type StatementCandidate = {
  emailId: string
  externalId: string
  subject: string
  from: string
  receivedAt: string
  attachments: Array<{ fileId: string; name: string; mimeType: string }>
}

export type ParsedStatement = {
  fileId: string
  fileName: string
  bank: StatementParseResult["bank"]
  /// How the file was opened, when it was encrypted. Describes the shape of the
  /// password ("PAN + DOB (DDMM)"), never the password.
  unlockedWith?: string
  currency: string
  rowCount: number
  totalDebits: string
  totalCredits: string
  earliest?: string
  latest?: string
  sample: Array<{
    date: string
    description: string
    amount: string
    direction: "DEBIT" | "CREDIT"
    category: string
  }>
}

export type StatementImportOutcome = {
  status: "IMPORTED" | "PREVIEW" | "LOCKED" | "NOTHING_FOUND" | "NOT_CONNECTED"
  message: string
  searched: string
  emailsScanned: number
  statements: ParsedStatement[]
  imported?: number
  skippedDuplicates?: number
  /// Files that were found but could not be opened, with the reason — a locked
  /// PDF the vault could not crack names the vault, not a generic failure.
  unreadable: Array<{ fileName: string; reason: string }>
}

/**
 * Finds mail that plausibly carries a statement.
 *
 * Looks in the workspace first and falls back to a live Gmail query, which is
 * the same read-through the assistant's email search uses: the database is a
 * cache of the mailbox, not a separate source of truth, so "not in the database"
 * must never be reported as "not in your email".
 */
export async function findStatementEmails(
  db: TenantDb,
  ctx: DomainContext,
  options: { from?: string; query?: string; days?: number; limit?: number } = {}
): Promise<{ connected: boolean; searched: string; candidates: StatementCandidate[] }> {
  const integrations = await db.integration.findMany({
    where: { tenantId: ctx.tenantId, provider: "GMAIL", status: "CONNECTED" },
  })

  if (integrations.length === 0) {
    return { connected: false, searched: "", candidates: [] }
  }

  const limit = options.limit ?? 10
  const since = new Date()
  since.setDate(since.getDate() - (options.days ?? 120))

  const terms = options.query ? [options.query] : STATEMENT_HINTS
  const searched = [options.from ? `from:${options.from}` : null, ...terms]
    .filter(Boolean)
    .join(" ")

  const where: Record<string, unknown> = {
    tenantId: ctx.tenantId,
    receivedAt: { gte: since },
    OR: terms.flatMap((term) => [
      { subject: { contains: term, mode: "insensitive" } },
      { snippet: { contains: term, mode: "insensitive" } },
    ]),
  }
  if (options.from) {
    where.fromEmail = { contains: options.from, mode: "insensitive" }
  }

  const select = {
    id: true,
    externalId: true,
    subject: true,
    fromName: true,
    fromEmail: true,
    receivedAt: true,
  }

  let rows = await db.emailMessage.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take: limit,
    select,
  })

  // Nothing cached: ask Gmail directly before concluding there is nothing.
  if (rows.length === 0) {
    const liveQuery = [
      options.from ? `from:${options.from}` : null,
      options.query ?? `(${STATEMENT_HINTS.map((h) => `"${h}"`).join(" OR ")})`,
      "has:attachment",
    ]
      .filter(Boolean)
      .join(" ")

    for (const integration of integrations) {
      try {
        await syncIntegrationEmails(db, ctx, integration, liveQuery)
      } catch (error) {
        console.warn(`[statement-import] live sync failed:`, error)
      }
    }

    rows = await db.emailMessage.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      take: limit,
      select,
    })
  }

  const candidates: StatementCandidate[] = []

  for (const row of rows) {
    const files = await ingestEmailAttachments(db, ctx, row.externalId)
    if (files.length === 0) continue

    candidates.push({
      emailId: row.id,
      externalId: row.externalId,
      subject: row.subject ?? "No subject",
      from: row.fromName ? `${row.fromName} <${row.fromEmail}>` : row.fromEmail ?? "Unknown",
      receivedAt: row.receivedAt.toISOString(),
      attachments: files.map((f) => ({
        fileId: f.fileId,
        name: f.name,
        mimeType: f.mimeType,
      })),
    })
  }

  return { connected: true, searched, candidates }
}

/**
 * Reads one stored file into parsed statement rows.
 *
 * The bank is guessed from the filename before the vault is consulted, so a
 * bank-specific saved password is tried ahead of the generic PAN/DOB
 * permutations — the difference between one attempt and twenty.
 */
export async function parseStoredStatement(
  db: TenantDb,
  ctx: DomainContext,
  fileId: string
): Promise<
  | { ok: true; parsed: ParsedStatement; result: StatementParseResult }
  | { ok: false; fileName: string; reason: string }
> {
  const stored = await readStoredFile(db, ctx.tenantId, fileId)
  if (!stored) return { ok: false, fileName: fileId, reason: "File not found." }

  const { file, bytes } = stored
  const bankHint = detectBank(file.name)
  const vault = await getVaultMap(db)
  const candidates = describePasswordCandidates(
    vault,
    bankHint === "GENERIC" ? undefined : bankHint
  )

  const outcome = await extractText(bytes, file.mimeType, candidates)

  if (!outcome.supported) {
    return { ok: false, fileName: file.name, reason: outcome.reason }
  }

  const result = parseBankStatement(outcome.text)

  if (result.transactions.length === 0) {
    return {
      ok: false,
      fileName: file.name,
      reason:
        "The file opened but no transaction rows matched a known statement layout.",
    }
  }

  const dates = result.transactions.map((t) => t.date.getTime())

  return {
    ok: true,
    result,
    parsed: {
      fileId,
      fileName: file.name,
      bank: result.bank,
      unlockedWith: outcome.unlockedWith,
      currency: result.currency,
      rowCount: result.transactions.length,
      totalDebits: formatMoney(money(result.totalDebitsMinor, result.currency)),
      totalCredits: formatMoney(money(result.totalCreditsMinor, result.currency)),
      earliest: new Date(Math.min(...dates)).toISOString().slice(0, 10),
      latest: new Date(Math.max(...dates)).toISOString().slice(0, 10),
      sample: result.transactions.slice(0, 5).map((t) => ({
        date: t.date.toISOString().slice(0, 10),
        description: t.description,
        amount: formatMoney(money(t.amountMinor, result.currency)),
        direction: t.direction,
        category: t.category,
      })),
    },
  }
}

/**
 * The whole chain, in one call.
 *
 * `apply: false` stops after parsing so the assistant can report what it found
 * and ask. Nothing about the search or the unlock is deferred by preview mode —
 * the user learns immediately whether their vault opened the file, which is the
 * part that usually needs fixing.
 */
export async function importStatementsFromEmail(
  db: TenantDb,
  ctx: DomainContext,
  options: {
    from?: string
    query?: string
    days?: number
    limit?: number
    apply?: boolean
  } = {}
): Promise<StatementImportOutcome> {
  const { connected, searched, candidates } = await findStatementEmails(db, ctx, options)

  if (!connected) {
    return {
      status: "NOT_CONNECTED",
      message:
        "No Gmail account is connected to this workspace. Connect one in Settings → Integrations and I can fetch statements directly.",
      searched: "",
      emailsScanned: 0,
      statements: [],
      unreadable: [],
    }
  }

  const statements: ParsedStatement[] = []
  const unreadable: StatementImportOutcome["unreadable"] = []
  const rows = []

  for (const candidate of candidates) {
    for (const attachment of candidate.attachments) {
      const outcome = await parseStoredStatement(db, ctx, attachment.fileId)

      if (outcome.ok) {
        statements.push(outcome.parsed)
        rows.push(...statementToTransactionInputs(outcome.result))
      } else {
        unreadable.push({ fileName: outcome.fileName, reason: outcome.reason })
      }
    }
  }

  if (statements.length === 0) {
    // A locked file is a different answer from an empty mailbox: one needs a
    // vault entry, the other needs a different search.
    const locked = unreadable.some((u) => /password|vault/i.test(u.reason))

    return {
      status: locked ? "LOCKED" : "NOTHING_FOUND",
      message: locked
        ? "I found statements but could not open them with what is in your vault. Add your PAN, date of birth, mobile number or customer ID in Settings → Vault and ask again."
        : `No readable statements turned up for "${searched}" in the last ${options.days ?? 120} days.`,
      searched,
      emailsScanned: candidates.length,
      statements: [],
      unreadable,
    }
  }

  if (options.apply === false) {
    return {
      status: "PREVIEW",
      message: `Parsed ${statements.length} statement${statements.length === 1 ? "" : "s"} with ${rows.length} transactions. Nothing has been imported yet.`,
      searched,
      emailsScanned: candidates.length,
      statements,
      unreadable,
    }
  }

  const { imported, skipped } = await importTransactions(db, ctx, rows)

  return {
    status: "IMPORTED",
    message: `Imported ${imported} transaction${imported === 1 ? "" : "s"}${
      skipped ? `, skipped ${skipped} already on the ledger` : ""
    }.`,
    searched,
    emailsScanned: candidates.length,
    statements,
    imported,
    skippedDuplicates: skipped,
    unreadable,
  }
}
