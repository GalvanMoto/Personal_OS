import { requireWorkspace } from "@/lib/auth/dal"
import { AssistantPanel } from "@/components/assistant/assistant-panel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bot,
  Calendar,
  CreditCard,
  FileSearch,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
  Zap,
} from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  // 1. Fetch live workspace stats for cockpit metrics
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    openTasksCount,
    pendingApprovalsCount,
    unreadNotificationsCount,
    inboxPendingCount,
  ] = await Promise.all([
    db.task.count({
      where: {
        status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
        parentId: null,
      },
    }),
    db.approvalRequest.count({
      where: { status: "PENDING" },
    }),
    db.notification.count({
      where: { readAt: null },
    }),
    db.inboxItem.count({
      where: { status: { in: ["PENDING", "NEEDS_REVIEW"] } },
    }),
  ])

  const tiles = [
    {
      label: "Open Tasks",
      value: openTasksCount.toString(),
      unit: "actionable",
      note: "scheduled & backlog",
      icon: Target,
    },
    {
      label: "Pending Approvals",
      value: pendingApprovalsCount.toString(),
      unit: "gated",
      note: "outbound email",
      icon: Zap,
    },
    {
      label: "Inbox Items",
      value: inboxPendingCount.toString(),
      unit: "captures",
      note: "awaiting triage",
      icon: MessageSquare,
    },
    {
      label: "Safety Boundary",
      value: "No delete",
      unit: "by design",
      note: "every call audit logged",
      icon: ShieldCheck,
    },
  ]

  const suggestedCommands = [
    {
      title: "What should I do right now?",
      category: "Planning",
      icon: Target,
      desc: "Evaluates priority score, deadline, and blockers.",
    },
    {
      title: "Plan my day tomorrow",
      category: "Calendar",
      icon: Calendar,
      desc: "Allocates 2h focus windows around client calls.",
    },
    {
      title: "What did I spend this month?",
      category: "Finance",
      icon: CreditCard,
      desc: "Deterministic aggregation from statement ledger.",
    },
    {
      title: "Fetch my bank statements from email",
      category: "Statements",
      icon: FileSearch,
      desc: "Unlocks password-protected PDFs from your vault.",
    },
  ]

  return (
    <div className="flex h-[calc(100svh-4rem)] max-h-[calc(100svh-4rem)] flex-col gap-3 p-3 md:p-4 overflow-hidden">
      {/* Cockpit Top Bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div>
          <h1 className="text-base font-semibold tracking-tight">AI Chief-of-Staff Cockpit</h1>
          <p className="text-[0.6875rem] text-muted-foreground">
            Multi-agent workspace copilot: live markdown, tables, charts, metrics, checklists & questionnaires.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-[0.6875rem] py-0.5">
            <Bot className="size-3 text-primary" />
            Universal Orchestrator
          </Badge>
        </div>
      </div>

      {/* Main Two-Column Cockpit Layout (Fixed Height, No Page Scroll) */}
      <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] overflow-hidden">
        {/* LEFT COLUMN: Cockpit KPIs & Suggestions (Scrolls independently if needed) */}
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
          {/* 4 KPI Stat Tiles (2x2 Grid) */}
          <div className="grid gap-2 grid-cols-2 shrink-0">
            {tiles.map((tile) => {
              const Icon = tile.icon
              return (
                <Card key={tile.label} className="p-0 shadow-xs">
                  <CardContent className="flex flex-col gap-1 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.625rem] font-medium text-muted-foreground truncate">{tile.label}</span>
                      <Icon className="size-3 text-muted-foreground shrink-0" />
                    </div>
                    <div>
                      <p className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold tabular-nums">{tile.value}</span>
                        <span className="text-[0.5625rem] text-muted-foreground">{tile.unit}</span>
                      </p>
                      <p className="truncate text-[0.5625rem] text-muted-foreground">{tile.note}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Suggested Natural Language Commands */}
          <Card className="shrink-0 shadow-xs">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-semibold flex items-center justify-between">
                <span>Suggested Capabilities</span>
                <Sparkles className="size-3 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 pt-0 space-y-1.5">
              {suggestedCommands.map((cmd) => {
                const Icon = cmd.icon
                return (
                  <div
                    key={cmd.title}
                    className="p-2 rounded-lg border bg-muted/20 hover:border-primary/40 hover:bg-muted/40 transition-all space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[0.5rem] font-semibold text-primary uppercase tracking-wider">
                        {cmd.category}
                      </span>
                      <Icon className="size-2.5 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-[0.6875rem] text-foreground tracking-tight">
                      &ldquo;{cmd.title}&rdquo;
                    </p>
                    <p className="text-[0.5625rem] text-muted-foreground leading-snug">
                      {cmd.desc}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Policy & Safety Boundary Card */}
          <Card className="border-primary/20 bg-primary/5 shrink-0 shadow-xs">
            <CardContent className="p-2.5 text-[0.6875rem] space-y-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground text-[0.6875rem]">Safety Boundaries</span>
              </div>
              <p className="text-[0.625rem] text-muted-foreground leading-relaxed">
                Reading, creating and editing run autonomously and are logged. The assistant has no delete tool at all. Sending email is the only action that stops for your approval.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Full-Height Fixed Assistant Chat Panel */}
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <AssistantPanel workspace={workspace} />
        </div>
      </div>
    </div>
  )
}
