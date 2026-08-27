import "server-only"

import { channelFor, ensureRealtimeInfra, getEmitter, getRedis } from "./redis"

export type RealtimeEvent = {
  type: "notification" | "inbox" | "task" | "project" | "email" | "transaction" | "badge"
  tenantId: string
  payload: Record<string, unknown>
  at: string
}

// Deduplicate local + Redis echo (same JSON within 500ms is one event)
const seen = new Map<string, number>()
function isDuplicate(raw: string): boolean {
  const now = Date.now()
  // prune
  for (const [k, t] of seen) if (now - t > 1000) seen.delete(k)
  if (seen.has(raw)) return true
  seen.set(raw, now)
  return false
}

/**
 * Publish to Redis (if available) + in-memory emitter via global psub.
 * Fire-and-forget: realtime must never block the DB write.
 */
export async function publishRealtime(event: RealtimeEvent): Promise<void> {
  const data = JSON.stringify(event)
  const chan = channelFor(event.tenantId)

  ensureRealtimeInfra()

  // Always emit locally; global psub will also fan out Redis messages.
  // Deduplication in subscribers handles the echo.
  getEmitter().emit(chan, data)

  const redis = getRedis()
  if (redis) {
    redis.publish(chan, data).catch(() => {})
  }
}

/**
 * Subscribe for the lifetime of the caller (SSE, etc.).
 * Uses only the in-memory emitter; Redis is fanned in via global psub.
 * Returns an unsubscribe function.
 */
export function subscribeRealtime(
  tenantId: string,
  onEvent: (event: RealtimeEvent) => void
): () => void {
  ensureRealtimeInfra()
  const chan = channelFor(tenantId)
  const emitter = getEmitter()

  const handler = (raw: string) => {
    if (isDuplicate(raw)) return
    try {
      const parsed = JSON.parse(raw) as RealtimeEvent
      onEvent(parsed)
    } catch {}
  }

  emitter.on(chan, handler)
  return () => {
    emitter.off(chan, handler)
  }
}
