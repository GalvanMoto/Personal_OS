import "server-only"

import { prisma } from "@/lib/db/client"
import type { TenantDb } from "@/lib/db/tenant"
import type { JobStatus } from "@/lib/generated/prisma/enums"

/**
 * A Postgres-backed job queue.
 *
 * Redis and BullMQ are the obvious choice at scale, but this system is
 * self-hosted and every extra daemon is another thing to keep alive on the
 * user's own box. `FOR UPDATE SKIP LOCKED` gives exactly-once claiming across
 * concurrent workers using the database that already has to be running, and
 * the swap to BullMQ later is confined to this file.
 */

export async function enqueue(
  db: TenantDb,
  kind: string,
  payload?: Record<string, unknown>,
  runAt: Date = new Date()
) {
  return db.job.create({
    data: { kind, payload: payload as never, runAt } as never,
  })
}

type ClaimedJob = {
  id: string
  tenantId: string
  kind: string
  payload: unknown
  attempts: number
  maxAttempts: number
}

/**
 * Atomically takes the next due job.
 *
 * The claim and the status change happen in one statement so two workers can
 * never pick up the same row; `SKIP LOCKED` means a busy row is passed over
 * rather than blocking the whole queue.
 */
export async function claimNext(): Promise<ClaimedJob | null> {
  const rows = await prisma.$queryRaw<ClaimedJob[]>`
    UPDATE jobs
       SET status = 'RUNNING',
           attempts = attempts + 1,
           "updatedAt" = now()
     WHERE id = (
       SELECT id
         FROM jobs
        WHERE status = 'QUEUED'
          AND "runAt" <= now()
        ORDER BY "runAt"
        FOR UPDATE SKIP LOCKED
        LIMIT 1
     )
    RETURNING id, "tenantId", kind, payload, attempts, "maxAttempts"
  `

  return rows[0] ?? null
}

export async function finishJob(
  jobId: string,
  status: Extract<JobStatus, "SUCCEEDED" | "FAILED">,
  detail: { output?: unknown; error?: string; tenantId: string }
) {
  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) return

  // A failure with attempts left goes back on the queue with a backoff rather
  // than being lost; only a job out of attempts is marked FAILED for good.
  const exhausted = job.attempts >= job.maxAttempts
  const finalStatus =
    status === "SUCCEEDED" ? "SUCCEEDED" : exhausted ? "FAILED" : "QUEUED"

  const backoffMs = Math.min(2 ** job.attempts * 1000, 5 * 60 * 1000)

  await prisma.$transaction([
    prisma.job.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        lastError: detail.error ?? null,
        runAt:
          finalStatus === "QUEUED"
            ? new Date(Date.now() + backoffMs)
            : job.runAt,
      },
    }),
    prisma.jobRun.create({
      data: {
        tenantId: detail.tenantId,
        jobId,
        status: status === "SUCCEEDED" ? "SUCCEEDED" : "FAILED",
        finishedAt: new Date(),
        output: detail.output as never,
        error: detail.error,
      },
    }),
  ])
}
