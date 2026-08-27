"use server"

import { revalidatePath } from "next/cache"
import { requireWorkspace } from "@/lib/auth/dal"
import { captureAndProcess } from "@/lib/domain/inbox"

export async function captureInbox(workspace: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim()
  if (!text) return

  const { db, user, tenant } = await requireWorkspace(workspace)

  await captureAndProcess(db, {
    tenantId: tenant.id,
    userId: user.id,
    actorType: "USER",
  }, {
    rawText: text,
    kind: "TEXT",
  })

  revalidatePath(`/w/${workspace}/today`)
}
