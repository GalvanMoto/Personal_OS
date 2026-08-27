import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { storeUpload } from "@/lib/domain/files"
import { logActivity } from "@/lib/events/activity"
import { getAccessToken } from "@/lib/integrations"
import { checksum } from "@/lib/storage/keys"
import {
  fetchGmailAttachment,
  listGmailAttachments,
  type GmailAttachmentRef,
} from "@/lib/integrations/gmail"

/**
 * Pulling files out of mail (PRD §45).
 *
 * Message sync deliberately stores only text, because bodies are small and
 * predictable while attachments are neither. This module is the explicit second
 * pass: it is called when something actually wants the file — the statement
 * importer, or the user asking for one — rather than on every sync, so a
 * mailbox full of newsletters never costs a download.
 *
 * Bytes land in the same object storage as uploads and become ordinary
 * `FileObject` rows, which means checksum dedupe, the files UI, and the tenant
 * key check all apply without a second implementation.
 */

/// Gmail returns base64url inside a JSON envelope rather than a byte stream, so
/// an attachment is fully resident in memory while it is stored. The cap sits
/// below the upload limit on purpose: a statement is tens of kilobytes, and
/// anything approaching this is a video someone mailed us.
export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

/// Formats any of our pipelines can actually read. Signature logos, calendar
/// invites and delivery receipts are the bulk of what else arrives.
const READABLE_MIME = new Set([
  "application/pdf",
  "text/csv",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])

const READABLE_EXTENSION = /\.(pdf|csv|xlsx?|txt)$/i

/**
 * Whether a listed attachment is worth redeeming for bytes.
 *
 * Mime type is checked first, then the filename — senders and mail clients
 * routinely label a plain PDF `application/octet-stream`, and refusing those
 * would silently drop exactly the bank statements this exists to catch.
 */
export function isReadableAttachment(ref: GmailAttachmentRef): boolean {
  if (ref.sizeBytes > MAX_ATTACHMENT_BYTES) return false
  return READABLE_MIME.has(ref.mimeType) || READABLE_EXTENSION.test(ref.filename)
}

/// Repairs the mime type when the sender did not set one, so downstream readers
/// dispatch on format rather than on `application/octet-stream`.
function resolveMimeType(ref: GmailAttachmentRef): string {
  if (READABLE_MIME.has(ref.mimeType)) return ref.mimeType

  const ext = ref.filename.toLowerCase().split(".").pop()
  if (ext === "pdf") return "application/pdf"
  if (ext === "csv") return "text/csv"
  if (ext === "txt") return "text/plain"
  if (ext === "xls") return "application/vnd.ms-excel"
  if (ext === "xlsx") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  }

  return ref.mimeType
}

export type IngestedAttachment = {
  fileId: string
  name: string
  mimeType: string
  sizeBytes: number
  /// True when the checksum matched a file already stored, so nothing new was
  /// written. Re-running an import is therefore free and idempotent.
  alreadyStored: boolean
}

/**
 * Downloads and stores every readable attachment on one message.
 *
 * `EmailMessage` rows carry no integration id — a Gmail message id is only
 * meaningful against the account that holds it — so each connected account is
 * tried until one answers. A miss is not an error: it means that message
 * belongs to a different connected mailbox.
 */
export async function ingestEmailAttachments(
  db: TenantDb,
  ctx: DomainContext,
  externalId: string
): Promise<IngestedAttachment[]> {
  const integrations = await db.integration.findMany({
    where: { tenantId: ctx.tenantId, provider: "GMAIL", status: "CONNECTED" },
  })

  for (const integration of integrations) {
    let accessToken: string
    let refs: GmailAttachmentRef[]

    try {
      accessToken = await getAccessToken(db, integration)
      refs = await listGmailAttachments(accessToken, externalId)
    } catch {
      // Wrong account for this message, or a token that will be repaired on the
      // next sync. Either way the next integration is the thing to try.
      continue
    }

    const wanted = refs.filter(isReadableAttachment)
    const stored: IngestedAttachment[] = []

    for (const ref of wanted) {
      try {
        const bytes = await fetchGmailAttachment(
          accessToken,
          externalId,
          ref.attachmentId
        )

        // Asked before storing rather than inferred from a row count, which
        // would race with any concurrent upload.
        const seen = await db.fileObject.findFirst({
          where: { checksum: checksum(bytes) },
          select: { id: true },
        })

        const file = await storeUpload(db, ctx, {
          name: ref.filename,
          mimeType: resolveMimeType(ref),
          bytes,
          sourceType: "GMAIL",
          sourceRef: externalId,
        })

        stored.push({
          fileId: file.id,
          name: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          alreadyStored: Boolean(seen),
        })
      } catch (error) {
        // One unreadable attachment must not cost the others. The failure is
        // logged rather than thrown so a statement alongside a corrupt image
        // still imports.
        console.warn(
          `[attachments] ${ref.filename} on ${externalId} failed:`,
          error
        )
      }
    }

    if (stored.length > 0) {
      await logActivity(db, {
        action: "email.attachments.ingested",
        summary: `Pulled ${stored.length} attachment${stored.length === 1 ? "" : "s"} from mail`,
        userId: ctx.userId,
        actorType: ctx.actorType ?? "AGENT",
        actorId: ctx.agent,
        metadata: { externalId, files: stored.map((f) => f.name) },
      })
    }

    return stored
  }

  return []
}
