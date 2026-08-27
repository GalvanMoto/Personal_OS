"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Layers,
  Loader2,
  Play,
  Sparkles,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { previewImportPlanAction, executeImportPlanAction } from "@/app/w/[workspace]/commitments/import-actions"
import type { ImportPlan } from "@/lib/domain/import-intelligence"
import { cn } from "@/lib/utils"

export function ImportSourcesDrawer({
  workspace,
  organizations,
}: {
  workspace: string
  organizations: Array<{ id: string; name: string }>
}) {
  const [open, setOpen] = useState(false)
  const [sheetUrl, setSheetUrl] = useState("")
  const [docUrl, setDocUrl] = useState("")
  const [briefText, setBriefText] = useState("")
  const [clientHint, setClientHint] = useState(organizations[0]?.name || "Karna Kreative")

  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<string | null>(null)

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setPlan(null)
    setReport(null)

    const urls = [sheetUrl.trim(), docUrl.trim()].filter(Boolean)

    try {
      const res = await previewImportPlanAction(workspace, {
        message: briefText.trim(),
        sourceUrls: urls,
        clientHint: clientHint.trim(),
      })

      if (!res.success || !res.plan) {
        setError(res.error || "Failed to analyze sources")
      } else {
        setPlan(res.plan)
      }
    } catch {
      setError("An unexpected error occurred during source analysis.")
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!plan) return
    setExecuting(true)
    setError(null)

    try {
      const res = await executeImportPlanAction(workspace, plan)
      if (!res.success) {
        setError(res.error || "Failed to execute import plan")
      } else {
        setReport(res.report || "Import completed successfully!")
        toast.add({
          title: "Sources Organized",
          description: `Created ${res.tasksCreated} tasks across ${plan.brands.length} brands.`,
          type: "success",
        } as unknown as Parameters<typeof toast.add>[0])
      }
    } catch {
      setError("An error occurred while executing the import plan.")
    } finally {
      setExecuting(false)
    }
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 font-medium"
      >
        <Sparkles className="size-3.5" />
        <span>Import & Organize Sources</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                <Sparkles className="size-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold">
                  Import Intelligence (Sheet + Doc + Brief)
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Give the Assistant raw links or messages — it extracts brands, deliverables, merged requirements, and checks assets.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {error}
              </div>
            )}

            {report ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs">
                  <pre className="font-sans whitespace-pre-wrap leading-relaxed text-foreground">
                    {report}
                  </pre>
                </div>
                <Button
                  onClick={() => {
                    setPlan(null)
                    setReport(null)
                    setOpen(false)
                  }}
                  className="w-full"
                  size="sm"
                >
                  Done
                </Button>
              </div>
            ) : plan ? (
              /* IMPORT PLAN PREVIEW */
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-semibold text-sm">Proposed Import Plan</h3>
                    <p className="text-[0.6875rem] text-muted-foreground">
                      Review extracted deliverables, matched brands, and merged requirements before applying.
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1 font-mono text-xs">
                    <Building2 className="size-3" />
                    {plan.client.name}
                  </Badge>
                </div>

                {/* Brands summary */}
                <div className="space-y-1.5">
                  <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                    Brand Accounts Detected ({plan.brands.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.brands.map((b) => (
                      <Badge
                        key={b.name}
                        variant={b.isExisting ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {b.name} {b.isExisting ? "✓ Matched" : "+ New Brand"}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Deliverables breakdown */}
                <div className="space-y-2">
                  <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                    Deliverables &amp; Merged Tasks ({plan.deliverables.reduce((s, d) => s + d.tasks.length, 0)} total)
                  </span>
                  <div className="space-y-2">
                    {plan.deliverables.map((del, idx) => (
                      <Card key={idx} className="bg-card/50">
                        <CardContent className="p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">
                              {del.brandName} • {del.quantity} {del.deliverableType}s ({del.frequency.toLowerCase()})
                            </span>
                            <Badge variant="outline" className="text-[0.625rem]">
                              Due {del.deadlineText || "Friday"}
                            </Badge>
                          </div>

                          <div className="space-y-1 pt-1 border-t">
                            {del.tasks.map((task, tIdx) => (
                              <div
                                key={tIdx}
                                className="flex flex-col gap-0.5 rounded bg-muted/40 p-1.5 text-[0.6875rem]"
                              >
                                <span className="font-medium text-foreground">{task.title}</span>
                                {task.requirement && (
                                  <span className="text-muted-foreground">
                                    💡 <strong>Brief:</strong> {task.requirement}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Missing Assets & Conflicts */}
                {(plan.assetsMissing.length > 0 || plan.conflicts.length > 0) && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 space-y-2 text-xs">
                    {plan.assetsMissing.length > 0 && (
                      <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Missing Assets Flagged:</span>{" "}
                          {plan.assetsMissing.join(", ")} (not found in workspace files).
                        </div>
                      </div>
                    )}
                    {plan.conflicts.map((c, i) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        ⚖️ <strong>{c.field} Conflict:</strong> {c.description} → <em>{c.resolution}</em>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlan(null)}
                    disabled={executing}
                  >
                    Edit Input
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleExecute}
                    disabled={executing}
                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {executing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Zap className="size-3.5" />
                    )}
                    <span>Apply &amp; Create Tasks</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* INPUT FORM */
              <form onSubmit={handlePreview} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Client Organization
                  </label>
                  <Input
                    value={clientHint}
                    onChange={(e) => setClientHint(e.target.value)}
                    placeholder="e.g. Karna Kreative"
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileSpreadsheet className="size-3.5 text-emerald-500" />
                    Google Sheet URL (Deliverables Grid)
                  </label>
                  <Input
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="size-3.5 text-indigo-500" />
                    Google Doc URL (Creative Brief / Requirements)
                  </label>
                  <Input
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Or Paste Raw Client Message / Brief
                  </label>
                  <Textarea
                    value={briefText}
                    onChange={(e) => setBriefText(e.target.value)}
                    placeholder="e.g. WOW Indian needs 3 reels this week. Reel 1: New menu items. Reel 2: Event highlights. Reel 3: Customer reactions. Delivery by Friday. Use new logo and food photography."
                    rows={4}
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || (!sheetUrl && !docUrl && !briefText)}
                  className="w-full h-9 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                  <span>Analyze &amp; Generate Import Plan</span>
                </Button>
              </form>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
