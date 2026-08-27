import type { TaskPriority, TaskStatus } from "@/lib/generated/prisma/enums"

/**
 * "What should I do now?" (PRD §22).
 *
 * Deliberately deterministic rather than model-driven: ranking a list is
 * arithmetic, and the user needs the same answer twice for the same inputs.
 * Every contribution also emits a reason, because the product promise is that
 * the system can explain its recommendation, not just make one.
 */

export type ScoreInput = {
  status: TaskStatus
  priority: TaskPriority
  dueAt: Date | null
  startedAt: Date | null
  estimateMin: number | null
  /// Unfinished subtasks that must land before this one can.
  openSubtasks: number
  /// The task belongs to a project that is currently active.
  projectActive: boolean
  now: Date
}

export type ScoreResult = {
  score: number
  reasons: string[]
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  URGENT: 40,
  HIGH: 25,
  MEDIUM: 12,
  LOW: 5,
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/// Whole days between two instants, counted by calendar day rather than by
/// elapsed hours so "due tomorrow" means tomorrow's date, not 24 hours away.
function daysUntil(due: Date, now: Date): number {
  return Math.round((startOfDay(due) - startOfDay(now)) / DAY_MS)
}

export function scoreTask(input: ScoreInput): ScoreResult {
  const reasons: string[] = []

  // Nothing that cannot be acted on should ever surface as the next action.
  if (input.status === "DONE" || input.status === "CANCELLED") {
    return { score: 0, reasons: ["Already closed"] }
  }

  let score = PRIORITY_WEIGHT[input.priority]
  if (input.priority === "URGENT" || input.priority === "HIGH") {
    reasons.push(`${input.priority.toLowerCase()} priority`)
  }

  if (input.dueAt) {
    const days = daysUntil(input.dueAt, input.now)

    if (days < 0) {
      const overdueBy = Math.abs(days)
      // Overdue dominates, but with a ceiling: a task three months late should
      // not permanently outrank everything due today.
      score += 50 + Math.min(overdueBy * 3, 30)
      reasons.push(`overdue by ${overdueBy} day${overdueBy === 1 ? "" : "s"}`)
    } else if (days === 0) {
      score += 35
      reasons.push("due today")
    } else if (days === 1) {
      score += 22
      reasons.push("due tomorrow")
    } else if (days <= 3) {
      score += 14
      reasons.push(`due in ${days} days`)
    } else if (days <= 7) {
      score += 7
      reasons.push("due this week")
    }
  }

  // Finishing something already open beats starting something new.
  if (input.status === "IN_PROGRESS") {
    score += 12
    reasons.push("already in progress")
  }

  // Parked work is not actionable; keep it visible but far down the list.
  if (input.status === "WAITING" || input.status === "BLOCKED") {
    score -= 40
    reasons.push(input.status === "WAITING" ? "waiting on someone" : "blocked")
  }

  if (input.openSubtasks > 0) {
    score -= 10
    reasons.push(
      `${input.openSubtasks} subtask${input.openSubtasks === 1 ? "" : "s"} first`
    )
  }

  // A quick win is worth a nudge when everything else is equal.
  if (input.estimateMin !== null && input.estimateMin <= 30) {
    score += 4
    reasons.push("quick win")
  }

  if (input.projectActive) {
    score += 3
  }

  return { score: Math.max(0, Math.round(score * 10) / 10), reasons }
}

/// Sorts by score, then by the earlier deadline, then by title so the order is
/// stable across renders instead of shuffling on every request.
export function compareByScore<
  T extends { score: number; dueAt: Date | null; title: string },
>(a: T, b: T): number {
  if (b.score !== a.score) return b.score - a.score
  if (a.dueAt && b.dueAt) return a.dueAt.getTime() - b.dueAt.getTime()
  if (a.dueAt) return -1
  if (b.dueAt) return 1
  return a.title.localeCompare(b.title)
}
