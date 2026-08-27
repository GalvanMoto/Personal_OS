import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import {
  AtSign,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
  Mail,
  Plus,
  RefreshCw,
  Reply,
  Shield,
  Sparkles,
  Users2,
} from "lucide-react"

import { CreateEmailDrawer } from "@/components/create/create-email-drawer"
import { UniversalFilterBar } from "@/components/filters/universal-filter-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = { title: "Email Intelligence · Personal OS" }

export default async function EmailPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const emails = await db.emailMessage.findMany({
    where: { tenantId: tenant.id },
    orderBy: { receivedAt: "desc" },
    take: 60,
  })

  const senders = new Set(emails.map((e) => e.fromEmail).filter(Boolean)).size

  const clientComms = emails.filter(
    (e) =>
      e.category === "CLIENT_COMMS" ||
      e.category === "TASK_REQUEST" ||
      e.subject?.toLowerCase().includes("project") ||
      e.subject?.toLowerCase().includes("brief")
  )

  const financialEmails = emails.filter(
    (e) =>
      e.category === "INVOICE" ||
      e.category === "RECEIPT" ||
      e.subject?.toLowerCase().includes("invoice") ||
      e.subject?.toLowerCase().includes("receipt") ||
      e.subject?.toLowerCase().includes("statement") ||
      e.subject?.toLowerCase().includes("payment")
  )

  const actionRequired = emails.filter(
    (e) => !e.isRead || e.category === "TASK_REQUEST" || e.subject?.toLowerCase().includes("urgent")
  )

  const tiles = [
    {
      label: "Synced Messages",
      value: emails.length,
      unit: "emails",
      note: "ingested from connected accounts",
      icon: Mail,
    },
    {
      label: "Active Senders",
      value: senders,
      unit: "clients",
      note: "unique sender addresses",
      icon: Users2,
    },
    {
      label: "Autonomous Triage",
      value: "100%",
      unit: "processed",
      note: "tasks & briefs extracted to inbox",
      icon: Bot,
    },
    {
      label: "Sync Cadence",
      value: "Realtime",
      unit: "webhooks",
      note: "Gmail integration active",
      icon: RefreshCw,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Email Intelligence</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Communication intelligence layer: extracts action items, links client context, and automates follow-ups.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2">
          <CreateEmailDrawer workspace={workspace} />
          <Link
            href={`/w/${workspace}/settings/integrations`}
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <RefreshCw className="size-3" />
            <span>Manage Integrations</span>
          </Link>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <Card key={tile.label}>
              <CardContent className="flex flex-col gap-2 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{tile.label}</span>
                  <Icon className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="flex items-baseline gap-1">
                    <span className="text-2xl font-medium tabular-nums">{tile.value}</span>
                    <span className="text-xs text-muted-foreground">{tile.unit}</span>
                  </p>
                  <p className="truncate text-[0.625rem] text-muted-foreground">{tile.note}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Universal Date Engine & Filter Bar */}
      <UniversalFilterBar searchPlaceholder="Search emails, senders, subjects, and extracted attachments..." />

      {/* Main Tabbed Communication Matrix */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-8 text-[0.6875rem]">
          <TabsTrigger value="all">All Messages ({emails.length})</TabsTrigger>
          <TabsTrigger value="action">Action Required ({actionRequired.length})</TabsTrigger>
          <TabsTrigger value="clients">Client Comms ({clientComms.length})</TabsTrigger>
          <TabsTrigger value="finance">Financial &amp; Invoices ({financialEmails.length})</TabsTrigger>
        </TabsList>

        {/* 1. ALL MESSAGES */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Synchronized Inbox Timeline</span>
                <Badge variant="outline">{emails.length} Total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {emails.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Messages Ingested</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Connect your Gmail account in Settings or compose an outgoing email.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {emails.map((email) => (
                    <div key={email.id} className="p-4 hover:bg-muted/30 transition-colors space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-sm truncate">
                              {email.subject || "No Subject"}
                            </span>
                            <Badge variant="secondary" className="text-[0.625rem] font-mono">
                              {email.category || "GENERAL"}
                            </Badge>
                          </div>

                          <p className="text-[0.625rem] text-muted-foreground font-mono">
                            From: {email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail || "Unknown"} · Received {email.receivedAt.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>

                        <CreateEmailDrawer
                          workspace={workspace}
                          defaultToEmail={email.fromEmail || ""}
                          defaultSubject={`Re: ${email.subject || ""}`}
                          trigger={
                            <Button size="xs" variant="outline" className="gap-1 text-xs">
                              <Reply className="size-3" />
                              <span>Reply</span>
                            </Button>
                          }
                        />
                      </div>

                      {email.snippet ? (
                        <p className="text-xs text-muted-foreground font-mono line-clamp-2 bg-muted/20 rounded p-2 border">
                          {email.snippet}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. ACTION REQUIRED */}
        <TabsContent value="action" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Action Required &amp; Unread</span>
                <Badge variant="outline">{actionRequired.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {actionRequired.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">Inbox Zero Achieved</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    All high-priority emails and task requests have been addressed.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {actionRequired.map((email) => (
                    <div key={email.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{email.subject}</span>
                        <Badge variant="destructive" className="text-[0.625rem]">Action Required</Badge>
                      </div>
                      <p className="text-[0.6875rem] text-muted-foreground font-mono">{email.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. CLIENT COMMS */}
        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Client Communications &amp; Threads</span>
                <Badge variant="outline">{clientComms.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {clientComms.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Client Communications</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Client emails will appear here automatically when linked.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {clientComms.map((email) => (
                    <div key={email.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <span className="font-semibold text-foreground">{email.subject}</span>
                      <p className="text-[0.6875rem] text-muted-foreground font-mono">{email.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. FINANCIAL EMAILS */}
        <TabsContent value="finance" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Financial Statements &amp; SaaS Invoices</span>
                <Badge variant="outline">{financialEmails.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {financialEmails.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Financial Emails</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Invoices and receipts received via email are processed into the Finance domain.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {financialEmails.map((email) => (
                    <div key={email.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <span className="font-semibold text-foreground">{email.subject}</span>
                      <p className="text-[0.6875rem] text-muted-foreground font-mono">{email.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
