import * as Icons from "@/components/watermelon/medesk-dashboard/components/medesk/icons"
import type {
  NavigationGroup,
} from "@/components/watermelon/medesk-dashboard/data"

/**
 * The real navigation.
 *
 * Every href is workspace-scoped and points at a route that exists — the
 * template shipped links to `/appointment` and `/staff`, which is why the
 * sidebar led nowhere. `badgeKey` names a count supplied by the shell context
 * so the numbers come from the database rather than being baked in.
 */
export type AppNavigationItem = NavigationGroup["items"][number] & {
  badgeKey?: string
}

export type AppNavigationGroup = Omit<NavigationGroup, "items"> & {
  items: AppNavigationItem[]
}

export function buildNavigation(workspace: string): AppNavigationGroup[] {
  const at = (path: string) => `/w/${workspace}${path}`

  return [
    {
      label: "Overview",
      collapsible: false,
      items: [{ name: "Today", href: at("/today"), icon: Icons.HomeIcon }],
    },
    {
      label: "Work",
      collapsible: true,
      items: [
        {
          name: "Inbox",
          href: at("/inbox"),
          icon: Icons.FileArrowUpIcon,
          badgeKey: "inbox",
        },
        {
          name: "Tasks",
          href: at("/tasks"),
          icon: Icons.CheckCircleIcon,
          badgeKey: "tasks",
        },
        { name: "Projects", href: at("/projects"), icon: Icons.FolderIcon },
        { name: "Clients", href: at("/clients"), icon: Icons.UsersIcon },
        { name: "Commitments", href: at("/commitments"), icon: Icons.StackIcon },
      ],
    },
    {
      label: "Information",
      collapsible: true,
      items: [
        { name: "Calendar", href: at("/calendar"), icon: Icons.CalendarDotsIcon },
        { name: "Files & Assets", href: at("/files"), icon: Icons.FilesIcon },
        { name: "Documents", href: at("/documents"), icon: Icons.FileIcon },
        { name: "Notes", href: at("/notes"), icon: Icons.NoteIcon },
        { name: "Email", href: at("/email"), icon: Icons.LinkIcon },
      ],
    },
    {
      label: "Finance",
      collapsible: true,
      items: [
        { name: "Finance Overview", href: at("/finance"), icon: Icons.ChartBarIcon },
        { name: "Transactions", href: at("/finance/transactions"), icon: Icons.TransactionsIcon },
        { name: "Subscriptions", href: at("/finance/subscriptions"), icon: Icons.SubscriptionsIcon },
        { name: "Invoices & Receipts", href: at("/finance/invoices"), icon: Icons.InvoicesIcon },
      ],
    },
    {
      label: "System",
      collapsible: true,
      items: [
        { name: "Assistant", href: at("/assistant"), icon: Icons.AssistantIcon },
        { name: "Memory", href: at("/memory"), icon: Icons.MemoryIcon },
        { name: "Agents Swarm", href: at("/agents"), icon: Icons.AgentsIcon },
        {
          name: "Activity",
          href: at("/activity"),
          icon: Icons.TimelineCheckIcon,
          badgeKey: "approvals",
        },
        { name: "Automations", href: at("/automations"), icon: Icons.AutomationsIcon },
        { name: "Notifications", href: at("/notifications"), icon: Icons.NotificationsIcon },
        {
          name: "Integrations",
          href: at("/settings/integrations"),
          icon: Icons.IntegrationsIcon,
        },
        {
          name: "Settings",
          href: at("/settings"),
          icon: Icons.SettingsIcon,
        },
      ],
    },
  ]
}
