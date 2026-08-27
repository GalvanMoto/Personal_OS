"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AtSign,
  CheckCircle2,
  FolderGit2,
  Inbox,
  LinkIcon,
  Loader2,
  Mail,
  Plus,
  Send,
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
import { createEmailAction } from "@/lib/actions/entities"

interface CreateEmailDrawerProps {
  workspace: string
  trigger?: React.ReactNode
  defaultToEmail?: string
  defaultSubject?: string
}

export function CreateEmailDrawer({
  workspace,
  trigger,
  defaultToEmail,
  defaultSubject,
}: CreateEmailDrawerProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState("compose")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    const res = await createEmailAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to record outgoing email")
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
          <Mail className="size-3.5" />
          <span>Compose Email</span>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="w-[420px] sm:w-[560px] p-0 flex flex-col h-full bg-background border-l">
        {/* Top Header */}
        <div className="px-6 py-5 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Mail className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
                Email Dispatch &amp; Logging
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Communication intelligence: tracks replies, extracts follow-ups, and preserves context.
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
            <span>Email logged and dispatched to communication timeline!</span>
          </div>
        ) : null}

        {/* Main Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9 p-1 bg-muted/50 rounded-lg text-xs">
                <TabsTrigger value="compose" className="gap-1.5 py-1 text-xs">
                  <Mail className="size-3.5" />
                  <span>Compose</span>
                </TabsTrigger>
                <TabsTrigger value="context" className="gap-1.5 py-1 text-xs">
                  <Target className="size-3.5" />
                  <span>Context &amp; Type</span>
                </TabsTrigger>
              </TabsList>

              {/* 1. COMPOSE TAB */}
              <TabsContent value="compose" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    To Recipient <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="toEmail"
                    type="email"
                    required
                    defaultValue={defaultToEmail || ""}
                    placeholder="client@company.com"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Subject Line <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="subject"
                    required
                    defaultValue={defaultSubject || ""}
                    placeholder="e.g. GB Banquet Sprint Deliverables &amp; Reel Approval"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Message Body <span className="text-destructive">*</span></span>
                    <span className="text-[0.625rem] text-muted-foreground font-mono">Markdown supported</span>
                  </label>
                  <Textarea
                    name="body"
                    required
                    rows={10}
                    placeholder="Hi Sarah,&#10;&#10;Here is the link to the latest 30s video reel preview for review:&#10;https://drive.google.com/...&#10;&#10;Best,&#10;Gautam"
                    className="text-xs font-mono resize-none"
                  />
                </div>
              </TabsContent>

              {/* 2. CONTEXT TAB */}
              <TabsContent value="context" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Communication Category</label>
                  <select
                    name="category"
                    defaultValue="CLIENT_COMMS"
                    className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="CLIENT_COMMS">Client Communication / Update</option>
                    <option value="DELIVERABLE">Deliverable Review &amp; Approval</option>
                    <option value="INVOICE">Invoice &amp; Billing Notice</option>
                    <option value="PROPOSAL">Proposal / Estimate</option>
                    <option value="FOLLOW_UP">Follow-up / Reminder</option>
                    <option value="INTERNAL">Internal Team Note</option>
                  </select>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 text-[0.6875rem] text-muted-foreground flex items-center gap-2">
                  <Sparkles className="size-4 shrink-0 text-primary" />
                  <span>
                    Email Agent tracks sent messages and creates a follow-up reminder if no reply is detected in 3 business days.
                  </span>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky Bottom Footer */}
          <div className="mt-auto border-t bg-muted/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[0.625rem] text-muted-foreground font-mono">
              Press Enter to log &amp; send
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
                    <Send className="size-3.5 mr-1" />
                    Send &amp; Log Email
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
