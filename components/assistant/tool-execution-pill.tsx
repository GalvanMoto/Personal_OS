"use client"

import { AlertCircle, Loader2, ShieldAlert } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * What a tool is doing, while it is doing it.
 *
 * The states come from TanStack's `ToolCallState`, and every one of them is
 * handled here — an earlier version matched on invented names like "running",
 * so anything that was not `complete` fell through to a spinner and a *failed*
 * tool sat there pretending to work forever.
 */

const RUNNING = new Set([
  "awaiting-input",
  "input-streaming",
  "input-complete",
])

/// Friendlier than the raw tool name, which is what the user actually reads.
const LABELS: Record<string, string> = {
  get_agenda: "Reading your agenda",
  next_best_action: "Working out what is next",
  search_tasks: "Searching tasks",
  get_task_context: "Gathering task context",
  explain_value: "Tracing where that came from",
  search_emails: "Searching your mail",
  sync_emails: "Syncing from Gmail",
  import_bank_statement: "Fetching bank statements",
  organize_sources: "Reading the document",
  spending_summary: "Adding up your spending",
  upcoming_payments: "Checking upcoming payments",
  create_task: "Creating a task",
  create_project: "Creating a project",
  create_reminder: "Setting a reminder",
  update_task: "Updating the task",
  send_email: "Preparing an email",
  remember: "Remembering that",
  recall: "Checking what I know",
  focus_task: "Bringing that into view",
}

export function ToolExecutionPill({
  name,
  state,
}: {
  name: string
  state?: string
  args?: unknown
  result?: unknown
}) {
  const label = LABELS[name] ?? name

  // Done is silent — a finished pill is clutter once the answer is written.
  if (state === "complete" || state === "approval-responded") {
    return null
  }

  if (state === "error") {
    return (
      <div className="my-1 inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-[0.6875rem]">
        <AlertCircle className="size-3 shrink-0 text-destructive" />
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-destructive">failed</span>
      </div>
    )
  }

  if (state === "approval-requested") {
    return (
      <div className="my-1 inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[0.6875rem]">
        <ShieldAlert className="size-3 shrink-0 text-amber-500" />
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-amber-600 dark:text-amber-400">
          waiting for your approval
        </span>
      </div>
    )
  }

  const running = !state || RUNNING.has(state)

  return (
    <div
      className={cn(
        "my-1 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-[0.6875rem]",
        running && "animate-pulse"
      )}
    >
      <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
      <span className="font-medium text-foreground">{label}</span>
    </div>
  )
}
