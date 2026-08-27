import "server-only"

import { execFile } from "node:child_process"
import { writeFile, unlink } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { existsSync } from "node:fs"

/**
 * Isolated Python layout parser – bank-agnostic (pdfplumber clustering + balance verification).
 * Reuses scripts/jio_parse.py (copied from chatwithbankstatement/scripts/parse_pdf.py:1) without
 * disturbing the existing TypeScript `parseBankStatement` – this is the primary for PDFs when
 * bytes are available, TS is the fallback for CSV/text and when Python is unavailable.
 */

export type PythonParseResult = {
  success?: boolean
  bankName?: string | null
  currency?: string
  periodStart?: string | null
  periodEnd?: string | null
  openingBalance?: number | null
  closingBalance?: number | null
  transactions?: Array<{
    date: string
    description: string
    amount: number
    type: "debit" | "credit"
    balance?: number | null
    verified?: boolean
    confidence?: number
  }>
  error?: string
  message?: string
}

export async function parseWithPython(
  bytes: Buffer,
  password?: string
): Promise<PythonParseResult | null> {
  const candidates = [
    join(process.cwd(), "scripts", "jio_parse.py"),
    join(process.cwd(), "scripts", "parse_pdf.py"),
  ]
  const script = candidates.find((p) => existsSync(p))
  if (!script) return null
  if (bytes.byteLength > 20 * 1024 * 1024) return null

  const tmpPath = join(tmpdir(), `stmt-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`)
  try {
    await writeFile(tmpPath, bytes)
    const result: any = await new Promise((resolve) => {
      const child = execFile(
        "python3",
        [script, tmpPath],
        { timeout: 60000, maxBuffer: 32 * 1024 * 1024 },
        (_err, stdout) => {
          try {
            resolve(JSON.parse(stdout))
          } catch {
            resolve({ error: "parse_failed", message: "python produced no JSON" })
          }
        }
      )
      child.stdin?.end(password ?? "")
    })
    if (result.error) return result
    if (!result.transactions) return null
    return result
  } catch (e) {
    console.warn("[python-parser] failed", e)
    return null
  } finally {
    try {
      await unlink(tmpPath)
    } catch {}
  }
}
