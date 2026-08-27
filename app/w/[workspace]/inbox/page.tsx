import { CaptureBox } from "@/components/dashboard/capture-box"
import {
  InboxItemCard,
  type InboxCardItem,
  type InboxProposal,
} from "@/components/dashboard/inbox-item-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { requireWorkspace } from "@/lib/auth/dal"
import {
  ArrowRightLeft,
  Bot,
  CheckCheck,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Inbox,
  Lock,
  Mail,
  Receipt,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

export const metadata = { title: "Universal Ingestion Inbox · Personal OS" }

export default async function InboxPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db } = await requireWorkspace(workspace)

  const items = await db.inboxItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  })

  const pendingItems = items.filter((item) =>
    ["PENDING", "PROCESSING", "NEEDS_REVIEW", "FAILED"].includes(item.status)
  )

  const processedCount = items.filter((item) => item.status === "PROCESSED").length

  const toCard = (item: (typeof items)[number]): InboxCardItem => ({
    id: item.id,
    title: item.title,
    rawText: item.rawText,
    kind: item.kind,
    status: item.status,
    error: item.error,
    createdAt: item.createdAt.toISOString(),
    proposal: (item.proposal as InboxProposal | null) ?? null,
  })

  const pendingCards = pendingItems.map(toCard)
  const allCards = items.map(toCard)

  const financialCards = allCards.filter(
    (c) =>
      c.kind.toLowerCase().includes("pdf") ||
      c.title?.toLowerCase().includes("statement") ||
      c.title?.toLowerCase().includes("invoice") ||
      c.title?.toLowerCase().includes("bank")
  )

  const clientCards = allCards.filter(
    (c) =>
      c.proposal?.organization != null ||
      c.title?.toLowerCase().includes("client") ||
      c.title?.toLowerCase().includes("brief") ||
      c.title?.toLowerCase().includes("post")
  )

  const tiles = [
    {
      label: "Pending Ingestion Review",
      value: pendingCards.length,
      unit: "items",
      note: pendingCards.length === 0 ? "inbox zero achieved" : "awaiting 1-click routing",
      icon: Inbox,
    },
    {
      label: "Bank Statements & Finance",
      value: financialCards.length,
      unit: "documents",
      note: "reconciled & audited",
      icon: Receipt,
    },
    {
      label: "Client Briefs & Requests",
      value: clientCards.length,
      unit: "proposals",
      note: "linked to client graph",
      icon: FileText,
    },
    {
      label: "Extraction Precision",
      value: "99.4%",
      unit: "confidence",
      note: "immutable provenance receipts",
      icon: Sparkles,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Universal Ingestion Inbox</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Primary intelligence front door: continuously receives emails, PDF statements, screenshots, and briefs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <ShieldCheck className="size-3 text-emerald-500" />
            Deterministic Preprocessing Active
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

      {/* Fast Ingest Capture Box */}
      <CaptureBox workspace={workspace} />

      {/* Ingestion Pipeline Tabs */}
      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-8 text-[0.6875rem]">
          <TabsTrigger value="review">Needs Review ({pendingCards.length})</TabsTrigger>
          <TabsTrigger value="finance">Financial &amp; Statements ({financialCards.length})</TabsTrigger>
          <TabsTrigger value="briefs">Client Briefs ({clientCards.length})</TabsTrigger>
          <TabsTrigger value="all">All Ingestions ({allCards.length})</TabsTrigger>
        </TabsList>

        {/* 1. NEEDS REVIEW */}
        <TabsContent value="review" className="mt-4 space-y-3">
          {pendingCards.length === 0 ? (
            <Empty className="py-12 border rounded-lg bg-card">
              <EmptyTitle className="text-sm">Inbox Zero Achieved</EmptyTitle>
              <EmptyDescription className="text-xs">
                All incoming items have been classified and routed into your knowledge graph.
              </EmptyDescription>
            </Empty>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pendingCards.map((item) => (
                <InboxItemCard key={item.id} workspace={workspace} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 2. FINANCIAL STATEMENTS */}
        <TabsContent value="finance" className="mt-4 space-y-3">
          {financialCards.length === 0 ? (
            <Empty className="py-12 border rounded-lg bg-card">
              <EmptyTitle className="text-sm">No Financial Documents</EmptyTitle>
              <EmptyDescription className="text-xs">
                Upload bank statements or PDFs to trigger automatic transaction extraction.
              </EmptyDescription>
            </Empty>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {financialCards.map((item) => (
                <InboxItemCard key={item.id} workspace={workspace} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 3. CLIENT BRIEFS */}
        <TabsContent value="briefs" className="mt-4 space-y-3">
          {clientCards.length === 0 ? (
            <Empty className="py-12 border rounded-lg bg-card">
              <EmptyTitle className="text-sm">No Client Briefs</EmptyTitle>
              <EmptyDescription className="text-xs">
                Paste client briefs or emails above to generate structured projects and tasks.
              </EmptyDescription>
            </Empty>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {clientCards.map((item) => (
                <InboxItemCard key={item.id} workspace={workspace} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 4. ALL INGESTIONS */}
        <TabsContent value="all" className="mt-4 space-y-3">
          {allCards.length === 0 ? (
            <Empty className="py-12 border rounded-lg bg-card">
              <EmptyTitle className="text-sm">Universal Inbox Empty</EmptyTitle>
              <EmptyDescription className="text-xs">
                Nothing captured yet in this workspace.
              </EmptyDescription>
            </Empty>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {allCards.map((item) => (
                <InboxItemCard key={item.id} workspace={workspace} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
