import { toolDefinition } from "@tanstack/ai"
import { z } from "zod"

/**
 * Isomorphic tool definitions.
 *
 * One declaration is imported by both sides: the server attaches `.server()`
 * implementations, the browser attaches `.client()` ones, and the schemas that
 * describe them to the model are the same object. Nothing here imports the
 * database or a provider SDK, which is what lets this file cross the wire.
 *
 * `needsApproval` mirrors the risk class in `lib/agents/tools.ts`. Only one
 * tool carries it: nothing here can delete, so reading, creating and editing
 * all run uninterrupted, and the single stop is mail leaving for someone else.
 */

const taskSummary = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  dueAt: z.string().nullable(),
})

// ---------------------------------------------------------------------------
// Reading — safe, runs without interruption
// ---------------------------------------------------------------------------

export const getAgendaDef = toolDefinition({
  name: "get_agenda",
  description:
    "What needs attention right now: overdue, due today, due soon, waiting on someone, and in progress. Use this for questions about the day, the week, or what is left.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    overdue: z.array(taskSummary),
    dueToday: z.array(taskSummary),
    dueSoon: z.array(taskSummary),
    waiting: z.array(taskSummary),
    inProgress: z.array(taskSummary),
    completedRecently: z.number(),
  }),
})

export const nextBestActionDef = toolDefinition({
  name: "next_best_action",
  description:
    "The single task the user should do next, with the reasons behind the recommendation. Never returns a task that is blocked or waiting on someone else.",
  inputSchema: z.object({}),
  outputSchema: z
    .object({
      id: z.string(),
      title: z.string(),
      score: z.number(),
      reasons: z.array(z.string()),
    })
    .nullable(),
})

export const searchTasksDef = toolDefinition({
  name: "search_tasks",
  description:
    "Find tasks by text or status, ranked by what to do first. Use when the user names a piece of work rather than asking about their day.",
  inputSchema: z.object({
    query: z.string().optional().meta({ description: "Words from the task title" }),
    status: z
      .enum(["BACKLOG", "TODO", "IN_PROGRESS", "WAITING", "BLOCKED", "DONE"])
      .optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({ tasks: z.array(taskSummary) }),
})

export const getTaskContextDef = toolDefinition({
  name: "get_task_context",
  description:
    "Everything needed to actually start a task: the original brief, the client, required assets, checklist, sibling tasks and previous work for the same client.",
  inputSchema: z.object({ taskId: z.string().meta({ description: "Task id" }) }),
  outputSchema: z.object({ pack: z.unknown().nullable() }),
})

export const explainValueDef = toolDefinition({
  name: "explain_value",
  description:
    "Why the system believes something about a record — the source, the quoted evidence and the confidence. Use when the user asks where a deadline or detail came from.",
  inputSchema: z.object({
    entityType: z.enum(["TASK", "PROJECT", "ORGANIZATION"]),
    entityId: z.string(),
  }),
  outputSchema: z.object({
    records: z.array(
      z.object({
        field: z.string().nullable(),
        kind: z.string(),
        confidence: z.number().nullable(),
        source: z.string(),
        evidence: z.string().nullable(),
      })
    ),
  }),
})

export const searchEmailsDef = toolDefinition({
  name: "search_emails",
  description:
    "Search received emails, invoices, bank statement alerts, client briefs, and newsletters in the workspace.",
  inputSchema: z.object({
    query: z.string().optional().describe("Keywords from subject, body or snippet"),
    from: z.string().optional().describe("Sender email address or company domain"),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    emails: z.array(
      z.object({
        subject: z.string(),
        from: z.string(),
        snippet: z.string(),
        receivedAt: z.string(),
      })
    ),
  }),
})

export const syncEmailsDef = toolDefinition({
  name: "sync_emails",
  description:
    "Fetch and synchronize the latest emails directly from connected Gmail/Google accounts into the workspace.",
  inputSchema: z.object({
    query: z.string().optional().describe("Optional filter query to search immediately after syncing"),
    from: z.string().optional().describe("Optional sender filter"),
  }),
  outputSchema: z.object({
    status: z.string(),
    message: z.string().optional(),
    fetched: z.number().optional(),
    ingested: z.number().optional(),
    emails: z.array(
      z.object({
        subject: z.string(),
        from: z.string(),
        snippet: z.string(),
        receivedAt: z.string(),
      })
    ),
  }),
})

// ---------------------------------------------------------------------------
// Creating — additive and easily undone, so no interruption
// ---------------------------------------------------------------------------

export const createTaskDef = toolDefinition({
  name: "create_task",
  description: "Create a task, optionally inside a project and with a deadline.",
  inputSchema: z.object({
    title: z.string().min(1).max(300),
    description: z.string().max(4000).optional(),
    projectId: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    dueAt: z
      .string()
      .datetime()
      .nullable()
      .default(null)
      .meta({ description: "ISO 8601 timestamp, or null" }),
  }),
  outputSchema: z.object({ id: z.string(), title: z.string() }),
})

export const createReminderDef = toolDefinition({
  name: "create_reminder",
  description: "Schedule a reminder, optionally attached to a task.",
  inputSchema: z.object({
    title: z.string().min(1).max(200),
    body: z.string().max(1000).optional(),
    remindAt: z.string().datetime(),
    taskId: z.string().optional(),
  }),
  outputSchema: z.object({ id: z.string(), remindAt: z.string() }),
})

export const createProjectDef = toolDefinition({
  name: "create_project",
  description: "Create a project, optionally attached to a client.",
  inputSchema: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    organizationId: z.string().optional(),
  }),
  outputSchema: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
})

export const createOrganizationDef = toolDefinition({
  name: "create_organization",
  description: "Add a client, vendor or partner.",
  inputSchema: z.object({
    name: z.string().min(1).max(120),
    kind: z.enum(["CLIENT", "VENDOR", "PARTNER", "EMPLOYER", "OTHER"]).default("CLIENT"),
  }),
  outputSchema: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
})

export const searchOrganizationsDef = toolDefinition({
  name: "search_organizations",
  description: "Search clients/vendors by name.",
  inputSchema: z.object({
    query: z.string().optional(),
    kind: z.enum(["CLIENT", "VENDOR", "PARTNER", "EMPLOYER", "OTHER"]).optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    organizations: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string(), kind: z.string() })),
  }),
})

export const createBrandDef = toolDefinition({
  name: "create_brand",
  description: "Create a brand/account under a client (e.g. WOW Indian under Karna Kreative).",
  inputSchema: z.object({
    organizationId: z.string().min(1),
    name: z.string().min(1).max(120),
    website: z.string().optional(),
    industry: z.string().max(60).optional(),
    color: z.string().max(20).optional(),
    notes: z.string().max(1000).optional(),
  }),
  outputSchema: z.object({ id: z.string(), name: z.string(), slug: z.string(), organizationId: z.string() }),
})

export const searchBrandsDef = toolDefinition({
  name: "search_brands",
  description: "Search brands/accounts by name or organization.",
  inputSchema: z.object({
    query: z.string().optional(),
    organizationId: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    brands: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string(), organizationId: z.string() }).passthrough()),
  }),
})

export const createCommitmentDef = toolDefinition({
  name: "create_commitment",
  description: "Create a recurring commitment (e.g. 3 reels every week for WOW Indian). Auto-generates tasks.",
  inputSchema: z.object({
    organizationId: z.string().min(1),
    brandId: z.string().optional(),
    title: z.string().min(1).max(200),
    deliverableType: z.enum(["REEL", "POST", "SHORT", "STORY", "REPORT", "DESIGN", "NEWSLETTER", "CUSTOM"]).default("REEL"),
    quantity: z.number().int().min(1).max(100).default(1),
    frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY"]).default("WEEKLY"),
    dueDayOfWeek: z.number().int().min(0).max(6).default(5),
    estimatedMinutes: z.number().int().min(5).max(480).default(45),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("HIGH"),
    description: z.string().max(1000).optional(),
  }),
  outputSchema: z.object({ id: z.string(), title: z.string(), frequency: z.string(), quantity: z.number(), isNew: z.boolean() }),
})

export const searchCommitmentsDef = toolDefinition({
  name: "search_commitments",
  description: "Search recurring commitments by client/brand/title.",
  inputSchema: z.object({
    query: z.string().optional(),
    organizationId: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    commitments: z.array(z.object({ id: z.string(), title: z.string(), frequency: z.string(), quantity: z.number() }).passthrough()),
  }),
})

export const ensureCommitmentDef = toolDefinition({
  name: "ensure_commitment",
  description: "Ensure Client → Brand → Recurring Commitment chain exists (idempotent). Use for 'Karna sends 3 reels every week for WOW Indian'.",
  inputSchema: z.object({
    clientName: z.string().min(1).max(120),
    brandName: z.string().max(120).optional(),
    title: z.string().min(1).max(200).default("Reels"),
    deliverableType: z.enum(["REEL", "POST", "SHORT", "STORY", "REPORT", "DESIGN", "NEWSLETTER", "CUSTOM"]).default("REEL"),
    quantity: z.number().int().min(1).max(100).default(1),
    frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY"]).default("WEEKLY"),
    dueDayOfWeek: z.number().int().min(0).max(6).default(5),
  }),
  outputSchema: z.object({
    organization: z.object({ id: z.string(), name: z.string() }),
    brand: z.object({ id: z.string(), name: z.string() }).nullable(),
    commitment: z.object({ id: z.string(), title: z.string(), isNew: z.boolean() }),
  }),
})

export const createInvoiceDef = toolDefinition({
  name: "create_invoice",
  description: "Create an invoice/financial obligation linked to a client.",
  inputSchema: z.object({
    organizationId: z.string().optional(),
    clientName: z.string().max(120).optional(),
    title: z.string().min(1).max(200),
    amountMinor: z.number().int().min(0),
    currency: z.string().max(10).default("INR"),
    direction: z.enum(["DEBIT", "CREDIT"]).default("DEBIT"),
    occurredAt: z.string().datetime(),
    dueAt: z.string().datetime().optional(),
    invoiceUrl: z.string().url().optional(),
  }),
  outputSchema: z.object({ id: z.string(), amountMinor: z.number(), currency: z.string() }),
})

export const searchInvoicesDef = toolDefinition({
  name: "search_invoices",
  description: "Search invoices/receipts (transactions). Use for 'what invoices are overdue?'",
  inputSchema: z.object({
    query: z.string().optional(),
    direction: z.enum(["DEBIT", "CREDIT"]).optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    invoices: z.array(z.object({ id: z.string(), title: z.string(), amountMinor: z.number(), currency: z.string() }).passthrough()),
  }),
})

export const updateSettingsDef = toolDefinition({
  name: "update_settings",
  description: "Update workspace settings (timezone, currency, theme, density, ai model, sound). Universal Settings control plane.",
  inputSchema: z.object({
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
  outputSchema: z.object({ settings: z.unknown(), user: z.unknown().nullable().optional() }),
})

export const getSettingsDef = toolDefinition({
  name: "get_settings",
  description: "Read current workspace settings.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    timezone: z.string(),
    currency: z.string(),
    dateFormat: z.string(),
    landingPage: z.string(),
    accent: z.string(),
    density: z.string(),
    theme: z.string(),
  }).passthrough(),
})

// ---------------------------------------------------------------------------
// Finance — read-only, and pre-formatted so the model never does arithmetic
// ---------------------------------------------------------------------------

export const spendingSummaryDef = toolDefinition({
  name: "spending_summary",
  description:
    "What was spent over a period, by category, with the change against the previous period. Amounts come back already formatted — report them exactly as given and never recompute or re-add them.",
  inputSchema: z.object({
    days: z.number().int().min(1).max(400).default(30),
  }),
  outputSchema: z.object({
    period: z.string(),
    spent: z.string(),
    earned: z.string(),
    net: z.string(),
    changeVsPreviousPercent: z.number().nullable(),
    byCategory: z.array(
      z.object({
        category: z.string(),
        amount: z.string(),
        share: z.number(),
      })
    ),
  }),
})

export const upcomingPaymentsDef = toolDefinition({
  name: "upcoming_payments",
  description:
    "Subscription payments expected soon, soonest first. Use for questions about bills or recurring charges coming up.",
  inputSchema: z.object({
    days: z.number().int().min(1).max(365).default(30),
  }),
  outputSchema: z.object({
    payments: z.array(
      z.object({
        name: z.string(),
        amount: z.string(),
        cycle: z.string(),
        dueAt: z.string(),
        daysAway: z.number(),
      })
    ),
  }),
})

// ---------------------------------------------------------------------------
// Subscriptions — universal control plane (operational.txt §15)
// ---------------------------------------------------------------------------

export const createSubscriptionDef = toolDefinition({
  name: "create_subscription",
  description:
    "Create or update a subscription (idempotent). Provider + frequency + payment day + billing URL → Subscription + payment schedule + reminder + notification. E.g. 'Add Contabo monthly on the 8th with https://...'",
  inputSchema: z.object({
    provider: z.string().min(1).max(120),
    service: z.string().max(120).optional(),
    amountMinor: z.number().int().min(0).optional(),
    currency: z.string().max(10).default("INR"),
    frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
    paymentDay: z.number().int().min(1).max(31).optional(),
    billingUrl: z.string().url().optional(),
    category: z.string().max(60).optional(),
    remindDaysBefore: z.number().int().min(1).max(30).default(1),
  }),
  outputSchema: z.object({
    subscription: z.object({
      id: z.string(),
      name: z.string(),
      vendor: z.string().nullable(),
      cycle: z.string(),
      nextDueAt: z.string().nullable(),
    }),
    reminder: z.object({ id: z.string(), remindAt: z.string() }).nullable().optional(),
    notification: z.object({ id: z.string() }).nullable().optional(),
    isNew: z.boolean(),
    message: z.string(),
  }),
})

export const searchSubscriptionsDef = toolDefinition({
  name: "search_subscriptions",
  description: "Search subscriptions by provider or name. Use for 'what subscriptions are due?'",
  inputSchema: z.object({
    query: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    subscriptions: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        vendor: z.string().nullable(),
        amountMinor: z.number(),
        currency: z.string(),
        cycle: z.string(),
        nextDueAt: z.string().nullable(),
        active: z.boolean(),
      }),
    ),
  }),
})

export const getSubscriptionDef = toolDefinition({
  name: "get_subscription",
  description: "Get a single subscription by id with billing link.",
  inputSchema: z.object({ id: z.string().min(1) }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    vendor: z.string().nullable(),
    amountMinor: z.number(),
    currency: z.string(),
    cycle: z.string(),
    nextDueAt: z.string().nullable(),
    active: z.boolean(),
    billingUrl: z.string().nullable(),
  }),
})

export const updateSubscriptionDef = toolDefinition({
  name: "update_subscription",
  description: "Update a subscription's amount, cycle, nextDueAt, active status, or billing URL.",
  inputSchema: z.object({
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
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    vendor: z.string().nullable(),
    cycle: z.string(),
    nextDueAt: z.string().nullable(),
    active: z.boolean(),
  }),
})

export const cancelSubscriptionDef = toolDefinition({
  name: "cancel_subscription",
  description: "Cancel/pause a subscription. Sets active=false and cancels scheduled reminders.",
  inputSchema: z.object({ id: z.string().min(1) }),
  outputSchema: z.object({ id: z.string(), active: z.boolean() }),
})

export const pauseSubscriptionDef = toolDefinition({
  name: "pause_subscription",
  description: "Pause a subscription (alias for cancel).",
  inputSchema: z.object({ id: z.string().min(1) }),
  outputSchema: z.object({ id: z.string(), active: z.boolean() }),
})

// ---------------------------------------------------------------------------
// Editing — reversible, so it runs like creating does
// ---------------------------------------------------------------------------

export const updateTaskDef = toolDefinition({
  name: "update_task",
  description:
    "Change a task's status, priority, deadline or what it is waiting on. Reversible, so it runs without stopping — say what you changed afterwards.",
  inputSchema: z.object({
    taskId: z.string(),
    status: z
      .enum(["BACKLOG", "TODO", "IN_PROGRESS", "WAITING", "BLOCKED", "DONE", "CANCELLED"])
      .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    dueAt: z.string().datetime().nullable().optional(),
    waitingOn: z.string().max(300).nullable().optional(),
  }),
  outputSchema: z.object({ id: z.string(), status: z.string() }),
})

export const completeTaskDef = toolDefinition({
  name: "complete_task",
  description: "Mark a task as done. Idempotent.",
  inputSchema: z.object({ taskId: z.string().min(1) }),
  outputSchema: z.object({ id: z.string(), status: z.string(), title: z.string() }),
})

export const deleteTaskDef = toolDefinition({
  name: "delete_task",
  description: "Delete a task and its checklist. Requires approval.",
  inputSchema: z.object({ taskId: z.string().min(1) }),
  outputSchema: z.object({ deleted: z.string(), title: z.string() }),
  needsApproval: true,
})

export const getProjectContextDef = toolDefinition({
  name: "get_project_context",
  description: "Project context: milestone, deliverables velocity, progress, client, tasks.",
  inputSchema: z.object({
    projectId: z.string().optional(),
    slug: z.string().optional(),
    query: z.string().optional(),
  }),
  outputSchema: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    status: z.string().optional(),
    progress: z.number().optional(),
  }).passthrough(),
})

// ---------------------------------------------------------------------------
// Calendar — two-way sync
// ---------------------------------------------------------------------------

export const searchCalendarDef = toolDefinition({
  name: "search_calendar",
  description: "Search calendar events by text or time window.",
  inputSchema: z.object({
    query: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    events: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        location: z.string().nullable().optional(),
        startsAt: z.string(),
        endsAt: z.string(),
        allDay: z.boolean(),
      }),
    ),
  }),
})

export const createCalendarEventDef = toolDefinition({
  name: "create_calendar_event",
  description: "Create a calendar event / meeting, optionally linked to a project.",
  inputSchema: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    location: z.string().max(500).optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    allDay: z.boolean().default(false),
    projectId: z.string().optional(),
  }),
  outputSchema: z.object({ id: z.string(), title: z.string(), startsAt: z.string() }),
})

export const updateCalendarEventDef = toolDefinition({
  name: "update_calendar_event",
  description: "Update a calendar event's time, title, or location.",
  inputSchema: z.object({
    id: z.string().min(1),
    title: z.string().max(200).optional(),
    location: z.string().max(500).nullable().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    allDay: z.boolean().optional(),
  }),
  outputSchema: z.object({ id: z.string(), title: z.string() }),
})

// ---------------------------------------------------------------------------
// Drive / Files / Documents
// ---------------------------------------------------------------------------

export const searchDriveDef = toolDefinition({
  name: "search_drive",
  description: "Search Drive files and local FileObjects by name or mimeType.",
  inputSchema: z.object({
    query: z.string().optional(),
    mimeType: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    files: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().nullable().optional(),
        createdAt: z.string(),
        sourceType: z.string().optional(),
      }),
    ),
  }),
})

export const getDriveFileDef = toolDefinition({
  name: "get_drive_file",
  description: "Get a single file's metadata and storage pointer.",
  inputSchema: z.object({ fileId: z.string().min(1) }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number(),
    storageKey: z.string(),
    createdAt: z.string(),
  }).passthrough(),
})

export const searchDocumentsDef = toolDefinition({
  name: "search_documents",
  description: "Search documents (parsed PDFs, briefs) by title or content.",
  inputSchema: z.object({
    query: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    documents: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string().nullable().optional(),
        fileId: z.string().nullable().optional(),
        createdAt: z.string().optional(),
      }),
    ),
  }),
})

export const searchAllDef = toolDefinition({
  name: "search_all",
  description:
    "Universal resolver: find everything related to a name across tasks, projects, clients, files, documents, subscriptions via SearchDocument index.",
  inputSchema: z.object({
    query: z.string().min(1).max(200),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    hits: z.array(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
        title: z.string(),
        href: z.string().nullable(),
        score: z.number(),
      }),
    ),
  }),
})

export const createNotificationDef = toolDefinition({
  name: "create_notification",
  description: "Create a central notification via Notification Engine.",
  inputSchema: z.object({
    title: z.string().min(1).max(200),
    body: z.string().max(2000).optional(),
    level: z.enum(["INFO", "REMINDER", "IMPORTANT", "URGENT", "APPROVAL_REQUIRED"]).default("INFO"),
    href: z.string().max(500).optional(),
  }),
  outputSchema: z.object({ id: z.string(), title: z.string() }),
})

// Planning aliases

export const getContextPackDef = toolDefinition({
  name: "get_context_pack",
  description: "Alias for get_task_context — everything needed to do a task.",
  inputSchema: z.object({ taskId: z.string().min(1) }),
  outputSchema: z.object({ pack: z.unknown().nullable() }),
})

export const recommendNextActionDef = toolDefinition({
  name: "recommend_next_action",
  description: "Alias for next_best_action.",
  inputSchema: z.object({}),
  outputSchema: z
    .object({
      id: z.string(),
      title: z.string(),
      score: z.number(),
      reasons: z.array(z.string()),
    })
    .nullable(),
})

export const explainClaimDef = toolDefinition({
  name: "explain_claim",
  description: "Alias for explain_value.",
  inputSchema: z.object({
    entityType: z.enum(["TASK", "PROJECT", "ORGANIZATION"]),
    entityId: z.string().min(1),
  }),
  outputSchema: z.object({
    records: z.array(
      z.object({
        field: z.string().nullable(),
        kind: z.string(),
        confidence: z.number().nullable(),
        source: z.string(),
        evidence: z.string().nullable(),
      }),
    ),
  }),
})

export const searchDocumentDef = toolDefinition({
  name: "search_document",
  description: "Alias for search_documents.",
  inputSchema: z.object({
    query: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputSchema: z.object({
    documents: z.array(z.object({ id: z.string(), title: z.string() }).passthrough()),
  }),
})

// ---------------------------------------------------------------------------
// Leaving the system — the one thing that still stops for a human
//
// Deleting is not here, and not gated either: the agent has no destructive tool
// at all. Sending mail is different in kind — it is not a change to the user's
// own data that can be edited back, it is a message another person receives.
// ---------------------------------------------------------------------------

export const sendEmailDef = toolDefinition({
  name: "send_email",
  description: "Send an email on the user's behalf. Leaves the system and cannot be recalled.",
  inputSchema: z.object({
    to: z.email(),
    subject: z.string().min(1).max(300),
    body: z.string().min(1).max(20000),
  }),
  outputSchema: z.object({ success: z.boolean(), messageId: z.string() }),
  needsApproval: true,
})

// ---------------------------------------------------------------------------
// Memory — what survives the end of a conversation
// ---------------------------------------------------------------------------

const memoryKindEnum = z.enum([
  "PREFERENCE",
  "FACT",
  "PERSON",
  "ROUTINE",
  "PROJECT",
  "CONTEXT",
])

export const rememberDef = toolDefinition({
  name: "remember",
  description:
    "Save something about the user that should outlast this conversation: how they like work done, a standing constraint, who someone is, a routine. Reuse the same key to correct something you already believe — the old value is kept as history, never lost. Do not use this for anything another tool can look up on demand; a deadline lives on the task, not in memory.",
  inputSchema: z.object({
    key: z
      .string()
      .min(1)
      .max(80)
      .describe("Short stable slug identifying the fact, e.g. prefers-morning-edits"),
    value: z.string().min(1).max(2000).describe("The fact, written as a full sentence"),
    kind: memoryKindEnum.default("FACT"),
    pinned: z
      .boolean()
      .default(false)
      .describe("Set only for something that should always be in context"),
  }),
  outputSchema: z.object({
    key: z.string(),
    stored: z.boolean(),
    corrected: z.boolean(),
  }),
})

export const recallDef = toolDefinition({
  name: "recall",
  description:
    "Search what you already know about the user. The most-used memories are already in your system prompt, so reach for this only when you need something specific that is not there — an old preference, a person, a past decision.",
  inputSchema: z.object({
    query: z.string().optional().describe("Words to match against the memory"),
    kind: memoryKindEnum.optional(),
    limit: z.number().int().min(1).max(50).default(10),
  }),
  outputSchema: z.object({
    memories: z.array(
      z.object({
        key: z.string(),
        kind: z.string(),
        value: z.string(),
        pinned: z.boolean(),
        updatedAt: z.string(),
      })
    ),
  }),
})

// ---------------------------------------------------------------------------
// Documents that arrive as files or links
// ---------------------------------------------------------------------------

export const importBankStatementDef = toolDefinition({
  name: "import_bank_statement",
  description:
    "Get bank and card statements out of the user's mail and onto the ledger. Finds the message, pulls the attachment, unlocks it with what the vault knows, reads the transactions and imports them. Use this for any request to fetch, check, read or import a statement — it searches the workspace and then Gmail itself, so never answer that a statement is out of reach without calling it first. Call with apply=false unless the user plainly asked to import, report what was found, then call again with apply=true once they agree. Re-running is safe: transactions already on the ledger are skipped.",
  inputSchema: z.object({
    from: z
      .string()
      .optional()
      .describe("Sender address or bank domain, e.g. sbi.co.in or jiopaymentsbank"),
    query: z
      .string()
      .optional()
      .describe("Subject words, when the user named a particular statement"),
    days: z.number().int().min(1).max(400).default(120),
    apply: z
      .boolean()
      .default(false)
      .describe("false reports what was found and writes nothing; true imports"),
  }),
  outputSchema: z.object({
    status: z.enum([
      "IMPORTED",
      "PREVIEW",
      "LOCKED",
      "NOTHING_FOUND",
      "NOT_CONNECTED",
    ]),
    message: z.string(),
    searched: z.string(),
    emailsScanned: z.number(),
    imported: z.number().optional(),
    skippedDuplicates: z.number().optional(),
    statements: z.array(
      z.object({
        fileName: z.string(),
        bank: z.string(),
        unlockedWith: z.string().optional(),
        rowCount: z.number(),
        totalDebits: z.string(),
        totalCredits: z.string(),
        earliest: z.string().optional(),
        latest: z.string().optional(),
        sample: z.array(
          z.object({
            date: z.string(),
            description: z.string(),
            amount: z.string(),
            direction: z.string(),
            category: z.string(),
          })
        ),
      })
    ),
    unreadable: z.array(
      z.object({ fileName: z.string(), reason: z.string() })
    ),
  }),
})

export const jioBankStatementExtractorDef = toolDefinition({
  name: "jio_bank_statement_extractor",
  description:
    "Dedicated Jio Payments Bank statement extractor with OCR fallback. Use when import_bank_statement opens Jio PDFs but returns 'no transaction rows matched' or when the PDF is a scanned image. Handles Jio's 2-date (01-Jul-2026) + wrapped narration + 3-amount (WITHDRAWALS/DEPOSITS/CLOSING) table, tries vault passwords (GAUT0912 = NAME first 4 + DOB DDMM) with case-insensitive Jio label matching, and falls back to vision/LLM table extraction when the regex parser finds no rows. Always try import_bank_statement first; use this only for Jio layout failures or explicit Jio requests.",
  inputSchema: z.object({
    from: z
      .string()
      .optional()
      .default("estatements@jiopayments.bank.in")
      .describe("Sender address, default Jio Payments Bank"),
    query: z
      .string()
      .optional()
      .describe("Subject words, e.g. 'July 2026'"),
    days: z.number().int().min(1).max(400).default(180),
    apply: z
      .boolean()
      .default(false)
      .describe("false previews + OCR, true imports to ledger"),
    useOcr: z
      .boolean()
      .default(true)
      .describe("When true, uses vision OCR + LLM table parsing if regex finds 0 rows"),
  }),
  outputSchema: z.object({
    status: z.enum([
      "IMPORTED",
      "PREVIEW",
      "LOCKED",
      "NOTHING_FOUND",
      "NOT_CONNECTED",
      "OCR_FALLBACK",
    ]),
    message: z.string(),
    searched: z.string(),
    emailsScanned: z.number(),
    imported: z.number().optional(),
    skippedDuplicates: z.number().optional(),
    statements: z.array(
      z.object({
        fileName: z.string(),
        bank: z.string(),
        unlockedWith: z.string().optional(),
        rowCount: z.number(),
        totalDebits: z.string(),
        totalCredits: z.string(),
        earliest: z.string().optional(),
        latest: z.string().optional(),
        sample: z.array(
          z.object({
            date: z.string(),
            description: z.string(),
            amount: z.string(),
            direction: z.string(),
            category: z.string(),
          })
        ),
      })
    ),
    unreadable: z.array(z.object({ fileName: z.string(), reason: z.string() })),
    ocrUsed: z.boolean().optional(),
    ocrReason: z.string().optional(),
  }),
})

export const organizeSourcesDef = toolDefinition({
  name: "organize_sources",
  description:
    "Read a Google Sheet, Google Doc or link the user shared and work out what is in it — clients, brands, recurring deliverables, per-item requirements and the assets each one needs. Call with apply=false first: describe what you found, what already exists in the workspace, what is missing, and ask before creating anything. Call again with apply=true once they say go.",
  inputSchema: z.object({
    message: z
      .string()
      .optional()
      .describe("The user's message, if it contains the link or the brief itself"),
    sourceUrls: z.array(z.string()).optional().describe("Explicit links to read"),
    clientHint: z.string().optional().describe("Client name, when the user named one"),
    apply: z
      .boolean()
      .default(false)
      .describe("false returns the plan only; true creates the records"),
  }),
  outputSchema: z.object({
    status: z.enum(["APPLIED", "PREVIEW"]),
    plan: z.unknown(),
    report: z.string().optional(),
  }),
})

// ---------------------------------------------------------------------------
// Client-side tools — these run in the browser, not on the server
// ---------------------------------------------------------------------------

export const focusTaskDef = toolDefinition({
  name: "focus_task",
  description:
    "Bring a task into view for the user. Call this after recommending or changing something so they can see what you mean.",
  inputSchema: z.object({
    taskId: z.string(),
    reason: z.string().max(200).optional(),
  }),
  outputSchema: z.object({ focused: z.boolean() }),
})

export const confirmWithUserDef = toolDefinition({
  name: "confirm_with_user",
  description:
    "Ask the user a short yes/no question in the interface when an answer would change what you do next. Do not use this for questions you can answer from the tools.",
  inputSchema: z.object({ question: z.string().max(300) }),
  outputSchema: z.object({ answer: z.enum(["yes", "no", "dismissed"]) }),
})

/// Definitions the browser must also know about, so the client can run or
/// approve them. Passing the same array to `chat()` and `clientTools()` is what
/// keeps the two sides in agreement.
export const clientToolDefinitions = [focusTaskDef, confirmWithUserDef] as const
