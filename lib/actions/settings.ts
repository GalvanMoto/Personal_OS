"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { fromZodError, guard, ok, workspaceContext } from "@/lib/actions/shared"
import { getWorkspaceSettings, updateWorkspaceSettings } from "@/lib/domain/settings"

const settingsSchema = z.object({
  displayName: z.string().max(80).optional(),
  timezone: z.string().max(80).optional(),
  currency: z.string().max(20).optional(),
  dateFormat: z.string().max(20).optional(),
  landingPage: z.string().max(60).optional(),
  accent: z.string().max(20).optional(),
  density: z.enum(["comfortable", "compact"]).optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
  selectedModel: z.string().max(80).optional(),
  azureEndpoint: z.string().max(200).optional(),
  azureDeployment: z.string().max(80).optional(),
  azureApiVersion: z.string().max(40).optional(),
  soundEnabled: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  employerCompany: z.string().max(80).optional(),
  employerRole: z.string().max(80).optional(),
  employerJoinedAt: z.string().max(20).optional(),
  employerStatus: z.enum(["running", "left", "on_leave"]).optional().or(z.string().max(20).optional()),
  employerLeftAt: z.string().max(20).optional(),
  employerType: z.string().max(30).optional(),
  employerWebsite: z.string().max(200).optional(),
})

export async function updateSettingsAction(workspace: string, patch: unknown) {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)
    const parsed = settingsSchema.safeParse(patch)
    if (!parsed.success) return fromZodError(parsed.error)
    const updated = await updateWorkspaceSettings(db, ctx, parsed.data as never)
    revalidatePath(`/w/${workspace}/settings`)
    return ok(updated)
  })
}

export async function getSettingsAction(workspace: string) {
  return guard(async () => {
    const { db, user } = await workspaceContext(workspace)
    const settings = await getWorkspaceSettings(db, { name: user.name, timezone: user.timezone })
    return ok(settings)
  })
}

export async function addMemoryAction(workspace: string, text: string) {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)
    const { remember } = await import("@/lib/domain/memory")
    const key = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || `memory-${Date.now()}`
    const res = await remember(db, ctx, { key, value: text, kind: "PREFERENCE", pinned: false })
    revalidatePath(`/w/${workspace}/settings`)
    return ok({ id: res.memory.id, key: res.memory.key })
  })
}

export async function deleteMemoryAction(workspace: string, memoryId: string) {
  return guard(async () => {
    const { db } = await workspaceContext(workspace)
    await db.agentMemory.delete({ where: { id: memoryId } }).catch(() => {
      throw new Error("Memory not found")
    })
    revalidatePath(`/w/${workspace}/settings`)
    return ok()
  })
}
