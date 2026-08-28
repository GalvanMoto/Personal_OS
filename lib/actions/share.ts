"use server"

import { revalidatePath } from "next/cache"
import { guard, ok, workspaceContext } from "@/lib/actions/shared"

function makeToken() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export async function toggleTaskShareAction(workspace: string, taskId: string) {
  return guard<any>(async () => {
    const { db } = await workspaceContext(workspace)
    const task = await db.task.findUnique({ where: { id: taskId }, select: { isPublic: true, shareToken: true } })
    if (!task) return { ok: false as const, error: "Task not found" }
    if ((task as any).isPublic && (task as any).shareToken) {
      await db.task.update({ where: { id: taskId }, data: { isPublic: false, shareToken: null } as never })
      return ok({ isPublic: false, shareToken: null, url: null } as any)
    } else {
      const token = makeToken()
      await db.task.update({ where: { id: taskId }, data: { isPublic: true, shareToken: token } as never })
      const url = `/share/${token}`
      revalidatePath(`/w/${workspace}/tasks/${taskId}`)
      return ok({ isPublic: true, shareToken: token, url } as any)
    }
  })
}

export async function toggleDocumentShareAction(workspace: string, documentId: string) {
  return guard<any>(async () => {
    const { db } = await workspaceContext(workspace)
    const doc = await db.document.findUnique({ where: { id: documentId }, select: { isPublic: true, shareToken: true } })
    if (!doc) return { ok: false as const, error: "Document not found" }
    if ((doc as any).isPublic && (doc as any).shareToken) {
      await db.document.update({ where: { id: documentId }, data: { isPublic: false, shareToken: null } as never })
      return ok({ isPublic: false, shareToken: null, url: null } as any)
    } else {
      const token = makeToken()
      await db.document.update({ where: { id: documentId }, data: { isPublic: true, shareToken: token } as never })
      const url = `/share/${token}`
      revalidatePath(`/w/${workspace}/documents`)
      return ok({ isPublic: true, shareToken: token, url } as any)
    }
  })
}
