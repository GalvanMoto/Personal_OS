"use server"

import { revalidatePath } from "next/cache"
import { requireWorkspace } from "@/lib/auth/dal"
import { drain } from "@/lib/jobs/runner"
import { tick } from "@/lib/jobs/schedule"
import { enqueue } from "@/lib/jobs/queue"
import { logActivity } from "@/lib/events/activity"

export async function triggerRoutineAction(workspace: string, kind: string) {
  const { db, user, tenant } = await requireWorkspace(workspace)

  try {
    // Enqueue the specific routine for this tenant
    const job = await enqueue(db, kind, { trigger: "manual-ui" })

    // Drain the worker queue immediately
    await drain(10)

    await logActivity(db, {
      action: "automation.routine.triggered",
      summary: `Manually triggered background routine: ${kind}`,
      userId: user.id,
      actorType: "USER",
      metadata: { kind, jobId: job.id },
    })

    revalidatePath(`/w/${workspace}/automations`)
    revalidatePath(`/w/${workspace}/notifications`)
    revalidatePath(`/w/${workspace}/today`)

    return { ok: true, jobId: job.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to run routine" }
  }
}

export async function triggerWorkerTickAction(workspace: string) {
  const { db, user, tenant } = await requireWorkspace(workspace)

  try {
    await tick(new Date())
    await drain(20)

    revalidatePath(`/w/${workspace}/automations`)
    revalidatePath(`/w/${workspace}/today`)

    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to execute worker tick" }
  }
}
