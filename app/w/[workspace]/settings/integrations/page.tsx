import { requireWorkspace } from "@/lib/auth/dal"
import { syncNow, disconnectGmail, disconnectDrive, disconnectCalendar } from "./actions"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Calendar, Cloud, KeyRound, Mail, Sparkles, Webhook } from "lucide-react"

export const metadata = { title: "Integrations & AI Settings · Personal OS" }

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const [gmailInts, driveInt, calInt, emailTotal] = await Promise.all([
    db.integration.findMany({ where: { tenantId: tenant.id, provider: "GMAIL" } }),
    db.integration.findFirst({ where: { tenantId: tenant.id, provider: "GOOGLE_DRIVE" } }),
    db.integration.findFirst({ where: { tenantId: tenant.id, provider: "GOOGLE_CALENDAR" } }),
    db.emailMessage.count({ where: { tenantId: tenant.id } }),
  ])

  const gmailConnected = gmailInts.filter((i) => i.status === "CONNECTED")
  const isGmailConnected = gmailConnected.length > 0
  const isDriveConnected = driveInt?.status === "CONNECTED"
  const isCalConnected = calInt?.status === "CONNECTED"

  const sync = syncNow.bind(null, workspace)
  const disconnect = disconnectGmail.bind(null, workspace)

  const activeCount = gmailConnected.length + (isDriveConnected ? 1 : 0) + (isCalConnected ? 1 : 0)

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
      note: "read & extracted to graph",
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
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Integrations &amp; Connections</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Connect your tools and configure your AI assistant.
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

      {/* Google Workspace Grid */}
      <div className="grid gap-3 md:grid-cols-3">
        {/* Gmail Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Mail className="size-4" />
                Gmail
                {gmailConnected.length > 1 ? <Badge variant="secondary" className="text-[0.625rem]">{gmailConnected.length} accounts</Badge> : null}
              </span>
              <Badge variant={isGmailConnected ? "secondary" : "outline"} className="text-[0.625rem]">
                {isGmailConnected ? `CONNECTED${gmailConnected.length > 1 ? ` ×${gmailConnected.length}` : ""}` : "DISCONNECTED"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            {isGmailConnected ? (
              <div className="space-y-1.5">
                {gmailConnected.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded border bg-muted/20 px-2 py-1 text-[0.625rem]">
                    <span className="font-mono truncate">{g.accountRef ?? "Gmail"}</span>
                    <Badge variant="outline" className="text-[0.625rem]">{g.status}</Badge>
                  </div>
                ))}
                <p className="text-muted-foreground">{emailTotal} emails indexed across {gmailConnected.length} account{gmailConnected.length > 1 ? "s" : ""}.</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Read & ingest briefs from client emails. Connect as many Gmails as you need.</p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href={`/api/integrations/gmail/connect?workspace=${workspace}`}
                className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground"
              >
                {isGmailConnected ? "Add another Gmail" : "Connect Gmail"}
              </a>
              {isGmailConnected ? (
                <>
                  <form action={sync}>
                    <button type="submit" className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground">
                      Sync all ({gmailConnected.length})
                    </button>
                  </form>
                  <form action={disconnect}>
                    <button type="submit" className="rounded border px-3 py-1.5 text-xs">
                      Disconnect all
                    </button>
                  </form>
                </>
              ) : null}
              <Link href={`/w/${workspace}/email`} className="rounded border px-3 py-1.5 text-xs">
                View emails
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Cloud className="size-4" />
                Google Drive
              </span>
              <Badge variant={isDriveConnected ? "secondary" : "outline"} className="text-[0.625rem]">
                {driveInt?.status ?? "DISCONNECTED"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            <p className="text-muted-foreground">
              {isDriveConnected
                ? `Connected${driveInt?.accountRef ? ` as ${driveInt.accountRef}` : ""}. Brand assets and files synchronized.`
                : "Automatically discovers brand assets, PDFs, and video links for Context Packs."}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {isDriveConnected ? (
                <form action={disconnectDrive.bind(null, workspace)}>
                  <button type="submit" className="rounded border px-3 py-1.5 text-xs">
                    Disconnect
                  </button>
                </form>
              ) : (
                <a
                  href={`/api/integrations/drive/connect?workspace=${workspace}`}
                  className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                >
                  Connect Drive
                </a>
              )}
              <Link href={`/w/${workspace}/files`} className="rounded border px-3 py-1.5 text-xs">
                View files
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Google Calendar Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Calendar className="size-4" />
                Google Calendar
              </span>
              <Badge variant={isCalConnected ? "secondary" : "outline"} className="text-[0.625rem]">
                {calInt?.status ?? "DISCONNECTED"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            <p className="text-muted-foreground">
              {isCalConnected
                ? `Connected${calInt?.accountRef ? ` as ${calInt.accountRef}` : ""}. Deadlines & execution schedule synchronized.`
                : "Two-way deadline sync and conflict-free execution blocking."}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {isCalConnected ? (
                <form action={disconnectCalendar.bind(null, workspace)}>
                  <button type="submit" className="rounded border px-3 py-1.5 text-xs">
                    Disconnect
                  </button>
                </form>
              ) : (
                <a
                  href={`/api/integrations/calendar/connect?workspace=${workspace}`}
                  className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                >
                  Connect Calendar
                </a>
              )}
              <Link href={`/w/${workspace}/calendar`} className="rounded border px-3 py-1.5 text-xs">
                View calendar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Configuration */}
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
