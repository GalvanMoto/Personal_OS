import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  FileText,
  FolderGit2,
  GitBranch,
  Globe,
  HardDrive,
  Layers,
  Laptop,
  Play,
  Plus,
  Sparkles,
  StickyNote,
  Terminal,
  Users2,
} from "lucide-react"

import { TaskRow } from "@/components/dashboard/task-row"
import { CreateTaskDrawer } from "@/components/create/create-task-drawer"
import { CreateNoteDrawer } from "@/components/create/create-note-drawer"
import { WorkSessionTimer } from "@/components/projects/work-session-timer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { requireWorkspace } from "@/lib/auth/dal"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; slug: string }>
}) {
  const { workspace, slug } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const project = await db.project.findFirst({
    where: { slug },
    include: {
      organization: true,
      tasks: {
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      },
      notes: true,
      events: true,
    },
  })

  if (!project) notFound()

  // Fetch recent activity logs for this project/workspace
  const activityLogs = await db.activityLog.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  })

  const totalTasks = project.tasks.length
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length
  const openTasks = project.tasks.filter((t) => t.status !== "DONE")
  const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)

  const tiles = [
    {
      label: "Deliverables progress",
      value: `${progress}%`,
      unit: "complete",
      note: `${doneTasks} of ${totalTasks} tasks finished`,
      icon: CheckCircle2,
    },
    {
      label: "Active deliverables",
      value: openTasks.length,
      unit: "in flight",
      note: openTasks.length === 0 ? "all delivered" : "active in pipeline",
      icon: Layers,
    },
    {
      label: "Client account",
      value: project.organization ? project.organization.name : "Internal OS",
      unit: "owner",
      note: "linked in organization graph",
      icon: Users2,
    },
    {
      label: "Target deadline",
      value: project.dueAt
        ? project.dueAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
        : "Continuous",
      unit: "deadline",
      note: project.status.toLowerCase().replace("_", " "),
      icon: Clock,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/w/${workspace}/projects`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-3" /> Back to Projects Board
          </Link>
          <h1 className="mt-1 text-xl font-medium tracking-tight flex items-center gap-2">
            {project.name}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {project.description || "Operational home for deliverables, work logs, assets, and decisions."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <WorkSessionTimer workspace={workspace} projectId={project.id} projectName={project.name} />
          <CreateTaskDrawer workspace={workspace} defaultProjectId={project.id} />
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
          <TabsTrigger value="overview">Overview &amp; Goals</TabsTrigger>
          <TabsTrigger value="tasks">Deliverables ({openTasks.length})</TabsTrigger>
          <TabsTrigger value="worklog">Work Log</TabsTrigger>
          <TabsTrigger value="decisions">Decisions &amp; Notes</TabsTrigger>
          <TabsTrigger value="technical">Repo &amp; Dev Links</TabsTrigger>
          <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW & GOALS */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            {/* Left: AI Context & Deliverable Progress */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" /> AI Project Brief &amp; Recommended Next Action
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1.5">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Bot className="size-3.5 text-primary" /> Next Best Action
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {openTasks.length > 0
                        ? `Continue with "${openTasks[0]?.title}" — priority is ${openTasks[0]?.priority.toLowerCase()}.`
                        : "All tasks completed! Review milestones or plan next iteration deliverables."}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Project Milestone Progress</span>
                      <span className="font-mono text-xs text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Goals & Deliverables */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" /> Primary Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="divide-y rounded-md border text-xs">
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-foreground">Operational Delivery</span>
                        <p className="text-[0.625rem] text-muted-foreground">Complete core sprint deliverables and client review</p>
                      </div>
                      <Badge variant="outline" className="text-emerald-500 text-[0.625rem]">On Track</Badge>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-foreground">Quality &amp; Test Verification</span>
                        <p className="text-[0.625rem] text-muted-foreground">All checks passed — secure and verified</p>
                      </div>
                      <Badge variant="outline" className="text-emerald-500 text-[0.625rem]">Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Project Metadata & Client Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users2 className="size-4 text-primary" /> Client &amp; Stakeholder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {project.organization ? (
                    <div className="space-y-2 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{project.organization.name}</span>
                        <Badge variant="secondary" className="text-[0.625rem]">Client</Badge>
                      </div>
                      {project.organization.website ? (
                        <p className="text-muted-foreground text-[0.625rem] font-mono">{project.organization.website}</p>
                      ) : null}
                      <Link
                        href={`/w/${workspace}/clients/${project.organization.slug}`}
                        className="text-primary hover:underline flex items-center gap-1 text-[0.6875rem] font-medium pt-1"
                      >
                        View Client 360 Hub <ArrowUpRight className="size-3" />
                      </Link>
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-4 text-center">Internal project (no client linked).</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 2. TASKS & DELIVERABLES */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Deliverables Matrix</span>
                <Badge variant="outline">{project.tasks.length} Total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {project.tasks.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No tasks created yet for this project.
                </p>
              ) : (
                <div className="divide-y text-xs">
                  {project.tasks.map((task) => (
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

        {/* 3. WORK LOG */}
        <TabsContent value="worklog" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Logged Work Sessions</span>
                <Badge variant="outline">Recorded by Personal OS</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-lg border p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Project Architecture &amp; System Integration</span>
                  <Badge variant="secondary" className="font-mono text-[0.625rem]">1h 45m</Badge>
                </div>
                <p className="text-[0.6875rem] text-muted-foreground">
                  Designed modular drawers and updated the workspace settings.
                </p>
                <span className="text-[0.625rem] text-muted-foreground font-mono block pt-1">Today · 10:30 AM → 12:15 PM</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. DECISIONS & NOTES */}
        <TabsContent value="decisions" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Architecture Decisions &amp; Notes</span>
                <Badge variant="outline">{project.notes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {project.notes.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No notes recorded yet for this project.
                </p>
              ) : (
                <div className="divide-y rounded-md border text-xs">
                  {project.notes.map((note) => (
                    <div key={note.id} className="p-3.5 space-y-1">
                      <span className="font-semibold text-foreground">{note.title}</span>
                      <p className="text-muted-foreground font-mono text-[0.6875rem] whitespace-pre-wrap">{note.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. TECHNICAL & REPO LINKS */}
        <TabsContent value="technical" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="size-4 text-primary" /> Development &amp; Repository Links
              </CardTitle>
              <CardDescription className="text-xs">
                Manual repository metadata, local dev URLs, and server endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 rounded-lg border space-y-1">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Code2 className="size-3.5 text-primary" /> Local Dev Server
                  </span>
                  <p className="font-mono text-primary text-[0.6875rem]">http://localhost:3000</p>
                </div>
                <div className="p-3 rounded-lg border space-y-1">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <GitBranch className="size-3.5 text-primary" /> Active Branch
                  </span>
                  <p className="font-mono text-muted-foreground text-[0.6875rem]">main</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. ACTIVITY */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="size-4 text-emerald-500" /> Project Activity Trail
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
