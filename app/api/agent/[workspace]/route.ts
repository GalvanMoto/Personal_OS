import { chat, chatParamsFromRequest, toServerSentEventsResponse } from "@tanstack/ai"

import { clientToolDefinitions } from "@/lib/ai/agent/definitions"
import {
  AGENT_SYSTEM_PROMPT,
  agentAdapter,
  agentModelOptions,
  isAgentConfigured,
  type AgentRuntimeContext,
} from "@/lib/ai/agent/runtime"
import { serverTools } from "@/lib/ai/agent/server-tools"
import { defaultAgentStrategy } from "@/lib/ai/agent/strategies"
import { requireWorkspace } from "@/lib/auth/dal"

/**
 * AG-UI endpoint for the assistant.
 *
 * The workspace is resolved from the URL and proven against the session before
 * a single token is generated, and the resulting tenant-scoped handle is what
 * every tool receives through `context`. The agent therefore cannot read across
 * the tenant boundary even if the model asks it to — the boundary is upstream
 * of the model, not a rule in the prompt.
 *
 * The response is a native AG-UI event stream. No provider-specific wire format
 * reaches the browser, so the headless client and any framework adapter consume
 * the same bytes regardless of which model produced them.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspace: string }> }
) {
  const { workspace } = await params

  if (!isAgentConfigured()) {
    return Response.json(
      { error: "AI provider is not configured. Please configure Azure OpenAI, OpenAI, or Anthropic in settings." },
      { status: 503 }
    )
  }

  // Redirects to /login or 404s before any model call is made.
  const { db, tenant, user } = await requireWorkspace(workspace)

  let agui: Awaited<ReturnType<typeof chatParamsFromRequest>>

  try {
    agui = await chatParamsFromRequest(request)
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Malformed AG-UI request body",
      },
      { status: 400 }
    )
  }

  const context: AgentRuntimeContext = {
    db,
    ctx: {
      tenantId: tenant.id,
      userId: user.id,
      actorType: "AGENT",
      agent: "assistant",
    },
  }

  const stream = chat({
    adapter: agentAdapter(),
    messages: agui.messages,
    // Server implementations plus the definitions of tools the browser runs, so
    // the model can call both halves.
    tools: [...serverTools, ...clientToolDefinitions],
    systemPrompts: [AGENT_SYSTEM_PROMPT],
    agentLoopStrategy: defaultAgentStrategy,
    modelOptions: agentModelOptions,
    threadId: agui.threadId,
    runId: agui.runId,
    // Carries an approved (or denied) interrupt back into the paused run.
    parentRunId: agui.parentRunId,
    resume: agui.resume,
    // Deliberately last: `agui` also carries a `context` field, which is the
    // AG-UI protocol's Context[] and not our runtime context. Spreading it into
    // chat() would silently strip the database handle off every tool call.
    context,
  })

  return toServerSentEventsResponse(stream)
}
