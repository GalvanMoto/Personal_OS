/**
 * Proves the tenant boundary in `lib/db/tenant.ts` actually holds.
 *
 * Run with: npm run check:tenancy
 * Creates two throwaway tenants, tries to cross the boundary in every way the
 * Prisma API allows, and deletes them again.
 */
import "dotenv/config"
import { prisma } from "@/lib/db/client"
import { readFileSync } from "node:fs"

import { PLATFORM_MODELS, TENANT_MODELS, tenantDb } from "@/lib/db/tenant"

let failures = 0
function check(label: string, pass: boolean) {
  console.log(`${pass ? "  ok  " : " FAIL "} ${label}`)
  if (!pass) failures++
}

async function main() {
  console.log("Cross-tenant writes below are expected to be rejected; Prisma logs them as errors.\n")
  const a = await prisma.tenant.create({ data: { slug: `iso-a-${Date.now()}`, name: "Tenant A" } })
  const b = await prisma.tenant.create({ data: { slug: `iso-b-${Date.now()}`, name: "Tenant B" } })

  const dbA = tenantDb(a.id)
  const dbB = tenantDb(b.id)

  // create() must stamp tenantId without the caller supplying it
  const taskA = await dbA.task.create({ data: { title: "A's task" } as never })
  const taskB = await dbB.task.create({ data: { title: "B's task" } as never })
  check("create() stamps the active tenant", taskA.tenantId === a.id && taskB.tenantId === b.id)

  // findMany must not see across the boundary
  const seenByA = await dbA.task.findMany()
  check("findMany() returns only own rows", seenByA.length === 1 && seenByA[0].id === taskA.id)

  // findUnique by another tenant's primary key must miss
  const stolen = await dbA.task.findUnique({ where: { id: taskB.id } })
  check("findUnique() on a foreign id returns null", stolen === null)

  // update against a foreign id must not mutate anything
  let updateBlocked = false
  try {
    await dbA.task.update({ where: { id: taskB.id }, data: { title: "hijacked" } })
  } catch {
    updateBlocked = true
  }
  const afterUpdate = await prisma.task.findUnique({ where: { id: taskB.id } })
  check("update() cannot reach a foreign row", updateBlocked && afterUpdate?.title === "B's task")

  // updateMany with no where must stay inside the tenant
  await dbA.task.updateMany({ data: { priority: "URGENT" } })
  const bAfterBulk = await prisma.task.findUnique({ where: { id: taskB.id } })
  check("updateMany() without where stays in tenant", bAfterBulk?.priority === "MEDIUM")

  // delete against a foreign id must not remove it
  let deleteBlocked = false
  try {
    await dbA.task.delete({ where: { id: taskB.id } })
  } catch {
    deleteBlocked = true
  }
  const afterDelete = await prisma.task.findUnique({ where: { id: taskB.id } })
  check("delete() cannot reach a foreign row", deleteBlocked && afterDelete !== null)

  // deleteMany with no where must not empty the table
  await dbA.task.deleteMany({})
  // Counted across the two throwaway tenants only — a global count would be
  // polluted by seed data and turn this into a false alarm.
  const survivors = await prisma.task.count({
    where: { tenantId: { in: [a.id, b.id] } },
  })
  check("deleteMany() without where stays in tenant", survivors === 1)

  // count/aggregate scoped
  const countB = await dbB.task.count()
  check("count() is scoped", countB === 1)

  // Every model in the schema must be classified. An unclassified model would
  // throw at runtime on first use, so catch it here instead of in production.
  const schema = readFileSync("prisma/schema.prisma", "utf8")
  const declared = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1])
  const unclassified = declared.filter(
    (name) => !TENANT_MODELS.has(name) && !PLATFORM_MODELS.has(name)
  )
  check(
    `every schema model is classified${unclassified.length ? ` (missing: ${unclassified.join(", ")})` : ""}`,
    unclassified.length === 0
  )

  await prisma.tenant.deleteMany({ where: { id: { in: [a.id, b.id] } } })

  console.log(failures === 0 ? "\nAll isolation checks passed." : `\n${failures} check(s) FAILED.`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
