import type { ActorType } from "@/lib/generated/prisma/enums"

/// Who is acting, carried through every domain call so events, activity and
/// provenance can attribute a change without each function taking four extra
/// arguments.
export type DomainContext = {
  tenantId: string
  userId?: string
  actorType?: ActorType
  /// Name of the agent, when actorType is AGENT.
  agent?: string
}
