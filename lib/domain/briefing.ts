import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import { agenda } from "@/lib/domain/tasks"

/**
 * The morning and evening briefings (PRD §4, §6, §38).
 *
 * Assembled from live data rather than stored, so a briefing opened at noon is
 * still correct. The wording is generated deterministically: a briefing that
 * occasionally hallucinates a deadline would be worse than a plain list.
 */

export type Briefing = {
  greeting: string
  date: string
  headline: string
  sections: Array<{
    key: string
    label: string
    tone: "danger" | "warning" | "info" | "success"
    items: Array<{ id: string; title: string; detail?: string }>
  }>
  nextBest: { id: string; title: string; why: string } | null
  question: string
}

function greet(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function describeDue(dueAt: Date | null, now: Date): string | undefined {
  if (!dueAt) return undefined

  const days = Math.round(
    (new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000
  )

  if (days < 0) return `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`
  if (days === 0) return "due today"
  if (days === 1) return "due tomorrow"
  return `due in ${days} days`
}

export async function buildBriefing(
  db: TenantDb,
  userName: string,
  now = new Date()
): Promise<Briefing> {
  const plan = await agenda(db, now)

  const toItems = (
    tasks: Array<{ id: string; title: string; dueAt: Date | null; waitingOn?: string | null }>
  ) =>
    tasks.slice(0, 8).map((task) => ({
      id: task.id,
      title: task.title,
      detail: task.waitingOn ?? describeDue(task.dueAt, now),
    }))

  const sections: Briefing["sections"] = []

  if (plan.overdue.length) {
    sections.push({
      key: "overdue",
      label: "Overdue",
      tone: "danger",
      items: toItems(plan.overdue),
    })
  }
  if (plan.dueToday.length) {
    sections.push({
      key: "today",
      label: "Due today",
      tone: "warning",
      items: toItems(plan.dueToday),
    })
  }
  if (plan.inProgress.length) {
    sections.push({
      key: "in-progress",
      label: "In progress",
      tone: "info",
      items: toItems(plan.inProgress),
    })
  }
  if (plan.dueSoon.length) {
    sections.push({
      key: "soon",
      label: "Due soon",
      tone: "info",
      items: toItems(plan.dueSoon),
    })
  }
  if (plan.waiting.length) {
    sections.push({
      key: "waiting",
      label: "Waiting on someone",
      tone: "info",
      items: toItems(plan.waiting),
    })
  }
  if (plan.completedRecently.length) {
    sections.push({
      key: "done",
      label: "Recently completed",
      tone: "success",
      items: plan.completedRecently.slice(0, 5).map((task) => ({
        id: task.id,
        title: task.title,
      })),
    })
  }

  // Lead with the thing most likely to hurt, and say nothing loudly when there
  // is nothing to say.
  const headline = plan.overdue.length
    ? `${plan.overdue.length} task${plan.overdue.length === 1 ? "" : "s"} overdue`
    : plan.dueToday.length
      ? `${plan.dueToday.length} task${plan.dueToday.length === 1 ? "" : "s"} due today`
      : plan.inProgress.length
        ? "You have work in progress"
        : "Nothing is due right now"

  return {
    greeting: `${greet(now)} ${userName}`,
    date: now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    headline,
    sections,
    nextBest: plan.nextBest
      ? {
          id: plan.nextBest.id,
          title: plan.nextBest.title,
          why: plan.nextBest.reasons.join(", ") || "highest priority open task",
        }
      : null,
    question: plan.nextBest
      ? "What are you working on first?"
      : "Anything you want to capture?",
  }
}

/**
 * End-of-day wrap-up (PRD §6).
 *
 * Deliberately a different shape from the morning briefing: the evening
 * question is what carries forward, not what to start.
 */
export async function buildWrapUp(db: TenantDb, now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const plan = await agenda(db, now)

  const completedToday = plan.completedRecently.filter(
    (task) => task.completedAt && task.completedAt >= startOfToday
  )

  return {
    completed: completedToday.map((task) => ({ id: task.id, title: task.title })),
    stillPending: [...plan.overdue, ...plan.dueToday].map((task) => ({
      id: task.id,
      title: task.title,
    })),
    waiting: plan.waiting.map((task) => ({
      id: task.id,
      title: task.title,
      detail: task.waitingOn,
    })),
    tomorrow: plan.dueSoon
      .filter((task) => {
        if (!task.dueAt) return false
        const days = Math.round(
          (task.dueAt.getTime() - startOfToday.getTime()) / 86_400_000
        )
        return days === 1
      })
      .map((task) => ({ id: task.id, title: task.title })),
    question: "Anything you want me to carry forward?",
  }
}
