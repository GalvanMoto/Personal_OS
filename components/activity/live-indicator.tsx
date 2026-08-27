"use client"

import { CheckCircle2, Loader2, AlertCircle, PauseCircle, Sparkles } from "lucide-react"
import type { SystemStatus } from "@/lib/agents/activity-types"

export function LiveIndicator({
  status,
  label,
  showIcon = true,
}: {
  status: SystemStatus
  label?: string
  showIcon?: boolean
}) {
  const isWorking =
    status === "processing" ||
    status === "thinking" ||
    status === "searching" ||
    status === "syncing" ||
    status === "executing"

  const isWaiting = status === "waiting_approval"
  const isFailed = status === "failed"

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      {/* Subtle pulsating status dot / icon */}
      {isWorking ? (
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-cyan-500" />
        </span>
      ) : isWaiting ? (
        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
      ) : isFailed ? (
        <span className="size-2 rounded-full bg-rose-500" />
      ) : (
        <span className="size-2 rounded-full bg-emerald-500/80" />
      )}

      {label ? (
        <span className="font-mono text-[0.6875rem] text-muted-foreground">
          {label}
        </span>
      ) : (
        <span className="font-mono text-[0.6875rem] text-muted-foreground">
          {isWorking
            ? "Working..."
            : isWaiting
              ? "Waiting Approval"
              : isFailed
                ? "Attention Required"
                : "Operational"}
        </span>
      )}
    </div>
  )
}
