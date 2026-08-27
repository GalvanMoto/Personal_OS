"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  fail,
  fromZodError,
  guard,
  ok,
  workspaceContext,
  type ActionResult,
} from "@/lib/actions/shared"
import { invalidateContextPack } from "@/lib/domain/context"
import { scheduleDeadlineReminders } from "@/lib/domain/reminders"
import { createTask, deleteTask, updateTask } from "@/lib/domain/tasks"

/// Deadlines arrive from `<input type="date">` as a bare day; store them at the
/// end of that day so "due Friday" is not overdue at 00:01 on Friday.
const dueAtSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) parsed.setHours(23, 59, 59, 0)
    return parsed
  })

const createSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title").max(300),
  description: z.string().trim().max(4000).optional(),
  projectId: z.string().trim().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueAt: dueAtSchema,
  estimateMin: z.coerce.number().int().min(0).max(10_000).optional(),
})

function revalidateWorkspace(slug: string) {
  revalidatePath(`/w/${slug}`, "layout")
}

export async function createTaskAction(
  workspace: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    const parsed = createSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return fromZodError(parsed.error)

    const task = await createTask(db, ctx, {
      title: parsed.data.title,
      description: parsed.data.description,
      projectId: parsed.data.projectId || undefined,
      priority: parsed.data.priority,
      dueAt: parsed.data.dueAt,
      estimateMin: parsed.data.estimateMin ?? null,
    })

    if (task.dueAt) await scheduleDeadlineReminders(db, ctx, task.id)

    revalidateWorkspace(workspace)
    return ok({ id: task.id })
  })
}

const statusSchema = z.enum([
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "WAITING",
  "BLOCKED",
  "DONE",
  "CANCELLED",
])

export async function setTaskStatusAction(
  workspace: string,
  taskId: string,
  status: z.infer<typeof statusSchema>,
  waitingOn?: string
): Promise<ActionResult> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    const parsed = statusSchema.safeParse(status)
    if (!parsed.success) return fail("That is not a valid status.")

    // A parked task needs a reason, otherwise "waiting" degrades into a second
    // backlog nobody can act on.
    if ((parsed.data === "WAITING" || parsed.data === "BLOCKED") && !waitingOn?.trim()) {
      return fail("Say what this is waiting on.", {
        waitingOn: "Required when parking a task",
      })
    }

    await updateTask(db, ctx, taskId, {
      status: parsed.data,
      waitingOn:
        parsed.data === "WAITING" || parsed.data === "BLOCKED"
          ? waitingOn!.trim()
          : null,
    })

    await invalidateContextPack(db, taskId)
    revalidateWorkspace(workspace)
    return ok()
  })
}

const updateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueAt: dueAtSchema,
  projectId: z.string().trim().nullable().optional(),
})

export async function updateTaskAction(
  workspace: string,
  taskId: string,
  formData: FormData
): Promise<ActionResult> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    const parsed = updateSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return fromZodError(parsed.error)

    const before = await db.task.findUnique({ where: { id: taskId } })
    if (!before) return fail("That task no longer exists.")

    await updateTask(db, ctx, taskId, {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      dueAt: parsed.data.dueAt,
      projectId: parsed.data.projectId || null,
    })

    // Moving a deadline invalidates the nudges scheduled against the old one.
    if (parsed.data.dueAt?.getTime() !== before.dueAt?.getTime()) {
      await scheduleDeadlineReminders(db, ctx, taskId)
    }

    await invalidateContextPack(db, taskId)
    revalidateWorkspace(workspace)
    return ok()
  })
}

export async function deleteTaskAction(
  workspace: string,
  taskId: string
): Promise<ActionResult> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    await deleteTask(db, ctx, taskId)

    revalidateWorkspace(workspace)
    return ok()
  })
}

export async function toggleChecklistItemAction(
  workspace: string,
  itemId: string,
  done: boolean
): Promise<ActionResult> {
  return guard(async () => {
    const { db } = await workspaceContext(workspace)

    const item = await db.taskChecklistItem.update({
      where: { id: itemId },
      data: { done },
    })

    await invalidateContextPack(db, item.taskId)
    revalidateWorkspace(workspace)
    return ok()
  })
}
