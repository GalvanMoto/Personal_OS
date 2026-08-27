/// Domain event names. Dot-namespaced as `<entity>.<past-tense-verb>` so
/// subscribers can match on a prefix. Adding a member here is the first step of
/// adding a reaction — the handler registry in `bus.ts` is keyed by these.
export const DOMAIN_EVENTS = [
  "inbox.captured",
  "inbox.processed",
  "inbox.dismissed",
  "task.created",
  "task.updated",
  "task.completed",
  "task.deadline.approaching",
  "project.created",
  "project.completed",
  "organization.created",
  "reminder.scheduled",
  "reminder.fired",
  "email.received",
  "document.processed",
  "transaction.imported",
  "subscription.detected",
] as const

export type DomainEventType = (typeof DOMAIN_EVENTS)[number]

export type DomainEventInput = {
  type: DomainEventType
  payload: Record<string, unknown>
  actorType?: "USER" | "AGENT" | "SYSTEM"
  actorId?: string
}
