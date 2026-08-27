import { requireWorkspace } from "@/lib/auth/dal"
import { subscribeRealtime, type RealtimeEvent } from "@/lib/realtime/bus"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspace: string }> }
) {
  const { workspace } = await params
  const { tenant } = await requireWorkspace(workspace)

  let interval: ReturnType<typeof setInterval> | null = null
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // Initial hello + badge sync hint
      send("ready", { at: new Date().toISOString(), tenantId: tenant.id })

      // Heartbeat to keep proxies from closing
      interval = setInterval(() => {
        controller.enqueue(encoder.encode(`: keepalive\n\n`))
      }, 15000)

      unsubscribe = subscribeRealtime(tenant.id, (evt: RealtimeEvent) => {
        send(evt.type, evt)
      })
    },
    cancel() {
      if (interval) clearInterval(interval)
      if (unsubscribe) unsubscribe()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
