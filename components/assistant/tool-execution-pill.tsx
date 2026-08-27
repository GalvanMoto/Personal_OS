"use client"

import { Loader2, Terminal, AlertCircle } from "lucide-react"

export function ToolExecutionPill({
  name,
  state,
}: {
  name: string
  state?: string
  args?: unknown
  result?: unknown
}) {
  const isRunning = state === "running" || state === "executing" || state === "in_progress" || state === "call"
  const isComplete = state === "complete" || state === "done" || state === "success" || state === "result"

  // Automatically hide once completed to keep the chat clean and compact
  if (isComplete) {
    return null
  }

  // Only render while actively executing or in case of error
  return (
    <div className="my-1 inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-950/30 px-2.5 py-1 text-[0.6875rem] font-mono text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-pulse">
      <Loader2 className="size-3 animate-spin text-cyan-400 shrink-0" />
      <span className="font-semibold text-foreground tracking-tight">{name}</span>
      <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 text-[0.6rem] uppercase tracking-wider font-sans font-medium text-cyan-300">
        Executing...
      </span>
    </div>
  )
}
