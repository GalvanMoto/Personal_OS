import "server-only"

import { z } from "zod"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { getContextPack, invalidateContextPack } from "@/lib/domain/context"
import { createOrganization, resolveOrganization } from "@/lib/domain/organizations"
import { createProject } from "@/lib/domain/projects"
import { createBrand, resolveBrand } from "@/lib/domain/brands"
import { createRecurringCommitment, getCommitmentsProgressSummary } from "@/lib/domain/commitments"
import { spendingSummary, upcomingPayments } from "@/lib/domain/finance"
import { formatMoney, money } from "@/lib/domain/money"
import { explain } from "@/lib/domain/provenance"
import {
  agenda,
  createTask,
  deleteTask,
  nextBestAction,
  rankedTasks,
  updateTask,
} from "@/lib/domain/tasks"
import { projectsWithProgress } from "@/lib/domain/projects"
import { logActivity } from "@/lib/events/activity"
import { checkAgentPolicy } from "@/lib/agents/registry"
import { scheduleReminder } from "@/lib/domain/reminders"
import { search as searchIndex } from "@/lib/search"
import { generateImportPlan, executeImportPlan } from "@/lib/domain/import-intelligence"
import { syncIntegrationEmails } from "@/lib/domain/email"
import { recall, remember } from "@/lib/domain/memory"
import { importStatementsFromEmail } from "@/lib/domain/statement-import"
import {
  cancelSubscription,
  createOrUpdateSubscription,
  getSubscription,
  searchSubscriptions,
  updateSubscription,
} from "@/lib/domain/subscription-orchestrator"

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
      return { id: organization.id, name: organization.name, slug: organization.slug }
    },
  }),

  defineTool({
    name: "search_organizations",
    description: "Search clients/vendors by name. Use for 'find Karna Kreative' / universal resolver client lookup.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      kind: z.enum(["CLIENT", "VENDOR", "PARTNER", "EMPLOYER", "OTHER"]).optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db }) => {
      const where: Record<string, unknown> = {}
      if (args.query) where.name = { contains: args.query, mode: "insensitive" }
      if (args.kind) where.kind = args.kind
      const rows = await db.organization.findMany({
        where: where as never,
        orderBy: { name: "asc" },
        take: args.limit,
        select: { id: true, name: true, slug: true, kind: true },
      })
      return rows
    },
  }),

  defineTool({
    name: "create_brand",
    description: "Create a brand/account under a client (e.g. WOW Indian under Karna Kreative).",
    risk: "SAFE",
    input: z.object({
      organizationId: z.string().min(1),
      name: z.string().min(1).max(120),
      website: z.string().optional(),
      industry: z.string().max(60).optional(),
      color: z.string().max(20).optional(),
      notes: z.string().max(1000).optional(),
    }),
    handler: async (args, { db, ctx }) => {
      const brand = await createBrand(db, ctx, args)
      return { id: brand.id, name: brand.name, slug: brand.slug, organizationId: brand.organizationId }
    },
  }),

  defineTool({
    name: "search_brands",
    description: "Search brands/accounts by name or organization.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      organizationId: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db }) => {
      const where: Record<string, unknown> = {}
      if (args.query) where.name = { contains: args.query, mode: "insensitive" }
      if (args.organizationId) where.organizationId = args.organizationId
      const rows = await db.brand.findMany({
        where: where as never,
        orderBy: { name: "asc" },
        take: args.limit,
        include: { organization: { select: { name: true, slug: true } } },
      })
      return rows.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        organizationId: b.organizationId,
        organization: b.organization,
      }))
    },
  }),

  defineTool({
    name: "create_commitment",
    description:
      "Create a recurring commitment (e.g. Karna Kreative → WOW Indian → 3 reels every week). Auto-generates weekly tasks and reminders via central engines. Idempotent per client+title+frequency.",
    risk: "SAFE",
    input: z.object({
      organizationId: z.string().min(1).describe("Client organization id (use search_organizations to resolve name → id)"),
      brandId: z.string().optional().describe("Brand id if deliverable is for a specific brand/account"),
      title: z.string().min(1).max(200).describe("e.g. 'Reels', 'WOW Indian reels'"),
      deliverableType: z.enum(["REEL", "POST", "SHORT", "STORY", "REPORT", "DESIGN", "NEWSLETTER", "CUSTOM"]).default("REEL"),
      quantity: z.number().int().min(1).max(100).default(1).describe("How many per cycle, e.g. 3"),
      frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY"]).default("WEEKLY"),
      dueDayOfWeek: z.number().int().min(0).max(6).default(5).describe("0=Sun, 5=Fri"),
      estimatedMinutes: z.number().int().min(5).max(480).default(45),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("HIGH"),
      description: z.string().max(1000).optional(),
    }),
    handler: async (args, { db, ctx }) => {
      // Idempotent: reuse existing active commitment with same org+title+frequency
      const existing = await db.recurringCommitment.findFirst({
        where: {
          organizationId: args.organizationId,
          title: { equals: args.title, mode: "insensitive" },
          frequency: args.frequency as never,
          status: "ACTIVE",
        },
      })
      if (existing) {
        return { id: existing.id, title: existing.title, frequency: existing.frequency, isNew: false }
      }
      const c = await createRecurringCommitment(db, ctx, {
        organizationId: args.organizationId,
        brandId: args.brandId,
        title: args.title,
        deliverableType: args.deliverableType as never,
        quantity: args.quantity,
        frequency: args.frequency as never,
        dueDayOfWeek: args.dueDayOfWeek,
        estimatedMinutes: args.estimatedMinutes,
        priority: args.priority as never,
        description: args.description,
      })
      return { id: c.id, title: c.title, frequency: c.frequency, quantity: c.quantity, isNew: true }
    },
  }),

  defineTool({
    name: "search_commitments",
    description: "Search recurring commitments by client/brand/title. Shows weekly progress matrix.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      organizationId: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db }) => {
      const summary = await getCommitmentsProgressSummary(db)
      let items = summary.items
      if (args.organizationId) items = items.filter((i) => i.id && summary.items.find((x) => x.id === i.id && x.clientSlug))
      if (args.query) {
        const q = args.query.toLowerCase()
        items = items.filter((i) => i.title.toLowerCase().includes(q) || i.clientName.toLowerCase().includes(q) || (i.brandName && i.brandName.toLowerCase().includes(q)))
      }
      // Also raw fallback if summary empty
      if (items.length === 0 && !args.query) {
        const rows = await db.recurringCommitment.findMany({
          where: args.organizationId ? { organizationId: args.organizationId } : {},
          orderBy: { createdAt: "desc" },
          take: args.limit,
          include: { organization: { select: { name: true, slug: true } }, brand: { select: { name: true } } },
        })
        return rows.map((r) => ({
          id: r.id,
          title: r.title,
          clientName: r.organization.name,
          brandName: r.brand?.name ?? null,
          frequency: r.frequency,
          quantity: r.quantity,
          status: r.status,
        }))
      }
      return items.slice(0, args.limit)
    },
  }),

  // Helper: resolve-or-create client+brand+commitment in one call (operational.txt §4 compound)
  defineTool({
    name: "ensure_commitment",
    description:
      "Universal helper: ensures Client → Brand → Recurring Commitment chain exists (idempotent). Use when user says 'Karna Kreative sends 3 reels every week for WOW Indian'. Creates missing org/brand/commitment and links them; returns ids and whether each was created.",
    risk: "SAFE",
    input: z.object({
      clientName: z.string().min(1).max(120),
      brandName: z.string().max(120).optional(),
      title: z.string().min(1).max(200).default("Reels"),
      deliverableType: z.enum(["REEL", "POST", "SHORT", "STORY", "REPORT", "DESIGN", "NEWSLETTER", "CUSTOM"]).default("REEL"),
      quantity: z.number().int().min(1).max(100).default(1),
      frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY"]).default("WEEKLY"),
      dueDayOfWeek: z.number().int().min(0).max(6).default(5),
    }),
    handler: async (args, { db, ctx }) => {
      const { organization } = await resolveOrganization(db, ctx, args.clientName)
      let brand: { id: string; name: string } | null = null
      if (args.brandName) {
        const res = await resolveBrand(db, ctx, organization.id, args.brandName)
        brand = res.brand
      }
      const existing = await db.recurringCommitment.findFirst({
        where: {
          organizationId: organization.id,
          title: { equals: args.title, mode: "insensitive" },
          frequency: args.frequency as never,
          status: "ACTIVE",
        },
      })
      if (existing) {
        return {
          organization: { id: organization.id, name: organization.name },
          brand,
          commitment: { id: existing.id, title: existing.title, isNew: false },
        }
      }
      const c = await createRecurringCommitment(db, ctx, {
        organizationId: organization.id,
        brandId: brand?.id ?? null,
        title: args.title,
        deliverableType: args.deliverableType as never,
        quantity: args.quantity,
        frequency: args.frequency as never,
        dueDayOfWeek: args.dueDayOfWeek,
      })
      return {
        organization: { id: organization.id, name: organization.name },
        brand,
        commitment: { id: c.id, title: c.title, isNew: true },
      }
    },
  }),

  // Invoices / Receipts — finance obligation (operational.txt §86, §89)
  // No separate table; invoices are TRANSACTIONS with category BUSINESS + linked Document/Link + EntityLink to Organization.
  defineTool({
    name: "create_invoice",
    description: "Create an invoice/financial obligation linked to a client and optionally a project. Use for 'Add invoice for Karna'.",
    risk: "SAFE",
    input: z.object({
      organizationId: z.string().optional().describe("Client id, or resolve via search_organizations first"),
      clientName: z.string().max(120).optional().describe("Client name fallback — will resolve-or-create"),
      title: z.string().min(1).max(200).describe("Invoice title/description"),
      amountMinor: z.number().int().min(0).describe("Amount in paise (e.g. 500000 = ₹5000)"),
      currency: z.string().max(10).default("INR"),
      direction: z.enum(["DEBIT", "CREDIT"]).default("DEBIT").describe("DEBIT = you owe/are billed, CREDIT = you are paid"),
      occurredAt: z.string().datetime().describe("Invoice date ISO"),
      dueAt: z.string().datetime().optional().describe("Due date ISO, creates Reminder if set"),
      invoiceUrl: z.string().url().optional().describe("Link to invoice PDF/Drive"),
    }),
    handler: async (args, { db, ctx }) => {
      let orgId = args.organizationId
      if (!orgId && args.clientName) {
        const { organization } = await resolveOrganization(db, ctx, args.clientName)
        orgId = organization.id
      }
      const { recordTransaction } = await import("@/lib/domain/finance")
      const { transaction } = await recordTransaction(db, ctx, {
        description: args.title,
        amountMinor: BigInt(args.amountMinor),
        direction: args.direction as never,
        occurredAt: new Date(args.occurredAt),
        currency: args.currency,
        organizationId: orgId,
        category: "BUSINESS",
        externalRef: `invoice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      })
      // Optional invoice link
      if (args.invoiceUrl) {
        const link = await db.linkResource.create({
          data: { url: args.invoiceUrl, title: `${args.title} — Invoice`, summary: `Invoice for ${args.clientName ?? orgId ?? ""}` } as never,
        })
        await db.entityLink
          .create({
            data: { fromType: "TRANSACTION", fromId: transaction.id, toType: "LINK", toId: link.id, relation: "RELATED_TO", createdBy: "AGENT" } as never,
          })
          .catch(() => {})
      }
      // Optional due reminder via central engine
      let reminder: { id: string } | null = null
      if (args.dueAt) {
        const r = await scheduleReminder(db, ctx, {
          title: `Invoice due: ${args.title}`,
          body: `Invoice ${args.title} due ${new Date(args.dueAt).toLocaleDateString("en-IN")}`,
          remindAt: new Date(new Date(args.dueAt).getTime() - 24 * 60 * 60 * 1000),
        })
        reminder = { id: r.id }
        await db.entityLink
          .create({
            data: { fromType: "TRANSACTION", fromId: transaction.id, toType: "REMINDER", toId: r.id, relation: "REQUIRES", createdBy: "AGENT" } as never,
          })
          .catch(() => {})
      }
      return { id: transaction.id, amountMinor: Number(transaction.amountMinor), currency: transaction.currency, reminder }
    },
  }),

  defineTool({
    name: "search_invoices",
    description: "Search invoices/receipts (transactions with invoice/business category, or linked docs). Use for 'what invoices are overdue?'.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      direction: z.enum(["DEBIT", "CREDIT"]).optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db }) => {
      const where: Record<string, unknown> = {}
      if (args.direction) where.direction = args.direction
      if (args.query) {
        where.OR = [
          { description: { contains: args.query, mode: "insensitive" } },
          { category: { contains: args.query, mode: "insensitive" } },
        ]
      } else {
        // Default: business/invoice-like categories
        where.category = { in: ["BUSINESS", "BILLS", "UNKNOWN"] }
      }
      const rows = await db.transaction.findMany({
        where: where as never,
        orderBy: { occurredAt: "desc" },
        take: args.limit,
        select: { id: true, description: true, amountMinor: true, currency: true, direction: true, occurredAt: true, category: true, organizationId: true },
      })
      return rows.map((r) => ({
        id: r.id,
        title: r.description,
        amountMinor: Number(r.amountMinor),
        currency: r.currency,
        direction: r.direction,
        occurredAt: r.occurredAt.toISOString(),
        category: r.category,
        organizationId: r.organizationId,
      }))
    },
  }),

  defineTool({
    name: "create_reminder",
    description: "Schedule a reminder, optionally attached to a task. Uses central Reminder Engine with suppression rules.",
    risk: "SAFE",
    input: z.object({
      title: z.string().min(1).max(200),
      body: z.string().max(1000).optional(),
      remindAt: z.string().datetime(),
      taskId: z.string().optional(),
      recurrence: z.string().max(200).optional().describe("RRULE string for repeating reminders"),
    }),
    handler: async (args, { db, ctx }) => {
      const reminder = await scheduleReminder(db, ctx, {
        title: args.title,
        body: args.body,
        remindAt: new Date(args.remindAt),
        taskId: args.taskId,
        recurrence: args.recurrence,
      })
      return { id: reminder.id, remindAt: reminder.remindAt }
    },
  }),

  defineTool({
    name: "complete_task",
    description: "Mark a task as done. Idempotent — completing an already done task is a no-op.",
    risk: "SAFE",
    input: z.object({ taskId: z.string().min(1) }),
    handler: async (args, { db, ctx }) => {
      const task = await updateTask(db, ctx, args.taskId, { status: "DONE" })
      await invalidateContextPack(db, args.taskId)
      return { id: task.id, status: task.status, title: task.title }
    },
  }),

  defineTool({
    name: "delete_task",
    description: "Delete a task and its checklist. Cannot be undone via the Assistant — the Activity page records it.",
    risk: "SENSITIVE",
    input: z.object({ taskId: z.string().min(1) }),
    handler: async (args, { db, ctx }) => deleteTask(db, ctx, args.taskId),
  }),

  defineTool({
    name: "get_project_context",
    description: "Project context: milestone, deliverables velocity, open vs done, client, and upcoming deadlines.",
    risk: "SAFE",
    input: z.object({
      projectId: z.string().optional(),
      slug: z.string().optional(),
      query: z.string().optional().describe("Project name fallback if id/slug omitted"),
    }),
    handler: async (args, { db }) => {
      if (args.projectId || args.slug) {
        const project = await db.project.findFirst({
          where: args.projectId ? { id: args.projectId } : { slug: args.slug! },
          include: { organization: { select: { name: true, slug: true } }, tasks: { select: { id: true, title: true, status: true, dueAt: true } } },
        })
        if (!project) throw new Error("Project not found")
        const total = project.tasks.length
        const done = project.tasks.filter((t) => t.status === "DONE").length
        return {
          id: project.id,
          name: project.name,
          slug: project.slug,
          status: project.status,
          organization: project.organization,
          totalTasks: total,
          doneTasks: done,
          progress: total === 0 ? 0 : Math.round((done / total) * 100),
          tasks: project.tasks.slice(0, 20),
        }
      }
      // Fallback: ranked search via projectsWithProgress
      const projects = await projectsWithProgress(db)
      if (args.query) {
        const q = args.query.toLowerCase()
        const filtered = projects.filter((p) => p.name.toLowerCase().includes(q))
        return filtered.slice(0, 10)
      }
      return projects.slice(0, 10)
    },
  }),

  // ---------------------------------------------------------------------------
  // Calendar — two-way sync (PRD §11)
  // ---------------------------------------------------------------------------

  defineTool({
    name: "search_calendar",
    description: "Search calendar events by text or time window. Use for meetings, deadlines, client check-ins.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      from: z.string().datetime().optional().describe("ISO start of window"),
      to: z.string().datetime().optional().describe("ISO end of window"),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db }) => {
      const where: Record<string, unknown> = {}
      if (args.query) where.title = { contains: args.query, mode: "insensitive" }
      if (args.from || args.to) {
        where.startsAt = {
          ...(args.from ? { gte: new Date(args.from) } : {}),
          ...(args.to ? { lte: new Date(args.to) } : {}),
        } as unknown
      }
      const events = await db.calendarEvent.findMany({
        where: where as never,
        orderBy: { startsAt: "asc" },
        take: args.limit,
        include: { project: { select: { name: true, slug: true } } },
      })
      return events.map((e) => ({
        id: e.id,
        title: e.title,
        location: e.location,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt.toISOString(),
        allDay: e.allDay,
        project: e.project,
      }))
    },
  }),

  defineTool({
    name: "create_calendar_event",
    description: "Create a calendar event / meeting, optionally linked to a project.",
    risk: "CONFIRM",
    input: z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      location: z.string().max(500).optional(),
      startsAt: z.string().datetime(),
      endsAt: z.string().datetime(),
      allDay: z.boolean().default(false),
      projectId: z.string().optional(),
    }),
    handler: async (args, { db, ctx }) => {
      const event = await db.calendarEvent.create({
        data: {
          title: args.title,
          location: args.location,
          startsAt: new Date(args.startsAt),
          endsAt: new Date(args.endsAt),
          allDay: args.allDay,
          projectId: args.projectId,
        } as never,
      })
      await logActivity(db, {
        action: "calendar.created",
        summary: `Created calendar event "${event.title}"`,
        userId: ctx.userId,
        actorType: ctx.actorType ?? "AGENT",
        actorId: ctx.agent,
        targetType: "CALENDAR_EVENT",
        targetId: event.id,
      } as never).catch(() => {})
      return { id: event.id, title: event.title, startsAt: event.startsAt.toISOString() }
    },
  }),

  defineTool({
    name: "update_calendar_event",
    description: "Update a calendar event's time, title, or location.",
    risk: "CONFIRM",
    input: z.object({
      id: z.string().min(1),
      title: z.string().max(200).optional(),
      location: z.string().max(500).nullable().optional(),
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().optional(),
      allDay: z.boolean().optional(),
    }),
    handler: async (args, { db }) => {
      const data: Record<string, unknown> = {}
      if (args.title !== undefined) data.title = args.title
      if (args.location !== undefined) data.location = args.location
      if (args.startsAt !== undefined) data.startsAt = new Date(args.startsAt)
      if (args.endsAt !== undefined) data.endsAt = new Date(args.endsAt)
      if (args.allDay !== undefined) data.allDay = args.allDay
      const updated = await db.calendarEvent.update({ where: { id: args.id }, data: data as never })
      return { id: updated.id, title: updated.title }
    },
  }),

  // ---------------------------------------------------------------------------
  // Drive / Files / Documents — universal knowledge index
  // ---------------------------------------------------------------------------

  defineTool({
    name: "search_drive",
    description: "Search Google Drive files and local FileObjects by name or mimeType. Also falls back to workspace file index.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      mimeType: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db }) => {
      const where: Record<string, unknown> = {}
      if (args.query) where.name = { contains: args.query, mode: "insensitive" }
      if (args.mimeType) where.mimeType = { contains: args.mimeType, mode: "insensitive" }
      const files = await db.fileObject.findMany({
        where: where as never,
        orderBy: { createdAt: "desc" },
        take: args.limit,
        select: { id: true, name: true, mimeType: true, sizeBytes: true, storageKey: true, createdAt: true, sourceType: true },
      })
      // If nothing local but Drive is connected, note that live Drive search is via integration
      return files.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        createdAt: f.createdAt.toISOString(),
        sourceType: f.sourceType,
      }))
    },
  }),

  defineTool({
    name: "get_drive_file",
    description: "Get a single file's metadata and storage pointer (Drive or local).",
    risk: "SAFE",
    input: z.object({ fileId: z.string().min(1) }),
    handler: async (args, { db }) => {
      const file = await db.fileObject.findUnique({ where: { id: args.fileId } })
      if (!file) throw new Error("File not found")
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        storageKey: file.storageKey,
        createdAt: file.createdAt.toISOString(),
        sourceType: file.sourceType,
        checksum: file.checksum,
      }
    },
  }),

  defineTool({
    name: "search_documents",
    description: "Search documents (parsed PDFs, briefs) by title or content. Use when user asks for a doc, sheet, or brief.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db }) => {
      const where: Record<string, unknown> = {}
      if (args.query) {
        where.OR = [
          { title: { contains: args.query, mode: "insensitive" } },
          { content: { contains: args.query, mode: "insensitive" } },
          { summary: { contains: args.query, mode: "insensitive" } },
        ]
      }
      const docs = await db.document.findMany({
        where: where as never,
        orderBy: { updatedAt: "desc" },
        take: args.limit,
        select: { id: true, title: true, summary: true, fileId: true, createdAt: true },
      })
      return docs
    },
  }),

  defineTool({
    name: "search_all",
    description:
      "Universal resolver: find everything related to a name across tasks, projects, clients, files, documents, subscriptions via the SearchDocument index. Use for 'find everything related to Karna Kreative' / 'find everything related to Contabo'.",
    risk: "SAFE",
    input: z.object({
      query: z.string().min(1).max(200),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db, ctx }) => {
      const hits = await searchIndex(ctx.tenantId, args.query, { limit: args.limit })
      return hits.map((h) => ({ entityType: h.entityType, entityId: h.entityId, title: h.title, href: h.href, score: h.score }))
    },
  }),

  defineTool({
    name: "create_notification",
    description: "Create a central notification (Reminder/Notification Engine). All modules publish events here; prevents duplicate notifications.",
    risk: "SAFE",
    input: z.object({
      title: z.string().min(1).max(200),
      body: z.string().max(2000).optional(),
      level: z.enum(["INFO", "REMINDER", "IMPORTANT", "URGENT", "APPROVAL_REQUIRED"]).default("INFO"),
      href: z.string().max(500).optional().describe("In-app deep link e.g. /w/acme/tasks/abc"),
    }),
    handler: async (args, { db }) => {
      const n = await db.notification.create({
        data: {
          title: args.title,
          body: args.body,
          level: args.level as never,
          href: args.href,
        } as never,
      })
      return { id: n.id, title: n.title }
    },
  }),

  // Planning aliases — registry expects these names, map to existing domain logic
  defineTool({
    name: "get_context_pack",
    description: "Alias for get_task_context — everything needed to do a task.",
    risk: "SAFE",
    input: z.object({ taskId: z.string().min(1) }),
    handler: async (args, { db }) => getContextPack(db, args.taskId),
  }),

  defineTool({
    name: "recommend_next_action",
    description: "Alias for next_best_action — single task to do now.",
    risk: "SAFE",
    input: z.object({}),
    handler: async (_args, { db }) => nextBestAction(db),
  }),

  defineTool({
    name: "explain_claim",
    description: "Alias for explain_value — why the system believes a fact.",
    risk: "SAFE",
    input: z.object({
      entityType: z.enum(["TASK", "PROJECT", "ORGANIZATION"]),
      entityId: z.string().min(1),
    }),
    handler: async (args, { db }) => {
      const records = await explain(db, args.entityType, args.entityId)
      return records.map((r) => ({ field: r.field, kind: r.kind, value: r.value, confidence: r.confidence, source: r.sourceType, evidence: r.evidence, agent: r.agent }))
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

  // ---------------------------------------------------------------------------
  // Subscriptions — universal control plane (operational.txt §2, §12, §14)
  // ---------------------------------------------------------------------------

  defineTool({
    name: "create_subscription",
    description:
      "Create or update a subscription (idempotent). Handles provider, service, billing frequency, payment day, amount, currency, billing URL, and automatically creates payment schedule + reminder + notification. Use for: 'Add Contabo monthly on the 8th with https://...', 'Track Adobe subscription', 'I pay Contabo every month'.",
    risk: "SAFE",
    input: z.object({
      provider: z.string().min(1).max(120).describe("Provider/merchant name, e.g. Contabo, Adobe, Notion"),
      service: z.string().max(120).optional().describe("Service name, e.g. Server, Creative Cloud"),
      amountMinor: z.number().int().min(0).optional().describe("Amount in minor units (paise/cents). 0 if unknown"),
      currency: z.string().max(10).default("INR").describe("Currency code, default INR"),
      frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY").describe("Billing frequency"),
      paymentDay: z.number().int().min(1).max(31).optional().describe("Day of month for monthly billing (1-31), e.g. 8 for 8th"),
      billingUrl: z.string().url().optional().describe("Billing portal URL"),
      category: z.string().max(60).optional().describe("Category, e.g. Hosting, Software"),
      remindDaysBefore: z.number().int().min(1).max(30).default(1).describe("Days before payment to remind, e.g. 3 for '3 days before'"),
    }),
    handler: async (args, { db, ctx }) => {
      const result = await createOrUpdateSubscription(db, ctx, {
        provider: args.provider,
        service: args.service,
        amountMinor: args.amountMinor,
        currency: args.currency,
        frequency: args.frequency,
        paymentDay: args.paymentDay,
        billingUrl: args.billingUrl,
        category: args.category,
        remindDaysBefore: args.remindDaysBefore,
      })
      return result
    },
  }),

  defineTool({
    name: "search_subscriptions",
    description: "Search subscriptions by provider or name. Use for 'what subscriptions are due next week?', 'show my Adobe subscription'.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional().describe("Search text for provider/name"),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db }) => {
      const rows = await searchSubscriptions(db, args.query)
      return rows.slice(0, args.limit).map((s) => ({
        id: s.id,
        name: s.name,
        vendor: s.vendor,
        amountMinor: Number(s.amountMinor),
        currency: s.currency,
        cycle: s.cycle,
        nextDueAt: s.nextDueAt?.toISOString() ?? null,
        active: s.active,
      }))
    },
  }),

  defineTool({
    name: "get_subscription",
    description: "Get a single subscription by id with full details and billing link if any.",
    risk: "SAFE",
    input: z.object({ id: z.string().min(1) }),
    handler: async (args, { db }) => {
      const sub = await getSubscription(db, args.id)
      if (!sub) throw new Error("Subscription not found")
      // Find linked billing URL via EntityLink -> LinkResource
      let billingUrl: string | null = null
      try {
        const link = await db.entityLink.findFirst({
          where: { fromType: "SUBSCRIPTION", fromId: sub.id, toType: "LINK" as any },
        } as never)
        if (link) {
          const res = await db.linkResource.findUnique({ where: { id: (link as any).toId } })
          billingUrl = (res as any)?.url ?? null
        }
      } catch {}
      return {
        id: sub.id,
        name: sub.name,
        vendor: sub.vendor,
        amountMinor: Number(sub.amountMinor),
        currency: sub.currency,
        cycle: sub.cycle,
        nextDueAt: sub.nextDueAt?.toISOString() ?? null,
        active: sub.active,
        billingUrl,
      }
    },
  }),

  defineTool({
    name: "update_subscription",
    description: "Update a subscription's amount, cycle, nextDueAt, active status, or billing URL. Idempotent.",
    risk: "SAFE",
    input: z.object({
      id: z.string().min(1),
      name: z.string().max(120).optional(),
      vendor: z.string().max(120).optional(),
      amountMinor: z.number().int().min(0).optional(),
      currency: z.string().max(10).optional(),
      cycle: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
      nextDueAt: z.string().datetime().nullable().optional(),
      active: z.boolean().optional(),
      billingUrl: z.string().url().optional(),
    }),
    handler: async (args, { db, ctx }) => {
      const { id, ...patch } = args
      const updated = await updateSubscription(db, ctx, id, patch)
      return {
        id: updated.id,
        name: updated.name,
        vendor: updated.vendor,
        cycle: updated.cycle,
        nextDueAt: updated.nextDueAt?.toISOString() ?? null,
        active: updated.active,
      }
    },
  }),

  defineTool({
    name: "cancel_subscription",
    description: "Cancel/pause a subscription. Sets active=false and cancels scheduled reminders.",
    risk: "SAFE",
    input: z.object({ id: z.string().min(1) }),
    handler: async (args, { db, ctx }) => {
      const updated = await cancelSubscription(db, ctx, args.id)
      return { id: updated.id, active: updated.active }
    },
  }),

  defineTool({
    name: "pause_subscription",
    description: "Pause a subscription (alias for cancel).",
    risk: "SAFE",
    input: z.object({ id: z.string().min(1) }),
    handler: async (args, { db, ctx }) => {
      const updated = await cancelSubscription(db, ctx, args.id)
      return { id: updated.id, active: updated.active }
    },
  }),

  // Alias: search_document → search_documents (registry expects search_document)
  defineTool({
    name: "search_document",
    description: "Alias for search_documents — search parsed briefs/docs.",
    risk: "SAFE",
    input: z.object({
      query: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    handler: async (args, { db }) => {
      const where: Record<string, unknown> = {}
      if (args.query) {
        where.OR = [
          { title: { contains: args.query, mode: "insensitive" } },
          { content: { contains: args.query, mode: "insensitive" } },
          { summary: { contains: args.query, mode: "insensitive" } },
        ]
      }
      const docs = await db.document.findMany({
        where: where as never,
        orderBy: { updatedAt: "desc" },
        take: args.limit,
        select: { id: true, title: true, summary: true, fileId: true, createdAt: true },
      })
      return docs
    },
  }),

  defineTool({
    name: "update_settings",
    description:
      "Update workspace settings (timezone, currency, dateFormat, landingPage, accent, density, theme, aiModel, sound/quiet hours). Universal control plane for Settings module — every setting operable via Assistant. Use for 'change my timezone to IST', 'set currency to USD', 'use dark theme'.",
    risk: "SAFE",
    input: z.object({
      displayName: z.string().max(80).optional(),
      timezone: z.string().max(80).optional(),
      currency: z.string().max(20).optional(),
      dateFormat: z.string().max(20).optional(),
      landingPage: z.string().max(60).optional(),
      accent: z.string().max(20).optional(),
      density: z.enum(["comfortable", "compact"]).optional(),
      theme: z.enum(["dark", "light", "system"]).optional(),
      selectedModel: z.string().max(80).optional(),
      soundEnabled: z.boolean().optional(),
      quietHoursEnabled: z.boolean().optional(),
    }),
    handler: async (args, { db, ctx }) => {
      const { updateWorkspaceSettings, getWorkspaceSettings } = await import("@/lib/domain/settings")
      const updated = await updateWorkspaceSettings(db, ctx, args as never)
      const userRow = ctx.userId ? await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true, timezone: true } }).catch(() => null) : null
      return { settings: updated, user: userRow }
    },
  }),

  defineTool({
    name: "get_settings",
    description: "Read current workspace settings (timezone, currency, theme, ai model, sound). Use before updating to show current values.",
    risk: "SAFE",
    input: z.object({}),
    handler: async (_args, { db, ctx }) => {
      const { getWorkspaceSettings } = await import("@/lib/domain/settings")
      const userRow = ctx.userId ? await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true, timezone: true } }).catch(() => null) : null
      const settings = await getWorkspaceSettings(db, userRow ? { name: userRow.name, timezone: userRow.timezone } : undefined)
      return settings
    },
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
