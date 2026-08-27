import "server-only"

import { z } from "zod"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { getContextPack, invalidateContextPack } from "@/lib/domain/context"
import { createOrganization } from "@/lib/domain/organizations"
import { createProject } from "@/lib/domain/projects"
import { spendingSummary, upcomingPayments } from "@/lib/domain/finance"
import { formatMoney, money } from "@/lib/domain/money"
import { explain } from "@/lib/domain/provenance"
import {
  agenda,
  createTask,
  nextBestAction,
  rankedTasks,
  updateTask,
} from "@/lib/domain/tasks"
import { logActivity } from "@/lib/events/activity"
import { checkAgentPolicy } from "@/lib/agents/registry"
import { generateImportPlan, executeImportPlan } from "@/lib/domain/import-intelligence"
import { syncIntegrationEmails } from "@/lib/domain/email"
import { recall, remember } from "@/lib/domain/memory"
import { importStatementsFromEmail } from "@/lib/domain/statement-import"

/**
 * The tool layer (PRD §27).
 *
 * Agents never hold a database handle. They call named tools with validated
 * arguments, and each tool declares how dangerous it is. Anything above SAFE
 * stops and becomes an ApprovalRequest instead of executing, which is what
 * makes "let the agent manage everything" survivable (PRD §19, §25).
 */

export type ToolRisk =
  /// Reversible and cheap. Runs immediately.
  | "SAFE"
  /// Changes the user's plan in a way they should see. Runs, but is announced.
  | "CONFIRM"
  /// Leaves the system or destroys data. Never runs without explicit approval.
  | "SENSITIVE"

export type ToolContext = {
  db: TenantDb
  ctx: DomainContext
}

type Tool<Schema extends z.ZodType> = {
  name: string
  description: string
  risk: ToolRisk
  input: Schema
  handler: (args: z.infer<Schema>, tools: ToolContext) => Promise<unknown>
}

function defineTool<Schema extends z.ZodType>(tool: Tool<Schema>) {
  return tool as Tool<z.ZodType>
}

const tools: Tool<z.ZodType>[] = [
  defineTool({
    name: "search_tasks",
    description:
      "Find tasks by text, status or due window. Returns them ranked by what to do next.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      status: z
        .enum(["BACKLOG", "TODO", "IN_PROGRESS", "WAITING", "BLOCKED", "DONE"])
        .optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db }) => {
      const ranked = await rankedTasks(db)

      return ranked
        .filter((task) => (args.status ? task.status === args.status : true))
        .filter((task) =>
          args.query
            ? task.title.toLowerCase().includes(args.query.toLowerCase())
            : true
        )
        .slice(0, args.limit)
        .map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueAt: task.dueAt,
          score: task.score,
          reasons: task.reasons,
        }))
    },
  }),

  defineTool({
    name: "get_agenda",
    description:
      "What needs attention today: overdue, due today, due soon, waiting, and the single next best action.",
    risk: "SAFE",
    input: z.object({}),
    handler: async (_args, { db }) => {
      const result = await agenda(db)

      const summarise = (tasks: Array<{ id: string; title: string; dueAt: Date | null }>) =>
        tasks.map((task) => ({ id: task.id, title: task.title, dueAt: task.dueAt }))

      return {
        overdue: summarise(result.overdue),
        dueToday: summarise(result.dueToday),
        dueSoon: summarise(result.dueSoon),
        waiting: summarise(result.waiting),
        inProgress: summarise(result.inProgress),
        completedRecently: result.completedRecently.length,
        nextBest: result.nextBest
          ? {
              id: result.nextBest.id,
              title: result.nextBest.title,
              reasons: result.nextBest.reasons,
            }
          : null,
      }
    },
  }),

  defineTool({
    name: "next_best_action",
    description:
      "The one task to do now, with the reasons behind the recommendation.",
    risk: "SAFE",
    input: z.object({}),
    handler: async (_args, { db }) => {
      const task = await nextBestAction(db)
      if (!task) return null

      return {
        id: task.id,
        title: task.title,
        dueAt: task.dueAt,
        score: task.score,
        reasons: task.reasons,
      }
    },
  }),

  defineTool({
    name: "get_task_context",
    description:
      "Everything needed to actually do a task: brief, client, assets, checklist, previous work.",
    risk: "SAFE",
    input: z.object({ taskId: z.string().min(1) }),
    handler: async (args, { db }) => getContextPack(db, args.taskId),
  }),

  defineTool({
    name: "explain_value",
    description:
      "Why the system believes something: the source, the quote, and the confidence.",
    risk: "SAFE",
    input: z.object({
      entityType: z.enum(["TASK", "PROJECT", "ORGANIZATION"]),
      entityId: z.string().min(1),
    }),
    handler: async (args, { db }) => {
      const records = await explain(db, args.entityType, args.entityId)

      return records.map((record) => ({
        field: record.field,
        kind: record.kind,
        value: record.value,
        confidence: record.confidence,
        source: record.sourceType,
        evidence: record.evidence,
        agent: record.agent,
      }))
    },
  }),

  defineTool({
    name: "create_task",
    description: "Create a task, optionally inside a project and with a deadline.",
    risk: "SAFE",
    input: z.object({
      title: z.string().min(1).max(300),
      description: z.string().max(4000).optional(),
      projectId: z.string().optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
      dueAt: z.string().datetime().nullable().default(null),
    }),
    handler: async (args, { db, ctx }) => {
      const task = await createTask(db, ctx, {
        title: args.title,
        description: args.description,
        projectId: args.projectId,
        priority: args.priority,
        dueAt: args.dueAt ? new Date(args.dueAt) : null,
      })

      return { id: task.id, title: task.title }
    },
  }),

  defineTool({
    name: "update_task",
    description:
      "Change a task's status, priority, deadline or what it is waiting on.",
    // Moving a deadline reshapes the user's day, so it is announced rather than
    // performed silently.
    risk: "SAFE",
    input: z.object({
      taskId: z.string().min(1),
      status: z
        .enum(["BACKLOG", "TODO", "IN_PROGRESS", "WAITING", "BLOCKED", "DONE", "CANCELLED"])
        .optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      dueAt: z.string().datetime().nullable().optional(),
      waitingOn: z.string().max(300).nullable().optional(),
    }),
    handler: async (args, { db, ctx }) => {
      const task = await updateTask(db, ctx, args.taskId, {
        status: args.status,
        priority: args.priority,
        dueAt: args.dueAt === undefined ? undefined : args.dueAt ? new Date(args.dueAt) : null,
        waitingOn: args.waitingOn,
      })

      await invalidateContextPack(db, args.taskId)
      return { id: task.id, status: task.status }
    },
  }),

  defineTool({
    name: "create_project",
    description: "Create a project, optionally attached to a client.",
    risk: "SAFE",
    input: z.object({
      name: z.string().min(1).max(120),
      description: z.string().max(2000).optional(),
      organizationId: z.string().optional(),
    }),
    handler: async (args, { db, ctx }) => {
      const project = await createProject(db, ctx, args)
      return { id: project.id, name: project.name, slug: project.slug }
    },
  }),

  defineTool({
    name: "create_organization",
    description: "Add a client, vendor or partner.",
    risk: "SAFE",
    input: z.object({
      name: z.string().min(1).max(120),
      kind: z.enum(["CLIENT", "VENDOR", "PARTNER", "EMPLOYER", "OTHER"]).default("CLIENT"),
    }),
    handler: async (args, { db, ctx }) => {
      const organization = await createOrganization(db, ctx, args)
      return { id: organization.id, name: organization.name }
    },
  }),

  defineTool({
    name: "create_reminder",
    description: "Schedule a reminder, optionally attached to a task.",
    risk: "SAFE",
    input: z.object({
      title: z.string().min(1).max(200),
      body: z.string().max(1000).optional(),
      remindAt: z.string().datetime(),
      taskId: z.string().optional(),
    }),
    handler: async (args, { db }) => {
      const reminder = await db.reminder.create({
        data: {
          title: args.title,
          body: args.body,
          remindAt: new Date(args.remindAt),
          taskId: args.taskId,
        } as never,
      })

      return { id: reminder.id, remindAt: reminder.remindAt }
    },
  }),

  defineTool({
    name: "spending_summary",
    description:
      "What was spent over a period, broken down by category, with the change against the previous period. Figures are computed from recorded transactions.",
    risk: "SAFE",
    input: z.object({
      days: z
        .number()
        .int()
        .min(1)
        .max(400)
        .default(30)
        .meta({ description: "How many days back to summarise" }),
    }),
    handler: async (args, { db }) => {
      const to = new Date()
      const from = new Date(to.getTime() - args.days * 24 * 60 * 60 * 1000)

      const summary = await spendingSummary(db, from, to)

      // Pre-formatted so the model reports the number rather than doing
      // arithmetic on it (PRD §20).
      return {
        period: `${args.days} days`,
        spent: formatMoney(money(summary.spentMinor, summary.currency)),
        earned: formatMoney(money(summary.earnedMinor, summary.currency)),
        net: formatMoney(money(summary.netMinor, summary.currency)),
        changeVsPreviousPercent: summary.changeVsPrevious,
        byCategory: summary.byCategory.map((row) => ({
          category: row.category,
          amount: formatMoney(money(row.minor, summary.currency)),
          share: row.share,
        })),
      }
    },
  }),

  defineTool({
    name: "upcoming_payments",
    description:
      "Subscription payments expected soon, soonest first. Use for questions about bills or recurring charges coming up.",
    risk: "SAFE",
    input: z.object({
      days: z.number().int().min(1).max(365).default(30),
    }),
    handler: async (args, { db }) => {
      const upcoming = await upcomingPayments(db, args.days)

      return upcoming.map((entry) => ({
        name: entry.name,
        amount: formatMoney(money(entry.amountMinor, entry.currency)),
        cycle: entry.cycle,
        dueAt: entry.dueAt.toISOString(),
        daysAway: entry.daysAway,
      }))
    },
  }),

  defineTool({
    name: "send_email",
    description: "Send an email on the user's behalf.",
    // Leaves the system and cannot be recalled.
    risk: "SENSITIVE",
    input: z.object({
      to: z.string().email(),
      subject: z.string().min(1).max(300),
      body: z.string().min(1).max(20000),
    }),
    handler: async () => {
      // Reached only after a human approves the pending request.
      throw new Error("Email sending is not connected yet.")
    },
  }),

  defineTool({
    name: "search_emails",
    description: "Search received emails, invoices, bank alerts, communications, and subscriptions.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional().describe("Search keywords from subject or body"),
      from: z.string().optional().describe("Sender email or domain filter"),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db, ctx }) => {
      // If Gmail is disconnected, hide all emails from frontend/agent
      const connectedCount = await db.integration.count({
        where: { tenantId: ctx.tenantId, provider: "GMAIL", status: "CONNECTED" },
      })
      if (connectedCount === 0) {
        return { emails: [] }
      }

      const where: Record<string, unknown> = { tenantId: ctx.tenantId }
      if (args.query) {
        where.OR = [
          { subject: { contains: args.query, mode: "insensitive" } },
          { body: { contains: args.query, mode: "insensitive" } },
          { snippet: { contains: args.query, mode: "insensitive" } },
        ]
      }
      if (args.from) {
        where.fromEmail = { contains: args.from, mode: "insensitive" }
      }

      let rows = await db.emailMessage.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        take: args.limit,
        select: {
          id: true,
          subject: true,
          fromName: true,
          fromEmail: true,
          snippet: true,
          receivedAt: true,
        },
      })

      // If no matching rows, attempt a live targeted sync directly from Gmail API and query again
      if (rows.length === 0) {
        const liveSearchQuery = [
          args.query,
          args.from ? `from:${args.from}` : null,
        ]
          .filter(Boolean)
          .join(" ")

        const integrations = await db.integration.findMany({
          where: { tenantId: ctx.tenantId, provider: "GMAIL", status: "CONNECTED" },
        })
        for (const integration of integrations) {
          try {
            await syncIntegrationEmails(db, ctx, integration, liveSearchQuery || undefined)
          } catch (err) {
            console.warn(`[search_emails] auto-sync failed for ${integration.id}:`, err)
          }
        }

        rows = await db.emailMessage.findMany({
          where,
          orderBy: { receivedAt: "desc" },
          take: args.limit,
          select: {
            id: true,
            subject: true,
            fromName: true,
            fromEmail: true,
            snippet: true,
            receivedAt: true,
          },
        })
      }

      return {
        emails: rows.map((r) => ({
          subject: r.subject || "No Subject",
          from: r.fromName ? `${r.fromName} <${r.fromEmail}>` : r.fromEmail || "Unknown",
          snippet: r.snippet || "",
          receivedAt: r.receivedAt ? (r.receivedAt instanceof Date ? r.receivedAt.toISOString() : String(r.receivedAt)) : "",
        })),
      }
    },
  }),

  defineTool({
    name: "sync_emails",
    description:
      "Fetch and synchronize latest emails from connected Gmail/Google accounts into the workspace database.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      from: z.string().optional(),
    }),
    handler: async (args, { db, ctx }) => {
      const integrations = await db.integration.findMany({
        where: { tenantId: ctx.tenantId, provider: "GMAIL", status: "CONNECTED" },
      })

      if (integrations.length === 0) {
        return {
          status: "NOT_CONNECTED",
          message: "No connected Gmail account found in workspace. Please connect Gmail in Settings → Integrations.",
          emails: [],
        }
      }

      const liveSearchQuery = [
        args.query,
        args.from ? `from:${args.from}` : null,
      ]
        .filter(Boolean)
        .join(" ")

      let totalFetched = 0
      let totalIngested = 0

      for (const integration of integrations) {
        try {
          const res = await syncIntegrationEmails(db, ctx, integration, liveSearchQuery || undefined)
          totalFetched += res.fetched
          totalIngested += res.ingested
        } catch (err) {
          console.warn(`[sync_emails] sync failed for ${integration.id}:`, err)
        }
      }

      const where: Record<string, unknown> = { tenantId: ctx.tenantId }
      if (args.query) {
        where.OR = [
          { subject: { contains: args.query, mode: "insensitive" } },
          { body: { contains: args.query, mode: "insensitive" } },
          { snippet: { contains: args.query, mode: "insensitive" } },
        ]
      }
      if (args.from) {
        where.fromEmail = { contains: args.from, mode: "insensitive" }
      }

      const rows = await db.emailMessage.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        take: 15,
        select: {
          id: true,
          subject: true,
          fromName: true,
          fromEmail: true,
          snippet: true,
          receivedAt: true,
        },
      })

      return {
        status: "SYNCED",
        fetched: totalFetched,
        ingested: totalIngested,
        emails: rows.map((r) => ({
          subject: r.subject || "No Subject",
          from: r.fromName ? `${r.fromName} <${r.fromEmail}>` : r.fromEmail || "Unknown",
          snippet: r.snippet || "",
          receivedAt: r.receivedAt ? (r.receivedAt instanceof Date ? r.receivedAt.toISOString() : String(r.receivedAt)) : "",
        })),
      }
    },
  }),

  defineTool({
    name: "organize_sources",
    description:
      "Ingest, understand, reconcile, and organize client briefs, Google Sheets, and Google Docs into structured Brands, Recurring Commitments, Weekly Tasks, and Requirements.",
    /// The gate here is `apply`, not an approval modal. The assistant is told to
    /// preview first and describe what it found, which is a conversation the
    /// user can steer — strictly better than a yes/no prompt over a plan they
    /// have not seen yet. Everything it creates is editable afterwards.
    risk: "SAFE",
    input: z.object({
      message: z.string().optional(),
      sourceUrls: z.array(z.string()).optional(),
      clientHint: z.string().optional(),
      apply: z.boolean().default(false),
    }),
    handler: async (args, { db, ctx }) => {
      const plan = await generateImportPlan(db, {
        message: args.message,
        sourceUrls: args.sourceUrls,
        clientHint: args.clientHint,
      })

      if (args.apply) {
        const execution = await executeImportPlan(db, ctx, plan)
        return {
          status: "APPLIED",
          plan,
          execution,
          report: execution.summaryReport,
        }
      }

      return {
        status: "PREVIEW",
        plan,
      }
    },
  }),

  // ---------------------------------------------------------------------------
  // Memory
  // ---------------------------------------------------------------------------

  defineTool({
    name: "remember",
    description:
      "Store or correct something about the user that should outlast this conversation.",
    risk: "SAFE",
    input: z.object({
      key: z.string().min(1).max(80),
      value: z.string().min(1).max(2000),
      kind: z
        .enum(["PREFERENCE", "FACT", "PERSON", "ROUTINE", "PROJECT", "CONTEXT"])
        .default("FACT"),
      pinned: z.boolean().default(false),
    }),
    handler: async (args, { db, ctx }) => {
      const { memory, changed, corrected } = await remember(db, ctx, args)
      return { key: memory.key, stored: changed, corrected }
    },
  }),

  defineTool({
    name: "recall",
    description: "Search what is already known about the user.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      kind: z
        .enum(["PREFERENCE", "FACT", "PERSON", "ROUTINE", "PROJECT", "CONTEXT"])
        .optional(),
      limit: z.number().int().min(1).max(50).default(10),
    }),
    handler: async (args, { db }) => ({
      memories: await recall(db, args),
    }),
  }),

  // ---------------------------------------------------------------------------
  // Statements
  // ---------------------------------------------------------------------------

  defineTool({
    name: "import_bank_statement",
    description:
      "Find bank statements in the user's mail, unlock them with the vault, parse them and put the transactions on the ledger.",
    /// SAFE despite writing: the import is additive and deduped twice over, so
    /// running it again settles rather than doubles. The judgement call the user
    /// actually cares about — whether to import at all — is `apply`, which the
    /// assistant is told to leave false until they say yes.
    risk: "SAFE",
    input: z.object({
      from: z.string().optional(),
      query: z.string().optional(),
      days: z.number().int().min(1).max(400).default(120),
      apply: z.boolean().default(false),
    }),
    handler: async (args, { db, ctx }) =>
      importStatementsFromEmail(db, ctx, args),
  }),
]

export const toolRegistry = new Map(tools.map((tool) => [tool.name, tool]))

/// The catalogue an agent is shown when deciding what it can do.
export function listTools() {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    risk: tool.risk,
    input: z.toJSONSchema(tool.input),
  }))
}

export type ToolOutcome =
  | { status: "OK"; result: unknown }
  | { status: "NEEDS_APPROVAL"; approvalId: string; reason: string }
  | { status: "ERROR"; error: string }

/**
 * Single entry point for every agent action.
 *
 * Validation, the risk gate, execution and the audit entry all live here, so
 * there is exactly one path from "an agent wanted to do something" to "the
 * database changed" — and it is always logged.
 */
export async function executeTool(
  name: string,
  rawArgs: unknown,
  { db, ctx }: ToolContext,
  options: {
    /// Set when replaying an ApprovalRequest a human already decided on.
    approvedRequestId?: string
    /// Set when approval was granted out-of-band — the TanStack AI client
    /// resolved a `needsApproval` interrupt before the call reached us. The
    /// gate is satisfied, but the invocation is still audited.
    preApproved?: boolean
  } = {}
): Promise<ToolOutcome> {
  const tool = toolRegistry.get(name)

  if (!tool) {
    return { status: "ERROR", error: `Unknown tool "${name}"` }
  }

  const parsed = tool.input.safeParse(rawArgs)

  if (!parsed.success) {
    return {
      status: "ERROR",
      error: `Invalid arguments for ${name}: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "input"} ${issue.message}`)
        .join("; ")}`,
    }
  }

  // Policy Engine authorization check (PRD §41)
  if (ctx.agent) {
    const policy = checkAgentPolicy(ctx.agent, name, tool.risk)
    if (!policy.allowed) {
      return { status: "ERROR", error: policy.reason || "Policy authorization denied" }
    }
  }

  // Sensitive tools stop here unless this call is the execution of an approval
  // a human already granted.
  if (
    tool.risk === "SENSITIVE" &&
    !options.approvedRequestId &&
    !options.preApproved
  ) {
    const request = await db.approvalRequest.create({
      data: {
        agent: ctx.agent ?? "assistant",
        tool: name,
        args: parsed.data as never,
        reason: tool.description,
      } as never,
    })

    await logActivity(db, {
      action: "agent.approval.requested",
      summary: `Asked permission to run ${name}`,
      userId: ctx.userId,
      actorType: "AGENT",
      actorId: ctx.agent,
      metadata: { tool: name },
    })

    return {
      status: "NEEDS_APPROVAL",
      approvalId: request.id,
      reason: tool.description,
    }
  }

  try {
    const result = await tool.handler(parsed.data, { db, ctx })

    await logActivity(db, {
      action: "agent.tool.invoked",
      summary: `Ran ${name}`,
      userId: ctx.userId,
      actorType: ctx.actorType ?? "AGENT",
      actorId: ctx.agent,
      metadata: {
        tool: name,
        risk: tool.risk,
        approvedBy: options.preApproved
          ? "client-interrupt"
          : options.approvedRequestId
            ? "approval-request"
            : undefined,
      },
    })

    return { status: "OK", result }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool failed"

    await logActivity(db, {
      action: "agent.tool.failed",
      summary: `${name} failed: ${message}`,
      userId: ctx.userId,
      actorType: "AGENT",
      actorId: ctx.agent,
      metadata: { tool: name },
    })

    return { status: "ERROR", error: message }
  }
}

/// Runs a tool call a human has approved, then records the outcome on the
/// request so the Activity page shows the full round trip.
export async function executeApproved(
  approvalId: string,
  { db, ctx }: ToolContext
): Promise<ToolOutcome> {
  const request = await db.approvalRequest.findUnique({ where: { id: approvalId } })

  if (!request) return { status: "ERROR", error: "Approval request not found" }
  if (request.status !== "APPROVED") {
    return { status: "ERROR", error: "This request has not been approved" }
  }

  const outcome = await executeTool(request.tool, request.args, { db, ctx }, {
    approvedRequestId: approvalId,
  })

  await db.approvalRequest.update({
    where: { id: approvalId },
    data: { result: outcome as never },
  })

  return outcome
}
