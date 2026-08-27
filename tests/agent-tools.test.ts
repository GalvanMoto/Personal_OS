/**
 * TanStack AI tool wiring, against a real database.
 *
 * Exercises the server implementations directly rather than through a model, so
 * the boundary that matters — tenant scoping, the approval gate, and the audit
 * trail — is verified without an API key or a network call.
 *
 * Run with: npm run test:db
 */
import "dotenv/config"

import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"

import { toolRegistry } from "@/lib/agents/tools"
import {
  clientToolDefinitions,
  getAgendaDef,
  sendEmailDef,
  updateTaskDef,
} from "@/lib/ai/agent/definitions"
import type { AgentRuntimeContext } from "@/lib/ai/agent/runtime"
import {
  createTask as createTaskTool,
  getAgenda,
  updateTask as updateTaskTool,
  nextBestAction,
  searchTasks,
  serverTools,
} from "@/lib/ai/agent/server-tools"
import { prisma } from "@/lib/db/client"
import { tenantDb } from "@/lib/db/tenant"
import { createTask } from "@/lib/domain/tasks"

const DAY = 24 * 60 * 60 * 1000

let runtime: AgentRuntimeContext
let tenantId: string

before(async () => {
  const tenant = await prisma.tenant.create({
    data: { slug: `agent-${Date.now()}`, name: "Agent Test" },
  })
  tenantId = tenant.id

  const db = tenantDb(tenantId)
  const ctx = { tenantId, actorType: "AGENT" as const, agent: "assistant" }
  runtime = { db, ctx }

  await createTask(db, ctx, {
    title: "Export the product video",
    priority: "HIGH",
    dueAt: new Date(Date.now() - 2 * DAY),
  })
})

after(async () => {
  await prisma.tenant.delete({ where: { id: tenantId } })
  await prisma.$disconnect()
})

const exec = <T extends { execute?: (...args: never[]) => unknown }>(
  tool: T,
  args: unknown
) =>
  (tool.execute as (a: unknown, c: unknown) => Promise<unknown>)(args, {
    context: runtime,
  })

describe("tool definitions", () => {
  it("declares approval only on tools that change or destroy", () => {
    assert.equal(sendEmailDef.needsApproval, true)
    assert.notEqual(getAgendaDef.needsApproval, true)
    // Editing is reversible, so it stopped being an interruption.
    assert.notEqual(updateTaskDef.needsApproval, true)
  })

  it("names every tool after one that exists in the registry", () => {
    for (const tool of serverTools) {
      assert.ok(
        toolRegistry.has(tool.name),
        `server tool "${tool.name}" has no entry in lib/agents/tools.ts`
      )
    }
  })

  it("keeps approval in step with the registry's risk classes", () => {
    for (const tool of serverTools) {
      const entry = toolRegistry.get(tool.name)!
      const gated = entry.risk !== "SAFE"

      assert.equal(
        tool.needsApproval === true,
        gated,
        `"${tool.name}" is ${entry.risk} but needsApproval is ${tool.needsApproval}`
      )
    }
  })

  it("exposes the browser-side tools separately", () => {
    const names = clientToolDefinitions.map((tool) => tool.name)
    assert.deepEqual(names, ["focus_task", "confirm_with_user"])
  })
})

describe("server tool execution", () => {
  it("reads through the tenant-scoped handle it was given", async () => {
    const result = (await exec(getAgenda, {})) as {
      overdue: Array<{ title: string }>
    }

    assert.equal(result.overdue.length, 1)
    assert.equal(result.overdue[0].title, "Export the product video")
  })

  it("returns a recommendation with its reasons", async () => {
    const result = (await exec(nextBestAction, {})) as {
      title: string
      reasons: string[]
    } | null

    assert.ok(result)
    assert.equal(result.title, "Export the product video")
    assert.ok(result.reasons.some((reason) => /overdue/.test(reason)))
  })

  it("serialises dates as ISO strings for the wire", async () => {
    const result = (await exec(searchTasks, { limit: 5 })) as {
      tasks: Array<{ dueAt: string | null }>
    }

    assert.ok(result.tasks.length > 0)
    const due = result.tasks[0].dueAt
    assert.ok(due && !Number.isNaN(Date.parse(due)))
  })

  it("writes through the audited path", async () => {
    await exec(createTaskTool, {
      title: "Agent-created task",
      priority: "MEDIUM",
      dueAt: null,
    })

    const logged = await runtime.db.activityLog.findFirst({
      where: { action: "agent.tool.invoked" },
    })
    assert.ok(logged, "tool invocations must reach the activity log")
  })

  it("refuses to run without a runtime context instead of falling back", async () => {
    await assert.rejects(
      () =>
        (getAgenda.execute as (a: unknown, c: unknown) => Promise<unknown>)(
          {},
          {}
        ),
      /runtime context is missing/i
    )
  })

  it("gives the agent no way to delete anything", async () => {
    // The guarantee is structural, not a rule in the prompt: there is no
    // destructive tool in the registry, so a model that asks for one gets an
    // unknown-tool error rather than a gate it might talk its way past.
    const destructive = [...toolRegistry.keys()].filter((name) =>
      /^(delete|remove|destroy|purge|drop|archive)_/.test(name)
    )

    assert.deepEqual(destructive, [], "no destructive tool may reach the agent")

    for (const tool of serverTools) {
      assert.ok(
        !/^(delete|remove|destroy|purge|drop)_/.test(tool.name),
        `"${tool.name}" is exposed to the model but reads as destructive`
      )
    }
  })

  it("edits a task without queuing an approval", async () => {
    const task = await runtime.db.task.findFirst({
      where: { title: "Agent-created task" },
    })
    assert.ok(task)

    const before = await runtime.db.approvalRequest.count()

    await exec(updateTaskTool, { taskId: task.id, status: "IN_PROGRESS" })

    const updated = await runtime.db.task.findUnique({ where: { id: task.id } })
    assert.equal(updated?.status, "IN_PROGRESS")
    assert.equal(
      await runtime.db.approvalRequest.count(),
      before,
      "an edit should not have parked an approval request"
    )
  })

  it("remembers and recalls across a conversation boundary", async () => {
    const { remember, recall } = await import("@/lib/domain/memory")

    await remember(runtime.db, runtime.ctx, {
      key: "Prefers Morning Edits",
      value: "Schedules heavy editing work before noon.",
      kind: "PREFERENCE",
    })

    const found = await recall(runtime.db, { query: "editing" })
    assert.equal(found.length, 1)
    assert.match(found[0].value, /before noon/)

    // A correction rewrites the value and keeps what was believed before.
    await remember(runtime.db, runtime.ctx, {
      key: "prefers-morning-edits",
      value: "Now schedules heavy editing work after lunch.",
    })

    const row = await runtime.db.agentMemory.findFirst({
      where: { key: "prefers-morning-edits" },
    })
    assert.match(row!.value, /after lunch/)
    assert.deepEqual(row!.history, ["Schedules heavy editing work before noon."])

    assert.equal(
      await runtime.db.agentMemory.count(),
      1,
      "correcting a memory must not create a second row"
    )
  })
})
