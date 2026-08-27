/**
 * Server-side smoke test.
 *
 * Signs in as the seeded user by minting a session row directly, then requests
 * every workspace route and reports its status. Catches the runtime failures a
 * build cannot — a bad Prisma query, a missing provider, a thrown context.
 *
 * Usage: npm run dev  (in one shell)
 *        npm run smoke
 */
import "dotenv/config"

import { createHash, randomBytes } from "node:crypto"

import { prisma } from "@/lib/db/client"

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000"
const EMAIL = process.env.SEED_EMAIL ?? "demo@example.com"

function digest(token: string) {
  return createHash("sha256").update(`${token}${process.env.SESSION_SECRET}`).digest("hex")
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } })
  if (!user) throw new Error(`No seeded user ${EMAIL}. Run: npm run db:seed`)

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { tenant: true },
  })
  if (!membership) throw new Error("Seeded user has no workspace")

  const slug = membership.tenant.slug
  const token = randomBytes(32).toString("base64url")

  await prisma.session.create({
    data: {
      tokenHash: digest(token),
      userId: user.id,
      activeTenantId: membership.tenantId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  })

  const routes = [
    "/",
    `/w/${slug}`,
    `/w/${slug}/today`,
    `/w/${slug}/inbox`,
    `/w/${slug}/tasks`,
    `/w/${slug}/projects`,
    `/w/${slug}/clients`,
    `/w/${slug}/finance`,
    `/w/${slug}/activity`,
    `/w/${slug}/assistant`,
    `/w/${slug}/search?q=banquet`,
  ]

  let failures = 0

  const check = (ok: boolean, label: string, detail?: string) => {
    if (!ok) failures++
    console.log(`${ok ? "  ok  " : " FAIL "} ${label}`)
    if (!ok && detail) console.log(`        ${detail}`)
  }

  for (const route of routes) {
    try {
      const response = await fetch(`${BASE}${route}`, {
        headers: { cookie: `dlrs_session=${token}` },
        redirect: "manual",
      })

      const body = response.status >= 400 ? await response.text() : ""
      const ok = response.status < 400

      if (!ok) failures++

      console.log(
        `${ok ? "  ok  " : " FAIL "} ${String(response.status).padEnd(3)} ${route}` +
          (body ? `\n        ${body.slice(0, 300).replace(/\s+/g, " ")}` : "")
      )
    } catch (error) {
      failures++
      console.log(` FAIL  ERR ${route}`)
      console.log(`        ${error instanceof Error ? error.message : error}`)
    }
  }

  // Responding is not the same as being wired up. These assert the pages show
  // real workspace data and that none of the dashboard template's fixtures or
  // dead links survived.
  const page = async (path: string) =>
    (
      await fetch(`${BASE}/w/${slug}${path}`, {
        headers: { cookie: `dlrs_session=${token}` },
      })
    ).text()

  const DEMO_STRINGS = [
    "Harrison",
    "Appointment Volume",
    "Department Load",
    "Patients",
    "Medesk",
  ]

  const STALE_ROUTES =
    /href="\/(appointment|staff|departments|resources|analytics|reports|trends|ai-assistant|smart-queries|permissions)\b/

  const today = await page("/today")

  check(today.includes(user.name), "the greeting names the signed-in user")
  check(
    !DEMO_STRINGS.some((needle) => today.includes(needle)),
    "no template fixtures on the dashboard",
    DEMO_STRINGS.filter((needle) => today.includes(needle)).join(", ")
  )
  check(!STALE_ROUTES.test(today), "no links to routes that do not exist")
  check(
    today.includes(`/w/${slug}/tasks`) && today.includes(`/w/${slug}/finance`),
    "navigation is workspace-scoped"
  )

  const clients = await page("/clients")
  const orgCount = await prisma.organization.count({ where: { tenantId: membership.tenantId } })
  check(
    orgCount === 0 || !clients.includes("No clients yet"),
    "clients page reflects the database"
  )

  await prisma.session.deleteMany({ where: { tokenHash: digest(token) } })

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`)
  process.exit(failures === 0 ? 0 : 1)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
