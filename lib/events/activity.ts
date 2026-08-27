import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { ActorType, EntityType } from "@/lib/generated/prisma/enums"

/// Human-readable audit trail (PRD §43). Distinct from the domain event log:
/// events drive machinery, activity is what the Activity page renders.
export async function logActivity(
  db: TenantDb,
  input: {
    action: string
    summary: string
    userId?: string
    actorType?: ActorType
    actorId?: string
    targetType?: EntityType
    targetId?: string
    metadata?: Record<string, unknown>
  }
) {
  return db.activityLog.create({
    data: {
      action: input.action,
      summary: input.summary,
      userId: input.userId,
      actorType: input.actorType ?? "USER",
      actorId: input.actorId,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata as never,
    } as never,
  })
}
