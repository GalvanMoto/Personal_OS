/**
 * Financial intelligence against a real database.
 * Run with: npm run test:db
 */
import "dotenv/config"

import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"

import { prisma } from "@/lib/db/client"
import { tenantDb, type TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import {
  detectSubscriptions,
  importTransactions,
  recategorizeUnknown,
  recordTransaction,
  spendingSummary,
  syncSubscriptions,
  upcomingPayments,
} from "@/lib/domain/finance"

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date(2026, 7, 26)

let tenantId: string
let db: TenantDb
let ctx: DomainContext

/// A charge n months before NOW, on the same day of the month.
const monthsAgo = (n: number) =>
  new Date(NOW.getFullYear(), NOW.getMonth() - n, 5)

before(async () => {
  const tenant = await prisma.tenant.create({
    data: { slug: `finance-${Date.now()}`, name: "Finance Test" },
  })
  tenantId = tenant.id
  db = tenantDb(tenantId)
  ctx = { tenantId }
})

after(async () => {
  await prisma.tenant.delete({ where: { id: tenantId } })
  await prisma.$disconnect()
})

describe("recording transactions", () => {
  it("categorises from the narration", async () => {
    const { transaction, created } = await recordTransaction(db, ctx, {
      description: "UPI/SWIGGY LIMITED/44021",
      amountMinor: 42000n,
      direction: "DEBIT",
      occurredAt: new Date(NOW.getTime() - DAY),
      externalRef: "ref-swiggy-1",
    })

    assert.equal(created, true)
    assert.equal(transaction.category, "FOOD")
    assert.equal(transaction.amountMinor, 42000n)
  })

  it("skips a transaction already imported", async () => {
    const again = await recordTransaction(db, ctx, {
      description: "UPI/SWIGGY LIMITED/44021",
      amountMinor: 42000n,
      direction: "DEBIT",
      occurredAt: new Date(NOW.getTime() - DAY),
      externalRef: "ref-swiggy-1",
    })

    assert.equal(again.created, false)
    assert.equal(await db.transaction.count({ where: { externalRef: "ref-swiggy-1" } }), 1)
  })

  it("reports what a statement import actually did", async () => {
    const result = await importTransactions(db, ctx, [
      {
        description: "ADOBE CREATIVE CLOUD",
        amountMinor: 167500n,
        direction: "DEBIT",
        occurredAt: new Date(NOW.getTime() - 2 * DAY),
        externalRef: "ref-adobe-aug",
      },
      // Same reference as the first test — an overlapping statement.
      {
        description: "UPI/SWIGGY LIMITED/44021",
        amountMinor: 42000n,
        direction: "DEBIT",
        occurredAt: new Date(NOW.getTime() - DAY),
        externalRef: "ref-swiggy-1",
      },
    ])

    assert.equal(result.imported, 1)
    assert.equal(result.skipped, 1)
  })
})

describe("spending summary", () => {
  before(async () => {
    await importTransactions(db, ctx, [
      {
        description: "IRCTC TICKET",
        amountMinor: 210000n,
        direction: "DEBIT",
        occurredAt: new Date(NOW.getTime() - 3 * DAY),
        externalRef: "ref-irctc",
      },
      {
        description: "SALARY CREDIT",
        amountMinor: 15000000n,
        direction: "CREDIT",
        occurredAt: new Date(NOW.getTime() - 4 * DAY),
        externalRef: "ref-salary",
      },
    ])
  })

  it("totals debits and credits exactly", async () => {
    const summary = await spendingSummary(
      db,
      new Date(NOW.getTime() - 10 * DAY),
      new Date(NOW.getTime() + DAY)
    )

    // 420.00 + 1675.00 + 2100.00
    assert.equal(summary.spentMinor, 42000 + 167500 + 210000)
    assert.equal(summary.earnedMinor, 15000000)
    assert.equal(summary.netMinor, summary.earnedMinor - summary.spentMinor)
  })

  it("breaks spend down by category, largest first", async () => {
    const summary = await spendingSummary(
      db,
      new Date(NOW.getTime() - 10 * DAY),
      new Date(NOW.getTime() + DAY)
    )

    assert.ok(summary.byCategory.length >= 3)
    assert.equal(summary.byCategory[0].category, "TRAVEL")

    const shares = summary.byCategory.reduce((sum, row) => sum + row.share, 0)
    assert.ok(Math.abs(shares - 100) < 0.5, `shares should total ~100, got ${shares}`)
  })

  it("excludes credits from the spend figure", async () => {
    const summary = await spendingSummary(
      db,
      new Date(NOW.getTime() - 10 * DAY),
      new Date(NOW.getTime() + DAY)
    )

    assert.ok(!summary.byCategory.some((row) => row.category === "INCOME"))
  })
})

describe("subscription detection", () => {
  before(async () => {
    // Four monthly charges of the same amount — a real subscription.
    for (let i = 3; i >= 0; i--) {
      await recordTransaction(db, ctx, {
        description: `UPI/NETFLIX ENTERTAINMENT/${1000 + i}`,
        amountMinor: 64900n,
        direction: "DEBIT",
        occurredAt: monthsAgo(i),
        externalRef: `ref-netflix-${i}`,
      })
    }

    // Three visits to the same shop for wildly different amounts — not one.
    for (let i = 2; i >= 0; i--) {
      await recordTransaction(db, ctx, {
        description: `POS/CORNER CAFE/${2000 + i}`,
        amountMinor: BigInt(20000 + i * 30000),
        direction: "DEBIT",
        occurredAt: monthsAgo(i),
        externalRef: `ref-cafe-${i}`,
      })
    }

    // Only two charges — not enough evidence.
    for (let i = 1; i >= 0; i--) {
      await recordTransaction(db, ctx, {
        description: `UPI/GYM MEMBERSHIP/${3000 + i}`,
        amountMinor: 150000n,
        direction: "DEBIT",
        occurredAt: monthsAgo(i),
        externalRef: `ref-gym-${i}`,
      })
    }
  })

  it("finds a steady monthly charge", async () => {
    const found = await detectSubscriptions(db, NOW)
    const netflix = found.find((entry) => entry.merchant.includes("netflix"))

    assert.ok(netflix, "a four-month identical charge should be detected")
    assert.equal(netflix.cycle, "MONTHLY")
    assert.equal(netflix.amountMinor, 64900)
    assert.equal(netflix.occurrences, 4)
  })

  it("predicts the next charge a cycle after the last one", async () => {
    const found = await detectSubscriptions(db, NOW)
    const netflix = found.find((entry) => entry.merchant.includes("netflix"))!

    const gap =
      (netflix.nextExpectedAt.getTime() - netflix.lastChargedAt.getTime()) / DAY
    assert.ok(gap >= 27 && gap <= 33, `expected a monthly gap, got ${gap} days`)
  })

  it("ignores a merchant whose amounts vary", async () => {
    const found = await detectSubscriptions(db, NOW)
    assert.ok(
      !found.some((entry) => entry.merchant.includes("cafe")),
      "varying amounts are visits, not a subscription"
    )
  })

  it("will not call two charges a subscription", async () => {
    const found = await detectSubscriptions(db, NOW)
    assert.ok(
      !found.some((entry) => entry.merchant.includes("gym")),
      "two charges is not enough evidence"
    )
  })

  it("is more confident the more charges it has seen", async () => {
    const found = await detectSubscriptions(db, NOW)
    const netflix = found.find((entry) => entry.merchant.includes("netflix"))!
    assert.ok(netflix.confidence > 0.8)
    assert.ok(netflix.confidence <= 0.95)
  })

  it("writes detections into the subscriptions table without duplicating", async () => {
    const first = await syncSubscriptions(db, ctx, NOW)
    assert.ok(first.created >= 1)

    const before = await db.subscription.count()
    const second = await syncSubscriptions(db, ctx, NOW)

    assert.equal(await db.subscription.count(), before, "a re-run must update, not duplicate")
    assert.equal(second.created, 0)
    assert.ok(second.updated >= 1)
  })

  it("lists what is due in the next month", async () => {
    await syncSubscriptions(db, ctx, NOW)
    const upcoming = await upcomingPayments(db, 40, NOW)

    assert.ok(upcoming.length >= 1)
    assert.ok(upcoming[0].daysAway >= 0)
    // Soonest first.
    for (let i = 1; i < upcoming.length; i++) {
      assert.ok(upcoming[i].daysAway >= upcoming[i - 1].daysAway)
    }
  })
})

describe("recategorising", () => {
  it("revisits rows that never matched a rule", async () => {
    const unknown = await recordTransaction(db, ctx, {
      description: "MISC DR 88213",
      amountMinor: 5000n,
      direction: "DEBIT",
      occurredAt: NOW,
      externalRef: "ref-unknown",
    })
    assert.equal(unknown.transaction.category, "UNKNOWN")

    // Stands in for a description corrected after the fact.
    await db.transaction.update({
      where: { id: unknown.transaction.id },
      data: { description: "SPOTIFY INDIA" },
    })

    assert.equal(await recategorizeUnknown(db), 1)

    const after = await db.transaction.findUnique({
      where: { id: unknown.transaction.id },
    })
    assert.equal(after?.category, "ENTERTAINMENT")
  })
})
