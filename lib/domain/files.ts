import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import { extractText } from "@/lib/ai/extract-text"
import type { DomainContext } from "@/lib/domain/context-types"
import { logActivity } from "@/lib/events/activity"
import { indexEntity, removeFromIndex } from "@/lib/search"
import { buildKey, keyBelongsTo, storage } from "@/lib/storage"
import type { InboxKind, SourceType } from "@/lib/generated/prisma/enums"

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

/// Maps a MIME type onto the inbox's notion of what arrived, so the pipeline
/// can treat a screenshot differently from a brief.
export function inboxKindFor(mimeType: string, fileName: string): InboxKind {
  if (mimeType.startsWith("image/")) {
    return /screenshot|screen shot|cleanshot/i.test(fileName) ? "SCREENSHOT" : "IMAGE"
  }
  if (mimeType === "application/pdf") return "PDF"
  if (mimeType.startsWith("audio/")) return "VOICE"
  if (mimeType.startsWith("text/")) return "DOCUMENT"
  return "FILE"
}

/**
 * Stores an upload and records it.
 *
 * The bytes go to object storage and only a key is kept in the database, so the
 * row stays small and swapping to S3 changes nothing here. Identical uploads
 * are deduped by checksum — re-sending the same brief should not create a
 * second copy of it.
 */
export async function storeUpload(
  db: TenantDb,
  ctx: DomainContext,
  input: {
    name: string
    mimeType: string
    bytes: Buffer
    inboxItemId?: string
    /// Where the bytes came from. Defaults to a human upload; the mail pipeline
    /// passes GMAIL so an attachment is distinguishable from a dropped file.
    sourceType?: SourceType
    /// Provider-side id of the thing that carried the file — a Gmail message
    /// id, say — so a stored attachment can be traced back to its email.
    sourceRef?: string
  }
) {
  if (input.bytes.byteLength === 0) {
    throw new Error("That file is empty.")
  }

  if (input.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Files must be under ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`
    )
  }

  const key = buildKey(ctx.tenantId, input.name)
  const stored = await storage().put(key, input.bytes, input.mimeType)

  const existing = await db.fileObject.findFirst({
    where: { checksum: stored.checksum },
  })

  if (existing) {
    // Drop the duplicate object rather than leaving it orphaned in storage.
    await storage().delete(key).catch(() => {})

    if (input.inboxItemId && !existing.inboxItemId) {
      return db.fileObject.update({
        where: { id: existing.id },
        data: { inboxItemId: input.inboxItemId },
      })
    }

    return existing
  }

  const file = await db.fileObject.create({
    data: {
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: stored.size,
      storageKey: stored.key,
      checksum: stored.checksum,
      inboxItemId: input.inboxItemId,
      sourceType: input.sourceType ?? "UPLOAD",
      sourceRef: input.sourceRef,
    } as never,
  })

  await logActivity(db, {
    action: "file.uploaded",
    summary: `Uploaded ${file.name}`,
    userId: ctx.userId,
    actorType: ctx.actorType,
    targetType: "FILE",
    targetId: file.id,
  })

  return file
}

/**
 * Captures a file into the inbox and reads it if it can.
 *
 * The inbox item is created first and always, so an unreadable file still
 * shows up as something the user consciously captured rather than vanishing.
 */
export async function captureFile(
  db: TenantDb,
  ctx: DomainContext,
  input: { name: string; mimeType: string; bytes: Buffer }
) {
  const item = await db.inboxItem.create({
    data: {
      kind: inboxKindFor(input.mimeType, input.name),
      status: "PENDING",
      title: input.name,
      sourceType: "UPLOAD",
    } as never,
  })

  const file = await storeUpload(db, ctx, { ...input, inboxItemId: item.id })

  let passwords: string[] | undefined
  if (input.mimeType === "application/pdf") {
    const { getVaultMap, buildPasswordCandidates } = await import("@/lib/domain/vault")
    const vault = await getVaultMap(db)
    passwords = buildPasswordCandidates(vault)
  }

  const outcome = await extractText(input.bytes, input.mimeType, passwords)

  const updated = await db.inboxItem.update({
    where: { id: item.id },
    data: outcome.supported
      ? { extractedText: outcome.text }
      : { status: "NEEDS_REVIEW", error: outcome.reason },
  })

  await indexEntity(db, {
    entityType: "FILE",
    entityId: file.id,
    title: file.name,
    body: outcome.supported ? outcome.text.slice(0, 20_000) : "",
    href: `/inbox/${item.id}`,
  })

  return { item: updated, file, extracted: outcome.supported }
}

/**
 * Reads a stored file back.
 *
 * The key is re-checked against the tenant even though the row was already
 * fetched through a scoped handle — storage has no tenant boundary of its own,
 * so this is the last line before raw bytes are returned.
 */
export async function readStoredFile(db: TenantDb, tenantId: string, fileId: string) {
  const file = await db.fileObject.findUnique({ where: { id: fileId } })
  if (!file) return null

  if (!keyBelongsTo(file.storageKey, tenantId)) {
    throw new Error("Stored object does not belong to this workspace")
  }

  return { file, bytes: await storage().get(file.storageKey) }
}

export async function deleteStoredFile(
  db: TenantDb,
  ctx: DomainContext,
  fileId: string
) {
  const file = await db.fileObject.findUnique({ where: { id: fileId } })
  if (!file) return false

  if (!keyBelongsTo(file.storageKey, ctx.tenantId)) {
    throw new Error("Stored object does not belong to this workspace")
  }

  await storage().delete(file.storageKey).catch(() => {})
  await db.fileObject.delete({ where: { id: fileId } })
  await removeFromIndex(db, "FILE", fileId)

  await logActivity(db, {
    action: "file.deleted",
    summary: `Deleted ${file.name}`,
    userId: ctx.userId,
    actorType: ctx.actorType,
    targetType: "FILE",
    targetId: fileId,
  })

  return true
}
