import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Bot, CheckCircle2, Clock, FileText, FolderGit2, Layers, MessageSquareQuote, ShieldCheck, Sparkles, Tag, Users2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { requireWorkspace } from "@/lib/auth/dal"
import { buildContextPack } from "@/lib/domain/context"
import { TaskDetailActions, ChecklistToggle } from "@/components/dashboard/task-detail-actions"

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>
}) {
  const { workspace, id } = await params
  const { db } = await requireWorkspace(workspace)

  const pack = await buildContextPack(db, id)
  if (!pack) notFound()

  const { task, project, organization, instructions, assets, checklist, siblingTasks, previousWork, openQuestions, sources } = pack

  const isDone = task.status === "DONE"
  const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && !isDone

  const tiles = [
    {
      label: "Execution status",
      value: task.status.toLowerCase().replace("_", " "),
      unit: isDone ? "completed" : "active",
      note: isOverdue ? "needs immediate attention" : "scheduled on timeline",
      icon: CheckCircle2,
    },
    {
      label: "Priority level",
      value: task.priority,
      unit: "urgency",
      note: "computed by planning scorer",
      icon: Clock,
    },
    {
      label: "Required assets",
      value: `${assets.length} items`,
      unit: "linked",
      note: "discovered from client brief",
      icon: Sparkles,
    },
    {
      label: "Checklist steps",
      value: `${checklist.filter((c) => c.done).length}/${checklist.length}`,
      unit: "done",
      note: checklist.length === 0 ? "single execution block" : "sub-steps defined",
      icon: Layers,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/w/${workspace}/tasks`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-3" /> Back to Tasks Matrix
          </Link>
          <h1 className="mt-1 text-xl font-medium tracking-tight flex items-center gap-2">
            {task.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {project ? (
              <Link
                href={`/w/${workspace}/projects/${project.slug}`}
                className="flex items-center gap-1 hover:underline text-foreground font-medium"
              >
                <FolderGit2 className="size-3" />
                {project.name}
              </Link>
            ) : null}
            {organization ? (
              <>
                <span>·</span>
                <Link
                  href={`/w/${workspace}/clients/${organization.slug}`}
                  className="flex items-center gap-1 hover:underline text-foreground"
                >
                  <Users2 className="size-3" />
                  {organization.name}
                </Link>
              </>
            ) : null}
          </div>
        </div>

        <TaskDetailActions
          workspace={workspace}
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueAt: task.dueAt ? new Date(task.dueAt).toISOString() : null,
          }}
        />
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
                    <span className="text-2xl font-medium tabular-nums capitalize">{tile.value}</span>
                    <span className="text-xs text-muted-foreground">{tile.unit}</span>
                  </p>
                  <p className="truncate text-[0.625rem] text-muted-foreground">{tile.note}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Grid: Context Pack Execution Engine */}
      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-3">
          {/* Client Brief & Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquareQuote className="size-4 text-primary" />
                Original Client Brief &amp; Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {instructions.length === 0 ? (
                <p className="text-muted-foreground">
                  {task.description || "No verbatim instructions attached."}
                </p>
              ) : (
                instructions.map((inst) => (
                  <div key={`${inst.source}-${inst.capturedAt}-${inst.text.slice(0,20)}`} className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-foreground italic leading-relaxed">
                      &ldquo;{inst.text}&rdquo;
                    </p>
                    <p className="mt-2 text-[0.625rem] text-muted-foreground font-mono">
                      Source: {inst.source} · {new Date(inst.capturedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Checklist */}
          {checklist.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Execution Checklist</span>
                  <Badge variant="outline">{checklist.filter((c) => c.done).length}/{checklist.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y text-xs">
                  {checklist.map((item) => (
                    <ChecklistToggle key={item.id} workspace={workspace} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Sibling Tasks */}
          {siblingTasks.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Other Deliverables in Project</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y text-xs">
                  {siblingTasks.map((sibling) => (
                    <div key={sibling.id} className="py-2 flex items-center justify-between">
                      <Link
                        href={`/w/${workspace}/tasks/${sibling.id}`}
                        className="hover:underline truncate text-muted-foreground hover:text-foreground"
                      >
                        {sibling.title}
                      </Link>
                      <Badge variant="outline" className="text-[0.625rem]">
                        {sibling.status.toLowerCase().replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right Sidebar: Assets & Provenance */}
        <div className="flex flex-col gap-3">
          {/* Required Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4" />
                Required Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs">
              {assets.length === 0 ? (
                <p className="text-muted-foreground">No asset dependencies discovered.</p>
              ) : (
                assets.map((asset) => (
                  <div key={asset.label} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                    <span className="font-medium truncate">{asset.label}</span>
                    <Badge variant={asset.done ? "secondary" : "outline"} className="text-[0.625rem]">
                      {asset.done ? "Ready" : "Pending"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Reference Previous Work */}
          {previousWork.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reference Past Work</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-xs">
                {previousWork.map((prev) => (
                  <div key={prev.id} className="p-2 rounded border bg-muted/10 text-muted-foreground">
                    <p className="font-medium text-foreground truncate">{prev.title}</p>
                    {prev.completedAt ? (
                      <p className="text-[0.625rem]">Completed {new Date(prev.completedAt).toLocaleDateString()}</p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {/* Provenance Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="size-4" />
                Provenance &amp; Source
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs">
              {sources.length === 0 ? (
                <p className="text-muted-foreground">Directly created by user.</p>
              ) : (
                sources.map((s) => (
                  <div key={`${s.kind}-${s.label}`} className="rounded border p-2 text-muted-foreground font-mono text-[0.625rem]">
                    <span className="text-foreground font-medium">{s.kind}</span>: {s.label}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
