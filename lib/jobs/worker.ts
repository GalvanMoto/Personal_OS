import "server-only"

import { tick } from "@/lib/jobs/schedule"
import { drain } from "@/lib/jobs/runner"

/**
 * The worker loop.
 *
 * One process: schedule what is due, then drain the queue. Kept as a plain
 * async loop rather than a framework so it runs the same way under `npm run
 * worker`, a systemd unit, or a container — and so the whole of the background
 * system can be reasoned about by reading two functions.
 */

export type WorkerOptions = {
  /// How long to wait between ticks.
  intervalMs?: number
  /// Stop after this many ticks. Omit to run until signalled.
  maxTicks?: number
  signal?: AbortSignal
  onTick?: (result: { enqueued: number; processed: number }) => void
}

export async function runWorker(options: WorkerOptions = {}) {
  const intervalMs = options.intervalMs ?? 60_000
  let ticks = 0

  while (!options.signal?.aborted) {
    if (options.maxTicks !== undefined && ticks >= options.maxTicks) break

    try {
      const scheduled = await tick()
      const processed = await drain()
      options.onTick?.({ enqueued: scheduled.enqueued, processed })
    } catch (error) {
      // A failure in one tick must not kill the loop — the next tick retries,
      // and a job that keeps failing exhausts its own attempts and stops.
      console.error("[worker] tick failed", error)
    }

    ticks++

    if (options.maxTicks !== undefined && ticks >= options.maxTicks) break

    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, intervalMs)
      options.signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timer)
          resolve()
        },
        { once: true }
      )
    })
  }

  return { ticks }
}
