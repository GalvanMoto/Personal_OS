import "server-only"

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/**
 * Encrypts small secrets (OAuth token blobs) at rest.
 *
 * The Integration table stores `secretCipher`, never the raw provider
 * credential — a database dump or a stray log line reveals nothing usable
 * (PRD §44, §45). Keys live in the environment, not the database, and are
 * 32 bytes for AES-256-GCM.
 */
function loadKey(): Buffer {
  const raw = process.env.SECRET_ENCRYPTION_KEY
  if (!raw) {
    throw new Error("SECRET_ENCRYPTION_KEY is not set. Copy .env.example to .env.")
  }

  const key = Buffer.from(raw, "hex")
  if (key.length !== 32) {
    throw new Error("SECRET_ENCRYPTION_KEY must be 32 bytes (64 hex chars).")
  }

  return key
}

/** Returns `iv:authTag:ciphertext`, all hex. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", loadKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [iv.toString("hex"), tag.toString("hex"), ciphertext.toString("hex")].join(":")
}

export function decryptSecret(value: string): string {
  const [ivHex, tagHex, dataHex] = value.split(":")
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Malformed secret cipher.")
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    loadKey(),
    Buffer.from(ivHex, "hex")
  )
  decipher.setAuthTag(Buffer.from(tagHex, "hex"))

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ])

  return plaintext.toString("utf8")
}
