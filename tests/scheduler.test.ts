/**
 * Recurring scheduling and the worker loop.
 * Run with: npm run test:db
 */
import "dotenv/config"

import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"

import { prisma } from "@/lib/db/client"
import { tenantDb, type TenantDb } from "@/lib/db/tenant"
import { pruneJobs, tick } from "@/lib/jobs/schedule"
import { runWorker } from "@/lib/jobs/worker"

let tenantId: string
let db: TenantDb

before(async () => {
  const tenant = await prisma.tenant.create({
    data: { slug: `sched-${Date.now()}`, name: "Scheduler Test" },
  })
  tenantId = tenant.id
  db = tenantDb(tenantId)
})

after(async () => {
  await prisma.tenant.delete({ where: { id: tenantId } })
  await prisma.$disconnect()
})

const kindsFor = async () =>
  (await db.job.findMany({ select: { kind: true } })).map((job) => job.kind)

describe("recurring schedule", () => {
  it("enqueues the per-minute jobs on any tick", async () => {
    await tick(new Date(2026, 7, 26, 13, 7))
    assert.ok((await kindsFor()).includes("reminder.dispatch"))
  })

  it("does not enqueue the same kind twice while one is pending", async () => {
    const before = (await kindsFor()).filter((k) => k === "reminder.dispatch").length

    await tick(new Date(2026, 7, 26, 13, 8))
    await tick(new Date(2026, 7, 26, 13, 9))

    const after = (await kindsFor()).filter((k) => k === "reminder.dispatch").length
    assert.equal(after, before, "a pending job must not be duplicated")
  })

  it("holds the daily briefing until its hour", async () => {
    await db.job.deleteMany({})

    await tick(new Date(2026, 7, 26, 7, 0))
    assert.ok(!(await kindsFor()).includes("briefing.daily"))

    await tick(new Date(2026, 7, 26, 8, 0))
    assert.ok((await kindsFor()).includes("briefing.daily"))
  })

  it("fires the daily briefing only in the first minute of the hour", async () => {
    await db.job.deleteMany({})

    await tick(new Date(2026, 7, 26, 8, 30))
    assert.ok(
      !(await kindsFor()).includes("briefing.daily"),
      "a per-minute tick would otherwise re-enqueue it all hour"
    )
  })

  it("runs the hourly sweep on the hour only", async () => {
    await db.job.deleteMany({})

    await tick(new Date(2026, 7, 26, 9, 30))
    assert.ok(!(await kindsFor()).includes("deadline.sweep"))

    await tick(new Date(2026, 7, 26, 10, 0))
    assert.ok((await kindsFor()).includes("deadline.sweep"))
  })
})

describe("worker loop", () => {
  it("schedules and drains, then stops when asked", async () => {
    await db.job.deleteMany({})

    const seen: Array<{ enqueued: number; processed: number }> = []

    const { ticks } = await runWorker({
      intervalMs: 1,
      maxTicks: 2,
      onTick: (result) => seen.push(result),
    })

    assert.equal(ticks, 2)
    assert.equal(seen.length, 2)

    // Whatever it enqueued must also have been executed, not left queued.
    const stuck = await db.job.count({ where: { status: "QUEUED" } })
    assert.equal(stuck, 0, "the worker should drain what it schedules")
  })

  it("stops promptly when the signal aborts", async () => {
    const controller = new AbortController()
    controller.abort()

    const { ticks } = await runWorker({ intervalMs: 60_000, signal: controller.signal })
    assert.equal(ticks, 0)
  })

  it("keeps ticking after a failing job", async () => {
    await db.job.create({ data: { kind: "no.such.handler" } as never })

    const { ticks } = await runWorker({ intervalMs: 1, maxTicks: 1 })
    assert.equal(ticks, 1)

    const failed = await db.job.findFirst({ where: { kind: "no.such.handler" } })
    assert.equal(failed?.status, "FAILED")
  })
})

describe("pruning", () => {
  it("removes finished jobs but keeps their run history", async () => {
    const job = await db.job.create({
      data: { kind: "reminder.dispatch", status: "SUCCEEDED" } as never,
    })
    await db.jobRun.create({
      data: { jobId: job.id, status: "SUCCEEDED" } as never,
    })

    // Backdate it past the retention window.
    await prisma.job.update({
      where: { id: job.id },
      data: { updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })

    await pruneJobs(7)

    assert.equal(await db.job.count({ where: { id: job.id } }), 0)
  })

  it("leaves queued work alone", async () => {
    const job = await db.job.create({ data: { kind: "deadline.sweep" } as never })
    await pruneJobs(0)
    assert.equal(await db.job.count({ where: { id: job.id } }), 1)
  })
})
