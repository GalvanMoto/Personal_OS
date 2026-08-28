"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckIcon, EyeIcon, PencilIcon, PlayIcon, Trash2Icon, UndoIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { deleteTaskAction, setTaskStatusAction } from "@/lib/actions/tasks"
import { cn } from "@/lib/utils"

export type TaskRowData = {
  id: string
  title: string
  status: string
  priority: string
  dueAt: string | null
  project: string | null
  waitingOn: string | null
  score?: number
  reasons?: string[]
}

const PRIORITY_VARIANT: Record<string, "destructive" | "secondary" | "outline"> = {
  URGENT: "destructive",
  HIGH: "secondary",
  MEDIUM: "outline",
  LOW: "outline",
}

function describeDue(iso: string | null): { label: string; overdue: boolean } | null {
  if (!iso) return null

  const due = new Date(iso)
  const now = new Date()
  const days = Math.round(
    (new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000
  )

  if (days < 0) {
    const late = Math.abs(days)
    return { label: `${late}d overdue`, overdue: true }
  }
  if (days === 0) return { label: "today", overdue: false }
  if (days === 1) return { label: "tomorrow", overdue: false }
  return { label: `in ${days}d`, overdue: false }
}

export function TaskRow({
  workspace,
  task,
  showReasons = false,
}: {
  workspace: string
  task: TaskRowData
  showReasons?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const done = task.status === "DONE"
  const due = describeDue(task.dueAt)

  function setStatus(status: "DONE" | "IN_PROGRESS" | "TODO") {
    startTransition(async () => {
      const result = await setTaskStatusAction(workspace, task.id, status)
      if (!result.ok) setError(result.error)
    })
  }

  function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return
    startTransition(async () => {
      const res = await deleteTaskAction(workspace, task.id)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-start gap-2">
        <Button
          size="icon-xs"
          variant={done ? "secondary" : "outline"}
          className="mt-0.5 shrink-0"
          disabled={pending}
          aria-label={done ? "Reopen task" : "Mark done"}
          onClick={() => setStatus(done ? "TODO" : "DONE")}
        >
          {pending ? <Spinner /> : done ? <UndoIcon /> : <CheckIcon />}
        </Button>

        <div className="min-w-0 flex-1">
          <Link href={`/w/${workspace}/tasks/${task.id}`} className={cn("block text-xs hover:underline", done && "text-muted-foreground line-through")}>
            {task.title}
          </Link>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.625rem] text-muted-foreground">
            {task.project ? <span>{task.project}</span> : null}

            {due ? (
              <span className={cn(due.overdue && "text-destructive")}>
                {due.label}
              </span>
            ) : null}

            {task.waitingOn ? <span>waiting: {task.waitingOn}</span> : null}

            {task.priority !== "MEDIUM" ? (
              <Badge
                variant={PRIORITY_VARIANT[task.priority] ?? "outline"}
                className="text-[0.625rem]"
              >
                {task.priority.toLowerCase()}
              </Badge>
            ) : null}
          </div>

          {/* The recommendation's justification, so a ranking is explainable. */}
          {showReasons && task.reasons?.length ? (
            <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
              {task.reasons.join(" · ")}
            </p>
          ) : null}

          {error ? (
            <p className="mt-0.5 text-[0.625rem] text-destructive">{error}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link href={`/w/${workspace}/tasks/${task.id}/edit`} className="inline-flex items-center justify-center size-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Edit task" title="Edit task">
            <PencilIcon className="size-3.5" />
          </Link>
          <Link href={`/w/${workspace}/tasks/${task.id}`} className="inline-flex items-center justify-center size-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="View task" title="View task">
            <EyeIcon className="size-3.5" />
          </Link>
          <Button
            size="icon-xs"
            variant="ghost"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            disabled={pending}
            aria-label="Delete task"
            onClick={handleDelete}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
          {!done && task.status !== "IN_PROGRESS" ? (
            <Button
              size="icon-xs"
              variant="ghost"
              className="shrink-0"
              disabled={pending}
              aria-label="Start task"
              onClick={() => setStatus("IN_PROGRESS")}
            >
              <PlayIcon />
            </Button>
          ) : null}
        </div>
      </div>
      <Separator />
    </div>
  )
}
