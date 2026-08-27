import { CaptureBox } from "@/components/dashboard/capture-box"
import { CreateTaskDrawer } from "@/components/create/create-task-drawer"
import { TaskRow, type TaskRowData } from "@/components/dashboard/task-row"
import { UniversalFilterBar } from "@/components/filters/universal-filter-bar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { requireWorkspace } from "@/lib/auth/dal"
import { agenda, rankedTasks } from "@/lib/domain/tasks"
import { CheckCircle2, Clock, Flame, ListTodo } from "lucide-react"

export const metadata = { title: "Tasks · Personal OS" }

export default async function TasksPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db } = await requireWorkspace(workspace)

  const [ranked, plan] = await Promise.all([
    rankedTasks(db),
    agenda(db),
  ])

  const toRow = (task: (typeof ranked)[number]): TaskRowData => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt?.toISOString() ?? null,
    project: task.project?.name ?? null,
    waitingOn: task.waitingOn,
    score: task.score,
    reasons: task.reasons,
  })

  const urgentTasks = ranked.filter(
    (t) => t.priority === "URGENT" || t.priority === "HIGH" || (t.dueAt && new Date(t.dueAt) < new Date())
  )

  const tiles = [
    {
      label: "Actionable now",
      value: plan.dueToday.length + plan.inProgress.length,
      unit: "tasks",
      note: "ranked by deadline & impact",
      icon: Flame,
    },
    {
      label: "Overdue / Urgent",
      value: plan.overdue.length + urgentTasks.length,
      unit: "priority",
      note: plan.overdue.length === 0 ? "no overdue work" : `${plan.overdue.length} past deadline`,
      icon: Clock,
    },
    {
      label: "Total active backlog",
      value: ranked.length,
      unit: "tasks",
      note: `${plan.inProgress.length} in flight`,
      icon: ListTodo,
    },
    {
      label: "Waiting on clients",
      value: plan.waiting.length,
      unit: "blocked",
      note: "waiting for external response",
      icon: CheckCircle2,
    },
  ]

  const groups = [
    {
      key: "now",
      label: "Do next · Highest scorer",
      tasks: ranked
        .filter((task) => task.status !== "WAITING" && task.status !== "BLOCKED")
        .slice(0, 5),
    },
    {
      key: "open",
      label: "Active deliverables",
      tasks: ranked
        .filter((task) => task.status !== "WAITING" && task.status !== "BLOCKED")
        .slice(5),
    },
    {
      key: "parked",
      label: "Waiting on someone",
      tasks: ranked.filter(
        (task) => task.status === "WAITING" || task.status === "BLOCKED"
      ),
    },
  ].filter((group) => group.tasks.length > 0)

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Tasks Matrix</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ranked by deadline, priority, client dependency, and execution velocity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CreateTaskDrawer workspace={workspace} />
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <ListTodo className="size-3" />
            {ranked.length} total open
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

      {/* Quick Capture */}
      <CaptureBox workspace={workspace} />

      {/* Universal Filter & Search Bar */}
      <UniversalFilterBar
        searchPlaceholder="Filter tasks by name, project, or client..."
        dateFields={[
          { id: "dueAt", label: "Due Date" },
          { id: "createdAt", label: "Created Date" },
          { id: "completedAt", label: "Completed Date" },
        ]}
        quickFilters={[
          {
            id: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "To Do", value: "TODO" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Waiting", value: "WAITING" },
              { label: "Done", value: "DONE" },
            ],
          },
          {
            id: "priority",
            label: "Priority",
            type: "select",
            options: [
              { label: "Urgent", value: "URGENT" },
              { label: "High", value: "HIGH" },
              { label: "Medium", value: "MEDIUM" },
              { label: "Low", value: "LOW" },
            ],
          },
        ]}
        advancedFilters={[
          {
            id: "due",
            label: "Due Timeline",
            type: "select",
            options: [
              { label: "Today", value: "today" },
              { label: "This Week", value: "week" },
              { label: "Overdue", value: "overdue" },
            ],
          },
        ]}
        presets={[
          { id: "today", label: "Due Today", filters: { due: "today" } },
          { id: "urgent", label: "High Priority", filters: { priority: "HIGH" } },
          { id: "waiting", label: "Waiting on Client", filters: { status: "WAITING" } },
          { id: "in_flight", label: "In Flight", filters: { status: "IN_PROGRESS" } },
        ]}
        sortOptions={[
          { label: "Priority Score", value: "score", direction: "desc" },
          { label: "Due Date", value: "due", direction: "asc" },
          { label: "Title", value: "title", direction: "asc" },
        ]}
        groupOptions={[
          { label: "Status", value: "status" },
          { label: "Project", value: "project" },
          { label: "Priority", value: "priority" },
        ]}
      />

      {/* Task Groups */}
      {groups.length === 0 ? (
        <Empty className="py-12">
          <EmptyTitle>No open tasks</EmptyTitle>
          <EmptyDescription>
            Capture something in the inbox above and it will land here with context.
          </EmptyDescription>
        </Empty>
      ) : (
        groups.map((group) => (
          <Card key={group.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {group.label}
                <Badge variant="outline">{group.tasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  workspace={workspace}
                  task={toRow(task)}
                  showReasons={group.key === "now"}
                />
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
