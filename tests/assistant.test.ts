/**
 * Assistant, briefing and background jobs against a real database.
 * Run with: npm run test:db
 */
import "dotenv/config"

import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"

import { handle } from "@/lib/agents/orchestrator"
import { prisma } from "@/lib/db/client"
import { tenantDb, type TenantDb } from "@/lib/db/tenant"
import { buildBriefing, buildWrapUp } from "@/lib/domain/briefing"
import type { DomainContext } from "@/lib/domain/context-types"
import { scheduleReminder } from "@/lib/domain/reminders"
import { createProject } from "@/lib/domain/projects"
import { createTask } from "@/lib/domain/tasks"
import { enqueue } from "@/lib/jobs/queue"
import { drain } from "@/lib/jobs/runner"

const DAY = 24 * 60 * 60 * 1000

let tenantId: string
let db: TenantDb
let ctx: DomainContext

before(async () => {
  const tenant = await prisma.tenant.create({
    data: { slug: `assist-${Date.now()}`, name: "Assistant Test" },
  })
  tenantId = tenant.id
  db = tenantDb(tenantId)
  ctx = { tenantId }

  const project = await createProject(db, ctx, { name: "Launch" })

  await createTask(db, ctx, {
    title: "Export the product video",
    projectId: project.id,
    priority: "HIGH",
    dueAt: new Date(Date.now() - 2 * DAY),
  })
  await createTask(db, ctx, {
    title: "Write the launch email",
    projectId: project.id,
    dueAt: new Date(Date.now() + 5 * DAY),
  })
})

after(async () => {
  await prisma.tenant.delete({ where: { id: tenantId } })
  await prisma.$disconnect()
})

describe("assistant", () => {
  it("recommends what to do next, with reasons", async () => {
    const turn = await handle("what should I do now?", { db, ctx })

    assert.match(turn.reply, /Export the product video/)
    assert.match(turn.reply, /overdue/)
    assert.equal(turn.calls[0].tool, "next_best_action")
  })

  it("summarises the agenda", async () => {
    const turn = await handle("what's overdue?", { db, ctx })
    assert.equal(turn.calls[0].tool, "get_agenda")
    assert.match(turn.reply, /overdue/)
  })

  it("creates a task with a deadline it parsed from the sentence", async () => {
    const turn = await handle("add task Record the voiceover by Friday", { db, ctx })

    assert.equal(turn.calls[0].tool, "create_task")
    const created = await db.task.findFirst({
      where: { title: { contains: "voiceover" } },
    })
    assert.ok(created)
    assert.ok(created.dueAt, "the deadline should have been extracted")
    // The date phrase must not survive inside the title.
    assert.ok(!/friday/i.test(created.title))
  })

  it("completes a task referred to loosely", async () => {
    const turn = await handle("done with the launch email", { db, ctx })

    assert.equal(turn.calls[0].tool, "update_task")
    const task = await db.task.findFirst({
      where: { title: "Write the launch email" },
    })
    assert.equal(task?.status, "DONE")
    assert.ok(task?.completedAt)
  })

  it("reschedules a task", async () => {
    const turn = await handle("move the product video to next Monday", { db, ctx })

    assert.equal(turn.calls[0].tool, "update_task")
    assert.match(turn.reply, /Moved it to/)
  })

  it("asks instead of guessing between equal matches", async () => {
    await createTask(db, ctx, { title: "Review the brief" })
    await createTask(db, ctx, { title: "Review the invoice" })

    const turn = await handle("done with review the", { db, ctx })

    assert.match(turn.reply, /Which one/)
    assert.equal(turn.calls.length, 0, "nothing should have been changed")
  })

  it("says so when nothing matches", async () => {
    const turn = await handle("done with the zeppelin repair", { db, ctx })
    assert.match(turn.reply, /couldn't find/)
    assert.equal(turn.calls.length, 0)
  })

  it("files anything that is not a command", async () => {
    const turn = await handle(
      "Client wants two banners for the sale, logo is in Drive",
      { db, ctx }
    )

    assert.ok(turn.capturedInboxItemId)
    const item = await db.inboxItem.findUnique({
      where: { id: turn.capturedInboxItemId! },
    })
    assert.equal(item?.status, "NEEDS_REVIEW")
  })

  it("schedules a reminder", async () => {
    const turn = await handle("remind me to chase the invoice tomorrow", { db, ctx })

    assert.equal(turn.calls[0].tool, "create_reminder")

    const reminder = await db.reminder.findFirst({
      where: { title: { contains: "invoice" } },
    })
    assert.ok(reminder, "a reminder should have been stored")
    assert.equal(reminder.status, "SCHEDULED")
    assert.ok(reminder.remindAt > new Date(), "it should be scheduled in the future")
  })
})

describe("briefing", () => {
  it("leads with what is most likely to hurt", async () => {
    const briefing = await buildBriefing(db, "Gautam")

    assert.match(briefing.greeting, /Gautam/)
    assert.match(briefing.headline, /overdue|due today|in progress|Nothing/)
    assert.ok(briefing.sections.length > 0)
  })

  it("produces an evening wrap-up", async () => {
    const wrapUp = await buildWrapUp(db)
    assert.ok(Array.isArray(wrapUp.completed))
    assert.match(wrapUp.question, /carry forward/)
  })
})

describe("job runner", () => {
  it("dispatches a due reminder into a notification", async () => {
    await scheduleReminder(db, ctx, {
      title: "Send the final cut",
      remindAt: new Date(Date.now() - 60_000),
    })

    await enqueue(db, "reminder.dispatch")
    const processed = await drain(10)

    assert.ok(processed >= 1)
    const notification = await db.notification.findFirst({
      where: { title: "Send the final cut" },
    })
    assert.ok(notification, "a notification should have been created")

    const reminder = await db.reminder.findFirst({
      where: { title: "Send the final cut" },
    })
    assert.equal(reminder?.status, "SENT")
  })

  it("marks an unknown job kind failed instead of retrying forever", async () => {
    await enqueue(db, "does.not.exist")
    await drain(10)

    const job = await db.job.findFirst({ where: { kind: "does.not.exist" } })
    assert.equal(job?.status, "FAILED")
    assert.match(job!.lastError ?? "", /No handler/)
  })

  it("records a run for every job it executes", async () => {
    const runs = await db.jobRun.findMany()
    assert.ok(runs.length >= 2)
  })
})
