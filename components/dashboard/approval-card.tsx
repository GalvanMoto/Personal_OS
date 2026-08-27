"use client"

import { useState, useTransition } from "react"
import { CheckIcon, XIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { approveRequestAction, rejectRequestAction } from "@/lib/actions/approvals"

/**
 * A sensitive action an agent wants to take (PRD §19, §25).
 *
 * The exact arguments are shown, not a paraphrase — approving something whose
 * effect you cannot see is not consent.
 */
export function ApprovalCard({
  workspace,
  request,
}: {
  workspace: string
  request: {
    id: string
    tool: string
    agent: string
    reason: string
    args: string
  }
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function decide(approve: boolean) {
    startTransition(async () => {
      const result = approve
        ? await approveRequestAction(workspace, request.id)
        : await rejectRequestAction(workspace, request.id)

      if (!result.ok) setError(result.error)
    })
  }

  return (
    <Alert>
      <AlertDescription className="flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[0.625rem]">
            {request.agent}
          </Badge>
          <span>wants to run</span>
          <Badge variant="outline" className="font-mono text-[0.625rem]">
            {request.tool}
          </Badge>
        </div>

        <p className="text-muted-foreground">{request.reason}</p>

        <pre className="max-h-32 overflow-auto rounded-sm bg-muted p-2 font-mono text-[0.625rem]">
          {request.args}
        </pre>

        {error ? <p className="text-destructive">{error}</p> : null}

        <div className="flex gap-1.5">
          <Button size="sm" disabled={pending} onClick={() => decide(true)}>
            {pending ? <Spinner /> : <CheckIcon />}
            Approve and run
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => decide(false)}
          >
            <XIcon />
            Decline
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
