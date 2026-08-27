import "server-only"

import { parseAmount } from "./money"
import { categorize, type Category } from "./categorize"
import type { RecordTransactionInput } from "./finance"
import type { TransactionDirection } from "@/lib/generated/prisma/enums"

export type ParsedStatementRow = {
  date: Date
  description: string
  reference?: string
  amountMinor: bigint
  direction: TransactionDirection
  balanceMinor?: bigint
  category: Category
  externalRef: string
}

export type StatementParseResult = {
  bank: "SBI" | "HDFC" | "ICICI" | "CHASE" | "JIO" | "GENERIC"
  accountNumber?: string
  currency: string
  statementPeriod?: { start?: Date; end?: Date }
  totalDebitsMinor: bigint
  totalCreditsMinor: bigint
  transactions: ParsedStatementRow[]
}

function parseFlexibleDate(dateStr: string): Date | null {
  const clean = dateStr.trim()
  // dd-MMM-yyyy e.g. 01-Jul-2026 (Jio) — must be before numeric dmy
  const dmyTextMatch = clean.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/)
  if (dmyTextMatch) {
    const [, d, mmm, y] = dmyTextMatch
    const map: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    }
    const m = map[mmm.toLowerCase()]
    if (m !== undefined) return new Date(Date.UTC(parseInt(y, 10), m, parseInt(d, 10)))
  }

  // dd/mm/yyyy or dd-mm-yyyy or dd/mm/yy
  const dmyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10)
    return new Date(Date.UTC(year, parseInt(m, 10) - 1, parseInt(d, 10)))
  }

  // yyyy-mm-dd
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)))
  }

  // Chase / US: mm/dd/yyyy
  const mdyMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch
    return new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)))
  }

  const parsed = new Date(clean)
  return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Detects the originating bank from header text.
 */
export function detectBank(text: string): "SBI" | "HDFC" | "ICICI" | "CHASE" | "JIO" | "GENERIC" {
  const lower = text.toLowerCase()
  if (lower.includes("state bank of india") || lower.includes("sbi") || lower.includes("onlinesbi")) {
    return "SBI"
  }
  if (lower.includes("hdfc bank") || lower.includes("hdfcbank")) {
    return "HDFC"
  }
  if (lower.includes("icici bank") || lower.includes("icicibank")) {
    return "ICICI"
  }
  if (lower.includes("jpmorgan chase") || lower.includes("chase bank") || lower.includes("chase.com")) {
    return "CHASE"
  }
  if (lower.includes("jio payments bank") || lower.includes("jpb") || lower.includes("jiopaymentsbank") || lower.includes("jio payments")) {
    return "JIO"
  }
  return "GENERIC"
}

/**
 * Parses bank statement text (extracted from PDF or CSV).
 */
export function parseBankStatement(
  text: string,
  bankHint?: "SBI" | "HDFC" | "ICICI" | "CHASE" | "JIO" | "AUTO"
): StatementParseResult {
  const bank = (!bankHint || bankHint === "AUTO") ? detectBank(text) : bankHint
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  const transactions: ParsedStatementRow[] = []
  let totalDebits = BigInt(0)
  let totalCredits = BigInt(0)

  // Jio Payments Bank has a 2-date + wrapped narration + 3-amount row layout
  // that the generic single-line parser misses. Handle it first.
  if (bank === "JIO") {
    const amountLineRe = /^\d{1,3}(?:,\d{3})*\.\d{2}\s+\d{1,3}(?:,\d{3})*\.\d{2}\s+\d{1,3}(?:,\d{3})*\.\d{2}\s*$/
    const jioDateRe = /^(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{2}-[A-Za-z]{3}-\d{4})\s*(.*)$/
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(jioDateRe)
      if (!m) continue
      const date = parseFlexibleDate(m[1])
      if (!date) continue
      let narration = (m[3] || "").trim()
      // Collect wrapped narration lines until amount line or next date
      let j = i + 1
      while (j < lines.length) {
        const nxt = lines[j]
        if (jioDateRe.test(nxt)) break
        if (amountLineRe.test(nxt)) break
        // Skip header fragments
        if (/^(Jio Payments Bank|Registered Address|Page \d+ of|Account Statement|TRANSACTION|VALUE|NARRATION|WITHDRAWALS|DEPOSITS|CLOSING|BALANCE|OPENING|TOTAL|NO\. OF|REACH US|Account No|IFSC|Customer ID|MMID|Account Status|Nomination)/i.test(nxt)) {
          j++
          continue
        }
        if (narration) narration += " "
        narration += nxt
        j++
      }
      if (j >= lines.length) continue
      const amountLine = lines[j]
      if (!amountLineRe.test(amountLine)) continue
      const parts = amountLine.trim().split(/\s+/)
      if (parts.length < 3) continue
      // Jio columns: WITHDRAWALS, DEPOSITS, CLOSING BALANCE
      const w = parseAmount(parts[0])
      const d = parseAmount(parts[1])
      if (w === null || d === null) continue
      const isCredit = d !== BigInt(0) && w === BigInt(0)
      const isDebit = w !== BigInt(0) && d === BigInt(0)
      // Skip summary rows (opening balance totals etc) with no narration
      if (!narration || /^(Opening|Total|No\. of)/i.test(narration)) {
        i = j
        continue
      }
      const absAmount = isCredit ? d : isDebit ? w : (d !== BigInt(0) ? d : w)
      if (!absAmount || absAmount === BigInt(0)) {
        i = j
        continue
      }
      const direction: TransactionDirection = isCredit ? "CREDIT" : "DEBIT"
      if (direction === "DEBIT") totalDebits += absAmount
      else totalCredits += absAmount
      const cleanNarration = narration.replace(/\s+/g, " ").trim().slice(0, 280)
      const guess = categorize(cleanNarration, direction)
      const externalRef = `${bank}-${date.toISOString().split("T")[0]}-${cleanNarration.slice(0, 20).replace(/\W/g, "")}-${absAmount.toString()}`
      transactions.push({
        date,
        description: cleanNarration,
        amountMinor: absAmount,
        direction,
        category: guess.category,
        externalRef,
      })
      i = j // consume amount line
    }

    if (transactions.length > 0) {
      return {
        bank,
        currency: "INR",
        totalDebitsMinor: totalDebits,
        totalCreditsMinor: totalCredits,
        transactions,
      }
    }
    // Fall through to generic parser if Jio table not found (e.g. CSV export)
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for common date-first row pattern:
    // e.g. "26/08/2026 UPI/SWIGGY/12345678 450.00 12500.50"
    // e.g. "08/15/2026 ADOBE CREATIVE CLOUD -54.99 1840.22"
    // e.g. "2026-08-20 Transfer to Kunal 2000.00 CR 14000.00"

    const dateMatch = line.match(/^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/)
    if (!dateMatch) continue

    const date = parseFlexibleDate(dateMatch[1])
    if (!date) continue

    const restOfLine = line.substring(dateMatch[0].length).trim()
    const tokens = restOfLine.split(/\s+/)
    if (tokens.length < 2) continue

    // Detect if credit from CR/DR indicator or words
    const hasCreditFlag = tokens.some((t) => /^(cr|credit|deposit)$/i.test(t))
    const isSalary = /salary/i.test(restOfLine)

    // Filter out numeric amounts from the right of the line
    const numericIndices: number[] = []
    for (let j = 0; j < tokens.length; j++) {
      const cleanToken = tokens[j].replace(/^[₹$\-\+]/, "")
      if (/^\d+(?:,\d+)*(?:\.\d{1,2})?$/.test(cleanToken)) {
        numericIndices.push(j)
      }
    }

    if (numericIndices.length === 0) continue

    let amountToken = tokens[numericIndices[0]]
    let descEndIndex = numericIndices[0]

    if (numericIndices.length >= 2) {
      // If there are 2 or more numbers at the end, first is usually amount, second is balance
      amountToken = tokens[numericIndices[numericIndices.length - 2]]
      descEndIndex = numericIndices[numericIndices.length - 2]
    }

    const narrationTokens = tokens.slice(0, descEndIndex).filter((t) => !/^(cr|dr)$/i.test(t))
    const narration = narrationTokens.join(" ").trim()
    if (!narration) continue

    const parsedAmount = parseAmount(amountToken)
    if (!parsedAmount || parsedAmount === BigInt(0)) continue

    const isNegative = amountToken.startsWith("-") || parsedAmount < BigInt(0)
    const direction: TransactionDirection = (hasCreditFlag || isSalary) && !isNegative ? "CREDIT" : "DEBIT"
    const absAmount = parsedAmount < BigInt(0) ? -parsedAmount : parsedAmount

    if (direction === "DEBIT") {
      totalDebits += absAmount
    } else {
      totalCredits += absAmount
    }

    const guess = categorize(narration, direction)
    const externalRef = `${bank}-${date.toISOString().split("T")[0]}-${narration.slice(0, 20).replace(/\W/g, "")}-${absAmount.toString()}`

    transactions.push({
      date,
      description: narration,
      amountMinor: absAmount,
      direction,
      category: guess.category,
      externalRef,
    })
  }

  return {
    bank,
    currency: bank === "CHASE" ? "USD" : "INR",
    totalDebitsMinor: totalDebits,
    totalCreditsMinor: totalCredits,
    transactions,
  }
}

/**
 * Converts parsed statement rows into domain transaction inputs.
 */
export function statementToTransactionInputs(
  result: StatementParseResult,
  accountId?: string
): RecordTransactionInput[] {
  return result.transactions.map((t) => ({
    description: t.description,
    amountMinor: t.amountMinor,
    direction: t.direction,
    occurredAt: t.date,
    currency: result.currency,
    accountId,
    category: t.category,
    externalRef: t.externalRef,
  }))
}
