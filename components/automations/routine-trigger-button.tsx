"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { triggerRoutineAction } from "@/lib/actions/automations"

interface RoutineTriggerButtonProps {
  workspace: string
  kind: string
}

export function RoutineTriggerButton({ workspace, kind }: RoutineTriggerButtonProps) {
  const [pending, setPending] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const router = useRouter()

  const handleTrigger = async () => {
    setPending(true)
    setSuccess(false)
    try {
      const res = await triggerRoutineAction(workspace, kind)
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          router.refresh()
        }, 1000)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={handleTrigger}
      className="h-7 gap-1.5 px-2.5 text-[0.6875rem] font-medium transition-colors"
    >
      {pending ? (
        <>
          <Loader2 className="size-3 animate-spin text-primary" />
          <span>Executing...</span>
        </>
      ) : success ? (
        <>
          <Check className="size-3 text-emerald-500" />
          <span className="text-emerald-500">Completed</span>
        </>
      ) : (
        <>
          <Play className="size-3 text-primary" />
          <span>Trigger Now</span>
        </>
      )}
    </Button>
  )
}
