"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { workspaceContext, guard, ok, fail, fromZodError, type ActionResult } from "@/lib/actions/shared"
import { setVaultSecret, deleteVaultSecret, getVaultMap, buildPasswordCandidates } from "@/lib/domain/vault"
import type { VaultKind } from "@/lib/domain/vault"

const saveSchema = z.object({
  kind: z.enum(["PAN", "DOB", "PHONE", "NAME", "CUSTOMER_ID", "BANK_TEMPLATE"]),
  label: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(200),
})

export async function saveVaultSecretAction(
  workspace: string,
  formData: FormData
): Promise<ActionResult> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)
    const parsed = saveSchema.safeParse({
      kind: String(formData.get("kind") || ""),
      label: String(formData.get("label") || ""),
      value: String(formData.get("value") || ""),
    })
    if (!parsed.success) return fromZodError(parsed.error)
    await setVaultSecret(db, ctx, parsed.data.kind as VaultKind, parsed.data.label, parsed.data.value)
    revalidatePath(`/w/${workspace}/settings/vault`)
    return ok()
  })
}

export async function deleteVaultSecretAction(
  workspace: string,
  kind: string,
  label: string
): Promise<ActionResult> {
  return guard(async () => {
    const { db } = await workspaceContext(workspace)
    await deleteVaultSecret(db, kind as VaultKind, label)
    revalidatePath(`/w/${workspace}/settings/vault`)
    return ok()
  })
}

export async function testVaultPasswordsAction(
  workspace: string,
  bank?: string
): Promise<ActionResult<{ candidates: string[] }>> {
  return guard(async () => {
    const { db } = await workspaceContext(workspace)
    const vault = await getVaultMap(db)
    const candidates = buildPasswordCandidates(vault, bank)
    if (candidates.length === 0) return fail("Add PAN, DOB, or phone to the vault first")
    return ok({ candidates: candidates.slice(0, 8) })
  })
}
