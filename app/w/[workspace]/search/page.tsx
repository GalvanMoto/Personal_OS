import Link from "next/link"
import { ArrowUpRight, CheckCircle2, FileText, FolderGit2, Layers, Search, Sparkles, User2, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { requireWorkspace } from "@/lib/auth/dal"
import { search } from "@/lib/search"

export const metadata = { title: "Search · Personal OS" }

const ENTITY_ICONS: Record<string, typeof FileText> = {
  TASK: Layers,
  PROJECT: FolderGit2,
  ORGANIZATION: User2,
  CLIENT: User2,
  DOCUMENT: FileText,
  INBOX_ITEM: Sparkles,
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { workspace } = await params
  const { q } = await searchParams
  const { db, tenant } = await requireWorkspace(workspace)

  const query = q?.trim() ?? ""
  const hits = query ? await search(tenant.id, query, { limit: 50 }) : []
  const totalIndexed = await db.searchDocument.count({ where: { tenantId: tenant.id } })

  const grouped = new Map<string, typeof hits>()
  for (const hit of hits) {
    grouped.set(hit.entityType, [...(grouped.get(hit.entityType) ?? []), hit])
  }

  const tiles = [
    {
      label: "Indexed entities",
      value: totalIndexed,
      unit: "records",
      note: "tasks, projects, files & clients",
      icon: Search,
    },
    {
      label: "Query results",
      value: hits.length,
      unit: "matches",
      note: query ? `for “${query}”` : "type in topbar to query",
      icon: Zap,
    },
    {
      label: "Search engine",
      value: "Hybrid",
      unit: "tsvector + trigram",
      note: "typo-tolerant ranking",
      icon: Sparkles,
    },
    {
      label: "Workspace security",
      value: "100%",
      unit: "private",
      note: "isolated to your workspace",
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">
            {query ? `Search Results for “${query}”` : "Universal Knowledge Search"}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {query
              ? `Found ${hits.length} result${hits.length === 1 ? "" : "s"} ranked by relevance.`
              : "Search across tasks, projects, deliverables, client relationships, notes, and emails."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Search className="size-3" />
            {hits.length} results
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

      {/* Results */}
      {query && hits.length === 0 ? (
        <Empty className="py-12">
          <EmptyTitle>No matching results</EmptyTitle>
          <EmptyDescription>
            Try searching for a client name, project keyword, or task title.
          </EmptyDescription>
        </Empty>
      ) : !query ? (
        <Card className="p-8 text-center">
          <Search className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium">Type any query in the top search bar</p>
          <p className="text-xs text-muted-foreground mt-1">
            Search tasks, clients, deliverable briefs, PDF contents, and finance records.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([type, entries]) => {
            const Icon = ENTITY_ICONS[type] || FileText
            return (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      {type.toLowerCase().replace("_", " ")}s
                    </span>
                    <Badge variant="outline" className="text-xs">{entries.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y text-xs">
                    {entries.map((hit) => (
                      <div key={`${hit.entityType}-${hit.entityId}`} className="py-2.5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          {hit.href ? (
                            <Link
                              href={`/w/${workspace}${hit.href}`}
                              className="font-medium text-sm hover:underline flex items-center gap-1 text-primary"
                            >
                              {hit.title}
                              <ArrowUpRight className="size-3" />
                            </Link>
                          ) : (
                            <span className="font-medium text-sm">{hit.title}</span>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[0.625rem]">
                          Score {hit.score.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
