/**
 * Development seed.
 *
 * Builds a workspace by running the real capture → extract → apply loop rather
 * than inserting rows directly, so the seed doubles as a smoke test of the
 * pipeline. A second workspace exists purely to make tenant isolation visible
 * in the UI.
 *
 * Run with: npm run db:seed
 */
import "dotenv/config"

import { hashPassword } from "@/lib/auth/password"
import { prisma } from "@/lib/db/client"
import { tenantDb } from "@/lib/db/tenant"
import { applyProposal, captureAndProcess } from "@/lib/domain/inbox"
import { createOrganization } from "@/lib/domain/organizations"
import { createProject } from "@/lib/domain/projects"
import { importTransactions, syncSubscriptions } from "@/lib/domain/finance"
import { createTask } from "@/lib/domain/tasks"
import { reindexWorkspace } from "@/lib/search"

const EMAIL = process.env.SEED_EMAIL ?? "demo@example.com"
const PASSWORD = process.env.SEED_PASSWORD ?? "personal-os-demo"

const DAY = 24 * 60 * 60 * 1000

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production database.")
  }

  console.log("Seeding…")

  // Idempotent: wipe only what this script owns.
  await prisma.tenant.deleteMany({
    where: { slug: { in: ["studio", "personal"] } },
  })
  await prisma.user.deleteMany({ where: { email: EMAIL } })

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: "Gautam",
      passwordHash: await hashPassword(PASSWORD),
    },
  })

  const studio = await prisma.tenant.create({
    data: { name: "Studio", slug: "studio" },
  })
  const personal = await prisma.tenant.create({
    data: { name: "Personal", slug: "personal" },
  })

  await prisma.membership.createMany({
    data: [
      { userId: user.id, tenantId: studio.id, role: "OWNER" },
      { userId: user.id, tenantId: personal.id, role: "OWNER" },
    ],
  })

  const db = tenantDb(studio.id)
  const ctx = { tenantId: studio.id, userId: user.id }
  const now = new Date()

  // --- A client with existing history, so context packs have something to show
  const banquet = await createOrganization(db, ctx, {
    name: "GB Banquet",
    kind: "CLIENT",
    notes: "Event venue. Prefers fast turnarounds and vertical video.",
  })

  const tanniaqua = await createOrganization(db, ctx, {
    name: "Tanniaqua Zone",
    kind: "CLIENT",
    notes: "Product brand. Strict on brand colours.",
  })

  const pastWork = await createProject(db, ctx, {
    name: "GB Banquet — Spring Campaign",
    organizationId: banquet.id,
    status: "COMPLETED",
  })

  for (const title of [
    "Edit venue walkthrough reel",
    "Design menu launch post",
    "Export teaser for stories",
  ]) {
    const task = await createTask(db, ctx, { title, projectId: pastWork.id })
    await db.task.update({
      where: { id: task.id },
      data: { status: "DONE", completedAt: new Date(now.getTime() - 21 * DAY) },
    })
  }

  // --- The PRD's own example, run through the real pipeline
  const captured = await captureAndProcess(db, ctx, {
    rawText:
      "Bro please make 3 reels for GB Banquet. First one should be event highlights, " +
      "second should show decoration and third should focus on the food. " +
      "Need them before Saturday. Photos are in Drive.",
    kind: "TEXT",
  })

  const applied = await applyProposal(db, ctx, captured.id)
  console.log(`  inbox → ${applied.tasks.length} tasks`)

  // --- A second capture left in review, so the Inbox screen is not empty
  await captureAndProcess(db, ctx, {
    rawText:
      "Client says: Please edit the new restaurant reel by Friday. " +
      "Use the new logo from Drive and add the menu items from this document.",
    kind: "TEXT",
  })

  // --- Hand-made work covering every state the Today page buckets
  const website = await createProject(db, ctx, {
    name: "Tanniaqua Zone — Website Refresh",
    organizationId: tanniaqua.id,
  })

  const fixtures: Array<Parameters<typeof createTask>[2] & { status?: never }> = [
    {
      title: "Update pricing section copy",
      projectId: website.id,
      priority: "URGENT",
      dueAt: new Date(now.getTime() - 2 * DAY),
      estimateMin: 45,
    },
    {
      title: "Export product video thumbnails",
      projectId: website.id,
      priority: "HIGH",
      dueAt: now,
      estimateMin: 25,
    },
    {
      title: "Write the LinkedIn launch post",
      projectId: website.id,
      priority: "MEDIUM",
      dueAt: new Date(now.getTime() + 3 * DAY),
    },
    {
      title: "Compress hero background loop",
      projectId: website.id,
      priority: "LOW",
      estimateMin: 20,
    },
  ]

  for (const fixture of fixtures) {
    await createTask(db, ctx, fixture)
  }

  const blocked = await createTask(db, ctx, {
    title: "Publish the campaign landing page",
    projectId: website.id,
    priority: "HIGH",
    dueAt: new Date(now.getTime() + 1 * DAY),
  })
  await db.task.update({
    where: { id: blocked.id },
    data: { status: "WAITING", waitingOn: "Client approval on final copy" },
  })

  const started = await createTask(db, ctx, {
    title: "Colour grade the product video",
    projectId: website.id,
    priority: "HIGH",
    dueAt: new Date(now.getTime() + 2 * DAY),
    estimateMin: 90,
  })
  await db.task.update({
    where: { id: started.id },
    data: { status: "IN_PROGRESS", startedAt: new Date(now.getTime() - 3600_000) },
  })

  // --- The other workspace stays deliberately sparse
  const personalDb = tenantDb(personal.id)
  await createTask(
    personalDb,
    { tenantId: personal.id, userId: user.id },
    { title: "Renew domain before it lapses", priority: "HIGH", dueAt: new Date(now.getTime() + 5 * DAY) }
  )

  // --- Finance: four months of history, including one real subscription
  const account = await db.financialAccount.create({
    data: {
      name: "Primary current account",
      kind: "BANK",
      institution: "SBI",
      maskedNumber: "4417",
    } as never,
  })

  const monthStart = (back: number, day: number) =>
    new Date(now.getFullYear(), now.getMonth() - back, day)

  const ledger = []

  for (let back = 3; back >= 0; back--) {
    // A steady charge the detector should pick up.
    ledger.push({
      description: `UPI/NETFLIX ENTERTAINMENT/${41000 + back}`,
      amountMinor: 64900n,
      direction: "DEBIT" as const,
      occurredAt: monthStart(back, 5),
      accountId: account.id,
      externalRef: `seed-netflix-${back}`,
    })

    // Everyday spend across a few categories.
    ledger.push(
      {
        description: `UPI/SWIGGY LIMITED/${52000 + back}`,
        amountMinor: BigInt(38000 + back * 4100),
        direction: "DEBIT" as const,
        occurredAt: monthStart(back, 11),
        accountId: account.id,
        externalRef: `seed-swiggy-${back}`,
      },
      {
        description: `ADOBE CREATIVE CLOUD ${back}`,
        amountMinor: 167500n,
        direction: "DEBIT" as const,
        occurredAt: monthStart(back, 2),
        accountId: account.id,
        externalRef: `seed-adobe-${back}`,
      },
      {
        description: `UBER INDIA TRIP ${back}`,
        amountMinor: BigInt(21000 + back * 7000),
        direction: "DEBIT" as const,
        occurredAt: monthStart(back, 17),
        accountId: account.id,
        externalRef: `seed-uber-${back}`,
      },
      {
        description: `NEFT FROM GB BANQUET INVOICE ${back}`,
        amountMinor: 4500000n,
        direction: "CREDIT" as const,
        occurredAt: monthStart(back, 8),
        accountId: account.id,
        externalRef: `seed-invoice-${back}`,
      }
    )
  }

  const finance = await importTransactions(db, ctx, ledger)
  const subscriptions = await syncSubscriptions(db, ctx)
  console.log(
    `  finance → ${finance.imported} transactions, ${subscriptions.created} subscriptions detected`
  )

  // Anything written straight through Prisma above bypassed the indexed write
  // path, so rebuild once at the end.
  const indexed = await reindexWorkspace(db)
  console.log(`  indexed ${indexed} entities for search`)

  const counts = {
    organizations: await db.organization.count(),
    projects: await db.project.count(),
    tasks: await db.task.count(),
    inbox: await db.inboxItem.count(),
    provenance: await db.provenance.count(),
    links: await db.entityLink.count(),
    searchDocs: await db.searchDocument.count(),
    transactions: await db.transaction.count(),
  }

  console.log("\nStudio workspace:", counts)
  console.log(`\nSign in with ${EMAIL} / ${PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
