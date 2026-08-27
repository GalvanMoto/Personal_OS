import "dotenv/config"
import { prisma } from "@/lib/db/client"
import { tenantDb } from "@/lib/db/tenant"
import { weeklyThroughput, workloadByClient } from "@/lib/domain/analytics"

const t = await prisma.tenant.findUnique({ where: { slug: "studio" } })
const db = tenantDb(t!.id)
console.log("throughput:", JSON.stringify(await weeklyThroughput(db, 4), null, 1))
console.log("workload:", JSON.stringify(await workloadByClient(db), null, 1))
await prisma.$disconnect()
