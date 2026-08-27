import Link from "next/link"
import { ArrowUpRight, CheckCircle2, FolderGit2, Layers, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { CreateProjectDrawer } from "@/components/create/create-project-drawer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { requireWorkspace } from "@/lib/auth/dal"
import { projectsWithProgress } from "@/lib/domain/projects"

export const metadata = { title: "Projects · Personal OS" }

const STATUS_VARIANT: Record<string, "secondary" | "outline" | "destructive"> = {
  ACTIVE: "secondary",
  PLANNING: "outline",
  ON_HOLD: "outline",
  COMPLETED: "outline",
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db } = await requireWorkspace(workspace)

  const projects = await projectsWithProgress(db)

  const activeProjects = projects.filter((p) => p.status === "ACTIVE")
  const totalTasks = projects.reduce((sum, p) => sum + p.totalTasks, 0)
  const doneTasks = projects.reduce((sum, p) => sum + p.doneTasks, 0)
  const overallProgress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)

  const tiles = [
    {
      label: "Active client projects",
      value: activeProjects.length,
      unit: "in flight",
      note: `${projects.length} total across graph`,
      icon: FolderGit2,
    },
    {
      label: "Total deliverables",
      value: totalTasks,
      unit: "tasks",
      note: `${doneTasks} marked completed`,
      icon: Layers,
    },
    {
      label: "Execution progress",
      value: `${overallProgress}%`,
      unit: "velocity",
      note: "overall project completion",
      icon: CheckCircle2,
    },
    {
      label: "Autonomous initiatives",
      value: projects.filter((p) => p.description).length,
      unit: "scoped",
      note: "with active brief description",
      icon: Sparkles,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Projects Board</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Client initiatives, deliverable progress, and linked cloud assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CreateProjectDrawer workspace={workspace} />
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <FolderGit2 className="size-3" />
            {projects.length} initiatives
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

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Empty className="py-12">
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            Filing an inbox item creates the project and associated deliverables automatically.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span className="truncate">{project.name}</span>
                  <Badge
                    variant={STATUS_VARIANT[project.status] ?? "outline"}
                    className="shrink-0 text-[0.625rem]"
                  >
                    {project.status.toLowerCase().replace("_", " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  {project.organization ? (
                    <Link
                      href={`/w/${workspace}/clients/${project.organization.slug}`}
                      className="flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                      {project.organization.name}
                      <ArrowUpRight className="size-3" />
                    </Link>
                  ) : (
                    <span>Internal Project</span>
                  )}
                  <span className="tabular-nums">
                    {project.doneTasks}/{project.totalTasks} done
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <Progress value={project.progress} className="h-1.5" />
                  <div className="flex justify-between text-[0.625rem] text-muted-foreground">
                    <span>Progress</span>
                    <span className="tabular-nums">{project.progress}%</span>
                  </div>
                </div>

                {project.description ? (
                  <p className="line-clamp-2 rounded bg-muted/30 p-2 text-[0.625rem] text-muted-foreground">
                    {project.description}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
