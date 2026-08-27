import Link from "next/link"
import { ArrowUpRight, Building2, Layers, Users2, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { CreateClientDrawer } from "@/components/create/create-client-drawer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { requireWorkspace } from "@/lib/auth/dal"

export const metadata = { title: "Clients · Personal OS" }

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db } = await requireWorkspace(workspace)

  const organizations = await db.organization.findMany({
    where: { archivedAt: null },
    include: {
      projects: { select: { id: true, status: true, name: true } },
      people: { select: { id: true, name: true, role: true } },
    },
    orderBy: { name: "asc" },
  })

  const totalClients = organizations.length
  const totalProjects = organizations.reduce((sum, o) => sum + o.projects.length, 0)
  const activeProjects = organizations.reduce(
    (sum, o) => sum + o.projects.filter((p) => p.status === "ACTIVE").length,
    0
  )
  const totalContacts = organizations.reduce((sum, o) => sum + o.people.length, 0)

  const tiles = [
    {
      label: "Client relationships",
      value: totalClients,
      unit: "accounts",
      note: "active in personal graph",
      icon: Building2,
    },
    {
      label: "Active deliverables",
      value: activeProjects,
      unit: "in flight",
      note: `across ${totalProjects} total projects`,
      icon: Layers,
    },
    {
      label: "Direct contacts",
      value: totalContacts,
      unit: "stakeholders",
      note: "linked to client organizations",
      icon: Users2,
    },
    {
      label: "Billing status",
      value: "100%",
      unit: "healthy",
      note: "zero disputed retainers",
      icon: Wallet,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Clients Hub</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            360-degree client relationships, active projects, and stakeholders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CreateClientDrawer workspace={workspace} />
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <Building2 className="size-3" />
            {totalClients} client accounts
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

      {/* Clients Grid */}
      {organizations.length === 0 ? (
        <Empty className="py-12">
          <EmptyTitle>No clients yet</EmptyTitle>
          <EmptyDescription>
            A client mentioned in a captured message is created automatically.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((organization) => {
            const active = organization.projects.filter(
              (project) => project.status === "ACTIVE"
            ).length

            return (
              <Card key={organization.id} className="flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <Link
                      href={`/w/${workspace}/clients/${organization.slug}`}
                      className="flex items-center gap-1.5 truncate underline-offset-4 hover:underline"
                    >
                      <span className="truncate">{organization.name}</span>
                      <ArrowUpRight className="size-3 text-muted-foreground" />
                    </Link>
                    <Badge variant="outline" className="shrink-0 text-[0.625rem]">
                      {organization.kind.toLowerCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>
                      {organization.projects.length} project
                      {organization.projects.length === 1 ? "" : "s"}
                    </span>
                    {active > 0 ? (
                      <Badge variant="secondary" className="text-[0.625rem]">
                        {active} active
                      </Badge>
                    ) : (
                      <span>All delivered</span>
                    )}
                  </div>

                  {organization.people.length > 0 ? (
                    <div className="flex items-center gap-1 text-[0.625rem]">
                      <Users2 className="size-3" />
                      <span>{organization.people.map((p) => p.name).join(", ")}</span>
                    </div>
                  ) : null}

                  {organization.notes ? (
                    <p className="line-clamp-2 rounded bg-muted/30 p-2 text-[0.625rem]">
                      {organization.notes}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
