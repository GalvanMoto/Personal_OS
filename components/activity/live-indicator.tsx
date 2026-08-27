"use client"

import { Loader2 } from "lucide-react"
import type { SystemStatus, AgentRole } from "@/lib/agents/activity-types"
import { AGENT_REGISTRY } from "@/lib/agents/activity-types"
import { cn } from "@/lib/utils"

export function LiveIndicator({
  status,
  activeAgent,
  label,
  hideLabel = false,
  className,
}: {
  status: SystemStatus
  activeAgent?: AgentRole | string | null
  label?: string
  hideLabel?: boolean
  className?: string
}) {
  const isWorking =
    status === "processing" ||
    status === "thinking" ||
    status === "searching" ||
    status === "syncing" ||
    status === "executing"

  const isWaiting = status === "waiting_approval"
  const isFailed = status === "failed"

  const agentInfo = activeAgent && (AGENT_REGISTRY as Record<string, typeof AGENT_REGISTRY.email>)[activeAgent]
  const agentDisplayName = agentInfo ? agentInfo.name : (activeAgent || "Agent")

  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs font-mono", className)}>
      {/* Animated Spinner when working, or status dot */}
      {isWorking ? (
        <span className="relative flex items-center justify-center shrink-0">
          <Loader2 className="size-3.5 animate-spin text-cyan-400" />
        </span>
      ) : isWaiting ? (
        <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
      ) : isFailed ? (
        <span className="size-2 rounded-full bg-rose-500 shrink-0" />
      ) : (
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 duration-1000" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      )}

      {!hideLabel && (
        <span className="text-[0.6875rem] leading-none transition-colors">
          {isWorking ? (
            <span className="flex items-center gap-1.5">
              <span className="text-cyan-400 font-medium">{agentDisplayName}</span>
              <span className="text-muted-foreground text-[0.625rem] lowercase hidden sm:inline">
                {status === "thinking"
                  ? "thinking..."
                  : status === "searching"
                    ? "searching..."
                    : status === "syncing"
                      ? "syncing..."
                      : "working..."}
              </span>
            </span>
          ) : isWaiting ? (
            <span className="text-amber-400 font-medium">Waiting Approval</span>
          ) : isFailed ? (
            <span className="text-rose-400 font-medium">Attention Required</span>
          ) : (
            <span className="text-muted-foreground">
              {label || "Operational Personal OS"}
            </span>
          )}
        </span>
      )}
    </div>
  )
}
