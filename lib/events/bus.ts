import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainEventInput, DomainEventType } from "@/lib/events/types"

type Handler = (event: {
  type: DomainEventType
  payload: Record<string, unknown>
  tenantId: string
}) => Promise<void>

const handlers = new Map<DomainEventType, Handler[]>()

export function on(type: DomainEventType, handler: Handler) {
  handlers.set(type, [...(handlers.get(type) ?? []), handler])
}

/**
 * Appends a domain event and lets in-process subscribers react.
 *
 * The row is written first and always: the log is the durable record, while
 * subscribers are best-effort. A handler that throws is swallowed so a failing
 * reaction can never roll back the action that caused it — the unprocessed row
 * stays in the table for a worker to pick up.
 */
export async function emit(
  db: TenantDb,
  tenantId: string,
  input: DomainEventInput
) {
  const event = await db.domainEvent.create({
    data: {
      type: input.type,
      payload: input.payload as never,
      actorType: input.actorType ?? "USER",
      actorId: input.actorId,
    } as never,
  })

  const subscribers = handlers.get(input.type) ?? []

  for (const handler of subscribers) {
    try {
      await handler({ type: input.type, payload: input.payload, tenantId })
    } catch (error) {
      console.error(`[events] handler for ${input.type} failed`, error)
    }
  }

  return event
}
