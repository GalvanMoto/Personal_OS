import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { RoutineTriggerButton } from "@/components/automations/routine-trigger-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Activity, Bot, CalendarClock, CheckCircle2, Clock, Cpu, PlayCircle, RefreshCw, Sparkles, Zap } from "lucide-react"

export const metadata = { title: "Automations & Cron Jobs · Personal OS" }

export default async function AutomationsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const [jobs, recentRuns] = await Promise.all([
    db.job.findMany({
      where: { tenantId: tenant.id },
      orderBy: { runAt: "desc" },
      take: 30,
    }),
    db.jobRun.findMany({
      where: { tenantId: tenant.id },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: { job: true },
    }),
  ])

  const recurringRoutines = [
    {
      name: "Daily Morning Intelligence Briefing",
      schedule: "Daily at 08:00 AM",
      cadence: "Cron 0 8 * * *",
      description: "Assembles overnight updates, overdue deliverables, and top focus recommendations into your morning feed.",
      active: true,
      kind: "briefing.daily",
    },
    {
      name: "Deadline & Task Overdue Sweep",
      schedule: "Every Hour (top of hour)",
      cadence: "Cron 0 * * * *",
      description: "Evaluates project deadlines, sends contextual notifications, and escalates at-risk client deliverables.",
      active: true,
      kind: "tasks.sweep",
    },
    {
      name: "Contextual Reminder Heartbeat",
      schedule: "Every Minute",
      cadence: "Cron * * * * *",
      description: "Drains due reminders and dispatches audio chimes / web push notifications to your devices.",
      active: true,
      kind: "reminder.dispatch",
    },
    {
      name: "Subscription & Recurring Debit Radar",
      schedule: "Daily at 00:00 AM",
      cadence: "Cron 0 0 * * *",
      description: "Detects subscription renewals 72 hours in advance and updates financial forecasts.",
      active: true,
      kind: "finance.subscriptions",
    },
    {
      name: "Gmail & Drive Ingest Sync",
      schedule: "Every 5 Minutes",
      cadence: "Cron */5 * * * *",
      description: "Polls incoming emails and Google Drive folders to auto-extract client tasks and logos.",
      active: true,
      kind: "integration.sync",
    },
  ]

  const totalRuns = recentRuns.length
  const succeededRuns = recentRuns.filter((r) => r.status === "SUCCEEDED").length
  const healthRate = totalRuns === 0 ? 100 : Math.round((succeededRuns / totalRuns) * 100)

  const tiles = [
    {
      label: "Autonomous cron routines",
      value: recurringRoutines.length,
      unit: "active",
      note: "background agent loops running",
      icon: Cpu,
    },
    {
      label: "Worker execution health",
      value: `${healthRate}%`,
      unit: "success",
      note: `${succeededRuns} of ${totalRuns} jobs passed`,
      icon: CheckCircle2,
    },
    {
      label: "Pending execution queue",
      value: jobs.filter((j) => j.status === "QUEUED").length,
      unit: "jobs",
      note: "queued in Postgres job queue",
      icon: Clock,
    },
    {
      label: "Heartbeat engine",
      value: "Active",
      unit: "60s tick",
      note: "zero-infrastructure reliable scheduler",
      icon: Activity,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Automations &amp; Background Workflows</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Persistent cron engine, background workers, and proactive agent loops running independently on your server.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Zap className="size-3 text-amber-500" />
            Cron Workers Healthy
          </Badge>
        </div>
      </div>

      {/* KPI Tiles */}
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

      {/* Main Grid: Recurring Routines & Live Job Execution Queue */}
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        {/* Recurring Schedules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                Scheduled Background Workflows
              </span>
              <Badge variant="outline">{recurringRoutines.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              {recurringRoutines.map((routine) => (
                <div key={routine.kind} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{routine.name}</span>
                        <Badge variant="secondary" className="text-[0.625rem] font-mono">
                          {routine.schedule}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">{routine.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <RoutineTriggerButton workspace={workspace} kind={routine.kind} />
                      <Badge variant="outline" className="text-[0.625rem] text-emerald-500 border-emerald-500/30">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Execution Run Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Activity className="size-4" />
                Recent Worker Executions
              </span>
              <Badge variant="outline">{recentRuns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentRuns.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Activity className="mx-auto size-6 mb-2 text-muted-foreground/50" />
                <p>No job executions recorded yet.</p>
                <p className="text-[0.625rem] mt-1">Background worker loops run automatically.</p>
              </div>
            ) : (
              <div className="divide-y text-xs">
                {recentRuns.map((run) => (
                  <div key={run.id} className="p-3.5 space-y-1 hover:bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium font-mono text-[0.6875rem] truncate">{run.job.kind}</span>
                      <Badge
                        variant={run.status === "SUCCEEDED" ? "secondary" : "destructive"}
                        className="text-[0.625rem]"
                      >
                        {run.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-[0.625rem] text-muted-foreground font-mono">
                      {new Date(run.startedAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                      {run.finishedAt ? ` · completed` : ` · running`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
