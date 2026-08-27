import "server-only"

import { chat, streamToText, type ContentPart } from "@tanstack/ai"
import { agentAdapter, isAgentConfigured } from "@/lib/ai/agent/runtime"
import { extractText } from "@/lib/ai/extract-text"
import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
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
import {
  findStatementEmails,
  type ParsedStatement,
  type StatementImportOutcome,
} from "@/lib/domain/statement-import"
import { describePasswordCandidates, getVaultMap } from "@/lib/domain/vault"

/**
 * Jio Payments Bank statement extractor with OCR/LLM fallback.
 *
 * Architecture:
 *  1. Vault unlock via `describePasswordCandidates(..., "JIO")` – handles
 *     GAUT0912 (NAME first 4 + DOB DDMM, case-insensitive, label-agnostic) and
 *     `BANK_TEMPLATE:Jio Payment Bank` direct passwords.
 *  2. Text layer via `extractText(bytes, "application/pdf", candidates)` – uses
 *     `unpdf` + vault candidates.
 *  3. Deterministic JIO table parser `parseBankStatement(text, "JIO")` – handles
 *     `01-Jul-2026 01-Jul-2026 <wrapped narration>` + `0.00 500.00 844.30`.
 *  4. If (2) succeeds but (3) yields 0 rows → LLM table extraction (sends the
 *     extracted text to the agent's LLM to parse the table). This covers
 *     layout drift without requiring a new regex.
 *  5. If (2) fails with "no text layer" (scanned PDF) → Vision OCR (sends the
 *     PDF as a `document` part to the same `agentAdapter`).
 *
 * The tool is idempotent: `importTransactions` dedupes on `externalRef`.
 */

const JIO_OCR_PROMPT = `You are a bank statement table extractor for Jio Payments Bank.

You will be given the full text extracted from a Jio Payments Bank PDF (already decrypted). The table has columns:
TRANSACTION DATE | VALUE DATE | NARRATION | WITHDRAWALS | DEPOSITS | CLOSING BALANCE

Each transaction is spread across 2-3 lines:
Line 1: "01-Jul-2026 01-Jul-2026 <narration part 1>"
Line 2: "<narration part 2>" (optional, wrapped)
Line 3: "<withdrawals> <deposits> <closing>" e.g. "0.00 500.00 844.30" or "175.00 0.00 669.30"

Return ONLY a JSON array (no markdown, no explanation) where each element is:
{"date":"YYYY-MM-DD","narration":"full narration as single line","withdrawals":"0.00","deposits":"500.00"}

Rules:
- date = TRANSACTION DATE converted to YYYY-MM-DD (e.g. 01-Jul-2026 -> 2026-07-01)
- narration = join all wrapped lines with a single space
- withdrawals/deposits are exactly as in the amount line (with commas, 2 decimals)
- Include every data row, skip headers, totals, and "Page X of Y"
- If a row has 0.00 in withdrawals, it is a credit; if 0.00 in deposits, it is a debit
- Return [] if no rows found
`

const VISION_OCR_PROMPT = `Transcribe this Jio Payments Bank statement PDF exactly as text, preserving the table.

Focus on the transaction table: TRANSACTION DATE, VALUE DATE, NARRATION, WITHDRAWALS, DEPOSITS, CLOSING BALANCE.
Reproduce each transaction row as it appears, keeping dates in DD-MMM-YYYY and amounts with 2 decimals.
If the PDF is scanned, do OCR and reproduce the table rows line by line.
Return only the transcribed text, no summary.`

export type JioExtractorOptions = {
  from?: string
  query?: string
  days?: number
  limit?: number
  apply?: boolean
  useOcr?: boolean
}

export type JioExtractorOutcome = Omit<StatementImportOutcome, "status"> & {
  status: StatementImportOutcome["status"] | "OCR_FALLBACK"
  ocrUsed?: boolean
  ocrReason?: string
}

/**
 * LLM table extraction for Jio when the regex parser finds no rows.
 */
async function parseJioWithLLM(text: string): Promise<StatementParseResult | null> {
  if (!isAgentConfigured()) return null
  // Cap text to avoid token blowup – Jio statements are ~16k chars for 1 month, 96k for 1 year.
  // Send first 30k chars (covers ~2 months) + last 5k for footer; enough for LLM to infer layout.
  const truncated = text.length > 35000 ? text.slice(0, 30000) + "\n...[truncated]...\n" + text.slice(-5000) : text

  const content: Array<ContentPart> = [
    { type: "text", content: JIO_OCR_PROMPT },
    { type: "text", content: truncated },
  ]

  try {
    const stream = chat({
      adapter: agentAdapter(),
      messages: [{ role: "user", content }],
      agentLoopStrategy: () => false,
      modelOptions: { max_tokens: 8000 },
    })
    const raw = (await streamToText(stream)).trim()
    // Extract JSON array from possibly markdown-fenced response
    const jsonStr = raw.match(/\[[\s\S]*\]/)?.[0] ?? raw
    const rows = JSON.parse(jsonStr) as Array<{
      date?: string
      narration?: string
      withdrawals?: string
      deposits?: string
    }>
    if (!Array.isArray(rows) || rows.length === 0) return null

    const transactions: StatementParseResult["transactions"] = []
    let totalDebits = BigInt(0)
    let totalCredits = BigInt(0)

    for (const r of rows) {
      if (!r.date || !r.narration) continue
      const date = new Date(r.date)
      if (isNaN(date.getTime())) continue
      const w = r.withdrawals ? parseFloat(String(r.withdrawals).replace(/,/g, "")) : 0
      const d = r.deposits ? parseFloat(String(r.deposits).replace(/,/g, "")) : 0
      const amountMinor = BigInt(Math.round((d !== 0 ? d : w) * 100))
      if (amountMinor === BigInt(0)) continue
      const direction = d !== 0 && w === 0 ? "CREDIT" : "DEBIT"
      if (direction === "DEBIT") totalDebits += amountMinor
      else totalCredits += amountMinor
      const cleanNarration = String(r.narration).replace(/\s+/g, " ").trim().slice(0, 280)
      const guess = categorize(cleanNarration, direction)
      const externalRef = `JIO-${date.toISOString().split("T")[0]}-${cleanNarration.slice(0, 20).replace(/\W/g, "")}-${amountMinor.toString()}`
      transactions.push({
        date,
        description: cleanNarration,
        amountMinor,
        direction,
        category: guess.category,
        externalRef,
      })
    }

    if (transactions.length === 0) return null

    return {
      bank: "JIO",
      currency: "INR",
      totalDebitsMinor: totalDebits,
      totalCreditsMinor: totalCredits,
      transactions,
    }
  } catch (e) {
    console.warn("[jio-llm] parse failed", e)
    return null
  }
}

/**
 * Vision OCR for scanned PDFs (no text layer).
 */
async function extractWithVision(bytes: Buffer): Promise<string | null> {
  if (!isAgentConfigured()) return null
  if (bytes.byteLength > 20 * 1024 * 1024) return null

  const content: Array<ContentPart> = [
    { type: "text", content: VISION_OCR_PROMPT },
    {
      type: "document",
      source: {
        type: "data",
        value: bytes.toString("base64"),
        mimeType: "application/pdf",
      },
    } as unknown as ContentPart,
  ]

  try {
    const stream = chat({
      adapter: agentAdapter(),
      messages: [{ role: "user", content }],
      agentLoopStrategy: () => false,
      modelOptions: { max_tokens: 8000 },
    })
    const text = (await streamToText(stream)).trim()
    if (!text || text.length < 100) return null
    return text
  } catch (e) {
    console.warn("[jio-vision] pdf ocr failed", e)
    return null
  }
}

async function tryParseFile(
  db: TenantDb,
  ctx: DomainContext,
  fileId: string,
  useOcr: boolean
): Promise<
  | { ok: true; parsed: ParsedStatement; result: StatementParseResult; via: string }
  | { ok: false; fileName: string; reason: string; via?: string }
> {
  const stored = await readStoredFile(db, ctx.tenantId, fileId)
  if (!stored) return { ok: false, fileName: fileId, reason: "File not found." }
  const { file, bytes } = stored
  const bankHint = detectBank(file.name)
  const vault = await getVaultMap(db)
  const candidates = describePasswordCandidates(vault, bankHint === "GENERIC" ? undefined : bankHint)
  const outcome = await extractText(bytes, file.mimeType, candidates)

  if (!outcome.supported) {
    // Scanned PDF without text layer – try vision OCR if enabled
    if (useOcr && /no text layer|scan/i.test(outcome.reason)) {
      const visionText = await extractWithVision(bytes)
      if (visionText) {
        const llmResult = await parseJioWithLLM(visionText)
        if (llmResult && llmResult.transactions.length > 0) {
          const parsed = toParsed(fileId, file.name, llmResult, "vision OCR")
          return { ok: true, parsed, result: llmResult, via: "vision" }
        }
      }
    }
    return { ok: false, fileName: file.name, reason: outcome.reason }
  }

  // Deterministic parse first (handles 2-date + wrapped narration)
  let result = parseBankStatement(outcome.text, bankHint === "GENERIC" ? undefined : (bankHint as any))
  if (result.transactions.length > 0) {
    const parsed = toParsed(fileId, file.name, result, outcome.unlockedWith)
    return { ok: true, parsed, result, via: outcome.unlockedWith || "text" }
  }

  // Regex found no rows but text exists – try LLM table extraction (layout drift)
  if (useOcr && outcome.text.length > 500) {
    const llmResult = await parseJioWithLLM(outcome.text)
    if (llmResult && llmResult.transactions.length > 0) {
      const parsed = toParsed(fileId, file.name, llmResult, "LLM table extraction")
      return { ok: true, parsed, result: llmResult, via: "llm" }
    }
    // If LLM also fails but vision might do better (e.g. heavily wrapped), try vision on the same PDF bytes
    const visionText = await extractWithVision(bytes)
    if (visionText) {
      const visionResult = await parseJioWithLLM(visionText)
      if (visionResult && visionResult.transactions.length > 0) {
        const parsed = toParsed(fileId, file.name, visionResult, "vision+LLM")
        return { ok: true, parsed, result: visionResult, via: "vision-llm" }
      }
    }
  }

  return {
    ok: false,
    fileName: file.name,
    reason: "The file opened but no transaction rows matched a known statement layout. OCR fallback also found no rows.",
    via: outcome.unlockedWith,
  }
}

function toParsed(
  fileId: string,
  fileName: string,
  result: StatementParseResult,
  unlockedWith?: string
): ParsedStatement {
  const dates = result.transactions.map((t) => t.date.getTime())
  return {
    fileId,
    fileName,
    bank: result.bank,
    unlockedWith,
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
  }
}

/**
 * Full Jio import flow with OCR/LLM fallback.
 */
export async function importJioStatements(
  db: TenantDb,
  ctx: DomainContext,
  options: JioExtractorOptions = {}
): Promise<JioExtractorOutcome> {
  const opts = {
    from: options.from ?? "estatements@jiopayments.bank.in",
    query: options.query,
    days: options.days ?? 180,
    limit: options.limit ?? 10,
    apply: options.apply ?? false,
    useOcr: options.useOcr ?? true,
  }

  const { connected, searched, candidates } = await findStatementEmails(db, ctx, {
    from: opts.from,
    query: opts.query,
    days: opts.days,
    limit: opts.limit,
  })

  if (!connected) {
    return {
      status: "NOT_CONNECTED",
      message:
        "No Gmail account is connected to this workspace. Connect one in Settings → Integrations and I can fetch statements directly.",
      searched: "",
      emailsScanned: 0,
      statements: [],
      unreadable: [],
      ocrUsed: false,
    }
  }

  const statements: ParsedStatement[] = []
  const unreadable: JioExtractorOutcome["unreadable"] = []
  const rows: Array<ReturnType<typeof statementToTransactionInputs>[number]> = []
  let ocrUsed = false

  for (const candidate of candidates) {
    for (const attachment of candidate.attachments) {
      const outcome = await tryParseFile(db, ctx, attachment.fileId, opts.useOcr)
      if (outcome.ok) {
        if (outcome.via === "llm" || outcome.via === "vision" || outcome.via === "vision-llm") ocrUsed = true
        statements.push(outcome.parsed)
        rows.push(...statementToTransactionInputs(outcome.result))
      } else {
        unreadable.push({ fileName: outcome.fileName, reason: outcome.reason })
        if (outcome.via) ocrUsed = true
      }
    }
  }

  if (statements.length === 0) {
    const locked = unreadable.some((u) => /password|vault/i.test(u.reason))
    return {
      status: locked ? "LOCKED" : "NOTHING_FOUND",
      message: locked
        ? "Jio PDFs are still locked. Add GAUT0912 as BANK_TEMPLATE:JIO or ensure NAME (GAUTAM BHAI) + DOB (09122002) are in Vault."
        : `No Jio statements with readable tables found for "${searched}" in last ${opts.days} days. OCR also found no rows.`,
      searched,
      emailsScanned: candidates.length,
      statements: [],
      unreadable,
      ocrUsed,
      ocrReason: ocrUsed ? "Tried vision/LLM table extraction after regex found 0 rows" : undefined,
    }
  }

  // If any file required OCR/LLM, mark status as OCR_FALLBACK for transparency
  if (ocrUsed && unreadable.length === 0) {
    // All files parsed, some via OCR – still a successful preview/import, but signal OCR was needed
  }

  if (opts.apply === false) {
    return {
      status: ocrUsed ? "OCR_FALLBACK" : "PREVIEW",
      message: `Parsed ${statements.length} Jio statement(s) with ${rows.length} transactions via ${ocrUsed ? "OCR/LLM" : "deterministic"} parser. Nothing imported yet.`,
      searched,
      emailsScanned: candidates.length,
      statements,
      unreadable,
      ocrUsed,
      ocrReason: ocrUsed ? "Deterministic parser found 0 rows, LLM/vision recovered the table" : undefined,
    }
  }

  const { imported, skipped } = await importTransactions(db, ctx, rows)

  return {
    status: ocrUsed ? "OCR_FALLBACK" : "IMPORTED",
    message: `Imported ${imported} Jio transaction(s)${skipped ? `, skipped ${skipped} already on ledger` : ""}${ocrUsed ? " (via OCR/LLM fallback)" : ""}.`,
    searched,
    emailsScanned: candidates.length,
    statements,
    imported,
    skippedDuplicates: skipped,
    unreadable,
    ocrUsed,
  }
}
