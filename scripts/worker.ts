/**
 * Background worker entrypoint.
 *
 * Run alongside the app: npm run worker
 *
 * Safe to run more than one — `claimNext()` uses FOR UPDATE SKIP LOCKED, and
 * the scheduler refuses to enqueue a kind that is already pending for a tenant.
 */
import "dotenv/config"

import { prisma } from "@/lib/db/client"
import { runWorker } from "@/lib/jobs/worker"

const controller = new AbortController()

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.log(`\n${signal} received, finishing the current tick…`)
    controller.abort()
  })
}

console.log("Worker started. Ctrl-C to stop.")

runWorker({
  signal: controller.signal,
  onTick: ({ enqueued, processed }) => {
    if (enqueued || processed) {
      console.log(
        `[${new Date().toISOString()}] enqueued ${enqueued}, processed ${processed}`
      )
    }
  },
})
  .then(({ ticks }) => console.log(`Worker stopped after ${ticks} ticks.`))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
