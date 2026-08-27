import { chat, chatParamsFromRequest, toServerSentEventsResponse } from "@tanstack/ai"

import { clientToolDefinitions } from "@/lib/ai/agent/definitions"
import {
  agentAdapter,
  agentSystemPrompts,
  agentModelOptions,
  isAgentConfigured,
  type AgentRuntimeContext,
} from "@/lib/ai/agent/runtime"
import { serverTools } from "@/lib/ai/agent/server-tools"
import { defaultAgentStrategy } from "@/lib/ai/agent/strategies"
import { requireWorkspace } from "@/lib/auth/dal"
import {
  createNewConversationThread,
  getConversationMessages,
  getOrCreateActiveConversation,
  persistChatMessage,
  recordAssistantTurn,
} from "@/lib/domain/chat"

/**
 * Fetch database-persisted chat messages for the active conversation thread.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspace: string }> }
) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const conversation = await getOrCreateActiveConversation(db, tenant.id)
  const messages = await getConversationMessages(db, tenant.id, conversation.id)

  return Response.json({
    conversationId: conversation.id,
    title: conversation.title,
    messages,
  })
}

/**
 * Start a fresh conversation thread in the database.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspace: string }> }
) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const conversation = await createNewConversationThread(db, tenant.id)
  return Response.json({
    success: true,
    conversationId: conversation.id,
  })
}

/**
 * AG-UI endpoint for the assistant with database thread persistence.
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

  // Persist user prompt in database conversation thread.
  // The DB conversation is the source of truth; `agui.threadId` is ignored so
  // hard-refresh never forks the transcript into a ghost thread.
  const conversation = await getOrCreateActiveConversation(db, tenant.id)
  const lastUserMsg = (agui.messages as any[]).filter((m) => m.role === "user").pop()
  if (lastUserMsg) {
    let textContent = ""
    if (typeof lastUserMsg.content === "string") {
      textContent = lastUserMsg.content
    } else if (Array.isArray(lastUserMsg.parts)) {
      textContent = lastUserMsg.parts
        .map((p: any) => p.content || p.text || "")
        .filter(Boolean)
        .join("\n")
    } else if (Array.isArray(lastUserMsg.content)) {
      textContent = lastUserMsg.content
        .map((p: any) => p.text || p.content || "")
        .filter(Boolean)
        .join("\n")
    }

    if (textContent.trim()) {
      await persistChatMessage(db, context.ctx, {
        conversationId: conversation.id,
        role: "USER",
        content: textContent.trim(),
      }).catch((err) => console.warn("[chat] failed to save user msg:", err))
    }
  }

  const stream = chat({
    adapter: agentAdapter(),
    messages: agui.messages,
    tools: [...serverTools, ...clientToolDefinitions],
    systemPrompts: await agentSystemPrompts(db),
    agentLoopStrategy: defaultAgentStrategy,
    modelOptions: agentModelOptions,
    threadId: conversation.id,
    runId: agui.runId,
    parentRunId: agui.parentRunId,
    resume: agui.resume,
    context,
  })

  return toServerSentEventsResponse(
    recordAssistantTurn(stream, db, context.ctx, conversation.id)
  )
}
