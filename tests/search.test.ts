/**
 * Search behaviour and — critically — its tenant boundary.
 *
 * `search()` is raw SQL, so the Prisma extension that scopes every other query
 * does not apply. These tests exist because that is exactly the kind of place a
 * cross-tenant leak hides.
 *
 * Run with: npm run test:db
 */
import "dotenv/config"

import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"

import { prisma } from "@/lib/db/client"
import { tenantDb, type TenantDb } from "@/lib/db/tenant"
import { createOrganization } from "@/lib/domain/organizations"
import { createTask, deleteTask } from "@/lib/domain/tasks"
import { indexEntity, reindexWorkspace, relatedTo, search } from "@/lib/search"

let alphaId: string
let betaId: string
let alpha: TenantDb
let beta: TenantDb

before(async () => {
  const stamp = Date.now()
  const a = await prisma.tenant.create({
    data: { slug: `search-a-${stamp}`, name: "Alpha" },
  })
  const b = await prisma.tenant.create({
    data: { slug: `search-b-${stamp}`, name: "Beta" },
  })

  alphaId = a.id
  betaId = b.id
  alpha = tenantDb(alphaId)
  beta = tenantDb(betaId)

  const ctxA = { tenantId: alphaId }
  await createOrganization(alpha, ctxA, {
    name: "Tanniaqua Zone",
    notes: "Product brand, strict on brand colours",
  })
  await createTask(alpha, ctxA, {
    title: "Colour grade the product video",
    description: "Match the brand palette before export",
  })
  await createTask(alpha, ctxA, { title: "Write the LinkedIn launch post" })

  await createOrganization(beta, { tenantId: betaId }, {
    name: "Tanniaqua Zone",
    notes: "A different workspace entirely",
  })
})

after(async () => {
  await prisma.tenant.deleteMany({ where: { id: { in: [alphaId, betaId] } } })
  await prisma.$disconnect()
})

describe("search", () => {
  it("indexes entities as they are created", async () => {
    const hits = await search(alphaId, "product video")
    assert.ok(hits.length > 0)
    assert.ok(hits.some((hit) => hit.title.includes("Colour grade")))
  })

  it("ranks a title match above a body-only match", async () => {
    const hits = await search(alphaId, "Tanniaqua")
    assert.ok(hits.length > 0)
    assert.equal(hits[0].entityType, "ORGANIZATION")
  })

  it("finds entities through their description, not just the title", async () => {
    const hits = await search(alphaId, "brand palette")
    assert.ok(hits.some((hit) => hit.title.includes("Colour grade")))
  })

  it("tolerates a misspelling via trigram matching", async () => {
    // Full-text stemming alone would miss this; the trigram index catches it.
    const hits = await search(alphaId, "Taniaqua")
    assert.ok(hits.length > 0, "a near-miss spelling should still find the client")
  })

  it("never returns another workspace's rows", async () => {
    const fromAlpha = await search(alphaId, "Tanniaqua")
    const fromBeta = await search(betaId, "Tanniaqua")

    assert.ok(fromAlpha.length > 0)
    assert.ok(fromBeta.length > 0)

    const alphaIds = new Set(fromAlpha.map((hit) => hit.entityId))
    for (const hit of fromBeta) {
      assert.ok(
        !alphaIds.has(hit.entityId),
        "a hit crossed the tenant boundary"
      )
    }

    // Beta has only the organization; Alpha's tasks must not appear.
    assert.ok(!fromBeta.some((hit) => hit.entityType === "TASK"))
  })

  it("returns nothing for an empty query rather than everything", async () => {
    assert.deepEqual(await search(alphaId, "   "), [])
  })

  it("survives punctuation that would break a raw tsquery", async () => {
    // websearch_to_tsquery tolerates this; to_tsquery would throw.
    const hits = await search(alphaId, "product & video | !!!")
    assert.ok(Array.isArray(hits))
  })

  it("groups results by entity type for the 'everything about X' view", async () => {
    const grouped = await relatedTo(alphaId, "Tanniaqua")
    assert.ok(grouped.has("ORGANIZATION"))
  })

  it("drops a deleted entity from the index", async () => {
    const task = await createTask(alpha, { tenantId: alphaId }, {
      title: "Temporary zeppelin task",
    })

    assert.ok((await search(alphaId, "zeppelin")).length > 0)

    await deleteTask(alpha, { tenantId: alphaId }, task.id)

    assert.equal(
      (await search(alphaId, "zeppelin")).length,
      0,
      "search should not return ghosts"
    )
  })

  it("keeps hrefs workspace-relative so a rename cannot stale them", async () => {
    const hits = await search(alphaId, "LinkedIn")
    assert.ok(hits[0].href?.startsWith("/tasks/"))
  })

  it("rebuilds the index from the current data", async () => {
    // Simulate a row written outside the indexed path.
    const orphan = await alpha.task.create({
      data: { title: "Unindexed archery lesson" } as never,
    })
    assert.equal((await search(alphaId, "archery")).length, 0)

    const indexed = await reindexWorkspace(alpha)
    assert.ok(indexed > 0)
    assert.ok((await search(alphaId, "archery")).length > 0)

    await alpha.task.delete({ where: { id: orphan.id } })
  })

  it("upserts rather than duplicating on re-index", async () => {
    const before = await alpha.searchDocument.count()
    await reindexWorkspace(alpha)
    assert.equal(await alpha.searchDocument.count(), before)
  })

  it("updates the index when an entity is renamed", async () => {
    const task = await createTask(alpha, { tenantId: alphaId }, {
      title: "Original kayak title",
    })

    await indexEntity(alpha, {
      entityType: "TASK",
      entityId: task.id,
      title: "Renamed canoe title",
      href: `/tasks/${task.id}`,
    })

    assert.equal((await search(alphaId, "kayak")).length, 0)
    assert.ok((await search(alphaId, "canoe")).length > 0)
  })
})
