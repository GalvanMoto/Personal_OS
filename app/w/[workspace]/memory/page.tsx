import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { requireWorkspace } from "@/lib/auth/dal"
import { workloadByClient, weeklyThroughput } from "@/lib/domain/analytics"
import { spendingSummary, topMerchants } from "@/lib/domain/finance"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const metadata = { title: "AI Memory & Patterns · Personal OS" }

export default async function MemoryPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant, user } = await requireWorkspace(workspace)

  const now = new Date()
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [tasks, projects, orgs, emails, transactions, throughput, workload, merchants, summary] =
    await Promise.all([
      db.task.findMany({ where: { tenantId: tenant.id }, select: { status: true, priority: true, createdAt: true, dueAt: true } }),
      db.project.findMany({ where: { tenantId: tenant.id }, select: { status: true, name: true } }),
      db.organization.findMany({ where: { tenantId: tenant.id }, select: { name: true } }),
      db.emailMessage.findMany({ where: { tenantId: tenant.id }, select: { category: true } }),
      db.transaction.findMany({ where: { tenantId: tenant.id }, select: { category: true, direction: true } }),
      weeklyThroughput(db, 4, now),
      workloadByClient(db),
      topMerchants(db, from, now, 5),
      spendingSummary(db, from, now).catch(() => null),
    ])

  const totalTasks = tasks.length
  const doneRate = totalTasks ? Math.round((tasks.filter((t) => t.status === "DONE").length / totalTasks) * 100) : 0
  const urgentShare = totalTasks ? Math.round((tasks.filter((t) => t.priority === "URGENT").length / totalTasks) * 100) : 0
  const emailCats = emails.reduce<Record<string, number>>((a, e) => { a[e.category || "OTHER"] = (a[e.category || "OTHER"] || 0) + 1; return a }, {})
  const txCats = transactions.reduce<Record<string, number>>((a, t) => { a[t.category || "OTHER"] = (a[t.category || "OTHER"] || 0) + 1; return a }, {})

  const hasData = totalTasks > 0 || transactions.length > 0 || emails.length > 0

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">AI Memory &amp; Patterns</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            What your assistant has learned about your work, money, and communication — private to {tenant.name}, updated live.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">Private to {user.name}</Badge>
      </div>

      {!hasData ? (
        <Empty className="py-16">
          <EmptyTitle>Learning your patterns</EmptyTitle>
          <EmptyDescription>
            Capture a few tasks, emails, or transactions and your assistant will start mapping your rhythms — no setup needed.
          </EmptyDescription>
        </Empty>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-xs">Work Rhythm</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-1">
            <p><span className="font-medium">{totalTasks}</span> tasks learned</p>
            <p className="text-muted-foreground">{doneRate}% completion rate · {urgentShare}% urgent</p>
            <p className="text-muted-foreground">Throughput last 4 weeks: {throughput.map((w) => w.completed).join(" · ") || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-xs">Client Focus</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-1">
            {workload.rows.length ? workload.rows.slice(0,3).map((r) => <p key={r.name}>{r.name} · {r.count} tasks ({r.share}%)</p>) : <p className="text-muted-foreground">No client workload yet</p>}
            <p className="text-muted-foreground">{orgs.length} organizations · {projects.length} projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-xs">Money Patterns</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-1">
            {summary ? <p>30-day spend: {summary.currency} {(Number(summary.spentMinor)/100).toFixed(0)}</p> : <p className="text-muted-foreground">No spend yet</p>}
            {Object.entries(txCats).slice(0,3).map(([k,v]) => <p key={k} className="text-muted-foreground">{k}: {v}</p>)}
            {merchants.length ? <p className="text-muted-foreground">Top merchant: {merchants[0].merchant}</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-xs">Communication</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-1">
            {Object.entries(emailCats).slice(0,3).map(([k,v]) => <p key={k} className="text-muted-foreground">{k}: {v}</p>)}
            {emails.length === 0 ? <p className="text-muted-foreground">No emails learned yet</p> : <p>{emails.length} emails categorized</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-xs">How your assistant uses this</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>• Ranks “Next Best Action” from overdue, client importance, and effort — not just due date</p>
            <p>• Suggests projects/clients when you capture (“GB Banquet → Social Media”)</p>
            <p>• Detects subscriptions and due payments from your transaction rhythm</p>
            <p>• Keeps every inference linked to its source (Provenance) so you can ask “why?”</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-xs">Controls</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-xs">
            <Link href={`/w/${workspace}/settings`} className="rounded border px-3 py-1.5 hover:bg-muted">Manage memory &amp; privacy</Link>
            <Link href={`/w/${workspace}/search`} className="rounded border px-3 py-1.5 hover:bg-muted">Search what it knows</Link>
            <Link href={`/w/${workspace}/assistant`} className="rounded bg-primary px-3 py-1.5 text-primary-foreground">Ask assistant</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
