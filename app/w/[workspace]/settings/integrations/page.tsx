import { requireWorkspace } from "@/lib/auth/dal"
import {
  syncNow,
  disconnectGmail,
  disconnectDrive,
  disconnectCalendar,
  disconnectIntegrationById,
  syncIntegrationById,
} from "./actions"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Calendar, Cloud, KeyRound, Mail, RefreshCw, Sparkles, Trash2, Webhook } from "lucide-react"

export const metadata = { title: "Integrations & AI Settings · Personal OS" }

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const [allIntegrations, emailTotal] = await Promise.all([
    db.integration.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    }),
    db.emailMessage.count({ where: { tenantId: tenant.id } }),
  ])

  const gmailInts = allIntegrations.filter((i) => i.provider === "GMAIL")
  const driveInt = allIntegrations.find((i) => i.provider === "GOOGLE_DRIVE")
  const calInt = allIntegrations.find((i) => i.provider === "GOOGLE_CALENDAR")

  const gmailConnected = gmailInts.filter((i) => i.status === "CONNECTED")
  const isGmailConnected = gmailConnected.length > 0
  const isDriveConnected = driveInt?.status === "CONNECTED"
  const isCalConnected = calInt?.status === "CONNECTED"

  const activeCount = allIntegrations.filter((i) => i.status === "CONNECTED").length

  const tiles = [
    {
      label: "Connected integrations",
      value: activeCount,
      unit: "active",
      note: "live connections",
      icon: Cloud,
    },
    {
      label: "Synced messages",
      value: emailTotal,
      unit: "emails",
      note: "indexed communication records",
      icon: Mail,
    },
    {
      label: "AI Extraction Engine",
      value: "Multi-Model",
      unit: "ready",
      note: "Claude · GPT-4o · Gemini",
      icon: Bot,
    },
    {
      label: "Automation Webhook",
      value: "Active",
      unit: "connected",
      note: "Capture from external tools",
      icon: Webhook,
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Integrations &amp; Connections</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Connect your tools, manage multiple accounts, and configure your AI assistant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <KeyRound className="size-3" />
            Secure Vault
          </Badge>
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

      {/* 1. Integration Service Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Gmail Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Mail className="size-4" />
                Gmail
              </span>
              <Badge variant={isGmailConnected ? "secondary" : "outline"} className="text-[0.625rem]">
                {isGmailConnected ? `CONNECTED${gmailConnected.length > 1 ? ` (${gmailConnected.length})` : ""}` : "DISCONNECTED"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            <p className="text-muted-foreground">
              {isGmailConnected
                ? `${gmailConnected.length} Gmail account${gmailConnected.length > 1 ? "s" : ""} connected with ${emailTotal} emails indexed.`
                : "Read & triage client communications and manage subscriptions."}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href={`/api/integrations/gmail/connect?workspace=${workspace}`}
                className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {isGmailConnected ? "Add another Gmail" : "Connect Gmail"}
              </a>
              <Link
                href={`/w/${workspace}/email`}
                className="rounded border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                View emails
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Cloud className="size-4" />
                Google Drive
              </span>
              <Badge variant={isDriveConnected ? "secondary" : "outline"} className="text-[0.625rem]">
                {isDriveConnected ? "CONNECTED" : "DISCONNECTED"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            <p className="text-muted-foreground">
              {isDriveConnected
                ? `Connected as ${driveInt?.accountRef ?? "Google Drive"}. Brand assets and files synchronized.`
                : "Automatically discovers brand assets, PDFs, and video links for Context Packs."}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {isDriveConnected ? (
                <form action={disconnectDrive.bind(null, workspace)}>
                  <button type="submit" className="rounded border px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                    Disconnect
                  </button>
                </form>
              ) : (
                <a
                  href={`/api/integrations/drive/connect?workspace=${workspace}`}
                  className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Connect Drive
                </a>
              )}
              <Link
                href={`/w/${workspace}/files`}
                className="rounded border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                View files
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Google Calendar Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Calendar className="size-4" />
                Google Calendar
              </span>
              <Badge variant={isCalConnected ? "secondary" : "outline"} className="text-[0.625rem]">
                {isCalConnected ? "CONNECTED" : "DISCONNECTED"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            <p className="text-muted-foreground">
              {isCalConnected
                ? `Connected as ${calInt?.accountRef ?? "Google Calendar"}. Deadlines & execution schedule synchronized.`
                : "Two-way deadline sync and conflict-free execution blocking."}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {isCalConnected ? (
                <form action={disconnectCalendar.bind(null, workspace)}>
                  <button type="submit" className="rounded border px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                    Disconnect
                  </button>
                </form>
              ) : (
                <a
                  href={`/api/integrations/calendar/connect?workspace=${workspace}`}
                  className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Connect Calendar
                </a>
              )}
              <Link
                href={`/w/${workspace}/calendar`}
                className="rounded border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                View calendar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Connected Accounts Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm">Connected Accounts &amp; Providers</CardTitle>
              <CardDescription className="text-xs">
                Detailed list of all linked Gmail mailboxes, Google Drive storage, and Google Calendar accounts.
              </CardDescription>
            </div>
            <a
              href={`/api/integrations/gmail/connect?workspace=${workspace}`}
              className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
            >
              <Mail className="size-3" />
              <span>+ Link New Gmail</span>
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {allIntegrations.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No accounts connected yet. Click any button above to connect.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/30 text-[0.6875rem] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Service</th>
                    <th className="px-4 py-2.5 font-medium">Account / Email</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Last Synced</th>
                    <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allIntegrations.map((item) => {
                    const isConnected = item.status === "CONNECTED"
                    const Icon =
                      item.provider === "GMAIL"
                        ? Mail
                        : item.provider === "GOOGLE_DRIVE"
                          ? Cloud
                          : Calendar

                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <Icon className="size-3.5 text-muted-foreground" />
                            <span>
                              {item.provider === "GMAIL"
                                ? "Gmail"
                                : item.provider === "GOOGLE_DRIVE"
                                  ? "Google Drive"
                                  : "Google Calendar"}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono text-foreground">
                          {item.accountRef ?? "Primary Account"}
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant={isConnected ? "secondary" : "outline"}
                            className="text-[0.625rem]"
                          >
                            {item.status}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground font-mono text-[0.6875rem]">
                          {item.lastSyncAt
                            ? new Date(item.lastSyncAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Never"}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isConnected && item.provider === "GMAIL" ? (
                              <form action={syncIntegrationById.bind(null, workspace, item.id)}>
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[0.6875rem] hover:bg-muted transition-colors"
                                >
                                  <RefreshCw className="size-2.5" />
                                  <span>Sync</span>
                                </button>
                              </form>
                            ) : null}

                            {isConnected ? (
                              <form action={disconnectIntegrationById.bind(null, workspace, item.id)}>
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 px-2 py-1 text-[0.6875rem] transition-colors"
                                >
                                  <span>Disconnect</span>
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. AI Assistant Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-xs">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="font-medium">Anthropic Claude</p>
              <p className="text-[0.625rem] text-muted-foreground">Chief-of-Staff</p>
              <Badge variant="secondary" className="mt-2 text-[0.625rem]">Active</Badge>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="font-medium">OpenAI</p>
              <p className="text-[0.625rem] text-muted-foreground">Fast Extraction</p>
              <Badge variant="outline" className="mt-2 text-[0.625rem]">Available</Badge>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="font-medium">Google Gemini</p>
              <p className="text-[0.625rem] text-muted-foreground">Vision &amp; Audio</p>
              <Badge variant="outline" className="mt-2 text-[0.625rem]">Available</Badge>
            </div>
          </div>
          <p className="text-[0.625rem] text-muted-foreground">
            Your AI assistant is ready and securely configured for your workspace.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
