"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  fail,
  fromZodError,
  guard,
  ok,
  workspaceContext,
  type ActionResult,
} from "@/lib/actions/shared"
import {
  applyProposal,
  captureAndProcess,
  dismissItem,
} from "@/lib/domain/inbox"

const captureSchema = z.object({
  text: z.string().trim().min(1, "Paste or type something first").max(50_000),
})

/**
 * The paste box (PRD §24).
 *
 * Capture and interpretation happen together, but nothing is written into the
 * graph — the result is a proposal the user reviews. That is the difference
 * between an assistant and an app that silently invents tasks.
 */
export async function captureAction(
  workspace: string,
  formData: FormData
): Promise<ActionResult<{ id: string; status: string }>> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    const parsed = captureSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return fromZodError(parsed.error)

    const item = await captureAndProcess(db, ctx, {
      rawText: parsed.data.text,
      kind: "TEXT",
    })

    revalidatePath(`/w/${workspace}`, "layout")
    return ok({ id: item.id, status: item.status })
  })
}

const applySchema = z.object({
  organizationName: z.string().trim().max(120).nullish(),
  projectName: z.string().trim().max(120).nullish(),
  dueAt: z.string().trim().nullish(),
  acceptTaskIndices: z.array(z.number().int().min(0)).optional(),
})

export async function applyProposalAction(
  workspace: string,
  inboxItemId: string,
  overrides: z.input<typeof applySchema> = {}
): Promise<ActionResult<{ taskCount: number }>> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    const parsed = applySchema.safeParse(overrides)
    if (!parsed.success) return fromZodError(parsed.error)

    const item = await db.inboxItem.findUnique({ where: { id: inboxItemId } })
    if (!item) return fail("That inbox item no longer exists.")
    if (item.status === "PROCESSED") {
      return fail("This item has already been filed.")
    }

    let dueAt: Date | null | undefined
    if (parsed.data.dueAt !== undefined) {
      if (parsed.data.dueAt === null || parsed.data.dueAt === "") {
        dueAt = null
      } else {
        const candidate = new Date(parsed.data.dueAt)
        if (Number.isNaN(candidate.getTime())) {
          return fail("That deadline is not a valid date.", { dueAt: "Invalid date" })
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(parsed.data.dueAt)) {
          candidate.setHours(23, 59, 59, 0)
        }
        dueAt = candidate
      }
    }

    const result = await applyProposal(db, ctx, inboxItemId, {
      organizationName: parsed.data.organizationName ?? undefined,
      projectName: parsed.data.projectName ?? undefined,
      dueAt,
      acceptTaskIndices: parsed.data.acceptTaskIndices,
    })

    revalidatePath(`/w/${workspace}`, "layout")
    return ok({ taskCount: result.tasks.length })
  })
}

export async function dismissInboxItemAction(
  workspace: string,
  inboxItemId: string
): Promise<ActionResult> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    await dismissItem(db, ctx, inboxItemId)

    revalidatePath(`/w/${workspace}`, "layout")
    return ok()
  })
}
