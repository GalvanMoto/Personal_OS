import "server-only"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/lib/generated/prisma/client"

// Next.js hot-reloads modules in development, which would otherwise open a new
// connection pool on every edit until Postgres refuses new clients.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.")
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })
}

/// Unscoped client. Only the tenancy and auth layers may use this directly —
/// everything else goes through `tenantDb()` so queries cannot escape a tenant.
export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
