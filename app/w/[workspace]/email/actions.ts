"use server"

import { requireWorkspace } from "@/lib/auth/dal"
import { revalidatePath } from "next/cache"
import { trashGmailMessage } from "@/lib/integrations/gmail"
import { getAccessToken } from "@/lib/integrations"

export async function deleteEmails(workspace: string, emailIds: string[], trashInGmail = true) {
  if (!emailIds.length) return { success: true, count: 0 }
  const { db, tenant } = await requireWorkspace(workspace)

  // 1. If trash in Gmail requested, find external Gmail IDs and trash them in Gmail
  if (trashInGmail) {
    try {
      const messages = await db.emailMessage.findMany({
        where: {
          tenantId: tenant.id,
          id: { in: emailIds },
        },
        select: { externalId: true },
      })

      const integrations = await db.integration.findMany({
        where: {
          tenantId: tenant.id,
          provider: "GMAIL",
          status: "CONNECTED",
        },
      })

      for (const integration of integrations) {
        try {
          const accessToken = await getAccessToken(db, integration)
          for (const msg of messages) {
            if (msg.externalId) {
              await trashGmailMessage(accessToken, msg.externalId).catch(() => null)
            }
          }
        } catch {}
      }
    } catch {}
  }

  // 2. Delete local database records
  const result = await db.emailMessage.deleteMany({
    where: {
      tenantId: tenant.id,
      id: { in: emailIds },
    },
  })

  revalidatePath(`/w/${workspace}/email`)
  return { success: true, count: result.count }
}

export async function deleteEmailsBySender(workspace: string, fromEmail: string, trashInGmail = true) {
  if (!fromEmail) return { success: true, count: 0 }
  const { db, tenant } = await requireWorkspace(workspace)

  // 1. If trash in Gmail requested, find external Gmail IDs and trash them in Gmail
  if (trashInGmail) {
    try {
      const messages = await db.emailMessage.findMany({
        where: {
          tenantId: tenant.id,
          fromEmail: { equals: fromEmail, mode: "insensitive" },
        },
        select: { externalId: true },
      })

      const integrations = await db.integration.findMany({
        where: {
          tenantId: tenant.id,
          provider: "GMAIL",
          status: "CONNECTED",
        },
      })

      for (const integration of integrations) {
        try {
          const accessToken = await getAccessToken(db, integration)
          for (const msg of messages) {
            if (msg.externalId) {
              await trashGmailMessage(accessToken, msg.externalId).catch(() => null)
            }
          }
        } catch {}
      }
    } catch {}
  }

  // 2. Delete local database records
  const result = await db.emailMessage.deleteMany({
    where: {
      tenantId: tenant.id,
      fromEmail: { equals: fromEmail, mode: "insensitive" },
    },
  })

  revalidatePath(`/w/${workspace}/email`)
  return { success: true, count: result.count }
}

export async function markEmailsAsRead(workspace: string, emailIds: string[]) {
  if (!emailIds.length) return { success: true, count: 0 }
  const { db, tenant } = await requireWorkspace(workspace)

  const result = await db.emailMessage.updateMany({
    where: {
      tenantId: tenant.id,
      id: { in: emailIds },
    },
    data: { isRead: true },
  })

  revalidatePath(`/w/${workspace}/email`)
  return { success: true, count: result.count }
}
