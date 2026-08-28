import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/client"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Link2, Clock, ShieldCheck } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const task = await prisma.task.findFirst({ where: { shareToken: token, isPublic: true }, select: { title: true } }).catch(()=>null)
  if (task) return { title: `${task.title} — Shared Task` }
  const doc = await prisma.document.findFirst({ where: { shareToken: token, isPublic: true }, select: { title: true } }).catch(()=>null)
  if (doc) return { title: `${doc.title} — Shared Doc` }
  return { title: "Shared — Personal OS" }
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const task = await prisma.task.findFirst({
    where: { shareToken: token, isPublic: true },
    select: { id: true, title: true, description: true, content: true, linkUrls: true, status: true, priority: true, dueAt: true, createdAt: true },
  }).catch(()=>null)

  if (task) {
    return (
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Badge variant="outline" className="gap-1"><ShieldCheck className="size-3" /> Public Task</Badge><span>·</span><span>{new Date(task.createdAt).toLocaleDateString()}</span></div>
        <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
        <div className="flex gap-2 text-xs"><Badge variant="secondary">{task.status}</Badge><Badge variant="outline">{task.priority}</Badge>{task.dueAt ? <span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3" />{new Date(task.dueAt).toLocaleDateString()}</span> : null}</div>
        {task.description ? <Card><CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</CardContent></Card> : null}
        {task.content ? <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="size-4" /> Rich Notes</CardTitle></CardHeader><CardContent><TiptapEditor value={task.content as any} editable={false} /></CardContent></Card> : null}
        {task.linkUrls?.length ? <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Link2 className="size-4" /> Links</CardTitle></CardHeader><CardContent className="space-y-2">{task.linkUrls.map((u:string)=>(<a key={u} href={u} target="_blank" rel="noreferrer" className="block rounded border p-2 text-xs font-mono hover:bg-muted break-all">{u}</a>))}</CardContent></Card> : null}
        <p className="text-xs text-muted-foreground">Public share via Personal OS — read-only.</p>
      </div>
    )
  }

  const doc = await prisma.document.findFirst({
    where: { shareToken: token, isPublic: true },
    include: { file: true },
  }).catch(()=>null)

  if (doc) {
    return (
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Badge variant="outline" className="gap-1"><ShieldCheck className="size-3" /> Public Doc</Badge><span>·</span><span>{new Date(doc.createdAt).toLocaleDateString()}</span></div>
        <h1 className="text-2xl font-semibold tracking-tight">{doc.title}</h1>
        {doc.summary ? <Card><CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{doc.summary}</CardContent></Card> : null}
        {doc.content ? <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="size-4" /> Content</CardTitle></CardHeader><CardContent className="text-sm whitespace-pre-wrap font-mono bg-muted/20 rounded p-3 border">{doc.content}</CardContent></Card> : null}
        {doc.file ? <Card><CardContent className="pt-4 text-xs"><a href={`/api/files/${doc.file.id}`} target="_blank" rel="noreferrer" className="text-primary underline">Download {doc.file.name}</a></CardContent></Card> : null}
      </div>
    )
  }

  notFound()
}
