"use client"

import { useState } from "react"
import {
  Activity,
  Bot,
  Calendar,
  CheckCircle2,
  Compass,
  Cpu,
  Folder,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Wallet,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AGENT_REGISTRY, type AgentRole } from "@/lib/agents/activity-types"
import { useSystemActivity, activityStore } from "./activity-store"
import { LiveIndicator } from "./live-indicator"

const AGENT_ICONS: Record<string, typeof Inbox> = {
  Inbox,
  Mail,
  Wallet,
  Folder,
  Calendar,
  Compass,
  Cpu,
}

export function ActivityCenterDrawer() {
  const [open, setOpen] = useState(false)
  const { status, runs, activeRuns, completedRuns, waitingApproval, activeCount } = useSystemActivity()

  const agentKeys = Object.keys(AGENT_REGISTRY) as AgentRole[]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex h-8 items-center gap-2 rounded-md border bg-background/60 px-2.5 text-xs font-normal hover:bg-muted/80 transition-all cursor-pointer">
        <LiveIndicator status={status} />
        {activeCount > 0 ? (
          <span className="font-mono text-[0.6875rem] text-cyan-400">
            {activeCount} active
          </span>
        ) : (
          <span className="font-mono text-[0.6875rem] text-muted-foreground hidden sm:inline">
            Personal OS
          </span>
        )}
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <SheetTitle className="text-sm font-medium">System Activity Center</SheetTitle>
            </div>
            <LiveIndicator status={status} />
          </div>
          <SheetDescription className="text-xs text-muted-foreground mt-1">
            Real-time background execution, agent runs, and automated sync jobs.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* 1. Active Background Runs */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Active Background Jobs ({activeRuns.length})
                </span>
                {completedRuns.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => activityStore.clearCompleted()}
                    className="text-[0.625rem] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear finished
                  </button>
                ) : null}
              </div>

              {activeRuns.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground font-mono">
                  All systems quiet. No background jobs currently active.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeRuns.map((run) => {
                    const agent = AGENT_REGISTRY[run.agentId]
                    const Icon = AGENT_ICONS[agent?.iconName ?? "Cpu"] ?? Cpu

                    return (
                      <div key={run.id} className="rounded-lg border bg-card p-3 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="size-3.5" style={{ color: agent?.color }} />
                            <span className="font-medium text-xs text-foreground">{agent?.name}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 font-mono text-[0.625rem] text-cyan-400">
                            <Loader2 className="size-2.5 animate-spin" />
                            <span>Working</span>
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground font-mono">{run.title}</p>

                        {run.progress ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[0.625rem] font-mono text-muted-foreground">
                              <span>Progress</span>
                              <span>
                                {run.progress.current} / {run.progress.total} {run.progress.unit ?? "items"}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-cyan-500 transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, (run.progress.current / run.progress.total) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 2. Agent Fleet Roster */}
            <div>
              <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground block mb-2.5">
                Autonomous Agents Fleet
              </span>
              <div className="divide-y rounded-lg border bg-card">
                {agentKeys.map((key) => {
                  const agent = AGENT_REGISTRY[key]
                  const Icon = AGENT_ICONS[agent.iconName] ?? Cpu
                  const isAgentActive = activeRuns.some((r) => r.agentId === key)

                  return (
                    <div key={agent.id} className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex size-7 items-center justify-center rounded-md border bg-muted/40"
                          style={{ borderColor: `${agent.color}40` }}
                        >
                          <Icon className="size-3.5" style={{ color: agent.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-[0.75rem]">{agent.name}</p>
                          <p className="text-[0.625rem] text-muted-foreground">{agent.title}</p>
                        </div>
                      </div>

                      <Badge
                        variant={isAgentActive ? "default" : "outline"}
                        className={`font-mono text-[0.625rem] ${
                          isAgentActive ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse" : "text-muted-foreground"
                        }`}
                      >
                        {isAgentActive ? "Working" : "Idle"}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
