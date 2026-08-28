import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import {
  ArrowUpRight,
  BookOpen,
  Download,
  FileCheck2,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderGit2,
  HardDrive,
  Lock,
  Plus,
  Shield,
  Sparkles,
} from "lucide-react"

import { CreateDocumentDrawer } from "@/components/create/create-document-drawer"
import { UniversalFilterBar } from "@/components/filters/universal-filter-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShareButton } from "@/components/share/share-button"

export const metadata = { title: "Document Intelligence & Knowledge · Personal OS" }

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const documents = await db.document.findMany({
    where: { tenantId: tenant.id },
    include: { file: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  })

  const withContent = documents.filter((d) => d.content && d.content.length > 0)
  const withSummary = documents.filter((d) => d.summary && d.summary.length > 0)

  const briefs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes("brief") ||
      d.title.toLowerCase().includes("requirement") ||
      d.title.toLowerCase().includes("scope")
  )

  const contracts = documents.filter(
    (d) =>
      d.title.toLowerCase().includes("contract") ||
      d.title.toLowerCase().includes("agreement") ||
      d.title.toLowerCase().includes("nda") ||
      d.title.toLowerCase().includes("legal")
  )

  const specs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes("spec") ||
      d.title.toLowerCase().includes("sop") ||
      d.title.toLowerCase().includes("architecture") ||
      d.title.toLowerCase().includes("guide")
  )

  const tiles = [
    {
      label: "Structured Documents",
      value: documents.length,
      unit: "briefs",
      note: "parsed from client briefs and PDFs",
      icon: BookOpen,
    },
    {
      label: "Searchable Knowledge Text",
      value: withContent.length,
      unit: "indexed",
      note: "extracted via PDF text engine",
      icon: FileCheck2,
    },
    {
      label: "AI Semantic Summaries",
      value: withSummary.length,
      unit: "condensed",
      note: "ready for Context Pack inclusion",
      icon: Sparkles,
    },
    {
      label: "Underlying File Objects",
      value: documents.filter((d) => d.fileId).length,
      unit: "linked files",
      note: "backed by SHA-256 object vault",
      icon: HardDrive,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Document Intelligence &amp; Knowledge</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Structured knowledge layer: client specifications, contracts, creative briefs, and searchable documentation.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2">
          <CreateDocumentDrawer workspace={workspace} />
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
      <UniversalFilterBar searchPlaceholder="Search documents, briefs, specifications, and extracted facts..." />

      {/* Main Tabbed Document Matrix */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-8 text-[0.6875rem]">
          <TabsTrigger value="all">All Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="briefs">Client Briefs ({briefs.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contracts &amp; Legal ({contracts.length})</TabsTrigger>
          <TabsTrigger value="specs">Specs &amp; SOPs ({specs.length})</TabsTrigger>
        </TabsList>

        {/* 1. ALL DOCUMENTS */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Canonical Knowledge Documents</span>
                <Badge variant="outline">{documents.length} Total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {documents.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Documents Indexed</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Create a document or upload a brief to extract structured knowledge.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 hover:bg-muted/30 transition-colors space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/w/${workspace}/documents/${doc.id}`}
                              className="font-semibold text-foreground text-sm truncate hover:underline hover:text-primary transition-colors flex items-center gap-1.5"
                            >
                              <span>{doc.title}</span>
                              <ArrowUpRight className="size-3.5 text-muted-foreground opacity-60" />
                            </Link>
                            <Badge variant="secondary" className="text-[0.625rem]">
                              Document
                            </Badge>
                          </div>

                          <p className="text-[0.625rem] text-muted-foreground font-mono">
                            Indexed {doc.createdAt.toLocaleDateString("en-IN")} · {doc.content ? `${doc.content.length} chars indexed` : "Summary only"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                        {doc.file ? (
                          <a
                            href={`/api/files/${workspace}/${doc.file.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                          >
                            <Download className="size-3" />
                            <span>Source File ({doc.file.name})</span>
                          </a>
                        ) : null}
                        <ShareButton workspace={workspace} documentId={doc.id} initialToken={(doc as any).shareToken} initialPublic={(doc as any).isPublic} />
                        </div>
                      </div>

                      {doc.summary ? (
                        <div className="rounded-md border bg-primary/5 p-2.5 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground block mb-0.5 text-[0.6875rem] flex items-center gap-1">
                            <Sparkles className="size-3 text-primary" /> AI Summary &amp; Key Facts
                          </span>
                          {doc.summary}
                        </div>
                      ) : null}

                      {doc.content ? (
                        <Link
                          href={`/w/${workspace}/documents/${doc.id}`}
                          className="block font-mono text-[0.6875rem] text-muted-foreground line-clamp-3 bg-muted/20 hover:bg-muted/40 rounded p-2 border transition-colors cursor-pointer"
                        >
                          {doc.content}
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. BRIEFS */}
        <TabsContent value="briefs" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Client Briefs &amp; Requirements</span>
                <Badge variant="outline">{briefs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {briefs.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Client Briefs Found</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Drop a client brief into Inbox or author a new brief above.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {briefs.map((doc) => (
                    <div key={doc.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <span className="font-semibold text-foreground">{doc.title}</span>
                      <p className="text-[0.6875rem] text-muted-foreground">{doc.summary || doc.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. CONTRACTS */}
        <TabsContent value="contracts" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Contracts &amp; Legal Agreements</span>
                <Badge variant="outline">{contracts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {contracts.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Contracts Recorded</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Upload client agreements, NDAs, or partner contracts.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {contracts.map((doc) => (
                    <div key={doc.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <span className="font-semibold text-foreground">{doc.title}</span>
                      <p className="text-[0.6875rem] text-muted-foreground">{doc.summary || doc.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. SPECS & SOPS */}
        <TabsContent value="specs" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Technical Specifications &amp; SOPs</span>
                <Badge variant="outline">{specs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {specs.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Specifications Found</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Author technical architecture docs or operational SOPs.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {specs.map((doc) => (
                    <div key={doc.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <span className="font-semibold text-foreground">{doc.title}</span>
                      <p className="text-[0.6875rem] text-muted-foreground">{doc.summary || doc.content}</p>
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
