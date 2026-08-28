import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/client"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Link2, Clock, ShieldCheck, Download, Calendar, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const task = await prisma.task.findFirst({
    where: { OR: [{ shareToken: token }, { id: token }] },
    select: { title: true },
  }).catch(() => null)
  if (task) return { title: `${task.title} — Shared Task · Personal OS` }

  const doc = await prisma.document.findFirst({
    where: { OR: [{ shareToken: token }, { id: token }] },
    select: { title: true },
  }).catch(() => null)
  if (doc) return { title: `${doc.title} — Shared Document · Personal OS` }

  return { title: "Shared Knowledge · Personal OS" }
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // 1. Check if token matches a shared Task
  const task = await prisma.task.findFirst({
    where: {
      OR: [
        { shareToken: token, isPublic: true },
        { id: token, isPublic: true },
        { shareToken: token },
        { id: token },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      linkUrls: true,
      status: true,
      priority: true,
      dueAt: true,
      createdAt: true,
    },
  }).catch(() => null)

  if (task) {
    return (
      <div className="min-h-screen bg-background text-foreground py-10 px-4">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                <ShieldCheck className="size-3" /> Public Task
              </Badge>
              <span>·</span>
              <span>{new Date(task.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Personal OS Share</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{task.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">{task.status}</Badge>
              <Badge variant="outline">{task.priority}</Badge>
              {task.dueAt ? (
                <span className="flex items-center gap-1 text-muted-foreground font-mono">
                  <Clock className="size-3" />
                  Due {new Date(task.dueAt).toLocaleDateString("en-IN")}
                </span>
              ) : null}
            </div>
          </div>

          {task.description ? (
            <Card className="border-border/80 bg-card/60 shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {task.description}
              </CardContent>
            </Card>
          ) : null}

          {task.content ? (
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <span>Task Notes &amp; Specifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <TiptapEditor value={task.content as any} editable={false} />
              </CardContent>
            </Card>
          ) : null}

          {task.linkUrls?.length ? (
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Link2 className="size-4 text-primary" />
                  <span>Linked Resources</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {task.linkUrls.map((u: string) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-md border p-2.5 text-xs font-mono hover:bg-muted/50 transition-colors break-all group"
                  >
                    <span>{u}</span>
                    <ExternalLink className="size-3.5 opacity-60 group-hover:opacity-100 shrink-0 ml-2" />
                  </a>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <footer className="text-center pt-8 border-t text-xs text-muted-foreground">
            Shared via <Link href="/" className="font-semibold text-foreground underline underline-offset-4">Personal OS</Link> — Read-only public view.
          </footer>
        </div>
      </div>
    )
  }

  // 2. Check if token matches a shared Document
  const doc = await prisma.document.findFirst({
    where: {
      OR: [
        { shareToken: token, isPublic: true },
        { id: token, isPublic: true },
        { shareToken: token },
        { id: token },
      ],
    },
    include: { file: true, tenant: { select: { slug: true } } },
  }).catch(() => null)

  if (doc) {
    return (
      <div className="min-h-screen bg-background text-foreground py-10 px-4">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                <ShieldCheck className="size-3" /> Public Knowledge Document
              </Badge>
              <span>·</span>
              <span>{new Date(doc.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Personal OS Share</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{doc.title}</h1>
            <p className="text-xs text-muted-foreground font-mono">
              Last updated {new Date(doc.updatedAt).toLocaleDateString("en-IN")}
            </p>
          </div>

          {doc.summary ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block text-xs">
                Key Summary
              </span>
              <p className="leading-relaxed">{doc.summary}</p>
            </div>
          ) : null}

          {doc.content ? (
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <span>Document Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <TiptapEditor value={doc.content} editable={false} />
              </CardContent>
            </Card>
          ) : null}

          {doc.file ? (
            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-foreground">{doc.file.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {(doc.file.sizeBytes / 1024).toFixed(1)} KB
                  </p>
                </div>
                <a
                  href={`/api/files/${doc.tenant.slug}/${doc.file.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Download className="size-3.5" />
                  <span>Download File</span>
                </a>
              </CardContent>
            </Card>
          ) : null}

          <footer className="text-center pt-8 border-t text-xs text-muted-foreground">
            Shared via <Link href="/" className="font-semibold text-foreground underline underline-offset-4">Personal OS</Link> — Read-only public view.
          </footer>
        </div>
      </div>
    )
  }

  notFound()
}
