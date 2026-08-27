import DashboardLayout from "@/components/watermelon/medesk-dashboard/dashboard-layout"
import { ShellProvider, type ShellData } from "@/components/dashboard/shell-context"
import { LiveProvider } from "@/components/realtime/live-provider"
import { getWorkspaces, requireWorkspace } from "@/lib/auth/dal"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Workspace shell.
 *
 * Membership is proven before anything renders, then the real workspace, user,
 * notifications and counts are handed to the dashboard chrome. The vendored
 * sidebar and topbar used to read a clinic's demo fixtures; they now read this.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant, user, role } = await requireWorkspace(workspace)

  const [workspaces, notifications, unreadCount, inboxCount, taskCount, approvalCount] =
    await Promise.all([
      getWorkspaces(),
      db.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.notification.count({ where: { readAt: null } }),
      db.inboxItem.count({ where: { status: { in: ["PENDING", "NEEDS_REVIEW"] } } }),
      db.task.count({
        where: { status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] }, parentId: null },
      }),
      db.approvalRequest.count({ where: { status: "PENDING" } }),
    ])

  const shell: ShellData = {
    workspace: { slug: tenant.slug, name: tenant.name },
    workspaces: workspaces.map((entry) => ({
      slug: entry.slug,
      name: entry.name,
    })),
    user: {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role,
    },
    notifications: notifications.map((entry) => ({
      id: entry.id,
      title: entry.title,
      body: entry.body,
      level: entry.level,
      // Notification hrefs are stored workspace-relative.
      href: entry.href ? `/w/${tenant.slug}${entry.href}` : null,
      createdAt: entry.createdAt.toISOString(),
      read: entry.readAt !== null,
    })),
    unreadCount,
    badges: {
      inbox: inboxCount,
      tasks: taskCount,
      approvals: approvalCount,
    },
  }

  return (
    <ShellProvider value={shell}>
      <LiveProvider workspace={tenant.slug} />
      <DashboardLayout>{children}</DashboardLayout>
    </ShellProvider>
  )
}
