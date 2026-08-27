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
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react"

import type { CommitmentMatrixItem } from "@/lib/domain/commitments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { generateWeeklyTasksAction } from "@/app/w/[workspace]/commitments/actions"
import { CreateCommitmentDrawer } from "./create-commitment-drawer"
import { CreateBrandDrawer } from "./create-brand-drawer"
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
      setStatusMsg(`Successfully verified tasks for all active commitments (${res.count} new created)`)
    } catch {
      setStatusMsg("Failed to run task generation")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Top Header & Workload Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Recurring Operational Commitments</h1>
            <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
              Agency & Multi-Brand Retainers
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational deliverables (Reels, Posts, Reports) tracked against recurring client SLAs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CreateBrandDrawer workspace={workspace} organizations={organizations} />
          <CreateCommitmentDrawer workspace={workspace} organizations={organizations} brands={brands} />
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 font-medium"
          >
            <Play className={cn("size-3.5", isGenerating && "animate-spin")} />
            <span>Generate Week Tasks</span>
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          {statusMsg}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-[0.6875rem] font-medium uppercase tracking-wider">
              Cycle Progress
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">
              {summary.overallPercent}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 text-[0.6875rem] text-muted-foreground">
            {summary.totalCompleted} of {summary.totalExpected} deliverables completed
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-[0.6875rem] font-medium uppercase tracking-wider">
              Remaining Work
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-500">
              {summary.totalRemaining}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 text-[0.6875rem] text-muted-foreground">
            Deliverables due this active cycle
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-[0.6875rem] font-medium uppercase tracking-wider">
              Workload Capacity
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-indigo-500">
              {summary.totalHoursEstimated} hrs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 text-[0.6875rem] text-muted-foreground">
            Total estimated commitment time
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="p-3.5 pb-1">
            <CardDescription className="text-[0.6875rem] font-medium uppercase tracking-wider">
              Active Retainers
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-500">
              {summary.items.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 text-[0.6875rem] text-muted-foreground">
            Across {organizations.length} clients & {brands.length} brands
          </CardContent>
        </Card>
      </div>

      {/* Commitments Grid */}
      {summary.items.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Layers className="size-6" />
          </div>
          <h3 className="font-semibold text-sm">No Recurring Commitments Configured</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
            Model recurring client agreements like Karna Kreative (e.g. 3 Reels/week for WOW Indian). The system will automatically spawn weekly tasks and track delivery SLA health.
          </p>
          <div className="flex items-center justify-center gap-2">
            <CreateCommitmentDrawer workspace={workspace} organizations={organizations} brands={brands} />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.items.map((item) => {
            const cycle = item.currentCycle
            return (
              <Card key={item.id} className="flex flex-col justify-between overflow-hidden border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="p-4 pb-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="size-3.5 text-indigo-500 shrink-0" />
                      <span className="font-medium text-foreground">{item.clientName}</span>
                      {item.brandName && (
                        <>
                          <span>/</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            {item.brandName}
                          </span>
                        </>
                      )}
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[0.625rem] font-bold px-1.5 py-0.2",
                        cycle.status === "COMPLETED" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
                        cycle.status === "ON_TRACK" && "bg-blue-500/10 text-blue-500 border-blue-500/30",
                        cycle.status === "AT_RISK" && "bg-amber-500/10 text-amber-500 border-amber-500/30",
                        cycle.status === "BEHIND" && "bg-rose-500/10 text-rose-500 border-rose-500/30"
                      )}
                    >
                      {cycle.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <CardTitle className="text-sm font-semibold leading-snug">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  {/* Progress Bar & Stats */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {cycle.label} Progress:
                      </span>
                      <span className="font-semibold">
                        {cycle.completedQuantity} / {cycle.targetQuantity} {item.unit} ({cycle.progressPercent}%)
                      </span>
                    </div>
                    <Progress value={cycle.progressPercent} className="h-2" />
                  </div>

                  {/* Details Meta */}
                  <div className="grid grid-cols-2 gap-2 text-[0.6875rem] text-muted-foreground border-t pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <Video className="size-3.5 text-muted-foreground" />
                      <span>{item.quantity} {item.deliverableType.toLowerCase()}s / {item.frequency.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>~{Math.round((item.quantity * item.estimatedMinutes) / 60 * 10) / 10}h total ({item.estimatedMinutes}m/ea)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
