import Link from "next/link"
import { ArrowUpRight, CalendarDays, Clock } from "lucide-react"

import { ApprovalCard } from "@/components/dashboard/approval-card"
import { CaptureBox } from "@/components/dashboard/capture-box"
import { UniversalCreateHub } from "@/components/create/universal-create-hub"
import {
  StatSparkline,
  ThroughputChart,
  WorkloadBreakdown,
} from "@/components/dashboard/overview-charts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireWorkspace } from "@/lib/auth/dal"
import {
  actorPerformance,
  dailyCounts,
  weeklyThroughput,
  workloadByClient,
} from "@/lib/domain/analytics"
import { buildBriefing } from "@/lib/domain/briefing"
import { upcomingPayments } from "@/lib/domain/finance"
import { formatMoney, money } from "@/lib/domain/money"
import { agenda } from "@/lib/domain/tasks"

export const metadata = { title: "Dashboard · Personal OS" }

const STATUS_VARIANT: Record<string, "destructive" | "secondary" | "outline"> = {
  IN_PROGRESS: "secondary",
  WAITING: "outline",
  BLOCKED: "destructive",
  TODO: "outline",
  BACKLOG: "outline",
}

function dueLabel(dueAt: Date | null, now: Date): string {
  if (!dueAt) return "—"

  const days = Math.round(
    (new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000
  )

  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return "today"
  if (days === 1) return "tomorrow"
  return `in ${days}d`
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, user } = await requireWorkspace(workspace)

  const now = new Date()

  const [briefing, plan, throughput, workload, spark, actors, payments, approvals] =
    await Promise.all([
      buildBriefing(db, user.name || user.email?.split("@")[0] || "there", now),
      agenda(db, now),
      weeklyThroughput(db, 4, now),
      workloadByClient(db),
      dailyCounts(db, 21, now),
      actorPerformance(db, 1, now),
      upcomingPayments(db, 30, now),
      db.approvalRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
    ])

  const capturedThisMonth = throughput.reduce((sum, week) => sum + week.captured, 0)
  const completedThisMonth = throughput.reduce((sum, week) => sum + week.completed, 0)
  const completionRate =
    capturedThisMonth === 0
      ? 0
      : Math.round((completedThisMonth / capturedThisMonth) * 100)

  // Each tile is a single headline number — a chart would be the wrong form, so
  // the sparkline sits alongside as context rather than as the subject.
  const tiles = [
    {
      label: "Due today",
      value: plan.dueToday.length,
      unit: "tasks",
      note: `${plan.inProgress.length} already in progress`,
      tone: "captured" as const,
      points: spark.captured,
    },
    {
      label: "Overdue",
      value: plan.overdue.length,
      unit: "tasks",
      note:
        plan.overdue.length === 0 ? "nothing late" : "needs attention first",
      tone: "blocked" as const,
      points: spark.captured,
    },
    {
      label: "Completed",
      value: completedThisMonth,
      unit: "this month",
      note: `${completionRate}% of what came in`,
      tone: "completed" as const,
      points: spark.completed,
    },
    {
      label: "Waiting",
      value: plan.waiting.length,
      unit: "blocked",
      note: "on someone else",
      tone: "blocked" as const,
      points: spark.completed,
    },
  ]

  const deliverables = [...plan.overdue, ...plan.dueToday, ...plan.inProgress]
    .filter(
      (task, index, all) => all.findIndex((other) => other.id === task.id) === index
    )
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">{briefing.greeting}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {briefing.date}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <UniversalCreateHub workspace={workspace} />
          <Badge variant="outline" className="gap-1.5">
            <Clock className="size-3" />
            {briefing.headline}
          </Badge>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <span className="text-xs text-muted-foreground">{tile.label}</span>

              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-baseline gap-1">
                    <span className="text-2xl font-medium tabular-nums">
                      {tile.value}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tile.unit}
                    </span>
                  </p>
                  <p className="text-[0.625rem] leading-tight text-balance text-muted-foreground">
                    {tile.note}
                  </p>
                </div>

                <StatSparkline
                  points={tile.points}
                  tone={tile.tone}
                  className="w-20 shrink-0"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Volume + workload */}
      <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Task &amp; ingestion volume
              <Link
                href={`/w/${workspace}/tasks`}
                className="ml-auto flex items-center gap-1 text-[0.625rem] font-normal text-muted-foreground underline-offset-4 hover:underline"
              >
                All tasks <ArrowUpRight className="size-3" />
              </Link>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Stat rail — the headline figures the chart is evidence for. */}
              <div className="flex shrink-0 flex-row gap-6 sm:w-28 sm:flex-col">
                <div>
                  <p className="text-xl font-medium tabular-nums">
                    {capturedThisMonth}
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground">
                    Captured, 4 weeks
                  </p>
                </div>
                <div>
                  <p className="text-xl font-medium tabular-nums">
                    {completionRate}%
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground">
                    Completion rate
                  </p>
                </div>
                <div>
                  <p className="text-xl font-medium tabular-nums">
                    {plan.waiting.length}
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground">
                    Still waiting
                  </p>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <ThroughputChart data={throughput} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Client &amp; project workload
              <Link
                href={`/w/${workspace}/clients`}
                className="ml-auto flex items-center gap-1 text-[0.625rem] font-normal text-muted-foreground underline-offset-4 hover:underline"
              >
                Clients <ArrowUpRight className="size-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WorkloadBreakdown total={workload.total} rows={workload.rows} />
          </CardContent>
        </Card>
      </div>

      {/* Capture + approvals */}
      <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
        <CaptureBox workspace={workspace} />

        {approvals.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Waiting on you
                <Badge variant="destructive">{approvals.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {approvals.map((request) => (
                <ApprovalCard
                  key={request.id}
                  workspace={workspace}
                  request={{
                    id: request.id,
                    tool: request.tool,
                    agent: request.agent,
                    reason: request.reason,
                    args: JSON.stringify(request.args, null, 2),
                  }}
                />
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Money coming up</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs">
              {payments.length === 0 ? (
                <p className="text-muted-foreground">
                  No recurring payments detected.
                </p>
              ) : (
                payments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span className="truncate">{payment.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatMoney(money(payment.amountMinor, payment.currency))}
                      {" · "}
                      {payment.daysAway === 0 ? "today" : `${payment.daysAway}d`}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Deliverables + who did the work */}
      <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Today&rsquo;s deliverables</CardTitle>
          </CardHeader>
          <CardContent>
            {deliverables.length === 0 ? (
              <p className="py-4 text-xs text-muted-foreground">
                Nothing due. Capture something above and it will appear here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deliverable</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliverables.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="max-w-[16rem] truncate">
                          {task.title}
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                          {task.project?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dueLabel(task.dueAt, now)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={STATUS_VARIANT[task.status] ?? "outline"}
                            className="text-[0.625rem]"
                          >
                            {task.status.toLowerCase().replace("_", " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Operator &amp; agent activity
              <Link
                href={`/w/${workspace}/activity`}
                className="ml-auto flex items-center gap-1 text-[0.625rem] font-normal text-muted-foreground underline-offset-4 hover:underline"
              >
                View all <ArrowUpRight className="size-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col text-xs">
            {actors.length === 0 ? (
              <p className="text-muted-foreground">Nothing recorded today.</p>
            ) : (
              actors.map((actor, index) => (
                <div key={actor.actor}>
                  {index > 0 ? <Separator className="my-2" /> : null}
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate capitalize">
                      {actor.actor === "USER"
                        ? user.name
                        : actor.actor.toLowerCase().replace(/[._-]/g, " ")}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {actor.actions} action{actor.actions === 1 ? "" : "s"} ·{" "}
                      {actor.successRate}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
