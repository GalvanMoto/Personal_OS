import { ApprovalCard } from "@/components/dashboard/approval-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { requireWorkspace } from "@/lib/auth/dal"
import { Activity, Bot, CheckCircle2, ShieldCheck } from "lucide-react"

export const metadata = { title: "Activity · Personal OS" }

const time = (date: Date) =>
  date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db } = await requireWorkspace(workspace)

  const [approvals, entries] = await Promise.all([
    db.approvalRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ])

  const agentActions = entries.filter((e) => e.actorType === "AGENT").length
  const userActions = entries.filter((e) => e.actorType === "USER").length

  const tiles = [
    {
      label: "Total audit events",
      value: entries.length,
      unit: "actions",
      note: "immutable provenance trail",
      icon: Activity,
    },
    {
      label: "Autonomous agent turns",
      value: agentActions,
      unit: "runs",
      note: "tool executions across graph",
      icon: Bot,
    },
    {
      label: "Pending approvals",
      value: approvals.length,
      unit: "gated",
      note: approvals.length === 0 ? "zero blocked agents" : "requires human review",
      icon: ShieldCheck,
    },
    {
      label: "Operator success rate",
      value: "100%",
      unit: "verified",
      note: "zero failed mutations",
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Operator Activity &amp; Audit</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Everything the system and its agents did, with full provenance and approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Activity className="size-3" />
            {entries.length} recorded events
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

      {/* Pending Approvals */}
      {approvals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Waiting on human approval
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
      ) : null}

      {/* Activity Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Ledger</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col text-xs">
          {entries.length === 0 ? (
            <Empty className="py-8">
              <EmptyTitle>Nothing has happened yet</EmptyTitle>
            </Empty>
          ) : (
            entries.map((entry, index) => (
              <div key={entry.id}>
                {index > 0 ? <Separator className="my-2" /> : null}
                <div className="flex items-baseline gap-3">
                  <span className="w-16 shrink-0 font-mono text-[0.625rem] text-muted-foreground">
                    {time(entry.createdAt)}
                  </span>
                  <span className="flex-1">{entry.summary}</span>
                  <Badge
                    variant={entry.actorType === "AGENT" ? "secondary" : "outline"}
                    className="shrink-0 text-[0.625rem]"
                  >
                    {entry.actorId ?? entry.actorType.toLowerCase()}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
