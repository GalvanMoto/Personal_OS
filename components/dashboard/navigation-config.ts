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
      ],
    },
    {
      label: "Information",
      collapsible: true,
      items: [
        { name: "Calendar", href: at("/calendar"), icon: Icons.CalendarDotsIcon },
        { name: "Files & Assets", href: at("/files"), icon: Icons.FileIcon },
        { name: "Documents", href: at("/documents"), icon: Icons.FileIcon },
        { name: "Notes", href: at("/notes"), icon: Icons.FileIcon },
        { name: "Email", href: at("/email"), icon: Icons.LinkIcon },
      ],
    },
    {
      label: "Finance",
      collapsible: true,
      items: [
        { name: "Finance Overview", href: at("/finance"), icon: Icons.ChartBarIcon },
        { name: "Transactions", href: at("/finance/transactions"), icon: Icons.ChartBarIcon },
        { name: "Subscriptions", href: at("/finance/subscriptions"), icon: Icons.StackIcon },
        { name: "Invoices & Receipts", href: at("/finance/invoices"), icon: Icons.SealCheckIcon },
      ],
    },
    {
      label: "System",
      collapsible: true,
      items: [
        { name: "Assistant", href: at("/assistant"), icon: Icons.SparkleIcon },
        { name: "Agents Swarm", href: at("/agents"), icon: Icons.SparkleIcon },
        {
          name: "Activity",
          href: at("/activity"),
          icon: Icons.TimelineCheckIcon,
          badgeKey: "approvals",
        },
        { name: "Automations", href: at("/automations"), icon: Icons.GearIcon },
        { name: "Notifications", href: at("/notifications"), icon: Icons.BellIcon },
        {
          name: "Integrations",
          href: at("/settings/integrations"),
          icon: Icons.PlugsConnectedIcon,
        },
        {
          name: "Settings",
          href: at("/settings"),
          icon: Icons.GearIcon,
        },
      ],
    },
  ]
}
