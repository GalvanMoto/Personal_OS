"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Play,
  TrendingUp,
  ListTodo,
  ArrowUpRight,
} from "lucide-react"

import type { CommitmentMatrixItem } from "@/lib/domain/commitments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { generateWeeklyTasksAction } from "@/app/w/[workspace]/commitments/actions"
import { CreateCommitmentDrawer } from "./create-commitment-drawer"
import { CreateBrandDrawer } from "./create-brand-drawer"
import { ImportSourcesDrawer } from "./import-sources-drawer"
import { cn } from "@/lib/utils"

export function CommitmentsMatrix({
  workspace,
  summary,
  organizations,
  brands,
}: {
  workspace: string
  summary: {
    totalExpected: number
    totalCompleted: number
    totalRemaining: number
    totalHoursEstimated: number
    overallPercent: number
    items: CommitmentMatrixItem[]
  }
  organizations: Array<{ id: string; name: string }>
  brands: Array<{ id: string; name: string; organizationId: string }>
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setStatusMsg(null)
    try {
      const res = await generateWeeklyTasksAction(workspace)
      setStatusMsg(`Verified active commitments — ${res.count} tasks generated for the current cycle.`)
    } catch {
      setStatusMsg("Failed to run task generation.")
    } finally {
      setIsGenerating(false)
    }
  }

  const behindCount = summary.items.filter(
    (i) => i.currentCycle.status === "BEHIND" || i.currentCycle.status === "AT_RISK"
  ).length
  const totalCommitments = summary.items.length

  const tiles = [
    {
      label: "Cycle Progress",
      value: `${summary.overallPercent}%`,
      unit: "completed",
      note: `${summary.totalCompleted} of ${summary.totalExpected} deliverables done`,
      icon: TrendingUp,
    },
    {
      label: "Remaining Deliverables",
      value: summary.totalRemaining,
      unit: "in flight",
      note: "scheduled for current cycle",
      icon: ListTodo,
    },
    {
      label: "Workload Allocated",
      value: summary.totalHoursEstimated.toFixed(1),
      unit: "hours",
      note: "capacity commitment this week",
      icon: Clock,
    },
    {
      label: "SLA Health",
      value:
        behindCount === 0
          ? "100%"
          : `${Math.round(((totalCommitments - behindCount) / Math.max(1, totalCommitments)) * 100)}%`,
      unit: "on track",
      note: behindCount === 0 ? "all client retainers healthy" : `${behindCount} retainers require attention`,
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Recurring Commitments</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Operational retainers, deliverables, and SLA health across client brands.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ImportSourcesDrawer workspace={workspace} organizations={organizations} />
          <CreateBrandDrawer workspace={workspace} organizations={organizations} />
          <CreateCommitmentDrawer workspace={workspace} organizations={organizations} brands={brands} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-8 gap-1.5 text-xs"
          >
            <Play className={cn("size-3.5", isGenerating && "animate-spin")} />
            <span>Generate Tasks</span>
          </Button>
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <Layers className="size-3" />
            {totalCommitments} active retainers
          </Badge>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {statusMsg}
        </div>
      )}

      {/* KPI Metric Tiles */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <Card key={tile.label}>
              <CardContent className="flex flex-col gap-2 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{tile.label}</span>
                  <Icon className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="flex items-baseline gap-1">
                    <span className="text-2xl font-medium tabular-nums">{tile.value}</span>
                    <span className="text-xs text-muted-foreground">{tile.unit}</span>
                  </p>
                  <p className="truncate text-[0.625rem] text-muted-foreground">{tile.note}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Commitments Overview */}
      {summary.items.length === 0 ? (
        <Empty className="py-12">
          <EmptyTitle>No recurring commitments yet</EmptyTitle>
          <EmptyDescription>
            Set up recurring deliverables (e.g. 3 Reels/week) for client brands to track capacity and automate weekly task runs.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summary.items.map((item) => {
            const isCompleted = item.currentCycle.completedQuantity >= item.currentCycle.targetQuantity
            const percent = item.currentCycle.progressPercent

            return (
              <Card key={item.id} className="flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start justify-between gap-2 text-sm font-medium">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="truncate font-semibold text-foreground text-sm">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="size-3 shrink-0" />
                        <Link
                          href={`/w/${workspace}/clients/${item.clientSlug}`}
                          className="truncate font-medium hover:underline hover:text-foreground"
                        >
                          {item.clientName}
                        </Link>
                        {item.brandName && (
                          <>
                            <span>•</span>
                            <span className="truncate text-foreground/80">{item.brandName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant={
                        item.currentCycle.status === "COMPLETED"
                          ? "default"
                          : item.currentCycle.status === "ON_TRACK"
                          ? "secondary"
                          : item.currentCycle.status === "AT_RISK"
                          ? "outline"
                          : "destructive"
                      }
                      className="shrink-0 text-[0.625rem] capitalize"
                    >
                      {item.currentCycle.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 text-xs text-muted-foreground pt-0">
                  {/* Target and Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Deliverables ({item.frequency.toLowerCase()})
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {item.currentCycle.completedQuantity} / {item.currentCycle.targetQuantity} {item.unit} ({percent}%)
                      </span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t text-[0.6875rem]">
                    <div>
                      <span className="text-muted-foreground">Schedule:</span>{" "}
                      <span className="font-medium text-foreground capitalize">
                        {item.frequency.toLowerCase()} (Fri)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Effort:</span>{" "}
                      <span className="font-medium text-foreground">
                        {((item.currentCycle.targetQuantity * item.estimatedMinutes) / 60).toFixed(1)} hrs
                      </span>
                    </div>
                  </div>

                  {/* Linked Tasks */}
                  {item.tasks.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t">
                      <span className="text-[0.625rem] font-medium text-muted-foreground uppercase tracking-wider">
                        Active Cycle Tasks ({item.currentCycle.cycleKey})
                      </span>
                      <div className="flex flex-col gap-1">
                        {item.tasks.map((task) => (
                          <Link
                            key={task.id}
                            href={`/w/${workspace}/tasks/${task.id}`}
                            className="group flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1 text-[0.6875rem] transition-colors hover:bg-muted"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={cn(
                                  "size-1.5 rounded-full shrink-0",
                                  task.status === "DONE"
                                    ? "bg-emerald-500"
                                    : task.status === "IN_PROGRESS"
                                    ? "bg-amber-500"
                                    : "bg-muted-foreground/50"
                                )}
                              />
                              <span className="truncate group-hover:underline">{task.title}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[0.5625rem] px-1 py-0 h-4 uppercase font-mono"
                            >
                              {task.status.toLowerCase()}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
