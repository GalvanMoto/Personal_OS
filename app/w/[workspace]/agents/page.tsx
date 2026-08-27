import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AGENT_REGISTRY } from "@/lib/agents/registry"
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Cpu,
  Eye,
  KeyRound,
  Lock,
  Play,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react"

export const metadata = { title: "Agent Control Plane & Swarm Cockpit · Personal OS" }

export default async function AgentsCockpitPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const [approvalsCount, activityLogs] = await Promise.all([
    db.approvalRequest.count({ where: { tenantId: tenant.id, status: "PENDING" } }),
    db.activityLog.findMany({
      where: { tenantId: tenant.id, actorType: "AGENT" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const agentsList = Object.values(AGENT_REGISTRY)

  const tiles = [
    {
      label: "Specialized agent swarm",
      value: agentsList.length,
      unit: "agents",
      note: "governed by policy boundaries",
      icon: Bot,
    },
    {
      label: "Governed tools",
      value: 14,
      unit: "tools",
      note: "schema-validated typed contracts",
      icon: Terminal,
    },
    {
      label: "Pending safety gates",
      value: approvalsCount,
      unit: "approvals",
      note: approvalsCount === 0 ? "all clear" : "human signoff needed",
      icon: ShieldAlert,
    },
    {
      label: "Audited agent runs",
      value: activityLogs.length,
      unit: "invocations",
      note: "recorded in immutable ledger",
      icon: Activity,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight flex items-center gap-2">
            Agent Control Plane &amp; Swarm Cockpit
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            &ldquo;Agents decide. Your application controls.&rdquo; — Scopes, risk tiers, and execution traces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/w/${workspace}/activity`}>
            <Badge variant="outline" className="gap-1.5 font-mono text-xs hover:bg-muted cursor-pointer">
              <ShieldCheck className="size-3 text-emerald-500" />
              {approvalsCount} Pending Approvals
            </Badge>
          </Link>
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

      {/* Main Grid: 10 Agents Swarm + Recent Run Traces */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: 10 Agents Matrix */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Bot className="size-4 text-primary" /> Active Specialized Agents
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {agentsList.map((agent) => (
              <Card key={agent.id} className="flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
                      <CardDescription className="text-[0.6875rem] font-medium text-primary mt-0.5">
                        {agent.role}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={agent.maxRiskLevel === "SENSITIVE" ? "destructive" : "secondary"}
                      className="text-[0.625rem] shrink-0"
                    >
                      {agent.maxRiskLevel}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2.5 pt-0 text-xs">
                  <p className="text-muted-foreground text-[0.6875rem] leading-relaxed">
                    {agent.purpose}
                  </p>

                  <div className="space-y-1 pt-2 border-t text-[0.625rem]">
                    <div className="flex items-start gap-1 text-muted-foreground">
                      <KeyRound className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="font-mono line-clamp-1">{agent.scopes.join(", ")}</span>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Terminal className="size-3 text-muted-foreground shrink-0" />
                      <span className="font-mono line-clamp-1">
                        Tools: {agent.allowedTools.join(", ")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Live Activity Audit Traces */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Activity className="size-4 text-emerald-500" /> Recent Agent Executions
          </h2>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Audited Tool Invocation Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activityLogs.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">
                  No agent tool invocations recorded yet.
                </p>
              ) : (
                <div className="divide-y text-xs">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">{log.action}</span>
                            <Badge variant="outline" className="text-[0.625rem] font-mono">
                              {log.actorId || "agent"}
                            </Badge>
                          </div>
                          <p className="text-[0.6875rem] text-muted-foreground mt-0.5">{log.summary}</p>
                        </div>
                        <span className="font-mono text-[0.625rem] text-muted-foreground shrink-0">
                          {log.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
