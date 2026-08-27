import "server-only"

import { EventEmitter } from "node:events"
import Redis from "ioredis"

const globalKey = "__dlrs_realtime__" as const

type GlobalStore = {
  pub?: Redis
  emitter: EventEmitter
}

const g = globalThis as unknown as Record<string, GlobalStore>

if (!g[globalKey]) {
  g[globalKey] = { emitter: new EventEmitter() }
  // Allow many SSE subscribers
  g[globalKey].emitter.setMaxListeners(100)
}

function redisUrl(): string {
  return process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || "redis://localhost:6379"
}

export function getEmitter(): EventEmitter {
  return g[globalKey].emitter
}

export function getRedis(): Redis | null {
  if (g[globalKey].pub) return g[globalKey].pub
  try {
    const url = redisUrl()
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: () => null as unknown as number,
    })
    // fire and forget connect, ignore errors for fallback
    client.connect().catch(() => {})
    client.on("error", () => {})
    g[globalKey].pub = client
    return client
  } catch {
    return null
  }
}

export function channelFor(tenantId: string): string {
  return `dlrs:tenant:${tenantId}:events`
}

// Singleton global subscriber that fans Redis pub/sub into the in-memory emitter.
// One psubscribe covers all tenants, avoiding a duplicate subscriber per SSE.
type SubStore = { sub?: Redis; ready: boolean }
const subKey = "__dlrs_realtime_sub__" as const
const gs = globalThis as unknown as Record<string, SubStore>

function ensureGlobalSub(): void {
  if (gs[subKey]?.sub) return
  const redis = getRedis()
  if (!redis) return
  try {
    const sub = redis.duplicate()
    sub.on("error", () => {})
    gs[subKey] = { sub, ready: false }
    sub.connect().then(() => {
      sub.psubscribe("dlrs:tenant:*:events").then(() => {
        if (gs[subKey]) gs[subKey].ready = true
      }).catch(() => {})
      sub.on("pmessage", (_pattern: string, channel: string, message: string) => {
        // Deduplicate: the local publish already emitted to this emitter,
        // but cross-instance publishes only arrive here, so re-emit is desired.
        // We publish via emitter only for remote messages; local dedup is handled
        // in bus.ts via seen cache, so it's safe to always re-emit.
        getEmitter().emit(channel, message)
      })
    }).catch(() => {})
  } catch {}
}

export function ensureRealtimeInfra(): void {
  getRedis()
  ensureGlobalSub()
}
