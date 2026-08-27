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
    | {
        type: "tool-call"
        id: string
        name: string
        arguments: string
        state?: string
        output?: unknown
        // legacy fields kept for reading old rows
        args?: unknown
        result?: unknown
      }
    | { type: "tool-result"; toolCallId: string; content: string; state?: string }
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
      for (const tc of m.toolCalls as Array<{
        id?: string
        name: string
        state?: string
        arguments?: string
        args?: unknown
        result?: unknown
        output?: unknown
      }>) {
        const toolCallId =
          tc.id && typeof tc.id === "string" && tc.id.length > 0
            ? tc.id
            : `tc_${m.id}_${Math.random().toString(36).slice(2, 8)}`
        // Normalize arguments to a JSON string — TanStack expects `arguments: string`.
        // Old rows used `args` (parsed object); new rows use `arguments` (string).
        let argumentsStr = ""
        if (typeof tc.arguments === "string") {
          argumentsStr = tc.arguments
        } else if (tc.args !== undefined) {
          try {
            argumentsStr = typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args)
          } catch {
            argumentsStr = String(tc.args)
          }
        }
        const output = tc.result ?? tc.output
        const state =
          tc.state === "completed" ? "complete" : tc.state || "complete"

        parts.push({
          type: "tool-call",
          id: toolCallId,
          name: tc.name || "tool",
          arguments: argumentsStr,
          state,
          ...(output !== undefined ? { output } : {}),
          // keep legacy fields so old UI still sees something if it reads them
          ...(tc.args !== undefined ? { args: tc.args } : {}),
          ...(tc.result !== undefined ? { result: tc.result } : {}),
        } as SerializedChatMessage["parts"][number])

        // Also emit a tool-result part so convertMessagesToModelMessages can
        // produce a proper `role: 'tool'` message with content for the next turn.
        if (output !== undefined) {
          let contentStr: string
          if (typeof output === "string") contentStr = output
          else {
            try {
              contentStr = JSON.stringify(output)
            } catch {
              contentStr = String(output)
            }
          }
          parts.push({
            type: "tool-result",
            toolCallId,
            content: contentStr,
            state: "complete",
          })
        }
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
    { id: string; name: string; state: string; rawArgs: string; result?: unknown }
  >()

  const ensure = (id: string, name?: string) => {
    const existing = calls.get(id)
    if (existing) {
      if (name) existing.name = name
      return existing
    }
    const created: {
      id: string
      name: string
      state: string
      rawArgs: string
      result?: unknown
    } = { id, name: name ?? "tool", state: "complete", rawArgs: "" }
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
      // Store in the new TanStack-compatible shape: `id` + `arguments` (string)
      // + `output`. Old code stored `args` (parsed) + `result`; we keep both
      // for backward compatibility while migrating to the correct fields.
      const toolCalls = [...calls.values()].map((call) => {
        let parsedArgs: unknown
        try {
          parsedArgs = call.rawArgs ? JSON.parse(call.rawArgs) : undefined
        } catch {
          parsedArgs = call.rawArgs || undefined
        }
        return {
          id: call.id,
          name: call.name,
          state: call.state,
          // New canonical fields
          arguments: call.rawArgs || "",
          output: call.result,
          // Legacy aliases so getConversationMessages can read either shape
          args: parsedArgs,
          result: call.result,
        }
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
