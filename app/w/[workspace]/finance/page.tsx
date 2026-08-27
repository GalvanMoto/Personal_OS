import Link from "next/link"
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  FileCheck,
  FolderGit2,
  HardDrive,
  Landmark,
  Plus,
  Receipt,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import {
  CategoryBreakdown,
  Sparkline,
  SpendVsIncomeChart,
  TopMerchants,
} from "@/components/dashboard/finance-charts"
import { CATEGORICAL, SERIES } from "@/components/dashboard/viz-palette"
import { CreateTransactionDrawer } from "@/components/create/create-transaction-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireWorkspace } from "@/lib/auth/dal"
import {
  dailySpend,
  spendingSeries,
  spendingSummary,
  topMerchants,
  upcomingPayments,
} from "@/lib/domain/finance"
import { formatMoney, money } from "@/lib/domain/money"

export const metadata = { title: "Finance Overview · Personal OS" }

export default async function FinancePage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db } = await requireWorkspace(workspace)

  const to = new Date()
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [summary, series, daily, merchants, upcoming, recent, subscriptions] = await Promise.all([
    spendingSummary(db, from, to),
    spendingSeries(db, 6),
    dailySpend(db, 30),
    topMerchants(db, from, to, 7),
    upcomingPayments(db, 45),
    db.transaction.findMany({ orderBy: { occurredAt: "desc" }, take: 12 }),
    db.subscription.findMany({ take: 10 }),
  ])

  const fmt = (minor: number | bigint) => formatMoney(money(minor, summary.currency))
  const dueSoonMinor = upcoming.reduce((sum, payment) => sum + payment.amountMinor, 0)

  const tiles = [
    {
      label: "Spent · 30 days",
      value: fmt(summary.spentMinor),
      note:
        summary.changeVsPrevious === null
          ? "no prior period"
          : `${summary.changeVsPrevious >= 0 ? "+" : ""}${summary.changeVsPrevious}% vs previous 30 days`,
      slot: SERIES.spent,
      spark: daily.map((day) => day.minor),
      icon: TrendingDown,
    },
    {
      label: "Received · 30 days",
      value: fmt(summary.earnedMinor),
      note: `${series.length}-month history`,
      slot: SERIES.earned,
      spark: series.map((point) => point.earnedMinor),
      icon: TrendingUp,
    },
    {
      label: "Net Cash Flow",
      value: fmt(summary.netMinor),
      note: summary.netMinor >= 0 ? "in surplus" : "spending exceeds income",
      slot: CATEGORICAL[6],
      spark: series.map((point) => point.earnedMinor - point.spentMinor),
      icon: Wallet,
    },
    {
      label: "Due in 45 days",
      value: fmt(dueSoonMinor),
      note: `${upcoming.length} recurring payment${upcoming.length === 1 ? "" : "s"}`,
      slot: CATEGORICAL[3],
      spark: upcoming.map((payment) => payment.amountMinor),
      icon: RefreshCw,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Finance &amp; Treasury Intelligence</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Structured source of truth: automated statement reconciliation, subscription radar, and client billing.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2">
          <CreateTransactionDrawer workspace={workspace} />
          <Link
            href={`/w/${workspace}/finance/transactions`}
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <CreditCard className="size-3" />
            <span>Ledger</span>
          </Link>
          <Link
            href={`/w/${workspace}/finance/subscriptions`}
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <RefreshCw className="size-3" />
            <span>Subscriptions</span>
          </Link>
          <Link
            href={`/w/${workspace}/finance/invoices`}
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Receipt className="size-3" />
            <span>Invoices</span>
          </Link>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="flex flex-col gap-2 pt-4">
              <span className="text-xs text-muted-foreground">{tile.label}</span>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-medium tabular-nums">{tile.value}</p>
                  <p className="text-[0.625rem] text-muted-foreground">{tile.note}</p>
                </div>
                {tile.spark.length > 1 ? (
                  <Sparkline
                    points={tile.spark}
                    slot={tile.slot}
                    className="w-24 shrink-0"
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Spent vs Received · 6-Month Trajectory</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendVsIncomeChart
              data={series.map((point) => ({
                label: point.label,
                spentMinor: point.spentMinor,
                earnedMinor: point.earnedMinor,
              }))}
              currency={summary.currency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Expense Categorization Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown
              rows={summary.byCategory}
              currency={summary.currency}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Outflow Merchants · 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <TopMerchants rows={merchants} currency={summary.currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Upcoming Obligations</span>
              <Badge variant="outline">{upcoming.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs">
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">
                No recurring payments detected yet.
              </p>
            ) : (
              upcoming.slice(0, 8).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-baseline justify-between gap-3 p-2 rounded-md hover:bg-muted/30"
                >
                  <span className="truncate font-medium">{payment.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground font-mono">
                    {fmt(payment.amountMinor)}
                    {" · "}
                    {payment.daysAway === 0 ? "today" : `${payment.daysAway}d`}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Ledger Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm">Recent Ledger Transactions</CardTitle>
            <CardDescription className="text-xs">
              Direct entries reconciled from bank statements and receipts.
            </CardDescription>
          </div>
          <Link
            href={`/w/${workspace}/finance/transactions`}
            className="text-xs text-primary hover:underline font-medium"
          >
            View All Ledger Entries →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-right text-xs">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {recent.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="max-w-[18rem] truncate font-medium">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      {transaction.category ? (
                        <Badge variant="outline" className="text-[0.625rem]">
                          {transaction.category.toLowerCase()}
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono">
                      {transaction.occurredAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono">
                      <span className={transaction.direction === "CREDIT" ? "text-emerald-500" : "text-foreground"}>
                        {transaction.direction === "CREDIT" ? "+" : "−"}
                        {fmt(transaction.amountMinor)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
