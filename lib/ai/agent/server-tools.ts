import "server-only"

import type { ToolExecutionContext } from "@tanstack/ai"

import { executeTool } from "@/lib/agents/tools"
import {
  createProjectDef,
  createReminderDef,
  createTaskDef,
  explainValueDef,
  getAgendaDef,
  importBankStatementDef,
  getTaskContextDef,
  nextBestActionDef,
  organizeSourcesDef,
  recallDef,
  rememberDef,
  searchEmailsDef,
  syncEmailsDef,
  searchTasksDef,
  sendEmailDef,
  spendingSummaryDef,
  upcomingPaymentsDef,
  updateTaskDef,
} from "@/lib/ai/agent/definitions"
import type { AgentRuntimeContext } from "@/lib/ai/agent/runtime"
import type { importStatementsFromEmail } from "@/lib/domain/statement-import"

/**
 * Server implementations.
 *
 * Every one of these funnels through `executeTool()` rather than touching the
 * database, so the agent inherits the boundary that already exists: zod
 * validation, the risk gate, and an activity-log entry per invocation. Adding a
 * TanStack tool cannot accidentally open an unaudited path to the data.
 */

/// The framework wraps our runtime context alongside the tool-call id, abort
/// signal and custom-event emitter.
type ExecContext = ToolExecutionContext<AgentRuntimeContext>

function requireContext(execContext: ExecContext | undefined): AgentRuntimeContext {
  const runtime = execContext?.context

  if (!runtime?.db) {
    // Only reachable if a route forgets `chat({ context })`. Failing loudly
    // beats falling back to an unscoped handle.
    throw new Error(
      "Agent runtime context is missing. Pass { db, ctx } via chat({ context })."
    )
  }

  return runtime
}

/**
 * Runs a registry tool and unwraps the outcome for the model.
 *
 * `preApproved` is set for tools declared `needsApproval` — the client already
 * resolved that interrupt, so re-queuing an ApprovalRequest here would deadlock
 * the run against an approval nobody is waiting on.
 */
async function run(
  name: string,
  args: unknown,
  execContext: ExecContext | undefined,
  options: { preApproved?: boolean } = {}
) {
  const { db, ctx } = requireContext(execContext)
  const outcome = await executeTool(name, args, { db, ctx }, options)

  if (outcome.status === "ERROR") {
    // Thrown so the framework reports it as a failed tool call and the model
    // can recover, rather than reading an error object as a valid result.
    throw new Error(outcome.error)
  }

  if (outcome.status === "NEEDS_APPROVAL") {
    throw new Error(
      `"${name}" requires approval that was not granted before execution.`
    )
  }

  return outcome.result
}

// --- Reading ---------------------------------------------------------------

export const getAgenda = getAgendaDef.server<AgentRuntimeContext>(
  async (_args, context) => {
    const result = (await run("get_agenda", {}, context)) as Record<string, unknown>

    const summarise = (value: unknown) =>
      ((value as Array<{ id: string; title: string; dueAt: Date | null }>) ?? []).map(
        (task) => ({
          id: task.id,
          title: task.title,
          status: "OPEN",
          dueAt: task.dueAt ? new Date(task.dueAt).toISOString() : null,
        })
      )

    return {
      overdue: summarise(result.overdue),
      dueToday: summarise(result.dueToday),
      dueSoon: summarise(result.dueSoon),
      waiting: summarise(result.waiting),
      inProgress: summarise(result.inProgress),
      completedRecently: Number(result.completedRecently ?? 0),
    }
  }
)

export const nextBestAction = nextBestActionDef.server<AgentRuntimeContext>(
  async (_args, context) => {
    const result = (await run("next_best_action", {}, context)) as {
      id: string
      title: string
      score: number
      reasons: string[]
    } | null

    return result
      ? {
          id: result.id,
          title: result.title,
          score: result.score,
          reasons: result.reasons,
        }
      : null
  }
)

export const searchTasks = searchTasksDef.server<AgentRuntimeContext>(
  async (args, context) => {
    const result = (await run("search_tasks", args, context)) as Array<{
      id: string
      title: string
      status: string
      dueAt: Date | null
    }>

    return {
      tasks: result.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueAt: task.dueAt ? new Date(task.dueAt).toISOString() : null,
      })),
    }
  }
)

export const getTaskContext = getTaskContextDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    pack: (await run("get_task_context", args, context)) ?? null,
  })
)

export const explainValue = explainValueDef.server<AgentRuntimeContext>(
  async (args, context) => {
    const records = (await run("explain_value", args, context)) as Array<{
      field: string | null
      kind: string
      confidence: number | null
      source: string
      evidence: string | null
    }>

    return {
      records: records.map((record) => ({
        field: record.field,
        kind: record.kind,
        confidence: record.confidence,
        source: record.source,
        evidence: record.evidence,
      })),
    }
  }
)

export const searchEmails = searchEmailsDef.server<AgentRuntimeContext>(
  async (args, context) => {
    const result = (await run("search_emails", args, context)) as {
      emails: Array<{
        subject: string
        from: string
        snippet: string
        receivedAt: string
      }>
    }

    return {
      emails: result.emails ?? [],
    }
  }
)

export const syncEmails = syncEmailsDef.server<AgentRuntimeContext>(
  async (args, context) => {
    const result = (await run("sync_emails", args, context)) as {
      status: string
      message?: string
      fetched?: number
      ingested?: number
      emails: Array<{
        subject: string
        from: string
        snippet: string
        receivedAt: string
      }>
    }

    return {
      status: result.status ?? "SYNCED",
      message: result.message,
      fetched: result.fetched,
      ingested: result.ingested,
      emails: result.emails ?? [],
    }
  }
)

// --- Creating --------------------------------------------------------------

export const createTask = createTaskDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("create_task", args, context)) as { id: string; title: string }
)

export const createProject = createProjectDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("create_project", args, context)) as {
      id: string
      name: string
      slug: string
    }
)

export const createReminder = createReminderDef.server<AgentRuntimeContext>(
  async (args, context) => {
    const result = (await run("create_reminder", args, context)) as {
      id: string
      remindAt: Date | string
    }

    return { id: result.id, remindAt: new Date(result.remindAt).toISOString() }
  }
)

// --- Finance ---------------------------------------------------------------

export const spendingSummary = spendingSummaryDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("spending_summary", args, context)) as {
      period: string
      spent: string
      earned: string
      net: string
      changeVsPreviousPercent: number | null
      byCategory: Array<{ category: string; amount: string; share: number }>
    }
)

export const upcomingPayments = upcomingPaymentsDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    payments: (await run("upcoming_payments", args, context)) as Array<{
      name: string
      amount: string
      cycle: string
      dueAt: string
      daysAway: number
    }>,
  })
)

// --- Editing ---------------------------------------------------------------

export const updateTask = updateTaskDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("update_task", args, context)) as {
      id: string
      status: string
    }
)

// --- Memory ----------------------------------------------------------------

export const remember = rememberDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("remember", args, context)) as {
      key: string
      stored: boolean
      corrected: boolean
    }
)

export const recall = recallDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("recall", args, context)) as {
      memories: Array<{
        key: string
        kind: string
        value: string
        pinned: boolean
        updatedAt: string
      }>
    }
)

// --- Documents that arrive as files or links -------------------------------

export const importBankStatement = importBankStatementDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("import_bank_statement", args, context)) as Awaited<
      ReturnType<typeof importStatementsFromEmail>
    >
)

export const organizeSources = organizeSourcesDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("organize_sources", args, context)) as {
      status: "APPLIED" | "PREVIEW"
      plan: unknown
      report?: string
    }
)

// --- Approval-gated --------------------------------------------------------

export const sendEmail = sendEmailDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("send_email", args, context, { preApproved: true })) as {
      success: boolean
      messageId: string
    }
)

/// The server half of the tool set. Client-side definitions are appended by the
/// route so the model can call them too.
export const serverTools = [
  getAgenda,
  nextBestAction,
  searchTasks,
  searchEmails,
  syncEmails,
  getTaskContext,
  explainValue,
  createTask,
  createProject,
  createReminder,
  spendingSummary,
  upcomingPayments,
  updateTask,
  remember,
  recall,
  importBankStatement,
  organizeSources,
  sendEmail,
]
