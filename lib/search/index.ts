import "server-only"

import { prisma } from "@/lib/db/client"
import type { TenantDb } from "@/lib/db/tenant"
import type { EntityType } from "@/lib/generated/prisma/enums"

/**
 * Cross-entity search (PRD §12).
 *
 * "Where is GB Banquet's latest logo?" should not require the user to know
 * whether the answer is a task, a project or a file. One index over every
 * entity makes that a single ranked query.
 *
 * Ranking blends two signals because they fail in opposite ways: full-text
 * handles real words and stemming but misses typos, while trigram similarity
 * catches "taniaqua" for "Tanniaqua" but ranks common words badly.
 */

export type SearchHit = {
  entityType: EntityType
  entityId: string
  title: string
  href: string | null
  score: number
}

type IndexInput = {
  entityType: EntityType
  entityId: string
  title: string
  body?: string
  href?: string | null
}

/// Upserts an entity's searchable representation. Safe to call on every write.
export async function indexEntity(db: TenantDb, input: IndexInput) {
  return db.searchDocument.upsert({
    where: {
      // tenantId is filled in by the tenant-scoping extension.
      tenantId_entityType_entityId: {
        entityType: input.entityType,
        entityId: input.entityId,
      },
    } as never,
    create: {
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      body: input.body ?? "",
      href: input.href ?? null,
    } as never,
    update: {
      title: input.title,
      body: input.body ?? "",
      href: input.href ?? null,
    },
  })
}

export async function removeFromIndex(
  db: TenantDb,
  entityType: EntityType,
  entityId: string
) {
  await db.searchDocument
    .deleteMany({ where: { entityType, entityId } })
    .catch(() => {})
}

/**
 * Ranked search across every indexed entity.
 *
 * This is raw SQL, which means the tenant-scoping extension does not apply —
 * `tenantId` is therefore a required argument and appears in the WHERE clause
 * explicitly. Do not add a code path here that omits it.
 */
export async function search(
  tenantId: string,
  query: string,
  options: { types?: EntityType[]; limit?: number } = {}
): Promise<SearchHit[]> {
  const term = query.trim()
  if (!term) return []

  const limit = Math.min(options.limit ?? 20, 100)

  // Prisma's tagged template parameterises every interpolation, so the user's
  // query string cannot alter the statement.
  const rows = await prisma.$queryRaw<
    Array<{
      entityType: EntityType
      entityId: string
      title: string
      href: string | null
      score: number
    }>
  >`
    SELECT "entityType",
           "entityId",
           "title",
           "href",
           (
             ts_rank("tsv", websearch_to_tsquery('english', ${term})) * 2.0
             + similarity("title", ${term})
           )::float8 AS score
      FROM "search_documents"
     WHERE "tenantId" = ${tenantId}
       AND (
             "tsv" @@ websearch_to_tsquery('english', ${term})
             OR "title" % ${term}
           )
     ORDER BY score DESC, "updatedAt" DESC
     LIMIT ${limit}
  `

  const filtered = options.types?.length
    ? rows.filter((row) => options.types!.includes(row.entityType))
    : rows

  return filtered.map((row) => ({
    entityType: row.entityType,
    entityId: row.entityId,
    title: row.title,
    href: row.href,
    score: Number(row.score),
  }))
}

/**
 * Everything connected to a name — the "show me everything related to X" query.
 *
 * Grouped by entity type so the caller can render sections rather than a flat
 * list, which is how the user actually thinks about a client.
 */
export async function relatedTo(tenantId: string, query: string, limit = 50) {
  const hits = await search(tenantId, query, { limit })

  const grouped = new Map<EntityType, SearchHit[]>()

  for (const hit of hits) {
    grouped.set(hit.entityType, [...(grouped.get(hit.entityType) ?? []), hit])
  }

  return grouped
}

/**
 * Rebuilds the index for one workspace.
 *
 * Needed because indexing happens on write: anything created before a field was
 * added to the indexed body, or imported straight through Prisma, would
 * otherwise stay invisible.
 */
export async function reindexWorkspace(db: TenantDb) {
  const [tasks, projects, organizations, notes, documents, inboxItems] =
    await Promise.all([
      db.task.findMany({ select: { id: true, title: true, description: true } }),
      db.project.findMany({
        select: { id: true, name: true, slug: true, description: true },
      }),
      db.organization.findMany({
        select: { id: true, name: true, slug: true, notes: true },
      }),
      db.note.findMany({ select: { id: true, title: true, body: true } }),
      db.document.findMany({
        select: { id: true, title: true, summary: true, content: true },
      }),
      db.inboxItem.findMany({
        select: { id: true, title: true, rawText: true, extractedText: true },
      }),
    ])

  let indexed = 0

  for (const task of tasks) {
    await indexEntity(db, {
      entityType: "TASK",
      entityId: task.id,
      title: task.title,
      body: task.description ?? "",
      href: `/tasks/${task.id}`,
    })
    indexed++
  }

  for (const project of projects) {
    await indexEntity(db, {
      entityType: "PROJECT",
      entityId: project.id,
      title: project.name,
      body: project.description ?? "",
      href: `/projects/${project.slug}`,
    })
    indexed++
  }

  for (const organization of organizations) {
    await indexEntity(db, {
      entityType: "ORGANIZATION",
      entityId: organization.id,
      title: organization.name,
      body: organization.notes ?? "",
      href: `/clients/${organization.slug}`,
    })
    indexed++
  }

  for (const note of notes) {
    await indexEntity(db, {
      entityType: "NOTE",
      entityId: note.id,
      title: note.title ?? "Note",
      body: note.body,
      href: `/notes/${note.id}`,
    })
    indexed++
  }

  for (const document of documents) {
    await indexEntity(db, {
      entityType: "DOCUMENT",
      entityId: document.id,
      title: document.title,
      body: [document.summary, document.content].filter(Boolean).join("\n"),
      href: `/documents/${document.id}`,
    })
    indexed++
  }

  for (const item of inboxItems) {
    await indexEntity(db, {
      entityType: "INBOX_ITEM",
      entityId: item.id,
      title: item.title ?? "Captured item",
      body: [item.rawText, item.extractedText].filter(Boolean).join("\n"),
      href: `/inbox/${item.id}`,
    })
    indexed++
  }

  return indexed
}
