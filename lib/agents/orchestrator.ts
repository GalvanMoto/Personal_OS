import "server-only"

import { findDate, formatDate } from "@/lib/ai/dates"
import { executeTool, type ToolOutcome } from "@/lib/agents/tools"
import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { captureAndProcess } from "@/lib/domain/inbox"

/**
 * The assistant (PRD §11, §12, §26).
 *
 * Intent routing is rule-based rather than model-driven. The commands people
 * actually type at a task system are a small, closed set — "what should I do",
 * "mark X done", "move X to Friday" — and matching them with rules makes the
 * assistant instant, free, and incapable of inventing a tool call. The seam for
 * an LLM planner is `plan()`: swap its body and every tool, permission and
 * audit path below stays exactly as it is.
 *
 * Anything that does not match a command is not an error — it is treated as
 * something to capture, which is the whole premise of the product.
 */

export type AssistantTurn = {
  reply: string
  calls: Array<{ tool: string; args: unknown; outcome: ToolOutcome }>
  /// Set when the message was filed rather than executed.
  capturedInboxItemId?: string
}

type Plan =
  | { kind: "tool"; tool: string; args: Record<string, unknown> }
  | { kind: "resolve_then"; tool: string; phrase: string; args: Record<string, unknown> }
  | { kind: "capture" }

/// Function words carry no identifying signal — matching on "the" would make
/// every task title a candidate and turn a miss into a false ambiguity.
const NOISE_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "about",
  "please", "task", "item", "one", "all", "are", "was", "has", "have", "its",
  "our", "your", "their", "been", "will", "can", "not", "but", "out", "now",
  "new", "some", "any", "get", "put", "off", "over", "than", "then", "them",
])

type TaskRef = { id: string; title: string; status: string }

type TaskMatch =
  | { kind: "one"; task: TaskRef }
  | { kind: "many"; options: TaskRef[] }
  | { kind: "none" }

/// Matches a spoken task reference like "the GB reel" against real titles.
async function resolveTask(db: TenantDb, phrase: string): Promise<TaskMatch> {
  const words = phrase
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !NOISE_WORDS.has(word))

  if (words.length === 0) return { kind: "none" }

  const open = await db.task.findMany({
    where: { status: { notIn: ["DONE", "CANCELLED"] } },
    select: { id: true, title: true, status: true },
    take: 200,
  })

  const scored = open
    .map((task) => {
      const haystack = task.title.toLowerCase()
      const hits = words.filter((word) => haystack.includes(word)).length
      return { task, hits }
    })
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits)

  if (scored.length === 0) return { kind: "none" }

  // Refuse to guess between two equally good matches — acting on the wrong
  // task is worse than asking.
  if (scored.length > 1 && scored[0].hits === scored[1].hits) {
    return { kind: "many", options: scored.slice(0, 4).map((entry) => entry.task) }
  }

  return { kind: "one", task: scored[0].task }
}

function plan(message: string): Plan {
  const text = message.trim()
  const lower = text.toLowerCase()

  if (/^(what|whats|what's)\s+(should|do)\s+i\s+(do|work on)/.test(lower)) {
    return { kind: "tool", tool: "next_best_action", args: {} }
  }

  if (/\b(what'?s?\s+(overdue|due|next|left|pending)|my day|today'?s? plan|brief)/.test(lower)) {
    return { kind: "tool", tool: "get_agenda", args: {} }
  }

  if (/\b(what am i waiting|waiting (for|on)|blocked)\b/.test(lower)) {
    return { kind: "tool", tool: "get_agenda", args: {} }
  }

  let match = lower.match(/^(?:i'?m\s+)?(?:done with|finished|completed|complete|mark)\s+(.+?)(?:\s+(?:as\s+)?done)?$/)
  if (match) {
    return {
      kind: "resolve_then",
      tool: "update_task",
      phrase: match[1],
      args: { status: "DONE" },
    }
  }

  match = lower.match(/^(?:start|starting|working on|begin)\s+(.+)$/)
  if (match) {
    return {
      kind: "resolve_then",
      tool: "update_task",
      phrase: match[1],
      args: { status: "IN_PROGRESS" },
    }
  }

  match = lower.match(/^(?:move|push|reschedule|shift|postpone)\s+(.+?)\s+to\s+(.+)$/)
  if (match) {
    const when = findDate(match[2])
    if (when) {
      return {
        kind: "resolve_then",
        tool: "update_task",
        phrase: match[1],
        args: { dueAt: when.date.toISOString() },
      }
    }
  }

  match = text.match(/^(?:add|create|new)\s+(?:a\s+)?task[:\s]+(.+)$/i)
  if (match) {
    const when = findDate(match[1])
    const title = when
      ? match[1].replace(when.phrase, "").replace(/\s+(by|before|on|due)\s*$/i, "").trim()
      : match[1].trim()

    return {
      kind: "tool",
      tool: "create_task",
      args: { title, dueAt: when ? when.date.toISOString() : null },
    }
  }

  match = text.match(/^remind me (?:to|about)\s+(.+)$/i)
  if (match) {
    const when = findDate(match[1])
    return {
      kind: "tool",
      tool: "create_reminder",
      args: {
        title: match[1].trim(),
        // No time said means tomorrow morning, which is when a reminder is
        // actually useful.
        remindAt: (when?.date ?? defaultReminderTime()).toISOString(),
      },
    }
  }

  match = text.match(/^(?:show|find|search)\s+(?:me\s+)?(?:everything\s+)?(?:related to|about|for|tasks?(?:\s+for)?)\s+(.+)$/i)
  if (match) {
    return { kind: "tool", tool: "search_tasks", args: { query: match[1].trim() } }
  }

  return { kind: "capture" }
}

function defaultReminderTime(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  return tomorrow
}

function describeAgenda(result: Record<string, unknown>): string {
  const counts = ["overdue", "dueToday", "dueSoon", "waiting", "inProgress"]
    .map((key) => ({ key, list: (result[key] as unknown[]) ?? [] }))
    .filter((entry) => entry.list.length > 0)

  if (counts.length === 0) return "Nothing needs your attention right now."

  const labels: Record<string, string> = {
    overdue: "overdue",
    dueToday: "due today",
    dueSoon: "due soon",
    waiting: "waiting on someone",
    inProgress: "in progress",
  }

  return counts
    .map((entry) => `${entry.list.length} ${labels[entry.key]}`)
    .join(", ")
}

export async function handle(
  message: string,
  { db, ctx }: { db: TenantDb; ctx: DomainContext }
): Promise<AssistantTurn> {
  const agentCtx: DomainContext = { ...ctx, actorType: "AGENT", agent: "assistant" }
  const intent = plan(message)

  if (intent.kind === "capture") {
    const item = await captureAndProcess(db, agentCtx, {
      rawText: message,
      kind: "TEXT",
    })

    const proposal = item.proposal as { tasks?: unknown[]; questions?: string[] } | null
    const count = proposal?.tasks?.length ?? 0

    return {
      reply:
        count > 0
          ? `Filed that. I read ${count} task${count === 1 ? "" : "s"} in it — review and I'll add them.`
          : "Filed that in your inbox.",
      calls: [],
      capturedInboxItemId: item.id,
    }
  }

  let args = intent.kind === "resolve_then" ? { ...intent.args } : intent.args

  if (intent.kind === "resolve_then") {
    const resolved = await resolveTask(db, intent.phrase)

    if (resolved.kind === "none") {
      return {
        reply: `I couldn't find an open task matching "${intent.phrase}".`,
        calls: [],
      }
    }

    if (resolved.kind === "many") {
      return {
        reply: `Which one did you mean? ${resolved.options
          .map((task) => `"${task.title}"`)
          .join(", ")}`,
        calls: [],
      }
    }

    args = { ...args, taskId: resolved.task.id }
  }

  const outcome = await executeTool(intent.tool, args, { db, ctx: agentCtx })
  const calls = [{ tool: intent.tool, args, outcome }]

  if (outcome.status === "ERROR") {
    return { reply: `That didn't work: ${outcome.error}`, calls }
  }

  if (outcome.status === "NEEDS_APPROVAL") {
    return {
      reply: `That needs your approval first: ${outcome.reason}`,
      calls,
    }
  }

  return { reply: describe(intent.tool, outcome.result, args), calls }
}

function describe(tool: string, result: unknown, args: unknown): string {
  switch (tool) {
    case "next_best_action": {
      if (!result) return "Nothing actionable right now."
      const task = result as { title: string; reasons: string[] }
      return `Do "${task.title}" next${
        task.reasons.length ? ` — ${task.reasons.join(", ")}.` : "."
      }`
    }

    case "get_agenda":
      return describeAgenda(result as Record<string, unknown>)

    case "search_tasks": {
      const tasks = result as Array<{ title: string }>
      if (tasks.length === 0) return "Nothing matched."
      return `${tasks.length} match${tasks.length === 1 ? "" : "es"}: ${tasks
        .slice(0, 5)
        .map((task) => `"${task.title}"`)
        .join(", ")}`
    }

    case "create_task": {
      const task = result as { title: string }
      return `Added "${task.title}".`
    }

    case "update_task": {
      const task = result as { status: string }
      const patch = args as { dueAt?: string }
      if (patch.dueAt) return `Moved it to ${formatDate(new Date(patch.dueAt))}.`
      return `Marked it ${task.status.toLowerCase().replace("_", " ")}.`
    }

    case "create_reminder": {
      const reminder = result as { remindAt: Date | string }
      return `I'll remind you on ${formatDate(new Date(reminder.remindAt))}.`
    }

    default:
      return "Done."
  }
}
