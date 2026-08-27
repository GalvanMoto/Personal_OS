"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  FolderGit2,
  ListTodo,
  Loader2,
  Plus,
  StickyNote,
  Users2,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  createClientAction,
  createNoteAction,
  createProjectAction,
  createTransactionAction,
} from "@/lib/actions/entities"
import { createTaskAction } from "@/lib/actions/tasks"

interface QuickCreateModalProps {
  workspace: string
}

export function QuickCreateModal({ workspace }: QuickCreateModalProps) {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("task")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const router = useRouter()

  const handleTaskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      await createTaskAction(workspace, formData)
      setSuccess("Task created successfully!")
      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
        router.refresh()
      }, 700)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setPending(false)
    }
  }

  const handleProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const res = await createProjectAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to create project")
    } else {
      setSuccess("Project created!")
      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
        router.refresh()
      }, 700)
    }
  }

  const handleClientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const res = await createClientAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to create client")
    } else {
      setSuccess("Client added!")
      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
        router.refresh()
      }, 700)
    }
  }

  const handleNoteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const res = await createNoteAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to save note")
    } else {
      setSuccess("Note saved to knowledge graph!")
      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
        router.refresh()
      }, 700)
    }
  }

  const handleTransactionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const res = await createTransactionAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to record transaction")
    } else {
      setSuccess("Transaction recorded!")
      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
        router.refresh()
      }, 700)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="gap-1.5 h-8 px-3 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
          />
        }
      >
        <Plus className="size-3.5" />
        <span>Create</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px] p-5">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base flex items-center gap-2">
            <Zap className="size-4 text-primary" /> Universal Quick Create
          </DialogTitle>
          <DialogDescription className="text-xs">
            Minimal manual entry — AI automatically infers relationships, priority, and metadata.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 p-2 text-xs text-emerald-500">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span>{success}</span>
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-8 text-[0.6875rem]">
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="project">Project</TabsTrigger>
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="note">Note</TabsTrigger>
            <TabsTrigger value="tx">Ledger</TabsTrigger>
          </TabsList>

          {/* 1. TASK */}
          <TabsContent value="task" className="mt-3">
            <form onSubmit={handleTaskSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Task Title *</label>
                <Input name="title" required placeholder="e.g. Finalize Q3 Client Deliverable" className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Priority</label>
                  <select name="priority" className="w-full h-8 rounded-md border bg-background px-2 text-xs">
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="URGENT">Urgent</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Due Date</label>
                  <Input name="dueAt" type="date" className="h-8 text-xs font-mono" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground">Instructions / Description</label>
                <Textarea name="description" rows={2} placeholder="Optional context or instructions..." className="text-xs" />
              </div>
              <Button type="submit" disabled={pending} className="w-full h-8 text-xs">
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Create Task"}
              </Button>
            </form>
          </TabsContent>

          {/* 2. PROJECT */}
          <TabsContent value="project" className="mt-3">
            <form onSubmit={handleProjectSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Project Name *</label>
                <Input name="name" required placeholder="e.g. Brand Identity 2026" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground">Target Deadline</label>
                <Input name="targetDate" type="date" className="h-8 text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground">Description &amp; Goals</label>
                <Textarea name="description" rows={2} placeholder="Scope, key deliverables, and client goals..." className="text-xs" />
              </div>
              <Button type="submit" disabled={pending} className="w-full h-8 text-xs">
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Create Project"}
              </Button>
            </form>
          </TabsContent>

          {/* 3. CLIENT */}
          <TabsContent value="client" className="mt-3">
            <form onSubmit={handleClientSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Client / Company Name *</label>
                <Input name="name" required placeholder="e.g. Acme Media Corp" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground">Contact Email</label>
                <Input name="email" type="email" placeholder="contact@acme.com" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground">Industry</label>
                <Input name="industry" placeholder="e.g. Hospitality, SaaS, E-Commerce" className="h-8 text-xs" />
              </div>
              <Button type="submit" disabled={pending} className="w-full h-8 text-xs">
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Create Client Account"}
              </Button>
            </form>
          </TabsContent>

          {/* 4. NOTE */}
          <TabsContent value="note" className="mt-3">
            <form onSubmit={handleNoteSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Note Title *</label>
                <Input name="title" required placeholder="e.g. Meeting Decisions" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground">Note Content *</label>
                <Textarea name="body" required rows={4} placeholder="Decisions, meeting takeaways, creative ideas..." className="text-xs" />
              </div>
              <Button type="submit" disabled={pending} className="w-full h-8 text-xs">
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Save Note"}
              </Button>
            </form>
          </TabsContent>

          {/* 5. TRANSACTION */}
          <TabsContent value="tx" className="mt-3">
            <form onSubmit={handleTransactionSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Description *</label>
                <Input name="description" required placeholder="e.g. Figma Monthly Subscription" className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Amount (₹) *</label>
                  <Input name="amount" type="number" step="0.01" required placeholder="1499.00" className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Type</label>
                  <select name="direction" className="w-full h-8 rounded-md border bg-background px-2 text-xs">
                    <option value="DEBIT">Debit / Expense</option>
                    <option value="CREDIT">Credit / Income</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground">Category</label>
                <select name="category" className="w-full h-8 rounded-md border bg-background px-2 text-xs">
                  <option value="SOFTWARE">Software &amp; SaaS</option>
                  <option value="FOOD">Food &amp; Dining</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="BILLS">Bills &amp; Utilities</option>
                  <option value="BUSINESS">Business Expense</option>
                  <option value="INCOME">Client Income</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <Button type="submit" disabled={pending} className="w-full h-8 text-xs">
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Record Transaction"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
