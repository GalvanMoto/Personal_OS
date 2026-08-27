import { requireWorkspace } from "@/lib/auth/dal"
import { SettingsCenter } from "@/components/settings/settings-center"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"

export const metadata = { title: "Settings & Control Center · Personal OS" }

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant, user } = await requireWorkspace(workspace)

  const [gmailInt, driveInt, calInt] = await Promise.all([
    db.integration.findUnique({
      where: { tenantId_provider: { tenantId: tenant.id, provider: "GMAIL" } },
    }),
    db.integration.findUnique({
      where: { tenantId_provider: { tenantId: tenant.id, provider: "GOOGLE_DRIVE" } },
    }),
    db.integration.findUnique({
      where: { tenantId_provider: { tenantId: tenant.id, provider: "GOOGLE_CALENDAR" } },
    }),
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
          gmail: gmailInt?.status === "CONNECTED",
          drive: driveInt?.status === "CONNECTED",
          calendar: calInt?.status === "CONNECTED",
        }}
      />
    </div>
  )
}
