"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/toast"

/**
 * Redis + SSE live layer — no reload, no polling lag.
 *
 * Connects to `/api/realtime/[workspace]/stream` (Redis pub/sub fanout via
 * `lib/realtime/bus.ts`). On `notification` it shows a toast and bumps the app
 * badge; on `task|inbox|badge` it does a soft `router.refresh()` which re-fetches
 * server components without losing client state (open drawers, filters, etc.).
 * Falls back to `RealtimeRefresh` polling if SSE drops.
 */
export function LiveProvider({ workspace }: { workspace: string }) {
  const router = useRouter()
  const esRef = useRef<EventSource | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleRefresh() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => router.refresh(), 300)
  }

  useEffect(() => {
    let closed = false
    let retryDelay = 1000

    function connect() {
      if (closed) return
      const es = new EventSource(`/api/realtime/${workspace}/stream`)
      esRef.current = es

      const handle = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as { type?: string; payload?: Record<string, unknown>; title?: string; at?: string }
          const type = (e as MessageEvent & { type: string }).type || data.type || "message"

          if (type === "notification") {
            const p = (data.payload ?? data) as Record<string, unknown>
            const title = (p.title as string) || (data.title as string) || "New notification"
            const body = (p.body as string) || ""
            
            // 1. In-app Toast
            try {
              toast.add({ title, description: body || undefined, type: "info" } as unknown as Parameters<typeof toast.add>[0])
            } catch {}

            // 2. Native OS Push / Device Notification
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({
                    type: "SHOW_NOTIFICATION",
                    title,
                    body,
                    icon: "/icon-192.png",
                  })
                } else {
                  new Notification(title, { body, icon: "/icon-192.png" })
                }
              } catch {}
            }

            // 3. App badge
            if ("setAppBadge" in navigator) {
              try { (navigator as unknown as { setAppBadge: (n?: number) => Promise<void> }).setAppBadge(1) } catch {}
            }
            scheduleRefresh()
            return
          }

          if (type === "badge" || type === "task" || type === "inbox" || type === "project" || type === "email") {
            scheduleRefresh()
            // also bump badge for task/inbox
            if (type !== "badge" && "setAppBadge" in navigator) {
              try { (navigator as unknown as { setAppBadge: (n?: number) => Promise<void> }).setAppBadge(1) } catch {}
            }
            return
          }

          // generic refresh for unknown
          scheduleRefresh()
        } catch {}
      }

      // Listen to all our custom events
      ;["notification", "badge", "task", "inbox", "project", "email", "ready"].forEach((t) => {
        es.addEventListener(t, handle as EventListener)
      })
      // Fallback for plain message
      es.onmessage = handle as unknown as (e: MessageEvent) => void

      es.onerror = () => {
        es.close()
        esRef.current = null
        if (closed) return
        // Exponential backoff retry
        setTimeout(connect, retryDelay)
        retryDelay = Math.min(retryDelay * 1.5, 15000)
      }

      es.onopen = () => {
        retryDelay = 1000
      }
    }

    connect()

    // Refresh on focus/visible even with SSE (covers missed events)
    const onFocus = () => scheduleRefresh()
    const onVisible = () => { if (document.visibilityState === "visible") scheduleRefresh() }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      closed = true
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisible)
      if (esRef.current) esRef.current.close()
    }
  }, [workspace, router])

  return null
}
