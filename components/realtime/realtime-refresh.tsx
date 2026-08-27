"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

/**
 * Live DB → UI bridge.
 *
 * Server Components already read directly from Postgres, but Next.js will
 * serve a cached RSC payload until the route is invalidated. This tiny
 * client piece does two things with no mock data:
 *  1) poll + refresh so the screen reflects writes from this tab, other tabs,
 *     the agent, and Gmail ingestion without a manual reload;
 *  2) refresh on focus / visibility so returning to the tab is always fresh.
 *
 * Mutations (capture, task/project create, inbox apply/dismiss) already call
 * `revalidatePath('/w/[workspace]', 'layout')` on the server — when they
 * succeed the next `router.refresh()` pulls the fresh rows.
 */
export function RealtimeRefresh({ intervalMs = 12_000 }: { intervalMs?: number }) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Cheap liveness signal for the shell — no additional fetch needed,
    // the RSC refresh itself re-runs every `requireWorkspace` query in the
    // layout and page. If you later add an SSE endpoint, keep the same call
    // site and put the EventSource here.
    timer.current = setInterval(() => router.refresh(), intervalMs)

    const onFocus = () => router.refresh()
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh()
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      if (timer.current) clearInterval(timer.current)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [intervalMs, router])

  return null
}
