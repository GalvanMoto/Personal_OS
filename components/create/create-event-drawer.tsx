"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderGit2,
  Globe,
  LinkIcon,
  ListTodo,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Target,
  User,
  Users2,
  Video,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { createCalendarEventAction } from "@/lib/actions/entities"

interface CreateEventDrawerProps {
  workspace: string
  trigger?: React.ReactNode
  defaultProjectId?: string
}

export function CreateEventDrawer({
  workspace,
  trigger,
  defaultProjectId,
}: CreateEventDrawerProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState("basic")
  const router = useRouter()

  const defaultStartTime = new Date()
  defaultStartTime.setHours(defaultStartTime.getHours() + 1, 0, 0, 0)
  const defaultEndTime = new Date(defaultStartTime)
  defaultEndTime.setHours(defaultEndTime.getHours() + 1)

  const toInputDateTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0")
    const y = date.getFullYear()
    const m = pad(date.getMonth() + 1)
    const d = pad(date.getDate())
    const h = pad(date.getHours())
    const min = pad(date.getMinutes())
    return `${y}-${m}-${d}T${h}:${min}`
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    const res = await createCalendarEventAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to create event")
    } else {
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        router.refresh()
      }, 600)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger render={<span className="inline-flex cursor-pointer" />} nativeButton={false}>
          {trigger}
        </SheetTrigger>
      ) : (
        <SheetTrigger
          render={
            <Button size="sm" className="gap-1.5 h-8 text-xs bg-primary text-primary-foreground font-medium" />
          }
        >
          <Plus className="size-3.5" />
          <span>New Event</span>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="w-[420px] sm:w-[560px] p-0 flex flex-col h-full bg-background border-l">
        {/* Top Header */}
        <div className="px-6 py-5 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Calendar className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
                Schedule Commitment / Event
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Time and commitment layer connecting meetings, focus blocks, deadlines, and context.
              </SheetDescription>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mx-6 mt-4 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-500">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Event scheduled into calendar timeline!</span>
          </div>
        ) : null}

        {/* Main Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-9 p-1 bg-muted/50 rounded-lg text-xs">
                <TabsTrigger value="basic" className="gap-1.5 py-1 text-xs">
                  <Calendar className="size-3.5" />
                  <span>Event</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-1.5 py-1 text-xs">
                  <Clock className="size-3.5" />
                  <span>Time</span>
                </TabsTrigger>
                <TabsTrigger value="relations" className="gap-1.5 py-1 text-xs">
                  <Target className="size-3.5" />
                  <span>Context</span>
                </TabsTrigger>
                <TabsTrigger value="meeting" className="gap-1.5 py-1 text-xs">
                  <Video className="size-3.5" />
                  <span>Meeting</span>
                </TabsTrigger>
              </TabsList>

              {/* 1. BASIC TAB */}
              <TabsContent value="basic" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Event Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="title"
                    required
                    placeholder="e.g. GB Banquet Sprint Review &amp; Demo"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Event Type</label>
                    <select
                      name="eventType"
                      defaultValue="MEETING"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="MEETING">Client / Team Meeting</option>
                      <option value="FOCUS">Focus Work Block</option>
                      <option value="APPOINTMENT">Appointment</option>
                      <option value="DEADLINE">Target Deadline</option>
                      <option value="PERSONAL">Personal Commitment</option>
                      <option value="TRAVEL">Travel / Transit</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Status</label>
                    <select
                      name="status"
                      defaultValue="CONFIRMED"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="TENTATIVE">Tentative</option>
                      <option value="SCHEDULED">Scheduled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Description &amp; Agenda</label>
                  <Textarea
                    name="description"
                    rows={4}
                    placeholder="Agenda items, talking points, expected deliverables to present..."
                    className="text-xs resize-none"
                  />
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 text-[0.6875rem] text-muted-foreground flex items-center gap-2">
                  <Sparkles className="size-4 shrink-0 text-primary" />
                  <span>
                    Calendar Agent automatically prepares a context brief 15 minutes before client meetings.
                  </span>
                </div>
              </TabsContent>

              {/* 2. SCHEDULE TAB */}
              <TabsContent value="schedule" className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center gap-1">
                      Starts At <span className="text-destructive">*</span>
                    </label>
                    <Input
                      name="startsAt"
                      type="datetime-local"
                      required
                      defaultValue={toInputDateTime(defaultStartTime)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center gap-1">
                      Ends At <span className="text-destructive">*</span>
                    </label>
                    <Input
                      name="endsAt"
                      type="datetime-local"
                      required
                      defaultValue={toInputDateTime(defaultEndTime)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Recurrence</label>
                    <select
                      name="recurrence"
                      defaultValue="NONE"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="NONE">Does Not Repeat</option>
                      <option value="DAILY">Every Day</option>
                      <option value="WEEKDAYS">Every Weekday (Mon–Fri)</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="BIWEEKLY">Every 2 Weeks</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Smart Reminder</label>
                    <select
                      name="reminder"
                      defaultValue="30MIN"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="15MIN">15 minutes before (with Brief)</option>
                      <option value="30MIN">30 minutes before</option>
                      <option value="1HOUR">1 hour before</option>
                      <option value="1DAY">1 day before</option>
                      <option value="NONE">No reminder</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              {/* 3. RELATIONS & CONTEXT */}
              <TabsContent value="relations" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Project Association</label>
                  <Input
                    name="projectId"
                    defaultValue={defaultProjectId || ""}
                    placeholder="Link to Project ID"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Key Stakeholders &amp; Attendees</label>
                  <Input
                    name="attendees"
                    placeholder="e.g. sarah@gbbanquet.com, alex@studio.com"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Expected Outcome</label>
                  <Input
                    name="outcome"
                    placeholder="e.g. Signoff on video reel and schedule deployment"
                    className="h-9 text-xs"
                  />
                </div>
              </TabsContent>

              {/* 4. MEETING DETAILS */}
              <TabsContent value="meeting" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <Video className="size-3.5 text-primary" />
                    Video Call / Meeting URL
                  </label>
                  <Input
                    name="location"
                    placeholder="https://meet.google.com/abc-defg-hij or Zoom URL"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    Physical Location (If applicable)
                  </label>
                  <Input
                    name="physicalLocation"
                    placeholder="e.g. Conference Room A or Client Office"
                    className="h-9 text-xs"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky Bottom Footer */}
          <div className="mt-auto border-t bg-muted/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[0.625rem] text-muted-foreground font-mono">
              Press Enter to schedule
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-xs h-8 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending}
                size="sm"
                className="text-xs h-8 px-4 font-medium shadow-xs"
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-3.5 mr-1" />
                    Schedule Event
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
