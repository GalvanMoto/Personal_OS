import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { emit } from "@/lib/events/bus"

/**
 * Reminder scheduling (PRD §21).
 *
 * The interesting part is not the timer, it is the suppression rules: a
 * reminder for a task that is already done, or a second reminder for something
 * the user was just told about, is worse than no reminder at all because it
 * teaches them to ignore the channel.
 */

export async function scheduleReminder(
  db: TenantDb,
  ctx: DomainContext,
  input: {
    title: string
    body?: string
    remindAt: Date
    taskId?: string
    recurrence?: string
  }
) {
  const reminder = await db.reminder.create({
    data: {
      title: input.title,
      body: input.body,
      remindAt: input.remindAt,
      taskId: input.taskId,
      recurrence: input.recurrence,
    } as never,
  })

  await emit(db, ctx.tenantId, {
    type: "reminder.scheduled",
    payload: { reminderId: reminder.id, remindAt: reminder.remindAt.toISOString() },
    actorType: ctx.actorType ?? "USER",
    actorId: ctx.agent ?? ctx.userId,
  })

  return reminder
}

/**
 * Schedules the standard nudges for a task with a deadline.
 *
 * Only future moments are scheduled, and a task due in an hour does not also
 * get a "due tomorrow" reminder it already missed.
 */
export async function scheduleDeadlineReminders(
  db: TenantDb,
  ctx: DomainContext,
  taskId: string
) {
  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task?.dueAt) return []

  // Clear any nudges from a previous deadline before laying down new ones.
  await db.reminder.deleteMany({ where: { taskId, status: "SCHEDULED" } })

  const due = task.dueAt.getTime()
  const now = Date.now()

  const offsets = [
    { ms: 24 * 60 * 60 * 1000, label: "due tomorrow" },
    { ms: 3 * 60 * 60 * 1000, label: "due in a few hours" },
  ]

  const created = []

  for (const offset of offsets) {
    const remindAt = new Date(due - offset.ms)
    if (remindAt.getTime() <= now) continue

    created.push(
      await scheduleReminder(db, ctx, {
        title: `${task.title} is ${offset.label}`,
        taskId,
        remindAt,
      })
    )
  }

  return created
}

/**
 * Reminders that are ready to fire, with the ones that no longer make sense
 * already cancelled.
 *
 * Contextual rather than literal (PRD §21): the body says what is actually
 * left, not just that something is due.
 */
export async function dueReminders(db: TenantDb, now = new Date()) {
  const candidates = await db.reminder.findMany({
    where: { status: "SCHEDULED", remindAt: { lte: now } },
    include: {
      task: { include: { checklist: true, project: { include: { organization: true } } } },
    },
    orderBy: { remindAt: "asc" },
  })

  const ready = []

  for (const reminder of candidates) {
    // Silently drop reminders whose reason has gone away.
    if (
      reminder.task &&
      (reminder.task.status === "DONE" || reminder.task.status === "CANCELLED")
    ) {
      await db.reminder.update({
        where: { id: reminder.id },
        data: { status: "CANCELLED" },
      })
      continue
    }

    const remaining =
      reminder.task?.checklist.filter((entry) => !entry.done).map((entry) => entry.label) ?? []

    ready.push({
      id: reminder.id,
      title: reminder.title,
      body:
        reminder.body ??
        (remaining.length
          ? `Still to do: ${remaining.slice(0, 3).join(", ")}`
          : null),
      taskId: reminder.taskId,
      client: reminder.task?.project?.organization?.name ?? null,
    })
  }

  return ready
}

export async function markReminderSent(
  db: TenantDb,
  ctx: DomainContext,
  reminderId: string
) {
  const reminder = await db.reminder.update({
    where: { id: reminderId },
    data: { status: "SENT", sentAt: new Date() },
  })

  await emit(db, ctx.tenantId, {
    type: "reminder.fired",
    payload: { reminderId },
    actorType: "SYSTEM",
  })

  return reminder
}

export async function snoozeReminder(
  db: TenantDb,
  reminderId: string,
  until: Date
) {
  return db.reminder.update({
    where: { id: reminderId },
    data: { remindAt: until, status: "SCHEDULED" },
  })
}
