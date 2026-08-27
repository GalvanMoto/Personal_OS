import "server-only"

import { contextForTenant, handlerFor } from "@/lib/jobs/handlers"
import { claimNext, finishJob } from "@/lib/jobs/queue"

/**
 * Executes one job if any is due.
 *
 * Kept as a single step so it can be driven from a worker loop, a cron hit, or
 * a test — the scheduling policy lives outside, and the execution semantics
 * stay identical everywhere.
 */
export async function runOnce(): Promise<
  { ran: false } | { ran: true; kind: string; ok: boolean }
> {
  const job = await claimNext()
  if (!job) return { ran: false }

  const handler = handlerFor(job.kind)

  if (!handler) {
    await finishJob(job.id, "FAILED", {
      tenantId: job.tenantId,
      error: `No handler registered for job kind "${job.kind}"`,
    })
    return { ran: true, kind: job.kind, ok: false }
  }

  try {
    const output = await handler(
      (job.payload as Record<string, unknown>) ?? {},
      contextForTenant(job.tenantId)
    )

    await finishJob(job.id, "SUCCEEDED", { tenantId: job.tenantId, output })
    return { ran: true, kind: job.kind, ok: true }
  } catch (error) {
    await finishJob(job.id, "FAILED", {
      tenantId: job.tenantId,
      error: error instanceof Error ? error.message : "Job failed",
    })
    return { ran: true, kind: job.kind, ok: false }
  }
}

/// Drains everything currently due, with a ceiling so one wedged producer
/// cannot spin the worker forever.
export async function drain(limit = 100) {
  let processed = 0

  while (processed < limit) {
    const result = await runOnce()
    if (!result.ran) break
    processed++
  }

  return processed
}
