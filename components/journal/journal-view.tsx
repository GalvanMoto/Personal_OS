"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Target,
  ArrowUpRight,
  FileText,
  BadgeAlert,
  PanelRightClose,
  PanelRightOpen,
  Layers,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { JournalCalendar } from "@/components/journal/journal-calendar"
import {
  getJournalForDateAction,
  saveJournalAction,
  generateAIJournalAction,
  getJournalCalendarDatesAction,
} from "@/lib/actions/journal"
import { DayActivityData } from "@/lib/domain/journal-ai"
import { cn } from "@/lib/utils"

type Props = {
  workspace: string
  initialDate: string
  initialDoc: {
    id: string
    title: string
    content: any
    summary: string | null
    updatedAt: string
  } | null
  initialActivity: DayActivityData
  initialLoggedDates: string[]
}

export function JournalView({
  workspace,
  initialDate,
  initialDoc,
  initialActivity,
  initialLoggedDates,
}: Props) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = React.useState(initialDate)
  const [doc, setDoc] = React.useState(initialDoc)
  const [activity, setActivity] = React.useState(initialActivity)
  const [loggedDates, setLoggedDates] = React.useState(initialLoggedDates)

  const [title, setTitle] = React.useState(
    initialDoc?.title || `Daily Journal — ${initialDate}`
  )
  const [content, setContent] = React.useState<any>(initialDoc?.content || "")
  const [summary, setSummary] = React.useState(initialDoc?.summary || "")

  const [saving, startSave] = React.useTransition()
  const [generating, startGenerate] = React.useTransition()
  const [loadingDate, startLoadDate] = React.useTransition()

  const [saveSuccess, setSaveSuccess] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // Format date display
  const dateObj = new Date(`${currentDate}T00:00:00`)
  const formattedDateTitle = dateObj.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Change date handler
  function handleSelectDate(newDate: string) {
    if (newDate === currentDate) return
    setCurrentDate(newDate)
    setErrorMsg(null)

    startLoadDate(async () => {
      const res = await getJournalForDateAction(workspace, newDate)
      if (res.ok) {
        setDoc(res.document)
        setActivity(res.activity)
        setTitle(res.document?.title || `Daily Journal — ${newDate}`)
        setContent(res.document?.content || "")
        setSummary(res.document?.summary || "")
      }
    })
  }

  function handlePrevDay() {
    const d = new Date(`${currentDate}T00:00:00`)
    d.setDate(d.getDate() - 1)
    handleSelectDate(d.toISOString().split("T")[0])
  }

  function handleNextDay() {
    const d = new Date(`${currentDate}T00:00:00`)
    d.setDate(d.getDate() + 1)
    handleSelectDate(d.toISOString().split("T")[0])
  }

  // Save journal
  function handleSave() {
    setErrorMsg(null)
    startSave(async () => {
      const contentStr =
        typeof content === "object" ? JSON.stringify(content) : String(content || "")
      const res = await saveJournalAction(workspace, currentDate, {
        title,
        content: contentStr,
        summary,
      })

      if (res.ok) {
        setSaveSuccess(true)
        if (!loggedDates.includes(currentDate)) {
          setLoggedDates((prev) => [...prev, currentDate])
        }
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        setErrorMsg(res.error || "Failed to save journal entry")
      }
    })
  }

  // AI Smart Journal Generation
  function handleGenerateAI() {
    setErrorMsg(null)
    startGenerate(async () => {
      const res = await generateAIJournalAction(workspace, currentDate)
      if (res.ok && res.synthesis) {
        setContent(res.synthesis.tiptapContent)
        setSummary(res.synthesis.summary)
        if (res.activity) {
          setActivity(res.activity)
        }
      } else {
        setErrorMsg(res.error || "Failed to synthesize journal with AI")
      }
    })
  }

  return (
    <div className="w-full h-[calc(100dvh-4.25rem)] md:h-[calc(100dvh-4.75rem)] flex flex-col overflow-hidden bg-background">
      {/* 1. FIXED TOP HEADER BAR */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 md:px-6 border-b bg-card/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="size-7" onClick={handlePrevDay} title="Previous Day">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={handleNextDay} title="Next Day">
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="text-[10px] font-mono gap-1 text-primary border-primary/30 shrink-0">
              <BookOpen className="size-3" />
              <span>Daily Log</span>
            </Badge>
            <h1 className="text-sm font-semibold tracking-tight text-foreground truncate">
              {formattedDateTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* AI Smart Synthesis Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateAI}
            disabled={generating || loadingDate}
            className="h-8 px-3 text-xs font-medium gap-1.5 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary shadow-xs"
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">{generating ? "Synthesizing Day…" : "Smart AI Log"}</span>
          </Button>

          {/* Save Button */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || loadingDate}
            className="h-8 px-3.5 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-sm"
          >
            {saveSuccess ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>{saving ? "Saving…" : "Save"}</span>
              </>
            )}
          </Button>

          {/* Toggle Sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((v) => !v)}
            className="size-8 text-muted-foreground hover:text-foreground hidden lg:inline-flex"
            title={sidebarOpen ? "Hide Calendar & Activity" : "Show Calendar & Activity"}
          >
            {sidebarOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          </Button>
        </div>
      </header>

      {errorMsg ? (
        <div className="shrink-0 p-2.5 mx-4 md:mx-6 mt-2 text-xs rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
          {errorMsg}
        </div>
      ) : null}

      {/* 2. MAIN WORKSPACE: TIPTAP CANVAS + CALENDAR / ACTIVITY SIDEBAR */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        {/* Editor Canvas Column */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 p-3 sm:p-4 md:p-6 w-full max-w-full">
          <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
            {loadingDate ? (
              <div className="h-full flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
                <span className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                <span>Loading journal for {currentDate}…</span>
              </div>
            ) : (
              <TiptapEditor
                value={content}
                onChange={(val) => setContent(val)}
                placeholder="Write your reflections, log key wins, learnings, decisions, or click 'Smart AI Log' to automatically synthesize today's activity…"
                className="h-full border-none rounded-none"
                editorClassName="h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8"
              />
            )}
          </div>
        </main>

        {/* 3. SIDEBAR: Interactive Calendar & Day's Activity Timeline */}
        {sidebarOpen ? (
          <aside className="w-84 shrink-0 border-l bg-muted/10 p-4 space-y-4 overflow-y-auto hidden lg:flex lg:flex-col">
            {/* Calendar Widget */}
            <div>
              <JournalCalendar
                selectedDate={currentDate}
                onSelectDate={handleSelectDate}
                loggedDates={loggedDates}
              />
            </div>

            {/* AI Summary Card */}
            {summary ? (
              <Card className="border-border/80 bg-card/70 backdrop-blur-xs shadow-none">
                <CardHeader className="p-3.5 pb-2">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Sparkles className="size-3.5 text-primary" />
                    <span>AI Executive Reflection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 pt-1 space-y-2">
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Key executive takeaway from this day's journal…"
                    rows={4}
                    className="text-xs resize-none bg-muted/40 font-sans leading-relaxed"
                  />
                </CardContent>
              </Card>
            ) : null}

            {/* Day Activity Context */}
            <Card className="border-border/80 bg-card/70 shadow-none">
              <CardHeader className="p-3.5 pb-2">
                <CardTitle className="text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-3.5 text-muted-foreground" />
                    <span>Activity Context</span>
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono">
                    {activity.tasksCompleted.length + activity.events.length + activity.transactions.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-1 space-y-3 text-xs">
                {/* Completed Tasks */}
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Closed Tasks ({activity.tasksCompleted.length})
                  </span>
                  {activity.tasksCompleted.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/70 italic">None logged for this day</p>
                  ) : (
                    <ul className="space-y-1">
                      {activity.tasksCompleted.map((t) => (
                        <li key={t.id} className="text-[11px] flex items-center gap-1.5 text-foreground">
                          <Check className="size-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{t.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Meetings & Events */}
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Meetings &amp; Schedule ({activity.events.length})
                  </span>
                  {activity.events.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/70 italic">No meetings scheduled</p>
                  ) : (
                    <ul className="space-y-1">
                      {activity.events.map((e) => (
                        <li key={e.id} className="text-[11px] flex items-center gap-1.5 text-foreground">
                          <Clock className="size-3 text-primary shrink-0" />
                          <span className="truncate">{e.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Financial Transactions */}
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Transactions ({activity.transactions.length})
                  </span>
                  {activity.transactions.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/70 italic">No financial transactions</p>
                  ) : (
                    <ul className="space-y-1">
                      {activity.transactions.slice(0, 4).map((tx) => (
                        <li key={tx.id} className="text-[11px] flex items-center justify-between gap-1">
                          <span className="truncate text-foreground">{tx.description}</span>
                          <span
                            className={cn(
                              "font-mono font-medium shrink-0",
                              tx.direction === "CREDIT" ? "text-emerald-500" : "text-foreground"
                            )}
                          >
                            {tx.direction === "CREDIT" ? "+" : "-"}₹
                            {(tx.amountMinor / 100).toLocaleString("en-IN")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
