import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import {
  Bot,
  Mail,
  RefreshCw,
  Sparkles,
  Users2,
  Ban,
} from "lucide-react"

import { CreateEmailDrawer } from "@/components/create/create-email-drawer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmailSubscriptionManager, type EmailItem } from "@/components/email/email-subscription-manager"

export const metadata = { title: "Email Intelligence & Subscriptions · Personal OS" }

export default async function EmailPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  // Hide emails when Gmail is disconnected - matches requirement: disconnect => don't show emails in frontend
  const connectedGmailCount = await db.integration.count({
    where: { tenantId: tenant.id, provider: "GMAIL", status: "CONNECTED" },
  })
  const rawEmails =
    connectedGmailCount === 0
      ? []
      : await db.emailMessage.findMany({
          where: { tenantId: tenant.id },
          orderBy: { receivedAt: "desc" },
          take: 100,
        })

  const senders = new Set(rawEmails.map((e) => e.fromEmail).filter(Boolean)).size

  const emails: EmailItem[] = rawEmails.map((e) => ({
    id: e.id,
    subject: e.subject,
    fromName: e.fromName,
    fromEmail: e.fromEmail,
    snippet: e.snippet,
    body: e.body,
    receivedAt: e.receivedAt.toISOString(),
    isRead: e.isRead,
    category: e.category,
  }))

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
      unit: "contacts",
      note: "unique sender addresses",
      icon: Users2,
    },
    {
      label: "Autonomous Triage",
      value: "100%",
      unit: "processed",
      note: "promos & noise suppressed",
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
          <h1 className="text-xl font-medium tracking-tight">Email Intelligence &amp; Subscriptions</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Filter subscriptions, unsubscribe from recurring marketing blasts, and triage client communications.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2">
          <CreateEmailDrawer workspace={workspace} />
          <Link
            href={`/w/${workspace}/settings/integrations`}
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
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

      {/* Main Interactive Subscription & Email Manager */}
      <EmailSubscriptionManager workspace={workspace} initialEmails={emails} />
    </div>
  )
}
