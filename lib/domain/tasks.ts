import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { recordFact } from "@/lib/domain/provenance"
import { compareByScore, scoreTask } from "@/lib/domain/scoring"
import { logActivity } from "@/lib/events/activity"
import { indexEntity, removeFromIndex } from "@/lib/search"
import { emit } from "@/lib/events/bus"
import { publishRealtime } from "@/lib/realtime/bus"
import type {
  SourceType,
  TaskPriority,
  TaskStatus,
} from "@/lib/generated/prisma/enums"

export type CreateTaskInput = {
  title: string
  description?: string
  /// Tiptap JSON (rich notes, links, lists) — stored as Json, plain text indexed
  content?: unknown | null
  linkUrls?: string[]
  projectId?: string
  parentId?: string
  priority?: TaskPriority
  status?: TaskStatus
  dueAt?: Date | null
  estimateMin?: number | null
  checklist?: string[]
  /// Where this task came from, when it was not typed by hand.
  source?: {
    type: SourceType
    /// Id of the record inside this system that produced it (an inbox item,
    /// an email row).
    id?: string
    /// Provider-side reference, when the origin is external (a Gmail message
    /// id, a URL).
    ref?: string
    evidence?: string
  }
}

function sanitizeLinks(urls: unknown): string[] {
  if (!Array.isArray(urls)) return []
  const out: string[] = []
  for (const u of urls) {
    const s = String(u ?? "").trim()
    if (!s) continue
    // allow http(s) or drive/docs/sheets links only, deduped
    if (/^https?:\/\//i.test(s) && s.length <= 500) {
      if (!out.includes(s)) out.push(s)
    }
  }
  return out.slice(0, 12)
}

function plainFromContent(c: unknown): string {
  try {
    const j: any = c
    if (!j) return ""
    const walk = (n: any): string => {
      if (!n) return ""
      if (n.type === "text") return n.text ?? ""
      if (Array.isArray(n.content)) return n.content.map(walk).join(n.type === "paragraph" ? "\n\n" : " ")
      return ""
    }
    return walk(j).trim().slice(0, 4000)
  } catch { return "" }
}

export async function createTask(
  db: TenantDb,
  ctx: DomainContext,
  input: CreateTaskInput
) {
  const links = sanitizeLinks(input.linkUrls)
  const task = await db.task.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      content: (input.content as never) ?? undefined,
      linkUrls: links.length ? links : undefined,
      projectId: input.projectId,
      parentId: input.parentId,
      priority: input.priority ?? "MEDIUM",
      status: input.status ?? "TODO",
      dueAt: input.dueAt ?? null,
      estimateMin: input.estimateMin ?? null,
      createdBy: ctx.actorType ?? "USER",
      checklist: input.checklist?.length
        ? {
            create: input.checklist.map((label, position) => ({
              // Children of a tenant-scoped create still need the stamp, since
              // the extension only rewrites the top-level `data`.
              tenantId: ctx.tenantId,
              label,
              position,
            })),
          }
        : undefined,
    } as never,
    include: { checklist: true },
  })

  // A deadline the user never typed needs a receipt (PRD §18).
  if (input.source && input.dueAt) {
    await recordFact(db, {
      targetType: "TASK",
      targetId: task.id,
      field: "dueAt",
      value: input.dueAt.toISOString(),
      sourceType: input.source.type,
      sourceId: input.source.id,
      sourceRef: input.source.ref,
      evidence: input.source.evidence,
    })
  }

  const bodyForIndex = [task.description ?? "", plainFromContent((task as any).content), ((task as any).linkUrls as string[] | undefined)?.join(" ") ?? ""].filter(Boolean).join("\n\n")
  await indexEntity(db, {
    entityType: "TASK",
    entityId: task.id,
    title: task.title,
    body: bodyForIndex,
    href: `/tasks/${task.id}`,
  })

  await emit(db, ctx.tenantId, {
    type: "task.created",
    payload: { taskId: task.id, title: task.title },
    actorType: ctx.actorType ?? "USER",
    actorId: ctx.agent ?? ctx.userId,
  })

  await logActivity(db, {
    action: "task.created",
    summary: `Created task "${task.title}"`,
    userId: ctx.userId,
    actorType: ctx.actorType,
    actorId: ctx.agent,
    targetType: "TASK",
    targetId: task.id,
  })

  publishRealtime({ type: "task", tenantId: ctx.tenantId, payload: { id: task.id, title: task.title }, at: new Date().toISOString() }).catch(() => {})
  publishRealtime({ type: "badge", tenantId: ctx.tenantId, payload: {}, at: new Date().toISOString() }).catch(() => {})

  return task
}

export type UpdateTaskInput = Partial<{
  title: string
  description: string | null
  content: unknown | null
  linkUrls: string[] | null
  status: TaskStatus
  priority: TaskPriority
  projectId: string | null
  dueAt: Date | null
  estimateMin: number | null
  waitingOn: string | null
}>

export async function updateTask(
  db: TenantDb,
  ctx: DomainContext,
  taskId: string,
  patch: UpdateTaskInput
) {
  const before = await db.task.findUnique({ where: { id: taskId } })
  if (!before) throw new Error("Task not found")

  // Status changes carry timestamps with them, so callers cannot forget to set
  // completedAt and leave the finance/briefing queries lying.
  const data: Record<string, unknown> = { ...patch }

  if (patch.status && patch.status !== before.status) {
    if (patch.status === "IN_PROGRESS" && !before.startedAt) {
      data.startedAt = new Date()
    }
    data.completedAt = patch.status === "DONE" ? new Date() : null
  }

  // sanitize links if present
  if (patch.linkUrls !== undefined && patch.linkUrls !== null) {
    data.linkUrls = sanitizeLinks(patch.linkUrls) as never
  }
  if (patch.content !== undefined) data.content = patch.content as never

  const task = await db.task.update({ where: { id: taskId }, data: data as never })

  if (patch.title !== undefined || patch.description !== undefined || patch.content !== undefined || patch.linkUrls !== undefined) {
    const body = [task.description ?? "", plainFromContent((task as any).content), ((task as any).linkUrls as string[] | undefined)?.join(" ") ?? ""].filter(Boolean).join("\n\n")
    await indexEntity(db, {
      entityType: "TASK",
      entityId: task.id,
      title: task.title,
      body,
      href: `/tasks/${task.id}`,
    })
  }

  const completed = patch.status === "DONE" && before.status !== "DONE"

  await emit(db, ctx.tenantId, {
    type: completed ? "task.completed" : "task.updated",
    payload: { taskId, from: before.status, to: task.status },
    actorType: ctx.actorType ?? "USER",
    actorId: ctx.agent ?? ctx.userId,
  })

  await logActivity(db, {
    action: completed ? "task.completed" : "task.updated",
    summary: completed
      ? `Completed "${task.title}"`
      : `Updated "${task.title}"`,
    userId: ctx.userId,
    actorType: ctx.actorType,
    actorId: ctx.agent,
    targetType: "TASK",
    targetId: task.id,
    metadata: { changed: Object.keys(patch) },
  })

  return task
}

const OPEN_STATUSES: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "WAITING",
  "BLOCKED",
]

/// Loads open tasks with everything the scorer needs, in one round trip.
async function loadScorable(db: TenantDb) {
  return db.task.findMany({
    where: { status: { in: OPEN_STATUSES }, parentId: null },
    include: {
      project: { select: { id: true, name: true, slug: true, status: true } },
      subtasks: { select: { id: true, status: true } },
    },
  })
}

export type RankedTask = Awaited<ReturnType<typeof loadScorable>>[number] & {
  score: number
  reasons: string[]
}

/**
 * Every open task with its score and the reasons behind it.
 *
 * Scores are computed on read rather than stored, so changing a weight takes
 * effect immediately instead of requiring a backfill. The `score` column on the
 * table is only a cache for background jobs that cannot afford this query.
 */
export async function rankedTasks(
  db: TenantDb,
  now = new Date()
): Promise<RankedTask[]> {
  const tasks = await loadScorable(db)

  return tasks
    .map((task) => {
      const { score, reasons } = scoreTask({
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt,
        startedAt: task.startedAt,
        estimateMin: task.estimateMin,
        openSubtasks: task.subtasks.filter(
          (sub) => sub.status !== "DONE" && sub.status !== "CANCELLED"
        ).length,
        projectActive: task.project?.status === "ACTIVE",
        now,
      })
      return { ...task, score, reasons }
    })
    .sort(compareByScore)
}

/// The single task the assistant should recommend, with its justification.
export async function nextBestAction(db: TenantDb, now = new Date()) {
  const ranked = await rankedTasks(db, now)

  // Skip anything parked: recommending a blocked task is worse than silence.
  const actionable = ranked.filter(
    (task) => task.status !== "WAITING" && task.status !== "BLOCKED"
  )

  return actionable[0] ?? null
}

/**
 * The Today page in one query set (PRD §38).
 *
 * Buckets are computed against the caller's `now` rather than SQL `now()` so
 * the user's timezone decides what "today" means, not the server's.
 */
export async function agenda(db: TenantDb, now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
  const inSevenDays = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)

  const ranked = await rankedTasks(db, now)

  const overdue = ranked.filter((t) => t.dueAt && t.dueAt < startOfToday)
  const dueToday = ranked.filter(
    (t) => t.dueAt && t.dueAt >= startOfToday && t.dueAt < startOfTomorrow
  )
  const dueSoon = ranked.filter(
    (t) => t.dueAt && t.dueAt >= startOfTomorrow && t.dueAt < inSevenDays
  )
  const waiting = ranked.filter(
    (t) => t.status === "WAITING" || t.status === "BLOCKED"
  )
  const inProgress = ranked.filter((t) => t.status === "IN_PROGRESS")

  const completedRecently = await db.task.findMany({
    where: {
      status: "DONE",
      completedAt: { gte: new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  })

  return {
    overdue,
    dueToday,
    dueSoon,
    waiting,
    inProgress,
    completedRecently,
    nextBest:
      ranked.find((t) => t.status !== "WAITING" && t.status !== "BLOCKED") ??
      null,
  }
}

/**
 * Deletes a task and everything that points at it.
 *
 * Subtasks, checklist rows and context packs cascade in the schema; the search
 * index does not, so it is cleared here. Deleting through this function rather
 * than `db.task.delete()` is what keeps search from returning ghosts.
 */
export async function deleteTask(
  db: TenantDb,
  ctx: DomainContext,
  taskId: string
) {
  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error("Task not found")

  await db.task.delete({ where: { id: taskId } })
  await removeFromIndex(db, "TASK", taskId)

  await logActivity(db, {
    action: "task.deleted",
    summary: `Deleted "${task.title}"`,
    userId: ctx.userId,
    actorType: ctx.actorType,
    actorId: ctx.agent,
    targetType: "TASK",
    targetId: taskId,
  })

  return { deleted: taskId, title: task.title }
}
