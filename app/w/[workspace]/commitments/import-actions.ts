"use server"

import { revalidatePath } from "next/cache"
import { requireWorkspace } from "@/lib/auth/dal"
import { generateImportPlan, executeImportPlan, type ImportPlan } from "@/lib/domain/import-intelligence"

export async function previewImportPlanAction(
  workspace: string,
  input: {
    message?: string
    sourceUrls?: string[]
    clientHint?: string
  }
): Promise<{ success: boolean; plan?: ImportPlan; error?: string }> {
  try {
    const { db } = await requireWorkspace(workspace)
    const plan = await generateImportPlan(db, input)
    return { success: true, plan }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Failed to analyze sources"
    return { success: false, error }
  }
}

export async function executeImportPlanAction(
  workspace: string,
  plan: ImportPlan
): Promise<{
  success: boolean
  clientName?: string
  tasksCreated?: number
  commitmentsCreated?: number
  report?: string
  error?: string
}> {
  try {
    const { db, user } = await requireWorkspace(workspace)
    const res = await executeImportPlan(
      db,
      {
        userId: user.id,
        tenantId: workspace,
        actorType: "USER",
      },
      plan
    )

    revalidatePath(`/w/${workspace}/commitments`)
    revalidatePath(`/w/${workspace}/tasks`)
    revalidatePath(`/w/${workspace}/clients`)

    return {
      success: true,
      clientName: res.clientName,
      tasksCreated: res.tasksCreated,
      commitmentsCreated: res.commitmentsCreated,
      report: res.summaryReport,
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Failed to execute import"
    return { success: false, error }
  }
}
