import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { logActivity } from "@/lib/events/activity"

/**
 * What the assistant carries between conversations.
 *
 * A chat thread ends; the things worth knowing about the person should not.
 * This is deliberately a small keyed store of sentences rather than an
 * embedding index, for one reason: the user can read every line of it, correct
 * a line, and watch the correction take effect. An opaque vector store cannot
 * be audited, and an assistant that quietly accumulates unreviewable beliefs
 * about someone is the failure mode worth designing against.
 *
 * Nothing here deletes. A correction rewrites the value and pushes the previous
 * one onto `history`, so being told "no, it's the other way round" costs the
 * record of what was believed before, not the record itself.
 */

export type MemoryKind =
  | "PREFERENCE"
  | "FACT"
  | "PERSON"
  | "ROUTINE"
  | "PROJECT"
  | "CONTEXT"

export const MEMORY_KINDS: MemoryKind[] = [
  "PREFERENCE",
  "FACT",
  "PERSON",
  "ROUTINE",
  "PROJECT",
  "CONTEXT",
]

/// How many memories are injected into a system prompt. Enough to be useful,
/// small enough that the assistant's context is not mostly autobiography.
export const RECALL_LIMIT = 24

/// Normalizes a caller-supplied key so "Prefers Morning Work" and
/// "prefers-morning-work" address the same row rather than racing each other.
export function memoryKey(raw: string): string {
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "note"
  )
}

export type RememberInput = {
  key: string
  value: string
  kind?: MemoryKind
  confidence?: number
  pinned?: boolean
  sourceRef?: string
}

/**
 * Writes or corrects one memory.
 *
 * Returns `changed: false` when the value is identical to what is already
 * stored, so re-stating a known fact is free and does not churn `updatedAt` or
 * pollute the history with duplicates.
 */
export async function remember(
  db: TenantDb,
  ctx: DomainContext,
  input: RememberInput
) {
  const key = memoryKey(input.key)
  const value = input.value.trim()

  if (!value) throw new Error("A memory needs something to remember.")
  if (value.length > 2000) {
    throw new Error("That is too long to remember as one fact — split it up.")
  }

  const existing = await db.agentMemory.findUnique({
    where: { tenantId_key: { tenantId: ctx.tenantId, key } },
  })

  if (existing && existing.value === value) {
    return { memory: existing, changed: false, corrected: false }
  }

  if (existing) {
    const memory = await db.agentMemory.update({
      where: { id: existing.id },
      data: {
        value,
        kind: input.kind ?? existing.kind,
        confidence: input.confidence ?? existing.confidence,
        pinned: input.pinned ?? existing.pinned,
        sourceRef: input.sourceRef ?? existing.sourceRef,
        // Newest first, and bounded — a fact corrected fifty times is a fact
        // nobody needs fifty versions of.
        history: [existing.value, ...existing.history].slice(0, 10),
      },
    })

    await logActivity(db, {
      action: "memory.corrected",
      summary: `Updated what I remember about "${key}"`,
      userId: ctx.userId,
      actorType: ctx.actorType ?? "AGENT",
      actorId: ctx.agent,
      metadata: { key },
    })

    return { memory, changed: true, corrected: true }
  }

  const memory = await db.agentMemory.create({
    data: {
      key,
      value,
      kind: input.kind ?? "FACT",
      confidence: input.confidence ?? 1,
      pinned: input.pinned ?? false,
      sourceType: ctx.actorType === "USER" ? "USER_INPUT" : "AGENT",
      sourceRef: input.sourceRef,
    } as never,
  })

  await logActivity(db, {
    action: "memory.learned",
    summary: `Remembered "${key}"`,
    userId: ctx.userId,
    actorType: ctx.actorType ?? "AGENT",
    actorId: ctx.agent,
    metadata: { key },
  })

  return { memory, changed: true, corrected: false }
}

export type RecalledMemory = {
  key: string
  kind: string
  value: string
  pinned: boolean
  confidence: number
  updatedAt: string
}

/**
 * Finds memories relevant to a query, or the most useful ones when there is no
 * query.
 *
 * Ranking is pinned first, then how often a memory has actually been recalled,
 * then recency. Usage beats recency on purpose: the thing the assistant reaches
 * for every day matters more than the thing it learned this morning.
 */
export async function recall(
  db: TenantDb,
  options: { query?: string; kind?: MemoryKind; limit?: number } = {}
): Promise<RecalledMemory[]> {
  const where: Record<string, unknown> = {}
  if (options.kind) where.kind = options.kind
  if (options.query) {
    where.OR = [
      { key: { contains: memoryKey(options.query), mode: "insensitive" } },
      { value: { contains: options.query, mode: "insensitive" } },
    ]
  }

  const rows = await db.agentMemory.findMany({
    where,
    orderBy: [
      { pinned: "desc" },
      { useCount: "desc" },
      { updatedAt: "desc" },
    ],
    take: options.limit ?? RECALL_LIMIT,
  })

  // Recording the read is what makes the ranking above mean anything. Done as
  // one statement rather than per row, and never allowed to fail the recall —
  // a memory that cannot update its counter is still a memory worth returning.
  if (rows.length > 0) {
    await db.agentMemory
      .updateMany({
        where: { id: { in: rows.map((r: { id: string }) => r.id) } },
        data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
      })
      .catch(() => {})
  }

  return rows.map((row: {
    key: string
    kind: string
    value: string
    pinned: boolean
    confidence: number
    updatedAt: Date
  }) => ({
    key: row.key,
    kind: row.kind,
    value: row.value,
    pinned: row.pinned,
    confidence: row.confidence,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

/**
 * The block injected into the assistant's system prompt.
 *
 * Returns an empty string when there is nothing worth saying, so a fresh
 * workspace does not get a heading over an empty list — the assistant should
 * read as though it simply has not learned anything yet, which is the truth.
 */
export async function memoryPrompt(db: TenantDb): Promise<string> {
  const memories = await recall(db, { limit: RECALL_LIMIT })
  if (memories.length === 0) return ""
  // Filter out settings-backed keys — they are emitted via getSettingsForAssistant to avoid duplicate employer lines
  const filtered = memories.filter((m) => !m.key.startsWith("profile-employer-") && !m.key.startsWith("settings-"))

  const lines = filtered.map((m) => `- (${m.kind.toLowerCase()}) ${m.value}`)
  if (lines.length === 0) return ""

  return [
    "What you already know about this user, from earlier conversations:",
    ...lines,
    "",
    "Treat these as established unless the user says otherwise. If they correct one, call remember with the same key to update it. Do not repeat these back unprompted — just act on them.",
  ].join("\n")
}

/// Everything, for the memory settings page. Unranked and unfiltered: the point
/// of that screen is to show the whole picture, including what is rarely used.
export async function listMemories(db: TenantDb) {
  return db.agentMemory.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  })
}
