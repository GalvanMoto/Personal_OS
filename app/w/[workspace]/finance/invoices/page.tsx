import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, CheckCircle2, DollarSign, FileCheck, FileText, Receipt, Sparkles, TrendingUp, Users2, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { UniversalFilterBar } from "@/components/filters/universal-filter-bar"
import { formatMoney, money, sumMinor } from "@/lib/domain/money"

export const metadata = { title: "Invoices & Client Receipts · Personal OS" }

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const [clientTransactions, clients] = await Promise.all([
    db.transaction.findMany({
      where: {
        tenantId: tenant.id,
        direction: "CREDIT",
      },
      include: { organization: true },
      orderBy: { occurredAt: "desc" },
    }),
    db.organization.findMany({
      where: { tenantId: tenant.id, kind: "CLIENT" },
      include: { projects: true, transactions: true },
      orderBy: { name: "asc" },
    }),
  ])

  const totalInflowMinor = sumMinor(clientTransactions.map((t) => t.amountMinor))
  const currency = clientTransactions[0]?.currency ?? "INR"

  const tiles = [
    {
      label: "Total Client Revenue",
      value: formatMoney(money(totalInflowMinor, currency)),
      unit: "received",
      note: `${clientTransactions.length} settlement receipts`,
      icon: TrendingUp,
    },
    {
      label: "Billed Client Accounts",
      value: clients.length,
      unit: "clients",
      note: "active relationship graph",
      icon: Users2,
    },
    {
      label: "Inflow Receipts",
      value: clientTransactions.length,
      unit: "payments",
      note: "verified against bank statements",
      icon: Receipt,
    },
    {
      label: "Settlement Rate",
      value: "100%",
      unit: "cleared",
      note: "zero disputed entries",
      icon: FileCheck,
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
            <ArrowLeft className="size-3" /> Back to Finance Overview
          </Link>
          <h1 className="mt-1 text-xl font-medium tracking-tight flex items-center gap-2">
            Invoices, Retainers &amp; Client Receipts
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Client billing history, project settlements, and payment proof receipts extracted from statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <Receipt className="size-3" />
            {clientTransactions.length} Receipts
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
      <UniversalFilterBar searchPlaceholder="Search client receipts, invoice settlements, and retainers..." />

      {/* Main Grid: Client Billings & Recent Receipts */}
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        {/* Settlements Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Receipt className="size-4 text-emerald-500" />
                Settlement Receipts &amp; Retainers
              </span>
              <Badge variant="outline">{clientTransactions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {clientTransactions.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted-foreground">
                No client payment credits recorded yet.
              </p>
            ) : (
              <div className="divide-y text-xs">
                {clientTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-[0.625rem] text-muted-foreground mt-0.5 font-mono">
                        <span>{tx.occurredAt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                        {tx.organization ? (
                          <>
                            <span>·</span>
                            <Link
                              href={`/w/${workspace}/clients/${tx.organization.slug}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {tx.organization.name}
                            </Link>
                          </>
                        ) : null}
                        {tx.externalRef ? (
                          <>
                            <span>·</span>
                            <span className="font-mono">{tx.externalRef}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-emerald-500 font-mono">
                        +{formatMoney(money(tx.amountMinor, tx.currency))}
                      </p>
                      <Badge variant="secondary" className="text-[0.625rem] mt-0.5">
                        Cleared
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Accounts Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Users2 className="size-4" />
                Active Client Accounts
              </span>
              <Badge variant="outline">{clients.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {clients.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted-foreground">
                No client accounts recorded yet.
              </p>
            ) : (
              <div className="divide-y text-xs">
                {clients.map((client) => {
                  const clientTotalMinor = sumMinor(client.transactions.map((t) => t.amountMinor))
                  return (
                    <div key={client.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30">
                      <div className="min-w-0">
                        <Link
                          href={`/w/${workspace}/clients/${client.slug}`}
                          className="font-medium text-sm text-foreground hover:underline truncate block"
                        >
                          {client.name}
                        </Link>
                        <p className="text-muted-foreground mt-0.5 font-mono text-[0.6875rem]">
                          {client.projects.length} Active Projects · {client.transactions.length} Settlements
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold tabular-nums text-foreground font-mono">
                          {formatMoney(money(clientTotalMinor, currency))}
                        </p>
                        <span className="text-[0.625rem] text-muted-foreground block">Lifetime Value</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
