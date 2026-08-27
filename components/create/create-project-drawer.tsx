"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  Code2,
  FileText,
  FolderGit2,
  GitBranch,
  Globe,
  HardDrive,
  Layers,
  LinkIcon,
  ListTodo,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Terminal,
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
import { createProjectAction } from "@/lib/actions/entities"

interface CreateProjectDrawerProps {
  workspace: string
  trigger?: React.ReactNode
}

export function CreateProjectDrawer({
  workspace,
  trigger,
}: CreateProjectDrawerProps) {
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

    const res = await createProjectAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to create project")
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
          <span>New Project</span>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="w-[420px] sm:w-[560px] p-0 flex flex-col h-full bg-background border-l">
        {/* Top Header */}
        <div className="px-6 py-5 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <FolderGit2 className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
                Create Project Initiative
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Central home for deliverables, work sessions, repository metadata, and assets.
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
            <span>Project initiative created successfully!</span>
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
                <TabsTrigger value="planning" className="gap-1.5 py-1 text-xs">
                  <Target className="size-3.5" />
                  <span>Goals</span>
                </TabsTrigger>
                <TabsTrigger value="technical" className="gap-1.5 py-1 text-xs">
                  <Code2 className="size-3.5" />
                  <span>Technical</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-1.5 py-1 text-xs">
                  <LinkIcon className="size-3.5" />
                  <span>Links</span>
                </TabsTrigger>
              </TabsList>

              {/* 1. BASIC INFO TAB */}
              <TabsContent value="basic" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Project Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="name"
                    required
                    placeholder="e.g. Brand Identity Overhaul 2026"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Project Type</label>
                    <select
                      name="projectType"
                      defaultValue="DEVELOPMENT"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="DEVELOPMENT">Development / Software</option>
                      <option value="CLIENT_WORK">Client Work</option>
                      <option value="SAAS">SaaS Product</option>
                      <option value="MARKETING">Marketing &amp; SEO</option>
                      <option value="CONTENT">Content &amp; Media</option>
                      <option value="INTERNAL">Internal / Personal</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Initial Status</label>
                    <select
                      name="status"
                      defaultValue="ACTIVE"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="ACTIVE">Active (In Flight)</option>
                      <option value="PLANNING">Planning Stage</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Scope &amp; Overview</label>
                  <Textarea
                    name="description"
                    rows={4}
                    placeholder="What is this initiative and what does it aim to accomplish?"
                    className="text-xs resize-none"
                  />
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 text-[0.6875rem] text-muted-foreground flex items-center gap-2">
                  <Sparkles className="size-4 shrink-0 text-primary" />
                  <span>
                    Personal OS will automatically compute project velocity, health score, and link active work sessions.
                  </span>
                </div>
              </TabsContent>

              {/* 2. GOALS & PLANNING TAB */}
              <TabsContent value="planning" className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Start Date</label>
                    <Input name="startDate" type="date" className="h-9 text-xs font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Target Deadline</label>
                    <Input name="dueAt" type="date" className="h-9 text-xs font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Primary Success Objective</label>
                  <Input
                    name="goal"
                    placeholder="e.g. Deploy full offline PWA with agent automation"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Initial Deliverables Checklist</label>
                  <Textarea
                    name="deliverables"
                    rows={3}
                    placeholder="• Setup core application&#10;• Bank statement parser&#10;• Multi-tenant security tests"
                    className="text-xs font-mono resize-none"
                  />
                </div>
              </TabsContent>

              {/* 3. TECHNICAL METADATA TAB */}
              <TabsContent value="technical" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <GitBranch className="size-3.5 text-primary" />
                    Repository URL (Manual Link)
                  </label>
                  <Input
                    name="repoUrl"
                    placeholder="https://github.com/organization/repo"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Default Branch</label>
                    <Input name="branch" defaultValue="main" className="h-9 text-xs font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Local Directory Path</label>
                    <Input name="localPath" placeholder="~/Documents/project" className="h-9 text-xs font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Local Dev URL</label>
                    <Input name="devUrl" defaultValue="http://localhost:3000" className="h-9 text-xs font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Production URL</label>
                    <Input name="prodUrl" placeholder="https://app.domain.com" className="h-9 text-xs font-mono" />
                  </div>
                </div>
              </TabsContent>

              {/* 4. LINKS & DRIVE TAB */}
              <TabsContent value="links" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <HardDrive className="size-3.5 text-primary" />
                    Google Drive Assets Folder
                  </label>
                  <Input
                    name="driveUrl"
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="size-3.5 text-primary" />
                    Design / Figma Board URL
                  </label>
                  <Input
                    name="figmaUrl"
                    placeholder="https://figma.com/file/..."
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Architecture Notes &amp; ADRs</label>
                  <Textarea
                    name="notes"
                    rows={3}
                    placeholder="Architecture decisions, meeting takeaways, client constraints..."
                    className="text-xs resize-none"
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
                    Create Project
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
