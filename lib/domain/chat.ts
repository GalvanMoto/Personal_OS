import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { prisma } from "@/lib/db/client"
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
