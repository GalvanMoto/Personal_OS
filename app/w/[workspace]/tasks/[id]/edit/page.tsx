import { notFound } from "next/navigation"
import { requireWorkspace } from "@/lib/auth/dal"
import { TaskEditor, type TaskEditorData, type ProjectOption } from "@/components/tasks/task-editor"

export const metadata = {
  title: "Edit Task · Personal OS",
}

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>
}) {
  const { workspace, id } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const [task, projects] = await Promise.all([
    db.task.findUnique({
      where: { id, tenantId: tenant.id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    }),
    db.project.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!task) {
    notFound()
  }

  const initialTask: TaskEditorData = {
    id: task.id,
    title: task.title,
    description: task.description,
    content: (task as any).content ?? null,
    linkUrls: ((task as any).linkUrls as string[]) ?? [],
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt ? new Date(task.dueAt).toISOString() : null,
    projectId: task.projectId,
    waitingOn: task.waitingOn,
    shareToken: (task as any).shareToken ?? null,
    isPublic: Boolean((task as any).isPublic),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }

  const projectOptions: ProjectOption[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
  }))

  return (
    <TaskEditor
      workspace={workspace}
      initialTask={initialTask}
      projects={projectOptions}
    />
  )
}
