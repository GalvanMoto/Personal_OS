"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  LinkIcon,
  ListTodo,
  Loader2,
  Plus,
  Sparkles,
  Target,
  X,
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TiptapEditorWithAI } from "@/components/ui/tiptap-editor-with-ai"
import { createTaskAction } from "@/lib/actions/tasks"

interface CreateTaskDrawerProps {
  workspace: string
  trigger?: React.ReactNode
  defaultProjectId?: string
}

export function CreateTaskDrawer({
  workspace,
  trigger,
  defaultProjectId,
}: CreateTaskDrawerProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState("basic")
  const [checklist, setChecklist] = React.useState<string[]>([])
  const [newChecklistItem, setNewChecklistItem] = React.useState("")
  const [richContent, setRichContent] = React.useState<unknown>(null)
  const [linkUrlsText, setLinkUrlsText] = React.useState("")
  const router = useRouter()

  const handleAddChecklist = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return
    e.preventDefault()
    if (!newChecklistItem.trim()) return
    setChecklist((prev) => [...prev, newChecklistItem.trim()])
    setNewChecklistItem("")
  }

  const handleRemoveChecklist = (idx: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    if (checklist.length > 0) {
      formData.set("checklist", JSON.stringify(checklist))
    }
    if (richContent) formData.set("content", JSON.stringify(richContent))
    const links = linkUrlsText.split(/[,\n]+/).map((s)=>s.trim()).filter(Boolean).slice(0,12)
    if (links.length) formData.set("linkUrls", JSON.stringify(links))

    try {
      await createTaskAction(workspace, formData)
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setChecklist([])
        setRichContent(null)
        setLinkUrlsText("")
        router.refresh()
      }, 600)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setPending(false)
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
          <span>New Task</span>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="w-[420px] sm:w-[560px] p-0 flex flex-col h-full bg-background border-l">
        {/* Top Header */}
        <div className="px-6 py-5 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <ListTodo className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
                Create Intelligent Task
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Deliverable item with subtasks checklist, priority scoring, and effort estimation.
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
            <span>Task registered in execution graph!</span>
          </div>
        ) : null}

        {/* Main Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-9 p-1 bg-muted/50 rounded-lg text-xs">
                <TabsTrigger value="basic" className="gap-1.5 py-1 text-xs">
                  <FileText className="size-3.5" />
                  <span>Basic</span>
                </TabsTrigger>
                <TabsTrigger value="dates" className="gap-1.5 py-1 text-xs">
                  <Clock className="size-3.5" />
                  <span>Dates</span>
                </TabsTrigger>
                <TabsTrigger value="checklist" className="gap-1.5 py-1 text-xs">
                  <Layers className="size-3.5" />
                  <span>Checklist</span>
                </TabsTrigger>
                <TabsTrigger value="context" className="gap-1.5 py-1 text-xs">
                  <Target className="size-3.5" />
                  <span>Next Action</span>
                </TabsTrigger>
              </TabsList>

              {/* 1. BASIC INFO */}
              <TabsContent value="basic" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Task Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="title"
                    required
                    placeholder="e.g. Finalize Video Cut for GB Banquet"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Task Type</label>
                    <select
                      name="taskType"
                      defaultValue="CLIENT_WORK"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="CLIENT_WORK">Client Work</option>
                      <option value="DEVELOPMENT">Development</option>
                      <option value="DESIGN">Design &amp; UI</option>
                      <option value="CONTENT">Content &amp; Media</option>
                      <option value="MARKETING">Marketing &amp; SEO</option>
                      <option value="RESEARCH">Research &amp; Planning</option>
                      <option value="ADMIN">Admin &amp; Operations</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Priority</label>
                    <select
                      name="priority"
                      defaultValue="MEDIUM"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="URGENT">Urgent (Immediate Focus)</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Initial Status</label>
                    <select
                      name="status"
                      defaultValue="TODO"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="TODO">To Do (Not Started)</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING">Waiting on Client</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="BACKLOG">Backlog</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Project Association</label>
                    <Input
                      name="projectId"
                      defaultValue={defaultProjectId || ""}
                      placeholder="Optional Project ID"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Description &amp; Specifications (plain)</label>
                  <Textarea
                    name="description"
                    rows={3}
                    placeholder="Short plain text for search…"
                    className="text-xs resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1">Rich Notes (Tiptap) <span className="text-muted-foreground font-normal">— right chat reads/writes & tables</span></label>
                  <TiptapEditorWithAI workspace={workspace} value={richContent} onChange={setRichContent} placeholder="Paste Sheet/Doc details… Use right chat: ‘create table’, ‘rewrite selection’." />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1"><LinkIcon className="size-3" /> Linked Sheet / Doc URLs</label>
                  <Input value={linkUrlsText} onChange={(e)=>setLinkUrlsText(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..., https://docs.google.com/document/d/..." className="h-8 text-xs font-mono" />
                  <p className="text-[0.625rem] text-muted-foreground">Comma or newline separated — become clickable on detail page and are read by <code>organize_sources</code> agent.</p>
                </div>
              </TabsContent>

              {/* 2. DATES & EFFORT */}
              <TabsContent value="dates" className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Due Date</label>
                    <Input name="dueAt" type="date" className="h-9 text-xs font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Estimated Duration</label>
                    <Input name="estimateMin" type="number" placeholder="60 min" className="h-9 text-xs font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Reminder Escalation Policy</label>
                  <select
                    name="reminderPolicy"
                    defaultValue="AUTOMATIC"
                    className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="AUTOMATIC">Automatic (3 days before, morning of deadline, overdue escalation)</option>
                    <option value="URGENT_ONLY">Urgent Deadlines Only</option>
                    <option value="NONE">No Automated Reminders</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Waiting On / Blocked Reason</label>
                  <Input
                    name="waitingOn"
                    placeholder="e.g. Waiting for brand assets from Sarah"
                    className="h-9 text-xs"
                  />
                </div>
              </TabsContent>

              {/* 3. CHECKLIST */}
              <TabsContent value="checklist" className="mt-4 space-y-4 text-xs">
                <div className="space-y-3">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Subtasks &amp; Action Checklist</span>
                    <Badge variant="outline" className="text-[0.625rem] font-mono">{checklist.length} items</Badge>
                  </label>

                  <div className="flex items-center gap-2">
                    <Input
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={handleAddChecklist}
                      placeholder="Add subtask step (press Enter)..."
                      className="h-9 text-xs"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={handleAddChecklist} className="h-9 text-xs px-3">
                      Add
                    </Button>
                  </div>

                  {checklist.length > 0 ? (
                    <div className="divide-y rounded-lg border bg-muted/20 text-xs">
                      {checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5">
                          <span className="truncate">{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklist(idx)}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-6 text-center text-xs">
                      No subtasks added yet. Type an action item above and press Enter.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* 4. NEXT ACTION & CONTEXT */}
              <TabsContent value="context" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Concrete Next Action</label>
                  <Input
                    name="nextAction"
                    placeholder="e.g. Download latest event photos from Drive"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Expected Outcome</label>
                  <Input
                    name="expectedOutcome"
                    placeholder="e.g. Final 30s MP4 reel ready for client approval"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Asset / Drive Link</label>
                  <Input
                    name="assetUrl"
                    placeholder="https://drive.google.com/..."
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky Bottom Footer */}
          <div className="mt-auto border-t bg-muted/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[0.625rem] text-muted-foreground font-mono">
              Press Enter to create
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
                    Create Task
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
