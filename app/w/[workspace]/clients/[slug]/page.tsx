import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FolderGit2,
  Globe,
  HardDrive,
  Layers,
  Mail,
  Phone,
  Plus,
  Receipt,
  Sparkles,
  StickyNote,
  Users2,
  Wallet,
} from "lucide-react"

import { TaskRow } from "@/components/dashboard/task-row"
import { CreateTaskDrawer } from "@/components/create/create-task-drawer"
import { CreateProjectDrawer } from "@/components/create/create-project-drawer"
import { CreateNoteDrawer } from "@/components/create/create-note-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { requireWorkspace } from "@/lib/auth/dal"
import { organizationOverview } from "@/lib/domain/organizations"
import { formatMoney, money, sumMinor } from "@/lib/domain/money"

export default async function ClientPage({
  params,
}: {
  params: Promise<{ workspace: string; slug: string }>
}) {
  const { workspace, slug } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const found = await db.organization.findFirst({ where: { slug } })
  if (!found) notFound()

  const overview = await organizationOverview(db, found.id)
  if (!overview) notFound()

  const { organization, openTasks, transactions } = overview

  // Also fetch client notes and activity logs
  const [notes, activityLogs] = await Promise.all([
    db.note.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.activityLog.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ])

  const totalInvoiced = sumMinor(
    transactions.filter((t) => t.direction === "CREDIT").map((t) => t.amountMinor)
  )
  const currency = transactions[0]?.currency ?? "INR"

  const tiles = [
    {
      label: "Total invoiced",
      value: formatMoney(money(totalInvoiced, currency)),
      unit: "revenue",
      note: `${transactions.length} total ledger records`,
      icon: Wallet,
    },
    {
      label: "Open deliverables",
      value: openTasks.length,
      unit: "tasks",
      note: openTasks.length === 0 ? "all delivered" : "active in pipeline",
      icon: Layers,
    },
    {
      label: "Active initiatives",
      value: organization.projects.length,
      unit: "projects",
      note: "linked to client account",
      icon: FolderGit2,
    },
    {
      label: "Key contacts",
      value: organization.people.length,
      unit: "stakeholders",
      note: "primary contacts on file",
      icon: Users2,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/w/${workspace}/clients`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-3" /> Back to Clients
          </Link>
          <h1 className="mt-1 text-xl font-medium tracking-tight flex items-center gap-2">
            {organization.name}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-2">
            <span>{organization.notes || "360-degree client operations & relationship hub"}</span>
            {organization.website ? (
              <>
                <span>·</span>
                <a
                  href={organization.website.startsWith("http") ? organization.website : `https://${organization.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline flex items-center gap-0.5 font-mono"
                >
                  <Globe className="size-3" />
                  {organization.website.replace(/^https?:\/\//, "")}
                </a>
              </>
            ) : null}
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2">
          <CreateTaskDrawer workspace={workspace} />
          <CreateProjectDrawer workspace={workspace} />
          <CreateNoteDrawer workspace={workspace} />
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

      {/* Main 360 Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-8 text-[0.6875rem]">
          <TabsTrigger value="overview">Overview &amp; AI</TabsTrigger>
          <TabsTrigger value="tasks">Deliverables ({openTasks.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({organization.projects.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({organization.people.length})</TabsTrigger>
          <TabsTrigger value="finance">Ledger ({transactions.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW & AI */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            {/* Left: AI Relationship Brief */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" /> AI Relationship Intelligence &amp; Next Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Bot className="size-3.5 text-primary" /> Recommended Next Action
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {openTasks.length > 0
                      ? `Focus on deliverable "${openTasks[0]?.title}" due ${openTasks[0]?.dueAt ? openTasks[0]?.dueAt.toLocaleDateString("en-IN") : "soon"}.`
                      : "All client deliverables are fulfilled. Prepare next sprint proposal or check in on retainer."}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-semibold text-foreground">Client Profile Snapshot</h4>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[0.6875rem]">
                    <div className="p-2 rounded-md border bg-muted/20">
                      <span className="text-muted-foreground block text-[0.625rem]">RELATIONSHIP</span>
                      <span className="font-semibold text-foreground">Active Client</span>
                    </div>
                    <div className="p-2 rounded-md border bg-muted/20">
                      <span className="text-muted-foreground block text-[0.625rem]">HEALTH</span>
                      <span className="font-semibold text-emerald-500">100% On Track</span>
                    </div>
                    <div className="p-2 rounded-md border bg-muted/20">
                      <span className="text-muted-foreground block text-[0.625rem]">PAYMENT TERMS</span>
                      <span className="font-semibold text-foreground">Net 30 Days</span>
                    </div>
                    <div className="p-2 rounded-md border bg-muted/20">
                      <span className="text-muted-foreground block text-[0.625rem]">ACTIVE PIPELINE</span>
                      <span className="font-semibold text-foreground">{openTasks.length} Deliverables</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Quick Contacts & Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users2 className="size-4 text-primary" /> Primary Stakeholder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {organization.people.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">No contacts registered yet.</p>
                ) : (
                  organization.people.map((person) => (
                    <div key={person.id} className="p-3 rounded-lg border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{person.name}</span>
                        {person.role ? <Badge variant="secondary" className="text-[0.625rem]">{person.role}</Badge> : null}
                      </div>
                      {person.email ? (
                        <p className="text-muted-foreground flex items-center gap-1 font-mono text-[0.625rem]">
                          <Mail className="size-3" /> {person.email}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. DELIVERABLES & TASKS */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Active Deliverables Pipeline</span>
                <Badge variant="outline">{openTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {openTasks.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Nothing open for this client. All deliverables complete!
                </p>
              ) : (
                <div className="divide-y text-xs">
                  {openTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      workspace={workspace}
                      task={{
                        id: task.id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        dueAt: task.dueAt?.toISOString() ?? null,
                        project: null,
                        waitingOn: task.waitingOn,
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. PROJECTS */}
        <TabsContent value="projects" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Client Projects &amp; Initiatives</span>
                <Badge variant="outline">{organization.projects.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {organization.projects.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No projects created yet.</p>
              ) : (
                <div className="divide-y text-xs">
                  {organization.projects.map((project) => (
                    <div key={project.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                      <div>
                        <Link
                          href={`/w/${workspace}/projects`}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {project.name}
                        </Link>
                        <p className="text-[0.6875rem] text-muted-foreground mt-0.5 font-mono">
                          Status: {project.status}
                        </p>
                      </div>
                      <Badge variant="secondary" className="font-mono text-[0.625rem]">
                        {project._count.tasks} Tasks
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. CONTACTS */}
        <TabsContent value="contacts" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Stakeholders &amp; Team Directory</span>
                <Badge variant="outline">{organization.people.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {organization.people.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No contacts recorded.</p>
              ) : (
                <div className="divide-y text-xs">
                  {organization.people.map((person) => (
                    <div key={person.id} className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground">{person.name}</span>
                        {person.email ? (
                          <p className="text-muted-foreground font-mono text-[0.625rem]">{person.email}</p>
                        ) : null}
                      </div>
                      {person.role ? (
                        <Badge variant="outline" className="text-[0.625rem]">{person.role}</Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. FINANCE */}
        <TabsContent value="finance" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Client Financial Ledger &amp; Payments</span>
                <Badge variant="outline">{transactions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No financial ledger entries recorded.</p>
              ) : (
                <div className="divide-y text-xs">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <span className="font-medium text-foreground">{tx.description}</span>
                        <p className="text-[0.625rem] text-muted-foreground font-mono">
                          {tx.occurredAt.toLocaleDateString("en-IN")} · {tx.category}
                        </p>
                      </div>
                      <span className={`font-mono font-semibold tabular-nums ${tx.direction === "CREDIT" ? "text-emerald-500" : "text-foreground"}`}>
                        {tx.direction === "CREDIT" ? "+" : "-"}
                        {formatMoney(money(tx.amountMinor, tx.currency))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. ACTIVITY */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="size-4 text-emerald-500" /> Client Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activityLogs.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No activity records yet.</p>
              ) : (
                <div className="divide-y text-xs">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-3 flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-foreground">{log.action}</span>
                        <p className="text-[0.6875rem] text-muted-foreground mt-0.5">{log.summary}</p>
                      </div>
                      <span className="font-mono text-[0.625rem] text-muted-foreground">
                        {log.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
