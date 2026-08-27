import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import { categorize, merchantKey, type Category } from "@/lib/domain/categorize"
import type { DomainContext } from "@/lib/domain/context-types"
import { minorToNumber, percentChange, sumMinor } from "@/lib/domain/money"
import { logActivity } from "@/lib/events/activity"
import { emit } from "@/lib/events/bus"
import type { BillingCycle, TransactionDirection } from "@/lib/generated/prisma/enums"

/**
 * Financial intelligence (PRD §8, §9).
 *
 * Every number here is computed with integer arithmetic from stored rows. The
 * model is never asked what something totals — it is asked, at most, what an
 * unrecognised merchant might be. Getting a spending figure subtly wrong is
 * worse than not showing one.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export type RecordTransactionInput = {
  description: string
  amountMinor: bigint
  direction: TransactionDirection
  occurredAt: Date
  currency?: string
  accountId?: string
  organizationId?: string
  category?: Category
  /// Bank reference, used to make repeated statement imports idempotent.
  externalRef?: string
}

/**
 * Records a transaction, skipping one already imported.
 *
 * Statements overlap — August's and September's both contain the last days of
 * August — so re-importing must not double-count. The bank's own reference is
 * the dedupe key.
 */
export async function recordTransaction(
  db: TenantDb,
  ctx: DomainContext,
  input: RecordTransactionInput
) {
  // 1. Exact external ID / bank reference deduplication
  if (input.externalRef) {
    const existing = await db.transaction.findFirst({
      where: { externalRef: input.externalRef },
    })
    if (existing) return { transaction: existing, created: false }
  }

  // 2. Deterministic fingerprint deduplication for overlapping statements (date + amount + direction + account + description)
  const existingFingerprint = await db.transaction.findFirst({
    where: {
      occurredAt: input.occurredAt,
      amountMinor: input.amountMinor,
      direction: input.direction,
      description: input.description.trim(),
      accountId: input.accountId,
    },
  })
  if (existingFingerprint) {
    return { transaction: existingFingerprint, created: false }
  }

  const guess = input.category
    ? { category: input.category, confidence: 1, matched: null }
    : categorize(input.description, input.direction)

  const transaction = await db.transaction.create({
    data: {
      description: input.description.trim(),
      amountMinor: input.amountMinor,
      direction: input.direction,
      currency: input.currency ?? "INR",
      occurredAt: input.occurredAt,
      accountId: input.accountId,
      organizationId: input.organizationId,
      category: guess.category,
      externalRef: input.externalRef,
    } as never,
  })

  await emit(db, ctx.tenantId, {
    type: "transaction.imported",
    payload: { transactionId: transaction.id, category: guess.category },
    actorType: ctx.actorType ?? "SYSTEM",
  })

  return { transaction, created: true }
}

/**
 * Bulk import from a parsed statement.
 *
 * Returns counts rather than rows: the caller wants to tell the user "imported
 * 34, skipped 6 duplicates", not hold the whole statement in memory.
 */
export async function importTransactions(
  db: TenantDb,
  ctx: DomainContext,
  rows: RecordTransactionInput[]
) {
  let imported = 0
  let skipped = 0

  for (const row of rows) {
    const { created } = await recordTransaction(db, ctx, row)
    if (created) imported++
    else skipped++
  }

  await logActivity(db, {
    action: "finance.imported",
    summary: `Imported ${imported} transaction${imported === 1 ? "" : "s"}${
      skipped ? `, skipped ${skipped} already seen` : ""
    }`,
    userId: ctx.userId,
    actorType: ctx.actorType ?? "SYSTEM",
  })

  return { imported, skipped }
}

export type SpendingSummary = {
  from: Date
  to: Date
  currency: string
  spentMinor: number
  earnedMinor: number
  netMinor: number
  byCategory: Array<{ category: string; minor: number; share: number }>
  /// Change in spend against the equally long preceding window, or null when
  /// there is nothing to compare against.
  changeVsPrevious: number | null
}

/**
 * What was spent in a window, by category.
 *
 * Totals are summed as BigInt and converted once at the edge, so no
 * intermediate rounding can accumulate.
 */
export async function spendingSummary(
  db: TenantDb,
  from: Date,
  to: Date,
  currency = "INR"
): Promise<SpendingSummary> {
  const transactions = await db.transaction.findMany({
    where: { occurredAt: { gte: from, lt: to }, currency },
    select: { amountMinor: true, direction: true, category: true },
  })

  // Exclude internal transfers and liability settlements from spent/earned calculations per financelogic.txt
  const debits = transactions.filter((row) => row.direction === "DEBIT" && row.category !== "TRANSFER")
  const credits = transactions.filter((row) => row.direction === "CREDIT" && row.category !== "TRANSFER")

  const spent = sumMinor(debits.map((row) => row.amountMinor))
  const earned = sumMinor(credits.map((row) => row.amountMinor))

  const totals = new Map<string, bigint>()
  for (const row of debits) {
    const key = row.category ?? "UNKNOWN"
    totals.set(key, (totals.get(key) ?? 0n) + row.amountMinor)
  }

  const byCategory = [...totals.entries()]
    .map(([category, minor]) => ({
      category,
      minor: minorToNumber(minor),
      share: spent === 0n ? 0 : Math.round((Number(minor) / Number(spent)) * 1000) / 10,
    }))
    .sort((a, b) => b.minor - a.minor)

  // The same span immediately before, so "28% more on software" is meaningful.
  const span = to.getTime() - from.getTime()
  const previous = await db.transaction.findMany({
    where: {
      occurredAt: { gte: new Date(from.getTime() - span), lt: from },
      direction: "DEBIT",
      currency,
    },
    select: { amountMinor: true },
  })

  return {
    from,
    to,
    currency,
    spentMinor: minorToNumber(spent),
    earnedMinor: minorToNumber(earned),
    netMinor: minorToNumber(earned - spent),
    byCategory,
    changeVsPrevious: percentChange(
      sumMinor(previous.map((row) => row.amountMinor)),
      spent
    ),
  }
}

export type DetectedSubscription = {
  merchant: string
  description: string
  amountMinor: number
  currency: string
  cycle: BillingCycle
  occurrences: number
  lastChargedAt: Date
  nextExpectedAt: Date
  confidence: number
}

/// Median absolute gap in days, which resists a single missed or early charge
/// far better than a mean would.
function medianGapDays(dates: Date[]): number {
  const gaps = dates
    .slice(1)
    .map((date, index) => (date.getTime() - dates[index].getTime()) / DAY_MS)
    .sort((a, b) => a - b)

  if (gaps.length === 0) return 0

  const middle = Math.floor(gaps.length / 2)
  return gaps.length % 2 === 0 ? (gaps[middle - 1] + gaps[middle]) / 2 : gaps[middle]
}

function cycleFor(days: number): { cycle: BillingCycle; days: number } | null {
  if (days >= 6 && days <= 8) return { cycle: "WEEKLY", days: 7 }
  if (days >= 27 && days <= 33) return { cycle: "MONTHLY", days: 30 }
  if (days >= 85 && days <= 95) return { cycle: "QUARTERLY", days: 91 }
  if (days >= 355 && days <= 375) return { cycle: "YEARLY", days: 365 }
  return null
}

/**
 * Finds recurring payments in the transaction history (PRD §9).
 *
 * Groups by normalised merchant, then looks for a steady interval and a stable
 * amount. Deliberately conservative: three charges before calling something a
 * subscription, and amounts must agree within 5%. Two coincidental payments to
 * the same shop are not a subscription, and a false "you'll be charged ₹1,675
 * tomorrow" erodes trust in every other number the system shows.
 */
export async function detectSubscriptions(
  db: TenantDb,
  now = new Date()
): Promise<DetectedSubscription[]> {
  const transactions = await db.transaction.findMany({
    where: { direction: "DEBIT" },
    orderBy: { occurredAt: "asc" },
    select: {
      description: true,
      amountMinor: true,
      currency: true,
      occurredAt: true,
    },
  })

  const groups = new Map<string, typeof transactions>()

  for (const row of transactions) {
    const key = merchantKey(row.description)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  const detected: DetectedSubscription[] = []

  for (const [merchant, rows] of groups) {
    if (rows.length < 3) continue

    const amounts = rows.map((row) => row.amountMinor)
    const max = amounts.reduce((a, b) => (a > b ? a : b))
    const min = amounts.reduce((a, b) => (a < b ? a : b))

    // Amounts must be stable — a shop you visit often is not a subscription.
    if (max === 0n) continue
    const spread = Number(max - min) / Number(max)
    if (spread > 0.05) continue

    const gap = medianGapDays(rows.map((row) => row.occurredAt))
    const match = cycleFor(gap)
    if (!match) continue

    const last = rows[rows.length - 1]
    const nextExpectedAt = new Date(
      last.occurredAt.getTime() + match.days * DAY_MS
    )

    detected.push({
      merchant,
      description: last.description,
      amountMinor: minorToNumber(last.amountMinor),
      currency: last.currency,
      cycle: match.cycle,
      occurrences: rows.length,
      lastChargedAt: last.occurredAt,
      nextExpectedAt,
      // More observations and tighter amounts mean more certainty.
      confidence: Math.min(
        0.95,
        0.5 + rows.length * 0.1 + (0.05 - spread) * 2
      ),
    })
  }

  return detected
    .filter((entry) => entry.nextExpectedAt >= new Date(now.getTime() - 45 * DAY_MS))
    .sort((a, b) => a.nextExpectedAt.getTime() - b.nextExpectedAt.getTime())
}

/**
 * Writes detected subscriptions into the table, updating rather than
 * duplicating ones already known.
 */
export async function syncSubscriptions(
  db: TenantDb,
  ctx: DomainContext,
  now = new Date()
) {
  const detected = await detectSubscriptions(db, now)
  let created = 0
  let updated = 0

  for (const entry of detected) {
    const existing = await db.subscription.findFirst({
      where: { name: entry.merchant },
    })

    if (existing) {
      await db.subscription.update({
        where: { id: existing.id },
        data: {
          amountMinor: BigInt(entry.amountMinor),
          cycle: entry.cycle,
          nextDueAt: entry.nextExpectedAt,
        },
      })
      updated++
      continue
    }

    await db.subscription.create({
      data: {
        name: entry.merchant,
        vendor: entry.description.slice(0, 120),
        amountMinor: BigInt(entry.amountMinor),
        currency: entry.currency,
        cycle: entry.cycle,
        nextDueAt: entry.nextExpectedAt,
      } as never,
    })

    await emit(db, ctx.tenantId, {
      type: "subscription.detected",
      payload: { merchant: entry.merchant, cycle: entry.cycle },
      actorType: "SYSTEM",
    })

    created++
  }

  return { created, updated, detected: detected.length }
}

/// Payments expected in the next `days`, soonest first (PRD §9).
export async function upcomingPayments(db: TenantDb, days = 30, now = new Date()) {
  const until = new Date(now.getTime() + days * DAY_MS)

  const subscriptions = await db.subscription.findMany({
    where: { active: true, nextDueAt: { gte: now, lte: until } },
    orderBy: { nextDueAt: "asc" },
  })

  return subscriptions.map((subscription) => ({
    id: subscription.id,
    name: subscription.name,
    amountMinor: minorToNumber(subscription.amountMinor),
    currency: subscription.currency,
    cycle: subscription.cycle,
    dueAt: subscription.nextDueAt!,
    daysAway: Math.ceil(
      (subscription.nextDueAt!.getTime() - now.getTime()) / DAY_MS
    ),
  }))
}

/// Re-runs categorisation over rows that were never matched, after a rule change.
export async function recategorizeUnknown(db: TenantDb) {
  const rows = await db.transaction.findMany({
    where: { OR: [{ category: null }, { category: "UNKNOWN" }] },
    select: { id: true, description: true, direction: true },
  })

  let changed = 0

  for (const row of rows) {
    const guess = categorize(row.description, row.direction)
    if (guess.category === "UNKNOWN") continue

    await db.transaction.update({
      where: { id: row.id },
      data: { category: guess.category },
    })
    changed++
  }

  return changed
}

export type SpendPoint = {
  /// Short month label for the axis, e.g. "Aug".
  label: string
  monthStart: string
  spentMinor: number
  earnedMinor: number
}

/**
 * Month-by-month spend and income.
 *
 * Both series are money in the same currency, so they share one axis — a
 * second y-scale would invent a relationship the data does not contain.
 */
export async function spendingSeries(
  db: TenantDb,
  months = 6,
  now = new Date(),
  currency = "INR"
): Promise<SpendPoint[]> {
  const first = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

  const rows = await db.transaction.findMany({
    where: { occurredAt: { gte: first }, currency },
    select: { amountMinor: true, direction: true, occurredAt: true },
  })

  const buckets = new Map<string, { spent: bigint; earned: bigint }>()

  for (let index = 0; index < months; index++) {
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1) + index, 1)
    buckets.set(start.toISOString(), { spent: 0n, earned: 0n })
  }

  for (const row of rows) {
    const key = new Date(
      row.occurredAt.getFullYear(),
      row.occurredAt.getMonth(),
      1
    ).toISOString()

    const bucket = buckets.get(key)
    if (!bucket) continue

    if (row.direction === "DEBIT") bucket.spent += row.amountMinor
    else bucket.earned += row.amountMinor
  }

  return [...buckets.entries()].map(([monthStart, totals]) => ({
    label: new Date(monthStart).toLocaleDateString("en-IN", { month: "short" }),
    monthStart,
    spentMinor: minorToNumber(totals.spent),
    earnedMinor: minorToNumber(totals.earned),
  }))
}

/**
 * Daily spend totals, for the sparkline on a stat tile.
 *
 * Returns a dense array including zero days, so the sparkline's shape reflects
 * real gaps rather than compressing quiet periods away.
 */
export async function dailySpend(
  db: TenantDb,
  days = 30,
  now = new Date(),
  currency = "INR"
): Promise<Array<{ day: string; minor: number }>> {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))

  const rows = await db.transaction.findMany({
    where: { occurredAt: { gte: start }, direction: "DEBIT", currency },
    select: { amountMinor: true, occurredAt: true },
  })

  const totals = new Map<string, bigint>()

  for (let index = 0; index < days; index++) {
    const day = new Date(start.getTime() + index * DAY_MS)
    totals.set(day.toISOString().slice(0, 10), 0n)
  }

  for (const row of rows) {
    const key = row.occurredAt.toISOString().slice(0, 10)
    if (totals.has(key)) totals.set(key, totals.get(key)! + row.amountMinor)
  }

  return [...totals.entries()].map(([day, minor]) => ({
    day,
    minor: minorToNumber(minor),
  }))
}

/// Where the money actually goes, ranked. One measure, so the chart that renders
/// this uses a single hue rather than a value ramp.
export async function topMerchants(
  db: TenantDb,
  from: Date,
  to: Date,
  limit = 8,
  currency = "INR"
) {
  const rows = await db.transaction.findMany({
    where: { occurredAt: { gte: from, lt: to }, direction: "DEBIT", currency },
    select: { description: true, amountMinor: true },
  })

  const totals = new Map<string, { minor: bigint; count: number; label: string }>()

  for (const row of rows) {
    const key = merchantKey(row.description) || row.description.toLowerCase()
    const existing = totals.get(key)

    totals.set(key, {
      minor: (existing?.minor ?? 0n) + row.amountMinor,
      count: (existing?.count ?? 0) + 1,
      label: existing?.label ?? key,
    })
  }

  return [...totals.values()]
    .map((entry) => ({
      merchant: entry.label,
      minor: minorToNumber(entry.minor),
      count: entry.count,
    }))
    .sort((a, b) => b.minor - a.minor)
    .slice(0, limit)
}
