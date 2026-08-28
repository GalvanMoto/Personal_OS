"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, Trash2, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  deleteTaskAction,
  setTaskStatusAction,
  toggleChecklistItemAction,
} from "@/lib/actions/tasks"

const STATUSES = ["TODO", "IN_PROGRESS", "WAITING", "BLOCKED", "DONE", "CANCELLED"] as const

export function TaskDetailActions({
  workspace,
  task,
}: {
  workspace: string
  task: { id: string; title: string; description: string | null; content?: unknown | null; linkUrls?: string[] | null; status: string; priority: string; dueAt: string | null }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return
    startTransition(async () => {
      const res = await deleteTaskAction(workspace, task.id)
      if (res.ok) router.push(`/w/${workspace}/tasks`)
      else setError(res.error)
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

      <Link
        href={`/w/${workspace}/tasks/${task.id}/edit`}
        className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-md border border-input bg-background hover:bg-muted font-medium transition-colors"
      >
        <Pencil className="size-3" /> Edit
      </Link>

      <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={handleDelete} disabled={pending}>
        <Trash2 className="size-3" /> Delete
      </Button>
      {error ? <Badge variant="destructive" className="text-[0.625rem]">{error}</Badge> : null}
    </div>
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
