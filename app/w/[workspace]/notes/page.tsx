import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import {
  BookOpen,
  CheckCircle2,
  Code2,
  FileCode,
  FileText,
  FolderGit2,
  Lightbulb,
  Notebook,
  PenTool,
  Plus,
  Sparkles,
  StickyNote,
  Users2,
} from "lucide-react"

import { CreateNoteDrawer } from "@/components/create/create-note-drawer"
import { UniversalFilterBar } from "@/components/filters/universal-filter-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = { title: "Notes & Knowledge Scratchpad · Personal OS" }

export default async function NotesPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const notes = await db.note.findMany({
    where: { tenantId: tenant.id },
    include: { project: true },
    orderBy: { updatedAt: "desc" },
    take: 60,
  })

  const projectNotes = notes.filter((n) => n.projectId)
  const standaloneNotes = notes.filter((n) => !n.projectId)

  const decisions = notes.filter(
    (n) =>
      n.title?.toLowerCase().includes("decision") ||
      n.title?.toLowerCase().includes("adr") ||
      n.title?.toLowerCase().includes("architecture")
  )

  const ideas = notes.filter(
    (n) =>
      n.title?.toLowerCase().includes("idea") ||
      n.title?.toLowerCase().includes("concept") ||
      n.title?.toLowerCase().includes("explore")
  )

  const meetings = notes.filter(
    (n) =>
      n.title?.toLowerCase().includes("meeting") ||
      n.title?.toLowerCase().includes("sync") ||
      n.title?.toLowerCase().includes("client")
  )

  const tiles = [
    {
      label: "Captured Knowledge Notes",
      value: notes.length,
      unit: "notes",
      note: "stored in persistent graph",
      icon: Notebook,
    },
    {
      label: "Project Decisions & ADRs",
      value: projectNotes.length,
      unit: "linked",
      note: "associated with initiatives",
      icon: FolderGit2,
    },
    {
      label: "Personal Scratchpad",
      value: standaloneNotes.length,
      unit: "memos",
      note: "quick capture thoughts",
      icon: Lightbulb,
    },
    {
      label: "Search & Memory Status",
      value: "Indexed",
      unit: "active",
      note: "PostgreSQL trigram & vector ready",
      icon: Sparkles,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Notes &amp; Knowledge Scratchpad</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Thinking &amp; memory layer: architecture decisions, meeting notes, creative thoughts, and cheat-sheets.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2">
          <CreateNoteDrawer workspace={workspace} />
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
      <UniversalFilterBar searchPlaceholder="Search notes, ADRs, meeting takeaways, and tags..." />

      {/* Main Tabbed Notes Matrix */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-8 text-[0.6875rem]">
          <TabsTrigger value="all">All Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="decisions">Decisions &amp; ADRs ({decisions.length})</TabsTrigger>
          <TabsTrigger value="ideas">Ideas &amp; Insights ({ideas.length})</TabsTrigger>
          <TabsTrigger value="meetings">Meeting Notes ({meetings.length})</TabsTrigger>
        </TabsList>

        {/* 1. ALL NOTES */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Knowledge Vault</span>
                <Badge variant="outline">{notes.length} Notes</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notes.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Notes Recorded</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Capture an idea, meeting takeaway, or architecture decision using the New Note button above.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg border bg-card/60 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-sm tracking-tight line-clamp-1">
                            {note.title || "Untitled Memo"}
                          </h3>
                          <StickyNote className="size-3.5 text-primary shrink-0 mt-0.5" />
                        </div>

                        {note.project ? (
                          <div className="flex items-center gap-1 text-[0.625rem] text-primary font-mono">
                            <FolderGit2 className="size-2.5" />
                            <span>{note.project.name}</span>
                          </div>
                        ) : null}

                        <p className="text-xs text-muted-foreground font-mono line-clamp-4 whitespace-pre-wrap leading-relaxed pt-1">
                          {note.body}
                        </p>
                      </div>

                      <div className="pt-2 border-t flex items-center justify-between text-[0.625rem] text-muted-foreground font-mono">
                        <span>Updated {note.updatedAt.toLocaleDateString("en-IN")}</span>
                        <Badge variant="outline" className="text-[0.5625rem]">Indexed</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. DECISIONS & ADRS */}
        <TabsContent value="decisions" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Architecture Decision Records (ADRs)</span>
                <Badge variant="outline">{decisions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {decisions.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Architecture Decisions</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Record structural and technical decisions to inform AI agent policies.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {decisions.map((note) => (
                    <div key={note.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <span className="font-semibold text-foreground">{note.title}</span>
                      <p className="text-[0.6875rem] text-muted-foreground font-mono whitespace-pre-wrap">{note.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. IDEAS */}
        <TabsContent value="ideas" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Ideas &amp; Creative Thoughts</span>
                <Badge variant="outline">{ideas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ideas.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Creative Ideas</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Quickly capture product concepts or feature ideas.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {ideas.map((note) => (
                    <div key={note.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <span className="font-semibold text-foreground">{note.title}</span>
                      <p className="text-[0.6875rem] text-muted-foreground font-mono whitespace-pre-wrap">{note.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. MEETINGS */}
        <TabsContent value="meetings" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Meeting Notes &amp; Client Takeaways</span>
                <Badge variant="outline">{meetings.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {meetings.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Meeting Notes</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Record meeting takeaways or client preferences.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {meetings.map((note) => (
                    <div key={note.id} className="p-4 space-y-1.5 hover:bg-muted/30">
                      <span className="font-semibold text-foreground">{note.title}</span>
                      <p className="text-[0.6875rem] text-muted-foreground font-mono whitespace-pre-wrap">{note.body}</p>
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
