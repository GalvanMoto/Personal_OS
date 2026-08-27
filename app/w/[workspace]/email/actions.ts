"use server"

import { requireWorkspace } from "@/lib/auth/dal"
import { revalidatePath } from "next/cache"

export async function deleteEmails(workspace: string, emailIds: string[]) {
  if (!emailIds.length) return { success: true, count: 0 }
  const { db, tenant } = await requireWorkspace(workspace)

  const result = await db.emailMessage.deleteMany({
    where: {
      tenantId: tenant.id,
      id: { in: emailIds },
    },
  })

  revalidatePath(`/w/${workspace}/email`)
  return { success: true, count: result.count }
}

export async function deleteEmailsBySender(workspace: string, fromEmail: string) {
  if (!fromEmail) return { success: true, count: 0 }
  const { db, tenant } = await requireWorkspace(workspace)

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
