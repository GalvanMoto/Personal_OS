import "server-only"

import type { TenantDb } from "@/lib/db/tenant"

/**
 * Dashboard aggregates.
 *
 * Everything here is counted from rows, not sampled or estimated, and every
 * bucket is dense — a week with no activity is a zero rather than a gap, so the
 * shape of the chart reflects the real rhythm of the work.
 */

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export type ThroughputPoint = {
  label: string
  captured: number
  completed: number
  blocked: number
}

/**
 * Work in, work out, work stuck — per week.
 *
 * Three counts of the same unit, so one axis. "Blocked" is measured at the end
 * of each week rather than counted as an event, because what matters is how
 * much was still parked, not how often something got parked.
 */
export async function weeklyThroughput(
  db: TenantDb,
  weeks = 4,
  now = new Date()
): Promise<ThroughputPoint[]> {
  const endOfThisWeek = startOfDay(new Date(now.getTime() + DAY_MS))
  const firstStart = new Date(endOfThisWeek.getTime() - weeks * 7 * DAY_MS)

  const [created, completed, blocked] = await Promise.all([
    db.task.findMany({
      where: { createdAt: { gte: firstStart } },
      select: { createdAt: true },
    }),
    db.task.findMany({
      where: { completedAt: { gte: firstStart } },
      select: { completedAt: true },
    }),
    db.task.findMany({
      where: { status: { in: ["WAITING", "BLOCKED"] } },
      select: { createdAt: true },
    }),
  ])

  return Array.from({ length: weeks }, (_unused, index) => {
    const start = new Date(firstStart.getTime() + index * 7 * DAY_MS)
    const end = new Date(start.getTime() + 7 * DAY_MS)

    const inRange = (date: Date | null) =>
      date !== null && date >= start && date < end

    return {
      label: `Week ${index + 1}`,
      captured: created.filter((task) => inRange(task.createdAt)).length,
      completed: completed.filter((task) => inRange(task.completedAt)).length,
      // Parked work that already existed by the end of this week.
      blocked: blocked.filter((task) => task.createdAt < end).length,
    }
  })
}

export type WorkloadRow = {
  name: string
  count: number
  share: number
}

/**
 * Open deliverables per client.
 *
 * Work with no client is a real bucket, not an omission — it is usually the
 * personal and admin tasks, and hiding it would make the shares lie.
 */
export async function workloadByClient(db: TenantDb): Promise<{
  total: number
  rows: WorkloadRow[]
}> {
  const tasks = await db.task.findMany({
    where: { status: { notIn: ["DONE", "CANCELLED"] } },
    select: { project: { select: { organization: { select: { name: true } } } } },
  })

  const totals = new Map<string, number>()

  for (const task of tasks) {
    const name = task.project?.organization?.name ?? "Unassigned"
    totals.set(name, (totals.get(name) ?? 0) + 1)
  }

  const total = tasks.length

  const rows = [...totals.entries()]
    .map(([name, count]) => ({
      name,
      count,
      share: total === 0 ? 0 : Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count)

  return { total, rows }
}

/// Daily counts for a stat tile's sparkline. Dense, including zero days.
export async function dailyCounts(
  db: TenantDb,
  days = 21,
  now = new Date()
): Promise<{ captured: number[]; completed: number[] }> {
  const start = startOfDay(new Date(now.getTime() - (days - 1) * DAY_MS))

  const [created, done] = await Promise.all([
    db.task.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    db.task.findMany({
      where: { completedAt: { gte: start } },
      select: { completedAt: true },
    }),
  ])

  const bucket = (dates: Array<Date | null>) => {
    const counts = new Array<number>(days).fill(0)

    for (const date of dates) {
      if (!date) continue
      const index = Math.floor((date.getTime() - start.getTime()) / DAY_MS)
      if (index >= 0 && index < days) counts[index]++
    }

    return counts
  }

  return {
    captured: bucket(created.map((task) => task.createdAt)),
    completed: bucket(done.map((task) => task.completedAt)),
  }
}

/**
 * Who did the work — the user and each agent, by logged action.
 *
 * Reads the activity log rather than a counter, so it cannot drift from what
 * the audit trail actually says happened.
 */
export async function actorPerformance(db: TenantDb, days = 1, now = new Date()) {
  const since = startOfDay(new Date(now.getTime() - (days - 1) * DAY_MS))

  const entries = await db.activityLog.findMany({
    where: { createdAt: { gte: since } },
    select: { actorType: true, actorId: true, action: true },
  })

  const totals = new Map<string, { actions: number; failures: number }>()

  for (const entry of entries) {
    const key =
      entry.actorType === "AGENT" ? (entry.actorId ?? "agent") : entry.actorType
    const current = totals.get(key) ?? { actions: 0, failures: 0 }

    current.actions++
    if (entry.action.endsWith(".failed")) current.failures++
    totals.set(key, current)
  }

  return [...totals.entries()]
    .map(([actor, stats]) => ({
      actor,
      actions: stats.actions,
      // Share of this actor's attempts that did not error.
      successRate:
        stats.actions === 0
          ? 100
          : Math.round(((stats.actions - stats.failures) / stats.actions) * 100),
    }))
    .sort((a, b) => b.actions - a.actions)
}
