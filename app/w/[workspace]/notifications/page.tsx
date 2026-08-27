import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import { AlertCircle, AlertTriangle, ArrowUpRight, Bell, CheckCircle2, Clock, Info, ShieldAlert, Sparkles, Volume2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"

export const metadata = { title: "Notification Center · Personal OS" }

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const notifications = await db.notification.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const unread = notifications.filter((n) => !n.readAt)
  const urgent = notifications.filter((n) => n.level === "URGENT" || n.level === "APPROVAL_REQUIRED")

  const tiles = [
    {
      label: "Unread alerts",
      value: unread.length,
      unit: "unread",
      note: "waiting for user acknowledgment",
      icon: Bell,
    },
    {
      label: "Urgent action required",
      value: urgent.length,
      unit: "critical",
      note: "destructive tools or immediate deadlines",
      icon: AlertTriangle,
    },
    {
      label: "Audio alert system",
      value: "Synthesized",
      unit: "Web Audio",
      note: "gentle harmonic chimes active",
      icon: Volume2,
    },
    {
      label: "PWA Web Push",
      value: "Service Worker",
      unit: "registered",
      note: "mobile & desktop lockscreen delivery",
      icon: Sparkles,
    },
  ]

  function getLevelIcon(level: string) {
    switch (level) {
      case "APPROVAL_REQUIRED":
      case "URGENT":
        return <AlertTriangle className="size-4 text-destructive shrink-0" />
      case "IMPORTANT":
        return <AlertCircle className="size-4 text-amber-500 shrink-0" />
      case "REMINDER":
        return <Clock className="size-4 text-primary shrink-0" />
      default:
        return <Info className="size-4 text-muted-foreground shrink-0" />
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Notification Center &amp; Alerts</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Multi-channel notifications: daily briefing broadcasts, overdue reminders, and agent approval requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <Bell className="size-3" />
            {unread.length} Unread
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

      {/* Notifications Feed */}
      {notifications.length === 0 ? (
        <Empty className="py-16">
          <EmptyTitle>No notifications yet</EmptyTitle>
          <EmptyDescription>
            You are all caught up. Notifications will appear when tasks approach deadlines or agents request approvals.
          </EmptyDescription>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Notification Feed</span>
              <Badge variant="outline">{notifications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-4 p-4 transition-colors ${
                    !n.readAt ? "bg-muted/40" : "hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">{getLevelIcon(n.level)}</div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{n.title}</span>
                        <Badge
                          variant={n.level === "URGENT" || n.level === "APPROVAL_REQUIRED" ? "destructive" : "secondary"}
                          className="text-[0.625rem]"
                        >
                          {n.level.toLowerCase().replace("_", " ")}
                        </Badge>
                      </div>

                      {n.body ? <p className="text-muted-foreground mt-1 leading-relaxed">{n.body}</p> : null}

                      <div className="flex items-center gap-3 text-[0.625rem] text-muted-foreground mt-2 font-mono">
                        <span>{n.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>·</span>
                        <span>{n.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                        {n.href ? (
                          <>
                            <span>·</span>
                            <Link href={`/w/${workspace}${n.href}`} className="text-primary hover:underline flex items-center gap-0.5">
                              View target <ArrowUpRight className="size-2.5" />
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {!n.readAt ? (
                    <div className="size-2 rounded-full bg-primary shrink-0 mt-2" />
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
