import "server-only"

import type { ToolExecutionContext } from "@tanstack/ai"

import { executeTool } from "@/lib/agents/tools"
import {
  cancelSubscriptionDef,
  completeTaskDef,
  createBrandDef,
  createCalendarEventDef,
  createCommitmentDef,
  createInvoiceDef,
  createNotificationDef,
  createOrganizationDef,
  createProjectDef,
  createReminderDef,
  createSubscriptionDef,
  createTaskDef,
  deleteTaskDef,
  ensureCommitmentDef,
  explainClaimDef,
  explainValueDef,
  getAgendaDef,
  getContextPackDef,
  getDriveFileDef,
  getProjectContextDef,
  getSettingsDef,
  getSubscriptionDef,
  getTaskContextDef,
  importBankStatementDef,
  jioBankStatementExtractorDef,
  nextBestActionDef,
  organizeSourcesDef,
  pauseSubscriptionDef,
  recallDef,
  recommendNextActionDef,
  rememberDef,
  searchAllDef,
  searchBrandsDef,
  searchCalendarDef,
  searchCommitmentsDef,
  searchDocumentDef,
  searchDocumentsDef,
  searchDriveDef,
  searchEmailsDef,
  searchInvoicesDef,
  searchOrganizationsDef,
  searchSubscriptionsDef,
  syncEmailsDef,
  searchTasksDef,
  sendEmailDef,
  spendingSummaryDef,
  updateCalendarEventDef,
  updateSettingsDef,
  updateSubscriptionDef,
  updateTaskDef,
  upcomingPaymentsDef,
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

// --- Subscriptions — universal control plane --------------------------------

export const createSubscription = createSubscriptionDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("create_subscription", args, context)) as {
      subscription: { id: string; name: string; vendor: string | null; cycle: string; nextDueAt: string | null }
      reminder?: { id: string; remindAt: string } | null
      notification?: { id: string } | null
      isNew: boolean
      message: string
    }
)

export const searchSubscriptions = searchSubscriptionsDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    subscriptions: (await run("search_subscriptions", args, context)) as Array<{
      id: string
      name: string
      vendor: string | null
      amountMinor: number
      currency: string
      cycle: string
      nextDueAt: string | null
      active: boolean
    }>,
  })
)

export const getSubscription = getSubscriptionDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("get_subscription", args, context)) as {
      id: string
      name: string
      vendor: string | null
      amountMinor: number
      currency: string
      cycle: string
      nextDueAt: string | null
      active: boolean
      billingUrl: string | null
    }
)

export const updateSubscription = updateSubscriptionDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("update_subscription", args, context)) as {
      id: string
      name: string
      vendor: string | null
      cycle: string
      nextDueAt: string | null
      active: boolean
    }
)

export const cancelSubscription = cancelSubscriptionDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("cancel_subscription", args, context)) as { id: string; active: boolean }
)

export const pauseSubscription = pauseSubscriptionDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("pause_subscription", args, context)) as { id: string; active: boolean }
)

// --- Tasks — complete/delete + project context --------------------------------

export const completeTask = completeTaskDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("complete_task", args, context)) as { id: string; status: string; title: string }
)

export const deleteTask = deleteTaskDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("delete_task", args, context, { preApproved: true })) as { deleted: string; title: string }
)

export const getProjectContext = getProjectContextDef.server<AgentRuntimeContext>(
  async (args, context) => (await run("get_project_context", args, context)) as any
)

// --- Organizations / Brands / Commitments / Invoices ---------------------------

export const createOrganization = createOrganizationDef.server<AgentRuntimeContext>(
  async (args, context) => (await run("create_organization", args, context)) as { id: string; name: string; slug: string }
)

export const searchOrganizations = searchOrganizationsDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    organizations: (await run("search_organizations", args, context)) as Array<{ id: string; name: string; slug: string; kind: string }>,
  })
)

export const createBrand = createBrandDef.server<AgentRuntimeContext>(
  async (args, context) => (await run("create_brand", args, context)) as { id: string; name: string; slug: string; organizationId: string }
)

export const searchBrands = searchBrandsDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    brands: (await run("search_brands", args, context)) as Array<{ id: string; name: string; slug: string; organizationId: string }>,
  })
)

export const createCommitment = createCommitmentDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("create_commitment", args, context)) as { id: string; title: string; frequency: string; quantity: number; isNew: boolean }
)

export const searchCommitments = searchCommitmentsDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    commitments: (await run("search_commitments", args, context)) as Array<{ id: string; title: string; frequency: string; quantity: number }>,
  })
)

export const ensureCommitment = ensureCommitmentDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("ensure_commitment", args, context)) as {
      organization: { id: string; name: string }
      brand: { id: string; name: string } | null
      commitment: { id: string; title: string; isNew: boolean }
    }
)

export const createInvoice = createInvoiceDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("create_invoice", args, context)) as { id: string; amountMinor: number; currency: string }
)

export const searchInvoices = searchInvoicesDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    invoices: (await run("search_invoices", args, context)) as Array<{ id: string; title: string; amountMinor: number; currency: string }>,
  })
)

export const updateSettings = updateSettingsDef.server<AgentRuntimeContext>(
  async (args, context) => (await run("update_settings", args, context)) as { settings: unknown; user: unknown }
)

export const getSettings = getSettingsDef.server<AgentRuntimeContext>(
  async (_args, context) =>
    (await run("get_settings", {}, context)) as unknown as {
      timezone: string
      currency: string
      dateFormat: string
      landingPage: string
      accent: string
      density: string
      theme: string
      [key: string]: unknown
    }
)

// --- Calendar ----------------------------------------------------------------

export const searchCalendar = searchCalendarDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    events: (await run("search_calendar", args, context)) as Array<{
      id: string
      title: string
      location: string | null
      startsAt: string
      endsAt: string
      allDay: boolean
    }>,
  })
)

export const createCalendarEvent = createCalendarEventDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("create_calendar_event", args, context)) as { id: string; title: string; startsAt: string }
)

export const updateCalendarEvent = updateCalendarEventDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("update_calendar_event", args, context)) as { id: string; title: string }
)

// --- Drive / Files / Documents -----------------------------------------------

export const searchDrive = searchDriveDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    files: (await run("search_drive", args, context)) as Array<{
      id: string
      name: string
      mimeType: string
      sizeBytes: number | null
      createdAt: string
      sourceType?: string
    }>,
  })
)

export const getDriveFile = getDriveFileDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("get_drive_file", args, context)) as {
      id: string
      name: string
      mimeType: string
      sizeBytes: number
      storageKey: string
      createdAt: string
    }
)

export const searchDocuments = searchDocumentsDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    documents: (await run("search_documents", args, context)) as Array<{
      id: string
      title: string
      summary: string | null
      fileId: string | null
    }>,
  })
)

export const searchAll = searchAllDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    hits: (await run("search_all", args, context)) as Array<{
      entityType: string
      entityId: string
      title: string
      href: string | null
      score: number
    }>,
  })
)

export const createNotification = createNotificationDef.server<AgentRuntimeContext>(
  async (args, context) =>
    (await run("create_notification", args, context)) as { id: string; title: string }
)

// Planning aliases

export const getContextPack = getContextPackDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    pack: (await run("get_context_pack", args, context)) as unknown,
  })
)

export const recommendNextAction = recommendNextActionDef.server<AgentRuntimeContext>(
  async (_args, context) =>
    (await run("recommend_next_action", {}, context)) as {
      id: string
      title: string
      score: number
      reasons: string[]
    } | null
)

export const explainClaim = explainClaimDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    records: (await run("explain_claim", args, context)) as Array<{
      field: string | null
      kind: string
      confidence: number | null
      source: string
      evidence: string | null
    }>,
  })
)

export const searchDocument = searchDocumentDef.server<AgentRuntimeContext>(
  async (args, context) => ({
    documents: (await run("search_document", args, context)) as Array<{ id: string; title: string }>,
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

export const jioBankStatementExtractor = jioBankStatementExtractorDef.server<AgentRuntimeContext>(
  async (args, context) => {
    const { db, ctx } = requireContext(context)
    const { importJioStatements } = await import("@/lib/domain/jio-statement-extractor")
    return (await importJioStatements(db, ctx, args as any)) as any
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
  recommendNextAction,
  searchTasks,
  searchEmails,
  syncEmails,
  getTaskContext,
  getContextPack,
  explainValue,
  explainClaim,
  createTask,
  completeTask,
  deleteTask,
  updateTask,
  createProject,
  getProjectContext,
  createOrganization,
  searchOrganizations,
  createBrand,
  searchBrands,
  createCommitment,
  searchCommitments,
  ensureCommitment,
  createInvoice,
  searchInvoices,
  createReminder,
  createNotification,
  searchCalendar,
  createCalendarEvent,
  updateCalendarEvent,
  searchDrive,
  getDriveFile,
  searchDocuments,
  searchDocument,
  searchAll,
  spendingSummary,
  upcomingPayments,
  createSubscription,
  searchSubscriptions,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  pauseSubscription,
  updateSettings,
  getSettings,
  remember,
  recall,
  importBankStatement,
  jioBankStatementExtractor,
  organizeSources,
  sendEmail,
]
