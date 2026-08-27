"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderGit2,
  HardDrive,
  LinkIcon,
  Loader2,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Target,
  User,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { createDocumentAction } from "@/lib/actions/entities"

interface CreateDocumentDrawerProps {
  workspace: string
  trigger?: React.ReactNode
  defaultProjectId?: string
}

export function CreateDocumentDrawer({
  workspace,
  trigger,
  defaultProjectId,
}: CreateDocumentDrawerProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState("basic")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    const res = await createDocumentAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to create document")
    } else {
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        router.refresh()
      }, 600)
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
          <span>New Document</span>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="w-[420px] sm:w-[560px] p-0 flex flex-col h-full bg-background border-l">
        {/* Top Header */}
        <div className="px-6 py-5 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <BookOpen className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
                Author Knowledge Document
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Structured knowledge layer: client briefs, specifications, legal agreements, and SOPs.
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
            <span>Document indexed into semantic knowledge graph!</span>
          </div>
        ) : null}

        {/* Main Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9 p-1 bg-muted/50 rounded-lg text-xs">
                <TabsTrigger value="basic" className="gap-1.5 py-1 text-xs">
                  <FileText className="size-3.5" />
                  <span>Basic</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-1.5 py-1 text-xs">
                  <FileCode className="size-3.5" />
                  <span>Content</span>
                </TabsTrigger>
                <TabsTrigger value="relations" className="gap-1.5 py-1 text-xs">
                  <Target className="size-3.5" />
                  <span>Context</span>
                </TabsTrigger>
              </TabsList>

              {/* 1. BASIC TAB */}
              <TabsContent value="basic" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Document Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="title"
                    required
                    placeholder="e.g. GB Banquet Social Media Deliverables Specification"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Document Type</label>
                    <select
                      name="type"
                      defaultValue="BRIEF"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="BRIEF">Client Brief / Requirements</option>
                      <option value="SPECIFICATION">Technical Specification / SOP</option>
                      <option value="CONTRACT">Contract / Legal Agreement</option>
                      <option value="PROPOSAL">Proposal / Estimate</option>
                      <option value="REPORT">Report / Analysis</option>
                      <option value="RESEARCH">Research Document</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Status</label>
                    <select
                      name="status"
                      defaultValue="ACTIVE"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="ACTIVE">Active (Canonical)</option>
                      <option value="DRAFT">Draft</option>
                      <option value="REVIEW">Under Review</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">AI Summary / Overview</label>
                  <Textarea
                    name="summary"
                    rows={3}
                    placeholder="Concise summary of key goals, deliverables, deadlines, and requirements..."
                    className="text-xs resize-none"
                  />
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 text-[0.6875rem] text-muted-foreground flex items-center gap-2">
                  <Sparkles className="size-4 shrink-0 text-primary" />
                  <span>
                    Personal OS will tokenize document sections and make them semantically searchable for all AI agents.
                  </span>
                </div>
              </TabsContent>

              {/* 2. CONTENT TAB */}
              <TabsContent value="content" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Markdown Content &amp; Structured Text</span>
                    <span className="text-[0.625rem] text-muted-foreground font-mono">Markdown supported</span>
                  </label>
                  <Textarea
                    name="content"
                    rows={12}
                    placeholder="# Project Scope&#10;&#10;## 1. Requirements&#10;- Deliverable A&#10;- Deliverable B&#10;&#10;## 2. Deadlines&#10;Final delivery by Friday 28 Aug."
                    className="text-xs font-mono resize-none"
                  />
                </div>
              </TabsContent>

              {/* 3. RELATIONS & CONTEXT */}
              <TabsContent value="relations" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Project Association</label>
                  <Input
                    name="projectId"
                    defaultValue={defaultProjectId || ""}
                    placeholder="Link to Project ID"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Client / Organization</label>
                  <Input
                    name="clientName"
                    placeholder="e.g. GB Banquet &amp; Hospitality"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Underlying File ID (Optional)</label>
                  <Input
                    name="fileId"
                    placeholder="Link to physical FileObject ID"
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
                    Save Document
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
