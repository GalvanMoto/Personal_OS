"use client"

import { useState } from "react"
import { CheckCircle2, ChevronDown, ChevronRight, Loader2, Terminal, AlertCircle, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

function formatToolName(name: string): string {
  return name.replace(/_/g, " ")
}

export function ToolExecutionPill({
  name,
  state,
  args,
  result,
}: {
  name: string
  state?: string
  args?: unknown
  result?: unknown
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isRunning = state === "running" || state === "executing" || state === "in_progress" || state === "call"
  const isComplete = state === "complete" || state === "done" || state === "success" || state === "result"
  const isError = state === "error" || state === "failed"

  return (
    <div className="my-1 text-xs transition-all duration-200">
      <button
        type="button"
        onClick={() => (args || result ? setIsExpanded(!isExpanded) : undefined)}
        className={`group inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[0.6875rem] font-mono transition-all ${
          isRunning
            ? "border-cyan-500/40 bg-cyan-950/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-pulse"
            : isComplete
              ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-950/30"
              : isError
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-muted-foreground/20 bg-muted/30 text-muted-foreground hover:bg-muted/50"
        }`}
      >
        {isRunning ? (
          <Loader2 className="size-3 animate-spin text-cyan-400 shrink-0" />
        ) : isComplete ? (
          <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
        ) : isError ? (
          <AlertCircle className="size-3 text-destructive shrink-0" />
        ) : (
          <Terminal className="size-3 text-muted-foreground shrink-0" />
        )}

        <span className="font-semibold text-foreground tracking-tight">{name}</span>

        <span
          className={`rounded px-1.5 py-0.2 text-[0.6rem] uppercase tracking-wider font-sans font-medium ${
            isRunning
              ? "bg-cyan-500/20 text-cyan-300"
              : isComplete
                ? "bg-emerald-500/20 text-emerald-300"
                : isError
                  ? "bg-destructive/20 text-destructive"
                  : "bg-muted text-muted-foreground"
          }`}
        >
          {isRunning ? "Executing" : isComplete ? "Completed" : state || "Invoked"}
        </span>

        {args || result ? (
          <span className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors ml-0.5">
            {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </span>
        ) : null}
      </button>

      {isExpanded && (args || result) ? (
        <div className="mt-1.5 overflow-hidden rounded-md border bg-black/40 p-2 font-mono text-[0.625rem] text-muted-foreground shadow-inner space-y-1.5">
          {args ? (
            <div>
              <span className="text-[0.6rem] text-cyan-400 font-semibold uppercase tracking-wider block">Input Args</span>
              <pre className="overflow-x-auto text-foreground/90 whitespace-pre-wrap">
                {typeof args === "string" ? args : JSON.stringify(args, null, 2)}
              </pre>
            </div>
          ) : null}
          {result ? (
            <div>
              <span className="text-[0.6rem] text-emerald-400 font-semibold uppercase tracking-wider block">Output Result</span>
              <pre className="overflow-x-auto text-foreground/90 whitespace-pre-wrap">
                {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
