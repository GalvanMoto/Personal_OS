"use server"

import { revalidatePath } from "next/cache"

import {
  fail,
  guard,
  ok,
  workspaceContext,
  type ActionResult,
} from "@/lib/actions/shared"
import { captureFile, deleteStoredFile, MAX_UPLOAD_BYTES } from "@/lib/domain/files"
import { processItem } from "@/lib/domain/inbox"

/**
 * Upload straight into the inbox (PRD §6).
 *
 * A readable file goes on to extraction in the same call, so dropping a brief
 * in produces a reviewable proposal rather than an attachment the user still
 * has to describe.
 */
export async function uploadToInboxAction(
  workspace: string,
  formData: FormData
): Promise<ActionResult<{ inboxItemId: string; extracted: boolean }>> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    const file = formData.get("file")

    if (!(file instanceof File)) {
      return fail("Choose a file to upload.", { file: "No file received" })
    }

    if (file.size === 0) return fail("That file is empty.")

    if (file.size > MAX_UPLOAD_BYTES) {
      return fail(
        `Files must be under ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`
      )
    }

    const bytes = Buffer.from(await file.arrayBuffer())

    const { item, extracted } = await captureFile(db, ctx, {
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      bytes,
    })

    // Only run extraction when there is text to read; otherwise the item stays
    // in review with the reason already recorded.
    if (extracted) await processItem(db, ctx, item.id)

    revalidatePath(`/w/${workspace}`, "layout")
    return ok({ inboxItemId: item.id, extracted })
  })
}

export async function deleteFileAction(
  workspace: string,
  fileId: string
): Promise<ActionResult> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    const removed = await deleteStoredFile(db, ctx, fileId)
    if (!removed) return fail("That file no longer exists.")

    revalidatePath(`/w/${workspace}`, "layout")
    return ok()
  })
}
