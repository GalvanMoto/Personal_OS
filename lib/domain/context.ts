import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import { neighbours } from "@/lib/domain/provenance"

/**
 * The Context Pack (PRD §10, §21) — the feature the PRD calls the real product.
 *
 * Opening a task should answer "what do I need to do this?" without the user
 * hunting through Drive, email and old chats. This assembles that answer from
 * the graph: the brief, the client, the assets the message asked for, what was
 * done before for the same client, and where every claim came from.
 */

export type ContextPackPayload = {
  task: {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    dueAt: string | null
  }
  project: { id: string; name: string; slug: string } | null
  organization: { id: string; name: string; slug: string } | null
  /// Verbatim instructions, quoted from whatever created this task.
  instructions: Array<{ text: string; source: string; capturedAt: string }>
  /// What the work needs before it can start.
  assets: Array<{ label: string; done: boolean }>
  checklist: Array<{ id: string; label: string; done: boolean }>
  siblingTasks: Array<{ id: string; title: string; status: string }>
  /// Finished work for the same client, as reference material.
  previousWork: Array<{ id: string; title: string; completedAt: string | null }>
  openQuestions: string[]
  sources: Array<{ kind: string; id: string; label: string }>
}

export async function buildContextPack(
  db: TenantDb,
  taskId: string
): Promise<ContextPackPayload | null> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      checklist: { orderBy: { position: "asc" } },
      project: {
        include: { organization: true },
      },
    },
  })

  if (!task) return null

  const organization = task.project?.organization ?? null

  // Where this task came from, and what the source literally said.
  const [provenance, graph] = await Promise.all([
    db.provenance.findMany({
      where: { targetType: "TASK", targetId: task.id },
      orderBy: { createdAt: "desc" },
    }),
    neighbours(db, "TASK", task.id),
  ])

  const inboxIds = graph.outgoing
    .filter((edge) => edge.toType === "INBOX_ITEM")
    .map((edge) => edge.toId)

  const inboxItems = inboxIds.length
    ? await db.inboxItem.findMany({ where: { id: { in: inboxIds } } })
    : []

  const instructions = provenance
    .filter((record) => record.evidence)
    .map((record) => ({
      text: record.evidence!,
      source: record.sourceType,
      capturedAt: record.createdAt.toISOString(),
    }))

  // Sibling tasks give the "3 reels" context: what else was asked for at once.
  const siblingTasks = task.projectId
    ? await db.task.findMany({
        where: { projectId: task.projectId, id: { not: task.id } },
        select: { id: true, title: true, status: true },
        orderBy: { position: "asc" },
        take: 20,
      })
    : []

  // Finished work for the same client is the best reference for new work.
  const previousWork = organization
    ? await db.task.findMany({
        where: {
          status: "DONE",
          id: { not: task.id },
          project: { organizationId: organization.id },
        },
        select: { id: true, title: true, completedAt: true },
        orderBy: { completedAt: "desc" },
        take: 8,
      })
    : []

  const openQuestions = inboxItems.flatMap((item) => {
    const proposal = item.proposal as { questions?: string[] } | null
    return proposal?.questions ?? []
  })

  return {
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt?.toISOString() ?? null,
    },
    project: task.project
      ? { id: task.project.id, name: task.project.name, slug: task.project.slug }
      : null,
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        }
      : null,
    instructions,
    assets: task.checklist
      .filter((entry) => /^collect /i.test(entry.label))
      .map((entry) => ({
        label: entry.label.replace(/^collect /i, ""),
        done: entry.done,
      })),
    checklist: task.checklist.map((entry) => ({
      id: entry.id,
      label: entry.label,
      done: entry.done,
    })),
    siblingTasks,
    previousWork: previousWork.map((entry) => ({
      id: entry.id,
      title: entry.title,
      completedAt: entry.completedAt?.toISOString() ?? null,
    })),
    openQuestions,
    sources: inboxItems.map((item) => ({
      kind: "INBOX_ITEM",
      id: item.id,
      label: item.title ?? item.rawText?.slice(0, 80) ?? "Captured item",
    })),
  }
}

/**
 * Returns a cached pack, rebuilding when it has gone stale.
 *
 * Assembling a pack touches half a dozen tables, which is too slow to repeat on
 * every render but too cheap to justify invalidation plumbing everywhere — a
 * short TTL keeps it honest without either cost.
 */
export async function getContextPack(db: TenantDb, taskId: string) {
  const cached = await db.contextPack.findUnique({ where: { taskId } })

  if (cached && (!cached.staleAt || cached.staleAt > new Date())) {
    return cached.payload as unknown as ContextPackPayload
  }

  const payload = await buildContextPack(db, taskId)
  if (!payload) return null

  const staleAt = new Date(Date.now() + 5 * 60 * 1000)

  await db.contextPack.upsert({
    where: { taskId },
    create: { taskId, payload: payload as never, staleAt } as never,
    update: { payload: payload as never, staleAt, generatedAt: new Date() },
  })

  return payload
}

/// Called when a task changes so the next read rebuilds instead of serving a
/// pack that describes the old state.
export async function invalidateContextPack(db: TenantDb, taskId: string) {
  await db.contextPack
    .updateMany({ where: { taskId }, data: { staleAt: new Date() } })
    .catch(() => {})
}
