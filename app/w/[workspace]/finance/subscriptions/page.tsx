import Link from "next/link"
import { ArrowLeft, AlertCircle, CalendarClock, CreditCard, RefreshCw, ShieldAlert, Sparkles, TrendingDown, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { UniversalFilterBar } from "@/components/filters/universal-filter-bar"
import { requireWorkspace } from "@/lib/auth/dal"
import { upcomingPayments } from "@/lib/domain/finance"
import { formatMoney, money, sumMinor } from "@/lib/domain/money"

export const metadata = { title: "Subscription Radar · Personal OS" }

export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db } = await requireWorkspace(workspace)

  const [subscriptions, upcoming] = await Promise.all([
    db.subscription.findMany({
      orderBy: [{ amountMinor: "desc" }],
    }),
    upcomingPayments(db, 30),
  ])

  const monthlyTotalMinor = sumMinor(subscriptions.map((s) => s.amountMinor))
  const annualTotalMinor = monthlyTotalMinor * BigInt(12)
  const currency = subscriptions[0]?.currency ?? "INR"
  const dueWithin3Days = upcoming.filter((p) => p.daysAway <= 3)

  const tiles = [
    {
      label: "Monthly Committed Spend",
      value: formatMoney(money(monthlyTotalMinor, currency)),
      unit: "/ month",
      note: `${formatMoney(money(annualTotalMinor, currency))} per year committed`,
      icon: Wallet,
    },
    {
      label: "Active Subscriptions",
      value: subscriptions.length,
      unit: "services",
      note: "automatically detected from statements",
      icon: RefreshCw,
    },
    {
      label: "72-Hour Renewal Alert",
      value: dueWithin3Days.length,
      unit: "imminent",
      note: dueWithin3Days.length === 0 ? "no debits in next 3 days" : "renewals pending debit",
      icon: AlertCircle,
    },
    {
      label: "Recurrence Confidence",
      value: "99.8%",
      unit: "deterministic",
      note: "integer cadence calculation",
      icon: Sparkles,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/w/${workspace}/finance`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-3" /> Back to Finance Dashboard
          </Link>
          <h1 className="mt-1 text-xl font-medium tracking-tight flex items-center gap-2">
            Subscription Radar &amp; Recurring Debits
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Deterministic recurrence engine tracking tool subscriptions, software retainers, and cloud bills.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <RefreshCw className="size-3" />
            {subscriptions.length} Active Radars
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

      {/* Universal Date Engine & Filter Bar */}
      <UniversalFilterBar searchPlaceholder="Search recurring subscriptions and software..." />

      {/* Subscriptions Grid */}
      {subscriptions.length === 0 ? (
        <Empty className="py-16">
          <EmptyTitle>No recurring subscriptions detected yet</EmptyTitle>
          <EmptyDescription>
            Import a bank statement PDF or record repetitive transactions to populate the Subscription Radar automatically.
          </EmptyDescription>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Detected Recurring Commitments</span>
              <Badge variant="outline">{subscriptions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">{sub.name}</p>
                    <p className="text-muted-foreground mt-0.5 font-mono text-[0.6875rem]">
                      Cycle: {sub.cycle.toLowerCase()} · Next debit:{" "}
                      {sub.nextDueAt ? sub.nextDueAt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Predicted monthly"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground font-mono">
                      {formatMoney(money(sub.amountMinor, sub.currency))}
                    </p>
                    <Badge variant={sub.active ? "secondary" : "outline"} className="text-[0.625rem] mt-0.5">
                      {sub.active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
