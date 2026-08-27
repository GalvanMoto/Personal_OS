import "server-only"

import { resolveProvider } from "@/lib/ai/provider"
import { extractionResultSchema, type ExtractionResult } from "@/lib/ai/types"
import { publishRealtime } from "@/lib/realtime/bus"
import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { resolveOrganization } from "@/lib/domain/organizations"
import { resolveProject } from "@/lib/domain/projects"
import { link, recordFact, recordInference } from "@/lib/domain/provenance"
import { createTask } from "@/lib/domain/tasks"
import { logActivity } from "@/lib/events/activity"
import { indexEntity } from "@/lib/search"
import { emit } from "@/lib/events/bus"
import type { InboxKind, SourceType } from "@/lib/generated/prisma/enums"

/**
 * The universal inbox (PRD §6).
 *
 * Capture is deliberately dumb and always succeeds: the user's thought is
 * saved before anything is interpreted, so a failing extractor can never lose
 * what they pasted. Understanding happens in a second step that can be retried.
 */

export async function capture(
  db: TenantDb,
  ctx: DomainContext,
  input: {
    rawText?: string
    kind?: InboxKind
    title?: string
    sourceType?: SourceType
    sourceRef?: string
  }
) {
  const item = await db.inboxItem.create({
    data: {
      kind: input.kind ?? "TEXT",
      status: "PENDING",
      title: input.title?.slice(0, 200) ?? null,
      rawText: input.rawText ?? null,
      sourceType: input.sourceType ?? "USER_INPUT",
      sourceRef: input.sourceRef,
    } as never,
  })

  await indexEntity(db, {
    entityType: "INBOX_ITEM",
    entityId: item.id,
    title: item.title ?? item.rawText?.slice(0, 80) ?? "Captured item",
    body: item.rawText ?? "",
    href: `/inbox/${item.id}`,
  })

  await emit(db, ctx.tenantId, {
    type: "inbox.captured",
    payload: { inboxItemId: item.id, kind: item.kind },
    actorType: ctx.actorType ?? "USER",
    actorId: ctx.agent ?? ctx.userId,
  })

  publishRealtime({ type: "inbox", tenantId: ctx.tenantId, payload: { id: item.id }, at: new Date().toISOString() }).catch(() => {})
  publishRealtime({ type: "badge", tenantId: ctx.tenantId, payload: {}, at: new Date().toISOString() }).catch(() => {})

  return item
}

/**
 * Runs extraction over a captured item and stores the proposal.
 *
 * Nothing is written into the graph here — the result lands on the inbox item
 * as a reviewable proposal. An item with open questions stops at NEEDS_REVIEW
 * so the user answers before records exist, rather than cleaning up after.
 */
export async function processItem(
  db: TenantDb,
  ctx: DomainContext,
  inboxItemId: string
) {
  const item = await db.inboxItem.findUnique({ where: { id: inboxItemId } })
  if (!item) throw new Error("Inbox item not found")

  const text = [item.rawText, item.extractedText].filter(Boolean).join("\n\n")

  if (!text.trim()) {
    return db.inboxItem.update({
      where: { id: inboxItemId },
      data: { status: "FAILED", error: "Nothing to read in this item." },
    })
  }

  await db.inboxItem.update({
    where: { id: inboxItemId },
    data: { status: "PROCESSING", error: null },
  })

  try {
    const [organizations, projects] = await Promise.all([
      db.organization.findMany({ select: { name: true } }),
      db.project.findMany({ select: { name: true } }),
    ])

    const provider = await resolveProvider()
    const proposal = await provider.extract({
      text,
      knownOrganizations: organizations.map((org) => org.name),
      knownProjects: projects.map((project) => project.name),
    })

    return await db.inboxItem.update({
      where: { id: inboxItemId },
      data: {
        status: proposal.questions.length > 0 ? "NEEDS_REVIEW" : "NEEDS_REVIEW",
        title: item.title ?? proposal.summary.slice(0, 200),
        proposal: proposal as never,
      },
    })
  } catch (error) {
    // A broken extractor must not swallow the capture.
    return db.inboxItem.update({
      where: { id: inboxItemId },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Extraction failed",
      },
    })
  }
}

export type ApplyOverrides = {
  /// Correct the client before anything is written.
  organizationName?: string | null
  projectName?: string | null
  dueAt?: Date | null
  /// Indices into `proposal.tasks`; omit to accept all of them.
  acceptTaskIndices?: number[]
}

/**
 * Turns an accepted proposal into real records.
 *
 * Everything created here gets provenance pointing back at the inbox item and
 * a DERIVED_FROM edge, so the user can always ask "where did this come from?"
 * and get the original message rather than a shrug (PRD §18).
 */
export async function applyProposal(
  db: TenantDb,
  ctx: DomainContext,
  inboxItemId: string,
  overrides: ApplyOverrides = {}
) {
  const item = await db.inboxItem.findUnique({ where: { id: inboxItemId } })
  if (!item) throw new Error("Inbox item not found")
  if (!item.proposal) throw new Error("This item has not been processed yet")

  const proposal: ExtractionResult = extractionResultSchema.parse(item.proposal)

  const source = {
    type: "INBOX" as SourceType,
    id: item.id,
  }

  // --- Client -------------------------------------------------------------
  const organizationName =
    overrides.organizationName !== undefined
      ? overrides.organizationName
      : (proposal.organization?.name ?? null)

  let organizationId: string | undefined

  if (organizationName) {
    const { organization } = await resolveOrganization(db, ctx, organizationName)
    organizationId = organization.id

    await recordInference(db, {
      targetType: "ORGANIZATION",
      targetId: organization.id,
      field: "name",
      value: organizationName,
      // A name the user typed is certain; one the extractor guessed is not.
      confidence:
        overrides.organizationName !== undefined
          ? 1
          : (proposal.organization?.confidence ?? 0.5),
      agent: "inbox",
      sourceType: source.type,
      sourceId: source.id,
      evidence: proposal.organization?.evidence,
    })
  }

  // --- Project ------------------------------------------------------------
  const projectName =
    overrides.projectName !== undefined
      ? overrides.projectName
      : (proposal.project?.name ?? null)

  let projectId: string | undefined

  if (projectName) {
    const { project } = await resolveProject(db, ctx, projectName, organizationId)
    projectId = project.id

    if (organizationId && !project.organizationId) {
      await db.project.update({
        where: { id: project.id },
        data: { organizationId },
      })
    }

    if (organizationId) {
      await link(db, {
        fromType: "PROJECT",
        fromId: project.id,
        toType: "ORGANIZATION",
        toId: organizationId,
        relation: "BELONGS_TO",
        createdBy: "AGENT",
      })
    }

    await link(db, {
      fromType: "PROJECT",
      fromId: project.id,
      toType: "INBOX_ITEM",
      toId: item.id,
      relation: "DERIVED_FROM",
      createdBy: "AGENT",
    })
  }

  // --- Tasks --------------------------------------------------------------
  const selected = overrides.acceptTaskIndices
    ? proposal.tasks.filter((_task, index) =>
        overrides.acceptTaskIndices!.includes(index)
      )
    : proposal.tasks

  const dueAt =
    overrides.dueAt !== undefined
      ? overrides.dueAt
      : proposal.deadline
        ? new Date(proposal.deadline.dueAt)
        : null

  // Assets the message referenced become the first task's checklist, so the
  // "where is the logo?" hunt is at least written down before work starts.
  const assetChecklist = proposal.assets.map(
    (asset) => `Collect ${asset.label.toLowerCase()}`
  )

  const createdTasks = []

  for (const [index, extracted] of selected.entries()) {
    const task = await createTask(
      db,
      { ...ctx, actorType: "AGENT", agent: "inbox" },
      {
        title: extracted.title,
        description: extracted.description,
        priority: extracted.priority,
        projectId,
        dueAt: extracted.dueAt ? new Date(extracted.dueAt) : dueAt,
        checklist: index === 0 ? assetChecklist : undefined,
        source: {
          type: source.type,
          id: source.id,
          evidence: extracted.evidence,
        },
      }
    )

    await recordFact(db, {
      targetType: "TASK",
      targetId: task.id,
      field: "title",
      value: task.title,
      sourceType: source.type,
      sourceId: source.id,
      evidence: extracted.evidence,
    })

    await link(db, {
      fromType: "TASK",
      fromId: task.id,
      toType: "INBOX_ITEM",
      toId: item.id,
      relation: "DERIVED_FROM",
      createdBy: "AGENT",
    })

    if (organizationId) {
      await link(db, {
        fromType: "TASK",
        fromId: task.id,
        toType: "ORGANIZATION",
        toId: organizationId,
        relation: "BELONGS_TO",
        createdBy: "AGENT",
      })
    }

    createdTasks.push(task)
  }

  // --- People -------------------------------------------------------------
  for (const person of proposal.people) {
    const existing = await db.person.findFirst({ where: { name: person.name } })
    if (!existing) {
      await db.person.create({
        data: { name: person.name, organizationId } as never,
      })
    }
  }

  const updated = await db.inboxItem.update({
    where: { id: inboxItemId },
    data: { status: "PROCESSED", processedAt: new Date() },
  })

  await emit(db, ctx.tenantId, {
    type: "inbox.processed",
    payload: {
      inboxItemId: item.id,
      taskIds: createdTasks.map((task) => task.id),
      projectId,
      organizationId,
    },
    actorType: "AGENT",
    actorId: "inbox",
  })

  await logActivity(db, {
    action: "inbox.processed",
    summary: `Turned an inbox item into ${createdTasks.length} task${
      createdTasks.length === 1 ? "" : "s"
    }`,
    userId: ctx.userId,
    actorType: "AGENT",
    actorId: "inbox",
    targetType: "INBOX_ITEM",
    targetId: item.id,
  })

  return { item: updated, tasks: createdTasks, projectId, organizationId }
}

export async function dismissItem(
  db: TenantDb,
  ctx: DomainContext,
  inboxItemId: string
) {
  const item = await db.inboxItem.update({
    where: { id: inboxItemId },
    data: { status: "DISMISSED", processedAt: new Date() },
  })

  await emit(db, ctx.tenantId, {
    type: "inbox.dismissed",
    payload: { inboxItemId },
    actorType: ctx.actorType ?? "USER",
    actorId: ctx.agent ?? ctx.userId,
  })

  return item
}

/// Capture and interpret in one call, for the paste box.
export async function captureAndProcess(
  db: TenantDb,
  ctx: DomainContext,
  input: Parameters<typeof capture>[2]
) {
  const item = await capture(db, ctx, input)
  return processItem(db, ctx, item.id)
}
