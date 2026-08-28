import { chat, chatParamsFromRequest, toServerSentEventsResponse } from "@tanstack/ai"
import { agentAdapter, isAgentConfigured } from "@/lib/ai/agent/runtime"
import { requireWorkspace } from "@/lib/auth/dal"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspace: string }> }
) {
  const { workspace } = await params

  if (!isAgentConfigured()) {
    return Response.json({ error: "AI not configured. Set Azure/OpenAI/Anthropic keys in Settings → AI." }, { status: 503 })
  }

  await requireWorkspace(workspace)

  let agui: Awaited<ReturnType<typeof chatParamsFromRequest>>
  try {
    agui = await chatParamsFromRequest(request)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Bad request" }, { status: 400 })
  }

  // Editor-specific system prompt — like Claude Docs skill: read/write/tables
  const editorSystem = `You are the Tiptap editor assistant (Claude Docs skill inside Personal OS).
You can read the current doc (provided in the last user message as [Editor Context]), then:
- rewrite selection, summarize, expand, fix grammar
- create tables: when user says "create table 3x3" output a markdown table (the client will convert to real Tiptap table)
- insert content: return concise markdown that will be inserted at cursor
- read: answer about doc content
Keep replies short, actionable. If you create a table, output ONLY the markdown table (no extra prose) so it can be parsed.`

  const stream = chat({
    adapter: agentAdapter(),
    messages: agui.messages as any,
    systemPrompts: [editorSystem],
    tools: [],
    threadId: agui.threadId,
    runId: agui.runId,
  })

  return toServerSentEventsResponse(stream as any)
}
