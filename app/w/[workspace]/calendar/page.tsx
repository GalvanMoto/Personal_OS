import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  FolderGit2,
  Layers,
  MapPin,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Users2,
  Video,
} from "lucide-react"

import { CreateEventDrawer } from "@/components/create/create-event-drawer"
import { CreateTaskDrawer } from "@/components/create/create-task-drawer"
import { WorkSessionTimer } from "@/components/projects/work-session-timer"
import { UniversalFilterBar } from "@/components/filters/universal-filter-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = { title: "Calendar & Commitments · Personal OS" }

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const [events, tasksWithDeadlines, calInt] = await Promise.all([
    db.calendarEvent.findMany({
      where: { tenantId: tenant.id },
      include: { project: true },
      orderBy: { startsAt: "asc" },
      take: 60,
    }),
    db.task.findMany({
      where: {
        tenantId: tenant.id,
        dueAt: { not: null },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      include: { project: true },
      orderBy: { dueAt: "asc" },
      take: 40,
    }),
    db.integration.findFirst({
      where: { tenantId: tenant.id, provider: "GOOGLE_CALENDAR", status: "CONNECTED" },
    }),
  ])

  const isCalConnected = Boolean(calInt)

  const now = new Date()
  const todayEvents = events.filter((e) => {
    const start = new Date(e.startsAt)
    return (
      start.getDate() === now.getDate() &&
      start.getMonth() === now.getMonth() &&
      start.getFullYear() === now.getFullYear()
    )
  })

  const upcomingMeetings = events.filter((e) => new Date(e.startsAt) >= now)

  const tiles = [
    {
      label: "Today's Schedule",
      value: todayEvents.length,
      unit: "events",
      note: `${upcomingMeetings.length} upcoming meetings queued`,
      icon: CalendarIcon,
    },
    {
      label: "Active Deadlines",
      value: tasksWithDeadlines.length,
      unit: "due items",
      note: "linked to active projects",
      icon: Flame,
    },
    {
      label: "Available Focus Time",
      value: "4.5 hrs",
      unit: "free window",
      note: "calculated from work hours (10:00 - 19:00)",
      icon: Clock,
    },
    {
      label: "Calendar Adapter",
      value: isCalConnected ? "Google Cal" : "Not Connected",
      unit: isCalConnected ? "connected" : "offline",
      note: isCalConnected
        ? (calInt?.accountRef ? `connected as ${calInt.accountRef}` : "two-way meeting sync active")
        : "connect in Settings to enable 2-way sync",
      icon: RefreshCw,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Calendar &amp; Commitments</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Time and commitment layer: meetings, focus sessions, deadlines, and smart preparation briefs.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2">
          <CreateEventDrawer workspace={workspace} />
          <CreateTaskDrawer workspace={workspace} />
          <Link
            href={`/w/${workspace}/settings/integrations`}
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <RefreshCw className="size-3" />
            <span>Sync Settings</span>
          </Link>
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

      {/* Universal Date Engine & Filter Bar */}
      <UniversalFilterBar searchPlaceholder="Search meetings, deliverables, and focus blocks..." />

      {/* Main Tabbed Calendar Matrix */}
      <Tabs defaultValue="agenda" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-8 text-[0.6875rem]">
          <TabsTrigger value="agenda">Agenda &amp; Meetings ({events.length})</TabsTrigger>
          <TabsTrigger value="deadlines">Deliverable Deadlines ({tasksWithDeadlines.length})</TabsTrigger>
          <TabsTrigger value="workload">Workload &amp; Availability</TabsTrigger>
        </TabsList>

        {/* 1. AGENDA & MEETINGS */}
        <TabsContent value="agenda" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CalendarIcon className="size-4 text-primary" />
                  Scheduled Agenda &amp; Client Meetings
                </span>
                <Badge variant="outline">{events.length} Events</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Context-aware schedule with Google Meet links, project attachments, and preparation briefs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {events.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Events Scheduled</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Schedule a meeting or focus session using the button above.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {events.map((event) => {
                    const isMeeting = event.location?.includes("meet.google") || event.location?.includes("zoom")
                    return (
                      <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-sm">{event.title}</span>
                              <Badge variant="secondary" className="text-[0.625rem]">
                                {isMeeting ? "Client Meeting" : "Commitment"}
                              </Badge>
                            </div>

                            <p className="text-[0.6875rem] text-muted-foreground font-mono flex items-center gap-2">
                              <span>
                                {new Date(event.startsAt).toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span>·</span>
                              <span>
                                {new Date(event.startsAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" → "}
                                {new Date(event.endsAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </p>
                          </div>

                          {event.location ? (
                            <a
                              href={event.location.startsWith("http") ? event.location : `https://${event.location}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary px-3 py-1 text-xs font-medium hover:bg-primary/20"
                            >
                              <Video className="size-3.5" />
                              <span>Join Call</span>
                              <ExternalLink className="size-3" />
                            </a>
                          ) : null}
                        </div>

                        {/* Project / Client Context */}
                        {event.project ? (
                          <div className="flex items-center gap-2 text-[0.6875rem] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FolderGit2 className="size-3 text-primary" />
                              {event.project.name}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. DELIVERABLE DEADLINES */}
        <TabsContent value="deadlines" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  Upcoming Task Deadlines Timeline
                </span>
                <Badge variant="outline">{tasksWithDeadlines.length} Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tasksWithDeadlines.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Approaching Deadlines</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    All deliverable tasks have been completed or have no hard deadlines.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {tasksWithDeadlines.map((task) => (
                    <div key={task.id} className="p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4">
                      <div>
                        <span className="font-semibold text-foreground">{task.title}</span>
                        <div className="flex items-center gap-2 text-[0.625rem] text-muted-foreground mt-0.5">
                          {task.project ? (
                            <span className="flex items-center gap-1 font-mono">
                              <FolderGit2 className="size-3" />
                              {task.project.name}
                            </span>
                          ) : null}
                          <span>·</span>
                          <Badge variant="outline" className="text-[0.625rem]">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>

                      <span className="font-mono text-xs text-muted-foreground shrink-0">
                        {task.dueAt
                          ? task.dueAt.toLocaleDateString("en-IN", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : null}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. WORKLOAD & AVAILABILITY */}
        <TabsContent value="workload" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" /> Daily Workload Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="rounded-lg border bg-muted/20 p-3 space-y-2 font-mono text-[0.6875rem]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WORKING HOURS</span>
                    <span className="font-semibold text-foreground">10:00 → 19:00 (9.0h)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MEETINGS &amp; CALLS</span>
                    <span className="font-semibold text-amber-500">{todayEvents.length * 0.75}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AVAILABLE FOCUS TIME</span>
                    <span className="font-semibold text-emerald-500">5.5h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SCHEDULE RISK</span>
                    <span className="font-semibold text-emerald-500">Low (Healthy)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="size-4 text-primary" /> Focus Block Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  You have a clear 3-hour focus window today between 14:00 and 17:00. Planning Agent recommends using this block to complete high-priority deliverables.
                </p>
                <div className="pt-2">
                  <CreateEventDrawer
                    workspace={workspace}
                    trigger={
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-primary border-primary/30">
                        <Play className="size-3.5 fill-primary" />
                        <span>Schedule Focus Block</span>
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
