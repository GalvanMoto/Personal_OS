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
 * Common Indian bank PDF password candidates.
 * Tries in order: bank-specific template first, then generic combos.
 * DOB is expected as DDMMYYYY or DD-MM-YYYY, we normalize to DDMM, DDMMYYYY, etc.
 */
export function buildPasswordCandidates(vault: Record<string, string>, bank?: string): string[] {
  const pan = vault["PAN:PAN"] || vault["PAN:default"] || ""
  const dob = vault["DOB:DOB"] || vault["DOB:default"] || ""
  const phone = vault["PHONE:PHONE"] || vault["PHONE:default"] || ""
  const name = vault["NAME:NAME"] || vault["NAME:default"] || ""
  const cust = vault["CUSTOMER_ID:CUSTOMER_ID"] || vault["CUSTOMER_ID:default"] || ""

  const candidates: string[] = []
  const push = (s: string) => { const t = s.trim(); if (t && !candidates.includes(t)) candidates.push(t) }

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

  const name4 = name.replace(/\s+/g, "").slice(0, 4).toUpperCase()
  const panUpper = pan.toUpperCase()

  // Bank templates
  const templateKey = bank ? `BANK_TEMPLATE:${bank}` : ""
  const template = templateKey ? vault[templateKey] : ""
  if (template) push(template)

  // Common patterns (SBI, HDFC, ICICI, etc.)
  if (name4 && ddmm) push(`${name4}${ddmm}`)
  if (name4 && ddmmyyyy) push(`${name4}${ddmmyyyy}`)
  if (panUpper && ddmm) push(`${panUpper}${ddmm}`)
  if (panUpper && ddmmyyyy) push(`${panUpper}${ddmmyyyy}`)
  if (cust && ddmm) push(`${cust}${ddmm}`)
  if (cust && ddmmyyyy) push(`${cust}${ddmmyyyy}`)
  if (phone) {
    push(phone)
    push(phone.slice(-4))
    if (ddmm) push(`${phone.slice(-4)}${ddmm}`)
  }
  if (panUpper) push(panUpper)
  if (ddmmyyyy) push(ddmmyyyy)
  if (ddmm) push(ddmm)
  if (dob) push(dob)
  if (cust) push(cust)
  if (pan) push(pan)

  // Generic fallbacks
  if (phone && ddmmyyyy) push(`${phone}${ddmmyyyy}`)

  return candidates.slice(0, 20)
}

export function describeVaultForUI(kind: VaultKind, label: string, masked: string) {
  const isPII = ["PAN", "PHONE", "CUSTOMER_ID"].includes(kind)
  return isPII ? `${kind} • ${label} • ${masked}` : `${kind} • ${label}`
}
