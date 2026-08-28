"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Trash2,
  Check,
  PanelRightClose,
  PanelRightOpen,
  Calendar as CalendarIcon,
  FolderGit2,
  Link2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TiptapEditorWithAI } from "@/components/ui/tiptap-editor-with-ai"
import { ShareButton } from "@/components/share/share-button"
import { deleteTaskAction, updateTaskAction, setTaskStatusAction } from "@/lib/actions/tasks"
import { cn } from "@/lib/utils"

export type TaskEditorData = {
  id: string
  title: string
  description: string | null
  content: unknown | null
  linkUrls: string[]
  status: string
  priority: string
  dueAt: string | null
  projectId: string | null
  waitingOn: string | null
  shareToken: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export type ProjectOption = {
  id: string
  name: string
}

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do", color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { value: "WAITING", label: "Waiting On Client", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { value: "BLOCKED", label: "Blocked", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  { value: "DONE", label: "Completed", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
]

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "text-zinc-400 border-zinc-500/20" },
  { value: "MEDIUM", label: "Medium", color: "text-blue-400 border-blue-500/20" },
  { value: "HIGH", label: "High", color: "text-amber-400 border-amber-500/20" },
  { value: "URGENT", label: "Urgent", color: "text-rose-400 border-rose-500/20" },
]

export function TaskEditor({
  workspace,
  initialTask,
  projects,
}: {
  workspace: string
  initialTask: TaskEditorData
  projects: ProjectOption[]
}) {
  const router = useRouter()

  const [title, setTitle] = React.useState(initialTask.title)
  const [description, setDescription] = React.useState(initialTask.description || "")
  const [content, setContent] = React.useState<unknown>(initialTask.content ?? null)
  const [status, setStatus] = React.useState(initialTask.status)
  const [priority, setPriority] = React.useState(initialTask.priority)
  const [projectId, setProjectId] = React.useState(initialTask.projectId || "")
  const [waitingOn, setWaitingOn] = React.useState(initialTask.waitingOn || "")
  const [dueAt, setDueAt] = React.useState(
    initialTask.dueAt ? initialTask.dueAt.slice(0, 10) : ""
  )
  const [linkUrlsText, setLinkUrlsText] = React.useState((initialTask.linkUrls || []).join("\n"))

  const [saving, startSave] = React.useTransition()
  const [saveSuccess, setSaveSuccess] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

  // Parse links for real-time preview in the sidebar
  const parsedLinks = React.useMemo(() => {
    return linkUrlsText
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [linkUrlsText])

  function handleSave() {
    setErrorMsg(null)
    startSave(async () => {
      // 1. Update task properties (title, description, content, linkUrls, priority, dueAt, projectId)
      const fd = new FormData()
      fd.set("title", title.trim() || "Untitled Task")
      fd.set("description", description.trim())
      if (content) fd.set("content", typeof content === "object" ? JSON.stringify(content) : String(content))
      else fd.set("content", "")

      fd.set("linkUrls", JSON.stringify(parsedLinks.slice(0, 12)))
      fd.set("priority", priority)
      if (dueAt) fd.set("dueAt", dueAt)
      if (projectId) fd.set("projectId", projectId)
      else fd.set("projectId", "")

      const res = await updateTaskAction(workspace, initialTask.id, fd)
      if (!res.ok) {
        setErrorMsg(res.error || "Failed to update task")
        return
      }

      // 2. Update status if changed
      if (status !== initialTask.status || (status === "WAITING" && waitingOn !== initialTask.waitingOn)) {
        const statusRes = await setTaskStatusAction(
          workspace,
          initialTask.id,
          status as any,
          waitingOn.trim() || undefined
        )
        if (!statusRes.ok) {
          setErrorMsg(statusRes.error || "Failed to update status")
          return
        }
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return
    startSave(async () => {
      const res = await deleteTaskAction(workspace, initialTask.id)
      if (res.ok) {
        router.push(`/w/${workspace}/tasks`)
      } else {
        setErrorMsg(res.error || "Failed to delete task")
      }
    })
  }

  // Keyboard shortcut: Cmd/Ctrl + S to save
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  return (
    <div className="w-full h-[calc(100dvh-4.25rem)] md:h-[calc(100dvh-4.75rem)] flex flex-col overflow-hidden bg-background">
      {/* 1. FIXED TOP HEADER BAR */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 md:px-6 border-b bg-card/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={`/w/${workspace}/tasks/${initialTask.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors shrink-0"
          >
            <ArrowLeft className="size-3.5" />
            <span>Task Detail</span>
          </Link>
          <span className="text-muted-foreground/30 hidden sm:inline">/</span>
          <Badge variant="outline" className="text-[10px] font-mono shrink-0 hidden sm:inline-flex">
            Individual Task Editor
          </Badge>
          <span className="text-xs text-muted-foreground font-mono truncate hidden lg:inline">
            · ID {initialTask.id.slice(-8)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ShareButton
            workspace={workspace}
            taskId={initialTask.id}
            initialToken={initialTask.shareToken}
            initialPublic={initialTask.isPublic}
          />

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "h-8 text-xs gap-1.5 transition-all shadow-sm",
              saveSuccess && "bg-emerald-600 hover:bg-emerald-600 text-white"
            )}
          >
            {saveSuccess ? (
              <>
                <Check className="size-3.5" />
                <span>Saved!</span>
              </>
            ) : saving ? (
              <>
                <span className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>Save Changes</span>
                <kbd className="hidden sm:inline-block ml-1 text-[10px] bg-primary-foreground/20 px-1 py-0.5 rounded font-mono">
                  ⌘S
                </kbd>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 size-8 p-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Hide Settings Sidebar" : "Show Settings Sidebar"}
          >
            {sidebarOpen ? (
              <PanelRightClose className="size-4 text-muted-foreground" />
            ) : (
              <PanelRightOpen className="size-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </header>

      {/* Error banner */}
      {errorMsg ? (
        <div className="shrink-0 bg-destructive/15 border-b border-destructive/30 px-4 py-2 text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs hover:underline font-bold">
            Dismiss
          </button>
        </div>
      ) : null}

      {/* 2. MAIN SPLIT VIEW CANVAS */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Primary Content Editor Canvas (Scrollable) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background/50">
          <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6">
            {/* Title Section */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Task Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be delivered or accomplished?"
                className="text-lg md:text-xl font-semibold bg-background border-border/80 focus-visible:ring-1 py-5 px-3.5 shadow-sm"
              />
            </div>

            {/* Brief / One-Line Summary */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Brief Context / Objectives
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="High-level goal, client constraints, or quick execution note..."
                className="text-xs leading-relaxed resize-none bg-background border-border/80 shadow-sm"
              />
            </div>

            {/* Rich Notes Canvas (Tiptap with AI support) */}
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="size-3.5 text-primary" />
                  Detailed Work Plan, Checklist &amp; Notes
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Full Rich Tiptap Canvas
                </span>
              </div>

              <div className="rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col">
                <TiptapEditorWithAI
                  workspace={workspace}
                  value={content}
                  onChange={setContent}
                  placeholder="Draft client brief specifications, step-by-step checklists, delivery links, or deliverables..."
                  heightClass="min-h-[420px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. SETTINGS & METADATA SIDEBAR */}
        {sidebarOpen ? (
          <aside className="w-80 md:w-96 shrink-0 border-l bg-card/60 overflow-y-auto flex flex-col p-4 md:p-5 gap-5 backdrop-blur-sm">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" /> Task Configuration
              </h3>
            </div>

            {/* Status Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Status</label>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      "text-xs px-2.5 py-1.5 rounded-lg border font-medium text-left transition-all",
                      status === opt.value
                        ? cn(opt.color, "ring-1 ring-primary/40 shadow-xs")
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Waiting On (if status is WAITING or BLOCKED) */}
            {status === "WAITING" || status === "BLOCKED" ? (
              <div className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <label className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> What is this waiting on?
                </label>
                <Input
                  value={waitingOn}
                  onChange={(e) => setWaitingOn(e.target.value)}
                  placeholder="e.g. Client brand assets, invoice approval..."
                  className="text-xs bg-background"
                />
              </div>
            ) : null}

            {/* Priority Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Priority Level</label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      "text-xs py-1.5 rounded-lg border font-medium text-center transition-all",
                      priority === opt.value
                        ? cn("bg-muted font-bold ring-1 ring-primary/40", opt.color)
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-muted-foreground" /> Deadline / Due Date
              </label>
              <Input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="text-xs bg-background font-mono"
              />
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <FolderGit2 className="size-3.5 text-muted-foreground" /> Associated Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full text-xs rounded-lg border border-border/80 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="">No Project (Standalone)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Attached Sheet/Doc URLs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Link2 className="size-3.5 text-muted-foreground" /> External URLs / Sheets
                </label>
                <span className="text-[10px] text-muted-foreground">1 per line</span>
              </div>
              <Textarea
                rows={3}
                value={linkUrlsText}
                onChange={(e) => setLinkUrlsText(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/...&#10;https://drive.google.com/drive/folders/..."
                className="text-xs font-mono resize-none bg-background"
              />

              {parsedLinks.length > 0 ? (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Preview ({parsedLinks.length})
                  </span>
                  {parsedLinks.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate p-1.5 rounded bg-muted/30 font-mono"
                    >
                      <Link2 className="size-3 shrink-0" />
                      <span className="truncate">{url}</span>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-border/60 space-y-2 mt-auto">
              <Button
                size="sm"
                variant="destructive"
                className="w-full text-xs gap-1.5 h-8 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 className="size-3.5" /> Delete Task
              </Button>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
