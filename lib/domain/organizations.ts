import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { logActivity } from "@/lib/events/activity"
import { indexEntity } from "@/lib/search"
import { emit } from "@/lib/events/bus"
import type { OrgKind } from "@/lib/generated/prisma/enums"
import { slugify, uniqueSlug } from "@/lib/slug"

export async function createOrganization(
  db: TenantDb,
  ctx: DomainContext,
  input: { name: string; kind?: OrgKind; website?: string; notes?: string }
) {
  const slug = await uniqueSlug(input.name, async (candidate) =>
    Boolean(await db.organization.findFirst({ where: { slug: candidate } }))
  )

  const organization = await db.organization.create({
    data: {
      name: input.name.trim(),
      kind: input.kind ?? "CLIENT",
      slug,
      website: input.website?.trim() || null,
      notes: input.notes?.trim() || null,
    } as never,
  })

  await indexEntity(db, {
    entityType: "ORGANIZATION",
    entityId: organization.id,
    title: organization.name,
    body: [organization.notes, organization.website].filter(Boolean).join(" "),
    href: `/clients/${organization.slug}`,
  })

  await emit(db, ctx.tenantId, {
    type: "organization.created",
    payload: { organizationId: organization.id, name: organization.name },
    actorType: ctx.actorType ?? "USER",
    actorId: ctx.agent ?? ctx.userId,
  })

  await logActivity(db, {
    action: "organization.created",
    summary: `Added ${organization.kind.toLowerCase()} "${organization.name}"`,
    userId: ctx.userId,
    actorType: ctx.actorType,
    actorId: ctx.agent,
    targetType: "ORGANIZATION",
    targetId: organization.id,
  })

  return organization
}

/**
 * Finds an existing organization by name before creating one.
 *
 * This is the narrow, deterministic half of entity resolution (PRD §36): exact
 * slug match only. Fuzzy matching ("GB" vs "GB Banquet") belongs to an agent
 * that proposes a merge for confirmation, not to this path — silently merging
 * two real clients is far worse than briefly holding a duplicate.
 */
export async function resolveOrganization(
  db: TenantDb,
  ctx: DomainContext,
  name: string,
  kind: OrgKind = "CLIENT"
) {
  const existing = await db.organization.findFirst({
    where: { slug: slugify(name) },
  })

  if (existing) return { organization: existing, created: false }

  return {
    organization: await createOrganization(db, ctx, { name, kind }),
    created: true,
  }
}

/// Everything hanging off one client, for the client page (PRD §41).
export async function organizationOverview(db: TenantDb, organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      people: true,
      projects: {
        include: { _count: { select: { tasks: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  })

  if (!organization) return null

  const projectIds = organization.projects.map((project) => project.id)

  const [openTasks, transactions] = await Promise.all([
    db.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      orderBy: { dueAt: "asc" },
      take: 25,
    }),
    db.transaction.findMany({
      where: { organizationId },
      orderBy: { occurredAt: "desc" },
      take: 10,
    }),
  ])

  return { organization, openTasks, transactions }
}
