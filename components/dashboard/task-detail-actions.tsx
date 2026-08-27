"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  deleteTaskAction,
  updateTaskAction,
  setTaskStatusAction,
  toggleChecklistItemAction,
} from "@/lib/actions/tasks"

const STATUSES = ["TODO", "IN_PROGRESS", "WAITING", "BLOCKED", "DONE", "CANCELLED"] as const

export function TaskDetailActions({
  workspace,
  task,
}: {
  workspace: string
  task: { id: string; title: string; description: string | null; status: string; priority: string; dueAt: string | null }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return
    startTransition(async () => {
      const res = await deleteTaskAction(workspace, task.id)
      if (res.ok) router.push(`/w/${workspace}/tasks`)
      else setError(res.error)
    })
  }

  function handleEdit() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set("title", title)
      fd.set("description", description)
      const res = await updateTaskAction(workspace, task.id, fd)
      if (res.ok) {
        setEditOpen(false)
        router.refresh()
      } else setError(res.error)
    })
  }

  function handleStatus(s: string) {
    const waitingOn = s === "WAITING" || s === "BLOCKED" ? prompt("What is this waiting on?") : undefined
    if ((s === "WAITING" || s === "BLOCKED") && !waitingOn) return
    startTransition(async () => {
      const res = await setTaskStatusAction(workspace, task.id, s as never, waitingOn ?? undefined)
      if (res.ok) router.refresh()
      else setError(res.error)
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={pending} />
            }
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            {task.status.replace("_", " ")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            {STATUSES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => handleStatus(s)}>
                {s.replace("_", " ")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setEditOpen(true)} disabled={pending}>
          <Pencil className="size-3" /> Edit
        </Button>
        <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={handleDelete} disabled={pending}>
          <Trash2 className="size-3" /> Delete
        </Button>
        {error ? <Badge variant="destructive" className="text-[0.625rem]">{error}</Badge> : null}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-8 text-xs" />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="text-xs" />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}><X className="size-3" /> Cancel</Button>
            <Button size="sm" onClick={handleEdit} disabled={pending || !title.trim()}>{pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ChecklistToggle({
  workspace,
  item,
}: {
  workspace: string
  item: { id: string; label: string; done: boolean }
}) {
  const [done, setDone] = useState(item.done)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  function toggle() {
    const next = !done
    setDone(next)
    startTransition(async () => {
      const res = await toggleChecklistItemAction(workspace, item.id, next)
      if (!res.ok) setDone(!next)
      else router.refresh()
    })
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="flex items-center gap-2.5 py-2 w-full text-left hover:bg-muted/20 rounded px-1 -mx-1 transition-colors"
    >
      <span className={`size-4 rounded border flex items-center justify-center shrink-0 ${done ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
        {done ? <Check className="size-3" /> : null}
      </span>
      <span className={`text-xs ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.label}</span>
    </button>
  )
}
