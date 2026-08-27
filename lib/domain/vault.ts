import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { encryptSecret, decryptSecret } from "@/lib/security/secret"

/**
 * Encrypted PII vault for statement passwords.
 * Every value is AES-256-GCM encrypted with SECRET_ENCRYPTION_KEY, tenant-isolated.
 * The plaintext never leaves the server decrypted except to try PDF passwords in-memory.
 */

export type VaultKind = "PAN" | "DOB" | "PHONE" | "NAME" | "CUSTOMER_ID" | "BANK_TEMPLATE"

export async function setVaultSecret(
  db: TenantDb,
  ctx: DomainContext,
  kind: VaultKind,
  label: string,
  plaintext: string
) {
  const secret = plaintext.trim()
  if (!secret) throw new Error("Value is required")
  const cipher = encryptSecret(secret)
  return db.vaultSecret.upsert({
    where: { tenantId_kind_label: { tenantId: ctx.tenantId, kind, label } },
    create: { kind, label, cipher },
    update: { cipher },
  } as never)
}

export async function deleteVaultSecret(
  db: TenantDb,
  kind: VaultKind,
  label: string
) {
  await db.vaultSecret.deleteMany({ where: { kind, label } as never })
}

export async function getVaultMap(db: TenantDb): Promise<Record<string, string>> {
  const rows = await db.vaultSecret.findMany()
  const map: Record<string, string> = {}
  for (const r of rows) {
    try {
      map[`${r.kind}:${r.label}`] = decryptSecret(r.cipher)
    } catch {}
  }
  return map
}

export async function listVaultMeta(db: TenantDb) {
  const rows = await db.vaultSecret.findMany({ orderBy: { createdAt: "desc" } })
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as VaultKind,
    label: r.label,
    masked: "***" + r.cipher.slice(-4),
    createdAt: r.createdAt,
  }))
}

function maskPAN(pan: string) {
  return pan.length > 4 ? `${pan.slice(0, 2)}****${pan.slice(-4)}` : "***"
}

/**
 * Candidate PDF passwords derived from vault secrets.
 *
 * Each carries a `label` describing its *shape* — "PAN + DOB (DDMM)" — never
 * the value. That is what lets the assistant tell the user which combination
 * unlocked a statement without the secret itself passing through a model, a
 * tool result, or the chat transcript.
 *
 * DOB is accepted as DDMMYYYY or DD-MM-YYYY and normalized to the fragments
 * Indian banks actually use.
 */
export type PasswordCandidate = { value: string; label: string }

export function describePasswordCandidates(
  vault: Record<string, string>,
  bank?: string
): PasswordCandidate[] {
  // Flexible lookup: old UI defaulted label to "PAN" regardless of kind, so
  // strict "KIND:KIND" missed credentials. Accept any label for that kind.
  // Also handles cases where user saved NAME under PAN kind by mistake — we
  // scan all values for shape matches as fallback.
  const findFirstByKind = (kind: string): string => {
    const exact = vault[`${kind}:${kind}`] || vault[`${kind}:default`]
    if (exact?.trim()) return exact.trim()
    for (const [k, v] of Object.entries(vault)) {
      if (k.startsWith(`${kind}:`) && v?.trim()) return v.trim()
    }
    return ""
  }

  let pan = findFirstByKind("PAN")
  let dob = findFirstByKind("DOB")
  let phone = findFirstByKind("PHONE")
  let name = findFirstByKind("NAME")
  let cust = findFirstByKind("CUSTOMER_ID")

  // Cross-kind fallback: if NAME empty but vault has a pure-letters value
  // (e.g. user saved "GAUTAM" under PAN), use it as name. Similarly for DOB
  // saved under wrong kind.
  if (!name) {
    for (const [, v] of Object.entries(vault)) {
      const t = v.trim()
      if (/^[A-Za-z\s\.]{4,40}$/.test(t) && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(t)) {
        name = t
        break
      }
    }
  }
  if (!dob) {
    for (const [, v] of Object.entries(vault)) {
      const t = v.trim()
      const digits = t.replace(/\D/g, "")
      if (digits.length === 8 || digits.length === 4) {
        dob = t
        break
      }
    }
  }
  if (!pan) {
    for (const [, v] of Object.entries(vault)) {
      const t = v.trim().toUpperCase()
      if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(t)) {
        pan = v.trim()
        break
      }
    }
  }

  const candidates: PasswordCandidate[] = []
  const push = (value: string, label: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (candidates.some((c) => c.value === trimmed)) return
    candidates.push({ value: trimmed, label })
  }

  // Normalize DOB variants
  let ddmm = "", ddmmyyyy = "", yyyymmdd = ""
  if (dob) {
    const digits = dob.replace(/\D/g, "")
    if (digits.length === 8) {
      ddmmyyyy = digits
      ddmm = digits.slice(0, 4)
      yyyymmdd = digits.slice(4) + digits.slice(2, 4) + digits.slice(0, 2)
    } else if (digits.length === 4) {
      ddmm = digits
    }
  }

  // Jio/SBI spec: "without special characters / space" — strip everything
  // non-alpha, not just spaces (handles "A. R. Rehman" → "ARRE").
  const name4 = name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()
  const panUpper = pan.toUpperCase()

  // Direct bank templates and exact secrets
  // Match is intentionally lenient: users save labels like "JIO", "Jio Payments",
  // "JPB", "Jio Payments Bank", "JioBank". For JIO hint we match substrings.
  const bankUpper = bank?.toUpperCase()
  const pushWithCaseVariants = (value: string, label: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    push(trimmed, label)
    const upper = trimmed.toUpperCase()
    const lower = trimmed.toLowerCase()
    if (upper !== trimmed) push(upper, `${label} (uppercase)`)
    if (lower !== trimmed && lower !== upper) push(lower, `${label} (lowercase)`)
  }

  for (const [k, val] of Object.entries(vault)) {
    if (k.startsWith("BANK_TEMPLATE:") || k.startsWith("PDF_PASSWORD:")) {
      const bKey = k.split(":")[1]?.toUpperCase() || ""
      const labelMatch =
        !bankUpper ||
        bKey === bankUpper ||
        bKey.includes(bankUpper!) ||
        bankUpper!.includes(bKey) ||
        // JIO aliases
        (bankUpper === "JIO" && /JIO|JPB|PAYMENTS/.test(bKey)) ||
        (bankUpper === "GENERIC" && true)
      if (labelMatch) {
        pushWithCaseVariants(val, `saved password for ${k.split(":")[1] || "this bank"}`)
      }
      // Also try exact value regardless of label if it's a direct password
      // shape like 4 letters + 4 digits (e.g. GAUT0912) — user may have saved
      // it under wrong label.
      if (bankUpper && /^[A-Z]{4}\d{4}$/.test(val.trim().toUpperCase())) {
        pushWithCaseVariants(val.trim(), `saved password (direct)`)
      }
    }
  }
  // Fallback: any vault entry that looks like a direct password for this bank
  // should also be tried, even if kind isn't BANK_TEMPLATE (covers UI confusion
  // where user saved GAUT0912 under NAME/DOB/Phone by mistake).
  for (const [k, val] of Object.entries(vault)) {
    if (/^[A-Z]{3,5}\d{3,6}$/i.test(val.trim()) && val.trim().length >= 6 && val.trim().length <= 10) {
      // Only push if it wasn't already added as a direct template candidate
      if (!bankUpper || k.toUpperCase().includes(bankUpper) || bankUpper === "JIO") {
        // Avoid duplicating pure PAN/DOB/phone values already handled
        if (val.trim().toUpperCase() !== panUpper && val.trim() !== dob && val.trim() !== phone) {
          pushWithCaseVariants(val.trim(), `stored value ${k}`)
        }
      }
    }
  }

  // 1. SBI (Name first 4 + DOB DDMM) or (DOB DDMM + Mobile last 5)
  if (name4 && ddmm) push(`${name4}${ddmm}`, "name (first 4) + DOB (DDMM)")
  if (name4 && ddmmyyyy) push(`${name4}${ddmmyyyy}`, "name (first 4) + DOB (DDMMYYYY)")
  if (phone && phone.length >= 5 && ddmm) push(`${ddmm}${phone.slice(-5)}`, "DOB (DDMM) + mobile (last 5)")
  if (phone && phone.length >= 4 && ddmm) push(`${phone.slice(-4)}${ddmm}`, "mobile (last 4) + DOB (DDMM)")

  // 2. HDFC (Cust ID) or (Cust ID + DOB DDMM) or (PAN)
  if (cust) push(cust, "customer ID")
  if (cust && ddmm) push(`${cust}${ddmm}`, "customer ID + DOB (DDMM)")
  if (cust && ddmmyyyy) push(`${cust}${ddmmyyyy}`, "customer ID + DOB (DDMMYYYY)")
  if (panUpper) push(panUpper, "PAN")

  // 3. ICICI & AXIS (Name first 4 + DOB DDMM) or (PAN + DOB DDMM)
  if (panUpper && ddmm) push(`${panUpper}${ddmm}`, "PAN + DOB (DDMM)")
  if (panUpper && ddmmyyyy) push(`${panUpper}${ddmmyyyy}`, "PAN + DOB (DDMMYYYY)")
  if (name4 && cust && cust.length >= 4) push(`${name4}${cust.slice(-4)}`, "name (first 4) + customer ID (last 4)")

  // 4. Phone & DOB combos
  if (phone) {
    push(phone, "mobile number")
    push(phone.slice(-4), "mobile (last 4)")
    if (ddmmyyyy) push(`${phone.slice(-4)}${ddmmyyyy}`, "mobile (last 4) + DOB (DDMMYYYY)")
  }

  // 5. Raw identifiers
  if (ddmmyyyy) push(ddmmyyyy, "DOB (DDMMYYYY)")
  if (ddmm) push(ddmm, "DOB (DDMM)")
  if (yyyymmdd) push(yyyymmdd, "DOB (YYYYMMDD)")
  if (dob) push(dob, "DOB as entered")

  return candidates.slice(0, 20)
}

/// The values alone, for callers that only need to try them.
export function buildPasswordCandidates(
  vault: Record<string, string>,
  bank?: string
): string[] {
  return describePasswordCandidates(vault, bank).map((c) => c.value)
}

export function describeVaultForUI(kind: VaultKind, label: string, masked: string) {
  const isPII = ["PAN", "PHONE", "CUSTOMER_ID"].includes(kind)
  return isPII ? `${kind} • ${label} • ${masked}` : `${kind} • ${label}`
}
