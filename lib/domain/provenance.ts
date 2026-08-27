import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type {
  ActorType,
  EntityType,
  LinkRelation,
  SourceType,
} from "@/lib/generated/prisma/enums"

type FactInput = {
  targetType: EntityType
  targetId: string
  /// Which field this explains. Omit for "the record as a whole".
  field?: string
  value?: unknown
  sourceType: SourceType
  sourceId?: string
  sourceRef?: string
  evidence?: string
}

/**
 * Records something a source literally stated.
 *
 * Facts carry no confidence: either the email said Friday or it did not. This
 * is what lets the assistant answer "why did you think that?" with a quote
 * rather than a shrug (PRD §8, §18).
 */
export async function recordFact(db: TenantDb, input: FactInput) {
  return db.provenance.create({
    data: {
      targetType: input.targetType,
      targetId: input.targetId,
      field: input.field,
      kind: "FACT",
      value: input.value as never,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceRef: input.sourceRef,
      evidence: input.evidence,
    } as never,
  })
}

/**
 * Records something an agent concluded.
 *
 * Kept in the same table as facts but tagged INFERENCE and always carrying a
 * confidence, so downstream code can weigh the two differently instead of
 * treating a guess as ground truth (PRD §32).
 */
export async function recordInference(
  db: TenantDb,
  input: FactInput & { confidence: number; agent: string }
) {
  return db.provenance.create({
    data: {
      targetType: input.targetType,
      targetId: input.targetId,
      field: input.field,
      kind: "INFERENCE",
      value: input.value as never,
      confidence: Math.max(0, Math.min(1, input.confidence)),
      agent: input.agent,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceRef: input.sourceRef,
      evidence: input.evidence,
    } as never,
  })
}

/// Everything known about where one record's values came from, newest first.
export async function explain(
  db: TenantDb,
  targetType: EntityType,
  targetId: string
) {
  return db.provenance.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
  })
}

/**
 * Connects two entities in the graph.
 *
 * Idempotent: the same edge asserted twice updates confidence rather than
 * duplicating, so re-running an extraction pass is safe.
 */
export async function link(
  db: TenantDb,
  input: {
    fromType: EntityType
    fromId: string
    toType: EntityType
    toId: string
    relation?: LinkRelation
    confidence?: number
    createdBy?: ActorType
  }
) {
  const relation = input.relation ?? "RELATED_TO"

  return db.entityLink.upsert({
    where: {
      // tenantId is filled in by the tenant-scoping extension.
      tenantId_fromType_fromId_toType_toId_relation: {
        fromType: input.fromType,
        fromId: input.fromId,
        toType: input.toType,
        toId: input.toId,
        relation,
      },
    } as never,
    create: {
      fromType: input.fromType,
      fromId: input.fromId,
      toType: input.toType,
      toId: input.toId,
      relation,
      confidence: input.confidence,
      createdBy: input.createdBy ?? "USER",
    } as never,
    update: { confidence: input.confidence } as never,
  })
}

/// Both directions of the graph around one node, since callers almost always
/// want "everything touching this" rather than one direction.
export async function neighbours(
  db: TenantDb,
  type: EntityType,
  id: string
) {
  const [outgoing, incoming] = await Promise.all([
    db.entityLink.findMany({ where: { fromType: type, fromId: id } }),
    db.entityLink.findMany({ where: { toType: type, toId: id } }),
  ])

  return { outgoing, incoming }
}
