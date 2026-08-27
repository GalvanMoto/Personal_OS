"use client"

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react"
import type { AgentStep } from "@/lib/agents/activity-types"

export function AgentStepTimeline({
  title,
  steps,
  isFinished = false,
}: {
  title?: string
  steps: AgentStep[]
  isFinished?: boolean
}) {
  return (
    <div className="rounded-lg border bg-card/60 p-3.5 shadow-sm space-y-2.5 text-xs font-sans">
      {title ? (
        <div className="flex items-center justify-between border-b pb-2">
          <span className="font-medium text-foreground tracking-tight">{title}</span>
          {isFinished ? (
            <span className="inline-flex items-center gap-1 font-mono text-[0.6875rem] text-emerald-400">
              <CheckCircle2 className="size-3" />
              <span>Ready</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[0.6875rem] text-cyan-400 animate-pulse">
              <Loader2 className="size-3 animate-spin" />
              <span>Processing...</span>
            </span>
          )}
        </div>
      ) : null}

      <div className="space-y-2 pl-0.5">
        {steps.map((step) => {
          const isDone = step.status === "completed"
          const isCurrent = step.status === "running"
          const isFailed = step.status === "failed"

          return (
            <div key={step.id} className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="size-3.5 animate-spin text-cyan-400" />
                ) : isFailed ? (
                  <XCircle className="size-3.5 text-destructive" />
                ) : (
                  <Circle className="size-3.5 text-muted-foreground/40" />
                )}
              </div>

              <div className="flex flex-col">
                <span
                  className={`text-xs ${
                    isDone
                      ? "text-muted-foreground font-normal"
                      : isCurrent
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/60"
                  }`}
                >
                  {step.label}
                </span>
                {step.detail ? (
                  <span className="text-[0.6875rem] font-mono text-muted-foreground/80 mt-0.5">
                    {step.detail}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
