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
 * `needsApproval` mirrors the risk class in `lib/agents/tools.ts`: anything
 * that leaves the system or destroys data stops for a human.
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
// Changing and destroying — these stop for a human
// ---------------------------------------------------------------------------

export const updateTaskDef = toolDefinition({
  name: "update_task",
  description:
    "Change a task's status, priority, deadline or what it is waiting on. Moving a deadline reshapes the user's plan, so this is confirmed before it runs.",
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
  needsApproval: true,
})

export const deleteTaskDef = toolDefinition({
  name: "delete_task",
  description: "Permanently delete a task. This cannot be undone.",
  inputSchema: z.object({ taskId: z.string() }),
  outputSchema: z.object({ deleted: z.string() }),
  needsApproval: true,
})

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
