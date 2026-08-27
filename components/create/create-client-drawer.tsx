"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  CheckCircle2,
  Globe,
  HardDrive,
  LinkIcon,
  Loader2,
  Mail,
  Phone,
  Plus,
  Receipt,
  User,
  Users2,
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
import { createClientAction } from "@/lib/actions/entities"

interface CreateClientDrawerProps {
  workspace: string
  trigger?: React.ReactNode
}

export function CreateClientDrawer({
  workspace,
  trigger,
}: CreateClientDrawerProps) {
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

    const res = await createClientAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to create client")
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
          <span>New Client</span>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="w-[420px] sm:w-[560px] p-0 flex flex-col h-full bg-background border-l">
        {/* Top Header */}
        <div className="px-6 py-5 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Building2 className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
                Create Client Relationship
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Single source of truth for client contacts, deliverables, drive links, and billing terms.
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
            <span>Client account registered in knowledge graph!</span>
          </div>
        ) : null}

        {/* Main Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-9 p-1 bg-muted/50 rounded-lg text-xs">
                <TabsTrigger value="basic" className="gap-1.5 py-1 text-xs">
                  <Building2 className="size-3.5" />
                  <span>Basic</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="gap-1.5 py-1 text-xs">
                  <Users2 className="size-3.5" />
                  <span>Contact</span>
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-1.5 py-1 text-xs">
                  <Receipt className="size-3.5" />
                  <span>Billing</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-1.5 py-1 text-xs">
                  <LinkIcon className="size-3.5" />
                  <span>Links</span>
                </TabsTrigger>
              </TabsList>

              {/* 1. BASIC INFO */}
              <TabsContent value="basic" className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Client Type</label>
                    <select
                      name="kind"
                      defaultValue="CLIENT"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="CLIENT">Company / Business</option>
                      <option value="INDIVIDUAL">Individual Client</option>
                      <option value="PARTNER">Partner / Agency</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Status</label>
                    <select
                      name="status"
                      defaultValue="ACTIVE"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="LEAD">Lead / Prospect</option>
                      <option value="PAST">Past Client</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Client / Company Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    name="name"
                    required
                    placeholder="e.g. GB Banquet &amp; Hospitality"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Industry / Sector</label>
                    <Input name="industry" placeholder="e.g. Hospitality, SaaS, Media" className="h-9 text-xs" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Website URL</label>
                    <Input name="website" placeholder="https://company.com" className="h-9 text-xs font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Client Description</label>
                  <Textarea
                    name="description"
                    rows={3}
                    placeholder="Brief summary of business, core products, and relationship context..."
                    className="text-xs resize-none"
                  />
                </div>
              </TabsContent>

              {/* 2. PRIMARY CONTACT */}
              <TabsContent value="contact" className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Primary Contact Name</label>
                    <Input name="contactName" placeholder="e.g. Sarah Jenkins" className="h-9 text-xs" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Job Title / Role</label>
                    <Input name="contactRole" placeholder="e.g. Marketing Director" className="h-9 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Contact Email</label>
                    <Input name="email" type="email" placeholder="sarah@gbbanquet.com" className="h-9 text-xs" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Phone / WhatsApp</label>
                    <Input name="phone" placeholder="+61 400 000 000" className="h-9 text-xs font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Preferred Method</label>
                    <select
                      name="preferredContact"
                      defaultValue="EMAIL"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="EMAIL">Email</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="PHONE">Phone Call</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Timezone</label>
                    <Input name="timezone" defaultValue="Asia/Kolkata (IST)" className="h-9 text-xs font-mono" />
                  </div>
                </div>
              </TabsContent>

              {/* 3. BILLING */}
              <TabsContent value="billing" className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Default Currency</label>
                    <Input name="currency" defaultValue="INR (₹)" className="h-9 text-xs font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Payment Terms</label>
                    <select
                      name="paymentTerms"
                      defaultValue="NET30"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                      <option value="NET7">Net 7 Days</option>
                      <option value="NET15">Net 15 Days</option>
                      <option value="NET30">Net 30 Days</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Billing / Accounts Email</label>
                  <Input name="billingEmail" type="email" placeholder="invoices@gbbanquet.com" className="h-9 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Tax / GST Number</label>
                  <Input name="taxNumber" placeholder="GSTIN / ABN / Tax ID" className="h-9 text-xs font-mono" />
                </div>
              </TabsContent>

              {/* 4. LINKS & NOTES */}
              <TabsContent value="links" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <HardDrive className="size-3.5 text-primary" />
                    Google Drive Asset Folder
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
                    Brand Assets / Figma URL
                  </label>
                  <Input
                    name="assetsUrl"
                    placeholder="https://figma.com/file/..."
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Private Internal Notes</label>
                  <Textarea
                    name="notes"
                    rows={3}
                    placeholder="Private relationship notes (never shared externally)..."
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
                    Create Client Account
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
