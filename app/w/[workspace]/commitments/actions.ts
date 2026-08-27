"use server"

import { revalidatePath } from "next/cache"
import { requireWorkspace } from "@/lib/auth/dal"
import {
  createRecurringCommitment,
  generateAllActiveCommitmentTasks,
  generateCycleTasks,
} from "@/lib/domain/commitments"
import { createBrand } from "@/lib/domain/brands"
import type {
  CommitmentFrequency,
  DeliverableType,
  TaskPriority,
} from "@/lib/generated/prisma/enums"

export async function createCommitmentAction(workspace: string, formData: FormData) {
  const { db, tenant, user, role } = await requireWorkspace(workspace)

  const organizationId = formData.get("organizationId") as string
  const brandId = (formData.get("brandId") as string) || null
  const title = formData.get("title") as string
  const deliverableType = (formData.get("deliverableType") as DeliverableType) || "REEL"
  const quantity = parseInt((formData.get("quantity") as string) || "1", 10)
  const frequency = (formData.get("frequency") as CommitmentFrequency) || "WEEKLY"
  const estimatedMinutes = parseInt((formData.get("estimatedMinutes") as string) || "45", 10)
  const priority = (formData.get("priority") as TaskPriority) || "HIGH"

  if (!organizationId || !title) {
    return { success: false, error: "Client and title are required" }
  }

  const ctx = {
    tenantId: tenant.id,
    userId: user.id,
    userRole: role,
  }

  const commitment = await createRecurringCommitment(db, ctx, {
    organizationId,
    brandId,
    title,
    deliverableType,
    quantity,
    frequency,
    estimatedMinutes,
    priority,
  })

  revalidatePath(`/w/${workspace}/commitments`)
  revalidatePath(`/w/${workspace}/today`)
  revalidatePath(`/w/${workspace}/dashboard`)
  return { success: true, commitmentId: commitment.id }
}

export async function createBrandAction(workspace: string, formData: FormData) {
  const { db, tenant, user, role } = await requireWorkspace(workspace)

  const organizationId = formData.get("organizationId") as string
  const name = formData.get("name") as string
  const website = (formData.get("website") as string) || undefined
  const industry = (formData.get("industry") as string) || undefined

  if (!organizationId || !name) {
    return { success: false, error: "Client and brand name are required" }
  }

  const ctx = {
    tenantId: tenant.id,
    userId: user.id,
    userRole: role,
  }

  const brand = await createBrand(db, ctx, {
    organizationId,
    name,
    website,
    industry,
  })

  revalidatePath(`/w/${workspace}/commitments`)
  revalidatePath(`/w/${workspace}/clients`)
  return { success: true, brandId: brand.id }
}

export async function generateWeeklyTasksAction(workspace: string) {
  const { db, tenant, user, role } = await requireWorkspace(workspace)

  const ctx = {
    tenantId: tenant.id,
    userId: user.id,
    userRole: role,
  }

  const res = await generateAllActiveCommitmentTasks(db, ctx)

  revalidatePath(`/w/${workspace}/commitments`)
  revalidatePath(`/w/${workspace}/today`)
  revalidatePath(`/w/${workspace}/dashboard`)
  return { success: true, count: res.totalGenerated }
}
