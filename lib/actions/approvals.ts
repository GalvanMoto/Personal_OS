"use server"

import { revalidatePath } from "next/cache"

import {
  fail,
  guard,
  ok,
  workspaceContext,
  type ActionResult,
} from "@/lib/actions/shared"
import { executeApproved } from "@/lib/agents/tools"
import { logActivity } from "@/lib/events/activity"

/**
 * Resolving an agent's request to do something sensitive (PRD §19, §25).
 *
 * Approval and execution are one action on purpose: an approved-but-never-run
 * request is a lie the Activity page would happily display. The decision is
 * recorded either way, so a denial is as auditable as a go-ahead.
 */
export async function approveRequestAction(
  workspace: string,
  approvalId: string
): Promise<ActionResult<{ executed: boolean }>> {
  return guard(async () => {
    const { db, ctx, user } = await workspaceContext(workspace)

    const request = await db.approvalRequest.findUnique({
      where: { id: approvalId },
    })

    if (!request) return fail("That request no longer exists.")
    if (request.status !== "PENDING") {
      return fail(`This request was already ${request.status.toLowerCase()}.`)
    }
    if (request.expiresAt && request.expiresAt < new Date()) {
      await db.approvalRequest.update({
        where: { id: approvalId },
        data: { status: "EXPIRED" },
      })
      return fail("This request expired before it was approved.")
    }

    await db.approvalRequest.update({
      where: { id: approvalId },
      data: { status: "APPROVED", decidedBy: user.id, decidedAt: new Date() },
    })

    await logActivity(db, {
      action: "agent.approval.granted",
      summary: `Approved ${request.tool}`,
      userId: user.id,
      metadata: { tool: request.tool, approvalId },
    })

    const outcome = await executeApproved(approvalId, { db, ctx })

    revalidatePath(`/w/${workspace}`, "layout")

    if (outcome.status === "ERROR") {
      return fail(`Approved, but it failed to run: ${outcome.error}`)
    }

    return ok({ executed: outcome.status === "OK" })
  })
}

export async function rejectRequestAction(
  workspace: string,
  approvalId: string
): Promise<ActionResult> {
  return guard(async () => {
    const { db, user } = await workspaceContext(workspace)

    const request = await db.approvalRequest.findUnique({
      where: { id: approvalId },
    })

    if (!request) return fail("That request no longer exists.")
    if (request.status !== "PENDING") {
      return fail(`This request was already ${request.status.toLowerCase()}.`)
    }

    await db.approvalRequest.update({
      where: { id: approvalId },
      data: { status: "REJECTED", decidedBy: user.id, decidedAt: new Date() },
    })

    await logActivity(db, {
      action: "agent.approval.rejected",
      summary: `Declined ${request.tool}`,
      userId: user.id,
      metadata: { tool: request.tool, approvalId },
    })

    revalidatePath(`/w/${workspace}`, "layout")
    return ok()
  })
}
