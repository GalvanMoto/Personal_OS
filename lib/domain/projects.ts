import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { logActivity } from "@/lib/events/activity"
import { indexEntity } from "@/lib/search"
import { emit } from "@/lib/events/bus"
import type { ProjectStatus } from "@/lib/generated/prisma/enums"
import { slugify, uniqueSlug } from "@/lib/slug"

export async function createProject(
  db: TenantDb,
  ctx: DomainContext,
  input: {
    name: string
    description?: string
    organizationId?: string
    status?: ProjectStatus
    dueAt?: Date | null
  }
) {
  const slug = await uniqueSlug(input.name, async (candidate) =>
    Boolean(await db.project.findFirst({ where: { slug: candidate } }))
  )

  const project = await db.project.create({
    data: {
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      organizationId: input.organizationId,
      status: input.status ?? "ACTIVE",
      dueAt: input.dueAt ?? null,
    } as never,
  })

  await indexEntity(db, {
    entityType: "PROJECT",
    entityId: project.id,
    title: project.name,
    body: project.description ?? "",
    href: `/projects/${project.slug}`,
  })

  await emit(db, ctx.tenantId, {
    type: "project.created",
    payload: { projectId: project.id, name: project.name },
    actorType: ctx.actorType ?? "USER",
    actorId: ctx.agent ?? ctx.userId,
  })

  await logActivity(db, {
    action: "project.created",
    summary: `Created project "${project.name}"`,
    userId: ctx.userId,
    actorType: ctx.actorType,
    actorId: ctx.agent,
    targetType: "PROJECT",
    targetId: project.id,
  })

  return project
}

/// Same deterministic-match-then-create policy as organizations.
export async function resolveProject(
  db: TenantDb,
  ctx: DomainContext,
  name: string,
  organizationId?: string
) {
  const existing = await db.project.findFirst({
    where: { slug: slugify(name) },
  })

  if (existing) return { project: existing, created: false }

  return {
    project: await createProject(db, ctx, { name, organizationId }),
    created: true,
  }
}

/// Counts open vs closed work so the project list can show progress without
/// loading every task.
export async function projectsWithProgress(db: TenantDb) {
  const projects = await db.project.findMany({
    where: { status: { notIn: ["ARCHIVED"] } },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      tasks: { select: { status: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  })

  return projects.map((project) => {
    const total = project.tasks.length
    const done = project.tasks.filter((task) => task.status === "DONE").length

    return {
      ...project,
      tasks: undefined,
      totalTasks: total,
      doneTasks: done,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
    }
  })
}
