import { requireWorkspace } from "@/lib/auth/dal"
import { SettingsCenter } from "@/components/settings/settings-center"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"
import { getWorkspaceSettings } from "@/lib/domain/settings"
import { listMemories } from "@/lib/domain/memory"

export const metadata = { title: "Settings & Control Center · Personal OS" }

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant, user } = await requireWorkspace(workspace)

  const [gmailInts, driveInt, calInt, settings, memories] = await Promise.all([
    db.integration.findMany({ where: { tenantId: tenant.id, provider: "GMAIL" } }),
    db.integration.findFirst({ where: { tenantId: tenant.id, provider: "GOOGLE_DRIVE" } }),
    db.integration.findFirst({ where: { tenantId: tenant.id, provider: "GOOGLE_CALENDAR" } }),
    getWorkspaceSettings(db, { name: user.name, timezone: user.timezone }),
    listMemories(db).then((rows) =>
      rows.slice(0, 20).map((r) => ({
        id: r.id,
        fact: r.value,
        source: r.sourceType,
        confidence: `${Math.round(r.confidence * 100)}%`,
        pinned: r.pinned,
        key: r.key,
      }))
    ),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Settings &amp; Control Center</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Configure system behavior, AI model providers, agent permission scopes, integrations, and security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <Lock className="size-3 text-emerald-500" />
            Workspace: {workspace}
          </Badge>
        </div>
      </div>

      <div className="mb-3 flex justify-end">
        <a href={`/w/${workspace}/settings/vault`} className="inline-flex items-center gap-1.5 rounded border bg-card px-3 py-1.5 text-xs hover:bg-muted">
          <Lock className="size-3" /> Statement Vault — PAN/DOB/Phone
        </a>
      </div>

      {/* Main Settings Center Layout */}
      <SettingsCenter
        workspace={workspace}
        user={{
          name: user.name,
          email: user.email,
          timezone: user.timezone,
          createdAt: new Date().toISOString(),
        }}
        integrations={{
          gmail: gmailInts.some((i) => i.status === "CONNECTED"),
          drive: driveInt?.status === "CONNECTED",
          calendar: calInt?.status === "CONNECTED",
        }}
        initialSettings={settings}
        initialMemories={memories}
      />
    </div>
  )
}
