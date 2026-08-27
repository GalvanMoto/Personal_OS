"use client"

import { useState, useTransition } from "react"
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderGit2,
  Layers,
  Lock,
  Mail,
  Receipt,
  Shield,
  ShieldAlert,
  Sparkles,
  User,
  X,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { applyProposalAction, dismissInboxItemAction } from "@/lib/actions/inbox"

export type InboxProposal = {
  summary: string
  organization: { name: string; confidence: number } | null
  project: { name: string } | null
  tasks: Array<{ title: string; priority: string; dueAt: string | null }>
  assets: Array<{ label: string }>
  questions: string[]
  deadline: { dueAt: string; phrase: string; confidence: number } | null
}

export type InboxCardItem = {
  id: string
  title: string | null
  rawText: string | null
  kind: string
  status: string
  error: string | null
  createdAt: string
  proposal: InboxProposal | null
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })

export function InboxItemCard({
  workspace,
  item,
}: {
  workspace: string
  item: InboxCardItem
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const proposal = item.proposal

  const isFinancial =
    item.kind.toLowerCase().includes("pdf") ||
    item.title?.toLowerCase().includes("statement") ||
    item.title?.toLowerCase().includes("invoice") ||
    item.title?.toLowerCase().includes("bank")

  const importanceLevel = isFinancial
    ? "Critical"
    : proposal?.deadline
      ? "Important"
      : "Relevant"

  const sensitivityLevel = isFinancial ? "Highly Sensitive" : "Internal"

  function accept() {
    startTransition(async () => {
      const result = await applyProposalAction(workspace, item.id)
      if (!result.ok) setError(result.error)
    })
  }

  function dismiss() {
    startTransition(async () => {
      const result = await dismissInboxItemAction(workspace, item.id)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <Card className="transition-all hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                {item.title ?? "Raw Ingested Item"}
              </CardTitle>
              <Badge
                variant={importanceLevel === "Critical" ? "destructive" : "secondary"}
                className="text-[0.625rem] font-medium"
              >
                {importanceLevel}
              </Badge>
            </div>
            <p className="text-[0.625rem] text-muted-foreground font-mono">
              Provenance: {item.kind.toUpperCase()} · Received {formatDate(item.createdAt)}
            </p>
          </div>

          <Badge variant="outline" className="text-[0.625rem] gap-1 font-mono">
            <Lock className="size-2.5 text-muted-foreground" />
            {sensitivityLevel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-xs">
        {item.rawText ? (
          <div className="rounded-md border bg-muted/20 p-2.5 font-mono text-[0.6875rem] text-muted-foreground line-clamp-3 whitespace-pre-wrap">
            {item.rawText}
          </div>
        ) : null}

        {item.error ? (
          <Alert variant="destructive">
            <AlertDescription>{item.error}</AlertDescription>
          </Alert>
        ) : null}

        {proposal ? (
          <div className="space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" /> AI Extracted Intelligence
              </span>
              <span className="text-[0.625rem] text-muted-foreground font-mono">98% Confidence</span>
            </div>

            <p className="text-[0.6875rem] text-muted-foreground leading-relaxed">
              {proposal.summary}
            </p>

            {/* Extracted Entity Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {proposal.organization ? (
                <Badge variant="secondary" className="gap-1 text-[0.625rem]">
                  <Building2 className="size-3 text-primary" />
                  <span>{proposal.organization.name}</span>
                  <span className="opacity-60 font-mono">
                    {Math.round(proposal.organization.confidence * 100)}%
                  </span>
                </Badge>
              ) : null}

              {proposal.project ? (
                <Badge variant="outline" className="gap-1 text-[0.625rem]">
                  <FolderGit2 className="size-3 text-primary" />
                  <span>{proposal.project.name}</span>
                </Badge>
              ) : null}

              {proposal.deadline ? (
                <Badge variant="outline" className="gap-1 text-[0.625rem] text-amber-500 border-amber-500/30">
                  <Clock className="size-3" />
                  <span>Due {formatDate(proposal.deadline.dueAt)}</span>
                </Badge>
              ) : null}
            </div>

            {/* Inferred Deliverables Checklist */}
            {proposal.tasks.length > 0 ? (
              <div className="space-y-1 pt-1.5 border-t border-primary/10">
                <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Detected Deliverables ({proposal.tasks.length})
                </span>
                <ul className="space-y-1">
                  {proposal.tasks.map((task, index) => (
                    <li key={index} className="flex items-center justify-between text-[0.6875rem] bg-background/60 rounded px-2 py-1 border">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className="text-[0.5625rem]">
                        {task.priority}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {proposal.assets.length > 0 ? (
              <p className="text-[0.625rem] text-muted-foreground font-mono">
                Asset Dependencies: {proposal.assets.map((asset) => asset.label).join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={accept}
              disabled={pending || !proposal}
              className="h-7 gap-1.5 px-3 text-xs"
            >
              {pending ? <Spinner /> : <Check className="size-3.5" />}
              <span>
                {proposal
                  ? `Accept & Route to Graph (${proposal.tasks.length} task${proposal.tasks.length === 1 ? "" : "s"})`
                  : "Processed"}
              </span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={dismiss}
              disabled={pending}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="size-3 mr-1" />
              Ignore / Noise
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
