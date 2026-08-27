"use client"

import { AlertCircle, Loader2, ShieldAlert } from "lucide-react"

import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"

/**
 * What a tool is doing, while it is doing it.
 *
 * Rendered as a `Marker` — the inline, muted status line the chat primitives
 * provide for exactly this — rather than a coloured chip, so a run that touches
 * six tools reads as a quiet trace under the answer instead of six badges
 * competing with it.
 *
 * Every `ToolCallState` is handled. An earlier version matched invented names
 * like "running", so anything that was not `complete` fell through to a spinner
 * and a *failed* tool sat there pretending to still be working.
 */

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

const RUNNING = new Set(["awaiting-input", "input-streaming", "input-complete"])

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

  // Done is silent — a finished trace is clutter once the answer is written.
  if (state === "complete" || state === "approval-responded") {
    return null
  }

  if (state === "error") {
    return (
      <Marker className="text-destructive">
        <MarkerIcon>
          <AlertCircle />
        </MarkerIcon>
        <MarkerContent>{label} failed</MarkerContent>
      </Marker>
    )
  }

  if (state === "approval-requested") {
    return (
      <Marker className="text-amber-600 dark:text-amber-400">
        <MarkerIcon>
          <ShieldAlert />
        </MarkerIcon>
        <MarkerContent>{label} — waiting for your approval</MarkerContent>
      </Marker>
    )
  }

  return (
    <Marker className={!state || RUNNING.has(state) ? "animate-pulse" : undefined}>
      <MarkerIcon>
        <Loader2 className="animate-spin" />
      </MarkerIcon>
      <MarkerContent>{label}…</MarkerContent>
    </Marker>
  )
}
