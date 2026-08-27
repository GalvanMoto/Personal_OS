/**
 * End-to-end test of the core loop against a real database.
 *
 * Run with: npm run test:db
 * Creates a throwaway tenant and removes it afterwards.
 */
import "dotenv/config"

import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"

import { executeTool } from "@/lib/agents/tools"
import { prisma } from "@/lib/db/client"
import { tenantDb, type TenantDb } from "@/lib/db/tenant"
import { buildContextPack } from "@/lib/domain/context"
import { applyProposal, captureAndProcess } from "@/lib/domain/inbox"
import { nextBestAction } from "@/lib/domain/tasks"
import type { DomainContext } from "@/lib/domain/context-types"

const BRIEF =
  "Bro please make 3 reels for GB Banquet. First one should be event highlights, " +
  "second should show decoration and third should focus on the food. " +
  "Need them before Saturday. Photos are in Drive."

let tenantId: string
let db: TenantDb
let ctx: DomainContext

before(async () => {
  const tenant = await prisma.tenant.create({
    data: { slug: `test-${Date.now()}`, name: "Pipeline Test" },
  })
  tenantId = tenant.id
  db = tenantDb(tenantId)
  ctx = { tenantId }
})

after(async () => {
  await prisma.tenant.delete({ where: { id: tenantId } })
  await prisma.$disconnect()
})

describe("capture → understand → organise", () => {
  let taskIds: string[] = []
  let inboxItemId: string

  it("captures raw text without interpreting it first", async () => {
    const item = await captureAndProcess(db, ctx, { rawText: BRIEF, kind: "TEXT" })
    inboxItemId = item.id

    assert.equal(item.rawText, BRIEF)
    // Understanding produced a proposal, but nothing was written to the graph.
    assert.equal(item.status, "NEEDS_REVIEW")
    assert.ok(item.proposal)
    assert.equal(await db.task.count(), 0)
  })

  it("turns an accepted proposal into a client, project and tasks", async () => {
    const result = await applyProposal(db, ctx, inboxItemId)
    taskIds = result.tasks.map((task) => task.id)

    assert.equal(result.tasks.length, 3)
    assert.ok(result.organizationId)
    assert.ok(result.projectId)

    const organization = await db.organization.findFirst()
    assert.equal(organization?.name, "GB Banquet")
  })

  it("marks the inbox item processed exactly once", async () => {
    const item = await db.inboxItem.findUnique({ where: { id: inboxItemId } })
    assert.equal(item?.status, "PROCESSED")
    assert.ok(item?.processedAt)
  })

  it("keeps a receipt for every value it extracted", async () => {
    const records = await db.provenance.findMany({
      where: { targetType: "TASK", targetId: taskIds[0] },
    })

    assert.ok(records.length > 0)
    const due = records.find((record) => record.field === "dueAt")
    assert.ok(due, "the deadline should be traceable to its source")
    assert.equal(due.sourceType, "INBOX")
    assert.equal(due.sourceId, inboxItemId)
  })

  it("links the tasks back to the message they came from", async () => {
    const edges = await db.entityLink.findMany({
      where: { fromType: "TASK", toType: "INBOX_ITEM", relation: "DERIVED_FROM" },
    })

    assert.equal(edges.length, 3)
  })

  it("records the assets the brief depends on", async () => {
    const checklist = await db.taskChecklistItem.findMany({
      where: { taskId: taskIds[0] },
    })

    const labels = checklist.map((entry) => entry.label.toLowerCase())
    assert.ok(labels.some((label) => label.includes("photos")))
  })
})

describe("context packs", () => {
  it("assembles what is needed to actually do the task", async () => {
    const task = await db.task.findFirst({ orderBy: { createdAt: "asc" } })
    assert.ok(task)

    const pack = await buildContextPack(db, task.id)
    assert.ok(pack)

    assert.equal(pack.organization?.name, "GB Banquet")
    assert.ok(pack.project)
    // The two other reels asked for in the same message.
    assert.equal(pack.siblingTasks.length, 2)
    assert.ok(pack.instructions.length > 0, "should quote the original brief")
    assert.ok(pack.sources.length > 0, "should point back at the capture")
  })
})

describe("planning", () => {
  it("recommends an actionable task and says why", async () => {
    const task = await nextBestAction(db)
    assert.ok(task)
    assert.notEqual(task.status, "WAITING")
    assert.notEqual(task.status, "BLOCKED")
    assert.ok(task.reasons.length > 0)
  })

  it("never recommends a task that is parked", async () => {
    const all = await db.task.findMany()
    for (const task of all) {
      await db.task.update({
        where: { id: task.id },
        data: { status: "WAITING", waitingOn: "client" },
      })
    }

    assert.equal(await nextBestAction(db), null)

    for (const task of all) {
      await db.task.update({ where: { id: task.id }, data: { status: "TODO" } })
    }
  })
})

describe("agent tool boundary", () => {
  it("runs a safe tool immediately", async () => {
    const outcome = await executeTool("next_best_action", {}, { db, ctx })
    assert.equal(outcome.status, "OK")
  })

  it("rejects arguments that do not match the schema", async () => {
    const outcome = await executeTool("create_task", { title: "" }, { db, ctx })
    assert.equal(outcome.status, "ERROR")
  })

  it("refuses an unknown tool", async () => {
    const outcome = await executeTool("drop_everything", {}, { db, ctx })
    assert.equal(outcome.status, "ERROR")
  })

  it("will not run a sensitive tool without approval", async () => {
    const before = await db.task.count()
    const task = await db.task.findFirst()
    assert.ok(task)

    const outcome = await executeTool("delete_task", { taskId: task.id }, { db, ctx })

    assert.equal(outcome.status, "NEEDS_APPROVAL")
    assert.equal(await db.task.count(), before, "nothing may be deleted yet")

    const request = await db.approvalRequest.findFirst()
    assert.equal(request?.tool, "delete_task")
    assert.equal(request?.status, "PENDING")
  })

  it("logs every tool invocation", async () => {
    const entries = await db.activityLog.findMany({
      where: { action: { startsWith: "agent." } },
    })
    assert.ok(entries.length > 0)
  })
})
