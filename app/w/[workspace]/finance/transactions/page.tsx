import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, BadgePercent, Calendar, CreditCard, DollarSign, Filter, Sparkles, Tag, TrendingDown, TrendingUp, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { CreateTransactionDrawer } from "@/components/create/create-transaction-drawer"
import { UniversalFilterBar } from "@/components/filters/universal-filter-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { formatMoney, money, sumMinor } from "@/lib/domain/money"
import { deriveMerchant, cleanDescription, categorize } from "@/lib/domain/categorize"

export const metadata = { title: "Bank Transactions Ledger · Personal OS" }

export default async function TransactionsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const transactions = await db.transaction.findMany({
    where: { tenantId: tenant.id },
    include: { organization: true, account: true },
    orderBy: { occurredAt: "desc" },
    take: 100,
  })

  const debits = transactions.filter((t) => t.direction === "DEBIT")
  const credits = transactions.filter((t) => t.direction === "CREDIT")

  const debitTotalMinor = sumMinor(debits.map((t) => t.amountMinor))
  const creditTotalMinor = sumMinor(credits.map((t) => t.amountMinor))
  const currency = transactions[0]?.currency ?? "INR"
  const uncategorized = transactions.filter((t) => !t.category || t.category === "OTHER")

  const tiles = [
    {
      label: "Total debits / spending",
      value: formatMoney(money(debitTotalMinor, currency)),
      unit: "outflow",
      note: `${debits.length} recorded debits`,
      icon: TrendingDown,
    },
    {
      label: "Total credits / income",
      value: formatMoney(money(creditTotalMinor, currency)),
      unit: "inflow",
      note: `${credits.length} client payments & deposits`,
      icon: TrendingUp,
    },
    {
      label: "Transaction volume",
      value: transactions.length,
      unit: "entries",
      note: "deduplicated by external ref",
      icon: CreditCard,
    },
    {
      label: "Categorization engine",
      value: `${transactions.length === 0 ? 100 : Math.round(((transactions.length - uncategorized.length) / transactions.length) * 100)}%`,
      unit: "classified",
      note: `${uncategorized.length} pending category rule`,
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
            <ArrowLeft className="size-3" /> Back to Finance Overview
          </Link>
          <h1 className="mt-1 text-xl font-medium tracking-tight flex items-center gap-2">
            Bank Transactions &amp; Statement Ledger
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Complete transaction ledger extracted from SBI, HDFC, ICICI, and Chase statements with deduplication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CreateTransactionDrawer workspace={workspace} />
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            {transactions.length} Total Records
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

      {/* Universal Filter & Search Bar */}
      <UniversalFilterBar
        searchPlaceholder="Search transactions by merchant, description, or bank ref..."
        dateFields={[
          { id: "occurredAt", label: "Transaction Date" },
          { id: "createdAt", label: "Recorded Date" },
        ]}
        quickFilters={[
          {
            id: "type",
            label: "Type",
            type: "select",
            options: [
              { label: "Debits / Spending", value: "DEBIT" },
              { label: "Credits / Inflow", value: "CREDIT" },
            ],
          },
          {
            id: "category",
            label: "Category",
            type: "select",
            options: [
              { label: "Software & SaaS", value: "SOFTWARE" },
              { label: "Food & Dining", value: "FOOD" },
              { label: "Travel", value: "TRAVEL" },
              { label: "Bills & Utilities", value: "BILLS" },
              { label: "Business", value: "BUSINESS" },
              { label: "Income", value: "INCOME" },
              { label: "Other", value: "OTHER" },
            ],
          },
        ]}
        advancedFilters={[
          {
            id: "amount",
            label: "Amount Bracket",
            type: "select",
            options: [
              { label: "< ₹500", value: "under_500" },
              { label: "₹500 – ₹2,000", value: "500_2000" },
              { label: "₹2,000 – ₹10,000", value: "2000_10000" },
              { label: "> ₹10,000", value: "above_10000" },
            ],
          },
        ]}
        presets={[
          { id: "debits", label: "All Debits", filters: { type: "DEBIT" } },
          { id: "credits", label: "Income Credits", filters: { type: "CREDIT" } },
          { id: "software", label: "Software SaaS", filters: { category: "SOFTWARE" } },
          { id: "large", label: "Large (>₹10k)", filters: { amount: "above_10000" } },
        ]}
        sortOptions={[
          { label: "Date (Newest)", value: "date_desc", direction: "desc" },
          { label: "Amount (Highest)", value: "amount_desc", direction: "desc" },
          { label: "Description", value: "desc_asc", direction: "asc" },
        ]}
        groupOptions={[
          { label: "Category", value: "category" },
          { label: "Direction", value: "direction" },
        ]}
      />

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <Empty className="py-16">
          <EmptyTitle>No bank transactions recorded yet</EmptyTitle>
          <EmptyDescription>
            Import a bank statement PDF in the Universal Inbox or record transactions to populate the ledger.
          </EmptyDescription>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span>All Ledger Entries</span>
              <Badge variant="outline">{transactions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              {transactions.map((tx) => {
                const isCredit = tx.direction === "CREDIT"
                const merchant = deriveMerchant(tx.description) ?? cleanDescription(tx.description).slice(0, 60) ?? tx.description
                const displayName = merchant || tx.description
                const liveCategory = categorize(tx.description, tx.direction as "DEBIT" | "CREDIT").category
                const displayCategory = liveCategory !== "UNKNOWN" ? liveCategory : tx.category ?? liveCategory
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCredit ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCredit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                      </div>

                      <div className="truncate">
                        <p className="font-medium text-sm text-foreground truncate" title={tx.description}>
                          {displayName}
                        </p>
                        {displayName !== tx.description ? (
                          <p className="truncate text-[0.625rem] text-muted-foreground/70" title={tx.description}>
                            {tx.description.slice(0, 80)}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-2 text-[0.625rem] text-muted-foreground mt-0.5">
                          <span>{tx.occurredAt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                          {displayCategory ? (
                            <>
                              <span>·</span>
                              <Badge variant="secondary" className="text-[0.625rem]">
                                {displayCategory.toLowerCase()}
                              </Badge>
                            </>
                          ) : null}
                          {tx.organization ? (
                            <>
                              <span>·</span>
                              <span className="text-foreground">{tx.organization.name}</span>
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
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          isCredit ? "text-emerald-500" : "text-foreground"
                        }`}
                      >
                        {isCredit ? "+" : "-"}{formatMoney(money(tx.amountMinor, tx.currency))}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
