"use client"

import * as React from "react"
import { Check, Clock, Loader2, Pause, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface WorkSessionTimerProps {
  workspace: string
  projectId: string
  projectName: string
}

export function WorkSessionTimer({
  workspace,
  projectId,
  projectName,
}: WorkSessionTimerProps) {
  const [isRunning, setIsRunning] = React.useState(false)
  const [seconds, setSeconds] = React.useState(0)
  const [sessionNotes, setSessionNotes] = React.useState("")
  const [savedSuccess, setSavedSuccess] = React.useState(false)

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    setIsRunning(true)
    setSavedSuccess(false)
  }

  const handleStop = () => {
    setIsRunning(false)
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      setSeconds(0)
    }, 3000)
  }

  return (
    <div className="flex items-center gap-2">
      {isRunning ? (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-xs">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-semibold text-primary">{formatDuration(seconds)}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStop}
            className="h-6 px-2 text-[0.6875rem] text-destructive hover:bg-destructive/10"
          >
            <Square className="size-3 fill-destructive mr-1" />
            Stop Session
          </Button>
        </div>
      ) : savedSuccess ? (
        <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/30 text-xs py-1">
          <Check className="size-3" />
          Work Session Logged ({formatDuration(seconds)})
        </Badge>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={handleStart}
          className="h-8 gap-1.5 px-3 text-xs border-primary/40 text-primary hover:bg-primary/5 font-medium shadow-xs"
        >
          <Play className="size-3.5 fill-primary" />
          <span>Start Work</span>
        </Button>
      )}
    </div>
  )
}
