import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import type { StreamChunk } from "@tanstack/ai"
import { publishRealtime } from "@/lib/realtime/bus"

export interface SerializedChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  parts: Array<
    | { type: "text"; content: string }
    | { type: "tool-call"; name: string; state?: string; args?: unknown; result?: unknown }
  >
  createdAt: string
}

/**
 * Retrieves or creates the latest active conversation thread for a tenant workspace.
 */
export async function getOrCreateActiveConversation(
  db: TenantDb,
  tenantId: string,
  title = "Chief of Staff Session"
) {
  let conversation = await db.conversation.findFirst({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        tenantId,
        title,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })
  }

  return conversation
}

/**
 * Fetches all formatted messages for a conversation thread.
 */
export async function getConversationMessages(
  db: TenantDb,
  tenantId: string,
  conversationId: string
): Promise<SerializedChatMessage[]> {
  const messages = await db.chatMessage.findMany({
    where: { tenantId, conversationId },
    orderBy: { createdAt: "asc" },
  })

  return messages.map((m) => {
    const role = m.role === "USER" ? "user" : m.role === "ASSISTANT" ? "assistant" : "system"
    const parts: SerializedChatMessage["parts"] = []

    if (m.content) {
      parts.push({ type: "text", content: m.content })
    }

    if (m.toolCalls && Array.isArray(m.toolCalls)) {
      for (const tc of m.toolCalls as Array<{ name: string; state?: string; args?: unknown; result?: unknown }>) {
        parts.push({
          type: "tool-call",
          name: tc.name || "tool",
          state: tc.state || "completed",
          args: tc.args,
          result: tc.result,
        })
      }
    }

    return {
      id: m.id,
      role,
      parts,
      createdAt: m.createdAt.toISOString(),
    }
  })
}

/**
 * Persists a message to the database thread and emits a real-time event.
 */
export async function persistChatMessage(
  db: TenantDb,
  ctx: DomainContext,
  params: {
    conversationId: string
    role: "USER" | "ASSISTANT" | "TOOL" | "SYSTEM"
    content: string
    toolCalls?: unknown
  }
) {
  const msg = await db.chatMessage.create({
    data: {
      tenantId: ctx.tenantId,
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      toolCalls: (params.toolCalls as never) || undefined,
    },
  })

  await db.conversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  })

  // Publish real-time event through Redis + EventEmitter bus
  publishRealtime({
    type: "inbox",
    tenantId: ctx.tenantId,
    payload: {
      action: "chat_message",
      conversationId: params.conversationId,
      messageId: msg.id,
      role: msg.role,
    },
    at: new Date().toISOString(),
  }).catch(() => {})

  return msg
}


/**
 * Passes the agent's stream through to the browser while recording what it said.
 *
 * The reply only exists as it streams — once the response is closed the text is
 * gone unless something kept it. This wraps the iterable rather than buffering
 * it, so the client still sees tokens the moment they are produced and the row
 * is written from what actually went out.
 *
 * The write lives in `finally` on purpose: a user who closes the tab halfway
 * through still saw half an answer, and a transcript missing it would be a
 * transcript that disagrees with their memory of the conversation.
 */
export async function* recordAssistantTurn(
  stream: AsyncIterable<StreamChunk>,
  db: TenantDb,
  ctx: DomainContext,
  conversationId: string
): AsyncGenerator<StreamChunk> {
  let text = ""
  const calls = new Map<
    string,
    { name: string; state: string; rawArgs: string; result?: unknown }
  >()

  const ensure = (id: string, name?: string) => {
    const existing = calls.get(id)
    if (existing) {
      if (name) existing.name = name
      return existing
    }
    const created: {
      name: string
      state: string
      rawArgs: string
      result?: unknown
    } = { name: name ?? "tool", state: "complete", rawArgs: "" }
    calls.set(id, created)
    return created
  }

  try {
    for await (const chunk of stream) {
      switch (chunk.type) {
        case "TEXT_MESSAGE_CONTENT":
          text += chunk.delta ?? ""
          break
        case "TOOL_CALL_START":
          ensure(chunk.toolCallId, chunk.toolCallName)
          break
        case "TOOL_CALL_ARGS":
          ensure(chunk.toolCallId).rawArgs += chunk.delta ?? ""
          break
        case "TOOL_CALL_RESULT": {
          const call = ensure(chunk.toolCallId)
          try {
            call.result = JSON.parse(chunk.content)
          } catch {
            // Not every tool returns JSON; the string is still worth keeping.
            call.result = chunk.content
          }
          break
        }
        case "RUN_ERROR":
          for (const call of calls.values()) {
            if (call.state !== "complete") call.state = "error"
          }
          break
      }

      yield chunk
    }
  } finally {
    if (text.trim() || calls.size > 0) {
      const toolCalls = [...calls.values()].map((call) => {
        let args: unknown
        try {
          args = call.rawArgs ? JSON.parse(call.rawArgs) : undefined
        } catch {
          args = call.rawArgs || undefined
        }
        return { name: call.name, state: call.state, args, result: call.result }
      })

      await persistChatMessage(db, ctx, {
        conversationId,
        role: "ASSISTANT",
        content: text.trim(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      }).catch((error) =>
        console.warn("[chat] failed to save assistant reply:", error)
      )
    }
  }
}

/**
 * Starts a fresh thread by creating a new conversation in the database.
 */
export async function createNewConversationThread(
  db: TenantDb,
  tenantId: string,
  title = "New Chief of Staff Session"
) {
  const conversation = await db.conversation.create({
    data: {
      tenantId,
      title,
    },
  })

  publishRealtime({
    type: "inbox",
    tenantId,
    payload: {
      action: "new_thread",
      conversationId: conversation.id,
    },
    at: new Date().toISOString(),
  }).catch(() => {})

  return conversation
}
