import "server-only"

import { prisma } from "@/lib/db/client"

/**
 * Recurring work.
 *
 * The queue in `queue.ts` handles one-shot jobs; something still has to put the
 * repeating ones on it. Rather than a cron daemon per schedule, a single tick
 * runs every minute and enqueues whatever is now due — so the only moving part
 * outside the database is one loop, and a missed tick self-heals on the next
 * one instead of silently skipping a day's briefing.
 */

type Schedule = {
  kind: string
  /// How often this should run, in minutes.
  everyMinutes?: number
  /// Or: run once a day at this local hour.
  dailyAtHour?: number
  payload?: Record<string, unknown>
}

const SCHEDULES: Schedule[] = [
  // Reminders are time-sensitive; a minute of lag is invisible, an hour is not.
  { kind: "reminder.dispatch", everyMinutes: 1 },
  // Syncs emails from connected Gmail integrations every 5 minutes.
  { kind: "email.sync", everyMinutes: 5 },
  // Flags deadlines that are close with no work started against them.
  { kind: "deadline.sweep", everyMinutes: 60 },
  // The morning briefing.
  { kind: "briefing.daily", dailyAtHour: 8 },
  // Recurring-payment detection needs a full day of new transactions to be
  // worth re-running, and the warning is useful in the morning.
  { kind: "finance.subscriptions", dailyAtHour: 7 },
]

/// True when `now` is inside the first minute of the scheduled hour, which is
/// the window a per-minute tick can observe exactly once.
function isDailyDue(now: Date, hour: number): boolean {
  return now.getHours() === hour && now.getMinutes() === 0
}

function isIntervalDue(now: Date, everyMinutes: number): boolean {
  if (everyMinutes <= 1) return true
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
  return minutesSinceMidnight % everyMinutes === 0
}

/**
 * Enqueues due recurring jobs for every workspace.
 *
 * Deliberately idempotent: a job of the same kind already queued or running for
 * a tenant is not enqueued again, so a tick that fires twice — or a worker
 * restarting mid-minute — cannot pile up duplicate briefings.
 */
export async function tick(now = new Date()) {
  const due = SCHEDULES.filter((schedule) =>
    schedule.dailyAtHour !== undefined
      ? isDailyDue(now, schedule.dailyAtHour)
      : isIntervalDue(now, schedule.everyMinutes ?? 1)
  )

  if (due.length === 0) return { enqueued: 0, kinds: [] as string[] }

  const tenants = await prisma.tenant.findMany({ select: { id: true } })

  let enqueued = 0
  const kinds: string[] = []

  for (const tenant of tenants) {
    for (const schedule of due) {
      if (schedule.kind === "email.sync") {
        const integrations = await prisma.integration.findMany({
          where: { tenantId: tenant.id, provider: "GMAIL", status: "CONNECTED" },
          select: { id: true },
        })
        for (const integration of integrations) {
          const pending = await prisma.job.count({
            where: {
              tenantId: tenant.id,
              kind: "email.sync",
              status: { in: ["QUEUED", "RUNNING"] },
            },
          })
          if (pending === 0) {
            try {
              await prisma.job.create({
                data: {
                  tenantId: tenant.id,
                  kind: "email.sync",
                  payload: { integrationId: integration.id } as never,
                  runAt: now,
                },
              })
              enqueued++
              if (!kinds.includes("email.sync")) kinds.push("email.sync")
            } catch {}
          }
        }
        continue
      }

      const pending = await prisma.job.count({
        where: {
          tenantId: tenant.id,
          kind: schedule.kind,
          status: { in: ["QUEUED", "RUNNING"] },
        },
      })

      if (pending > 0) continue

      try {
        await prisma.job.create({
          data: {
            tenantId: tenant.id,
            kind: schedule.kind,
            payload: schedule.payload as never,
            runAt: now,
          },
        })
      } catch (error) {
        // A workspace deleted between the listing above and this insert fails
        // the foreign key. That is expected, not exceptional — skip it and keep
        // scheduling the rest rather than losing the whole tick.
        console.warn(
          `[schedule] skipped ${schedule.kind} for tenant ${tenant.id}`,
          error instanceof Error ? error.message : error
        )
        continue
      }

      enqueued++
      if (!kinds.includes(schedule.kind)) kinds.push(schedule.kind)
    }
  }

  return { enqueued, kinds }
}

/**
 * Clears finished jobs so the table stays a work queue rather than a log.
 *
 * `JobRun` keeps the history, so nothing auditable is lost here.
 */
export async function pruneJobs(olderThanDays = 7) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)

  const { count } = await prisma.job.deleteMany({
    where: { status: { in: ["SUCCEEDED", "CANCELLED"] }, updatedAt: { lt: cutoff } },
  })

  return count
}
