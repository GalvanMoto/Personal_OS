import { createHash, randomUUID } from "node:crypto"

/// Strips anything that could escape the storage root or confuse an object
/// store. Applied to the caller's filename, never trusted as-is.
export function safeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file"

  return (
    base
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/^\.+/, "")
      .slice(0, 120) || "file"
  )
}

/**
 * Builds an object key.
 *
 * Tenant-prefixed and date-partitioned: the prefix means a listing can never
 * accidentally span workspaces, and the date keeps directory sizes sane on a
 * local filesystem.
 */
export function buildKey(tenantId: string, fileName: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")

  return `${tenantId}/${year}/${month}/${randomUUID()}-${safeFileName(fileName)}`
}

/**
 * Rejects keys that try to leave their root.
 *
 * Every read and write goes through this, so a key that reached the database
 * through some other path still cannot be used to walk the filesystem.
 */
export function assertSafeKey(key: string): string {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\0")) {
    throw new Error(`Unsafe storage key: ${JSON.stringify(key)}`)
  }
  return key
}

/// Keys are tenant-prefixed, so ownership is checkable without a database read.
export function keyBelongsTo(key: string, tenantId: string): boolean {
  return key.startsWith(`${tenantId}/`)
}

export function checksum(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex")
}
