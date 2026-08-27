"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  fromZodError,
  guard,
  ok,
  workspaceContext,
  type ActionResult,
} from "@/lib/actions/shared"
import { createOrganization } from "@/lib/domain/organizations"
import { createProject } from "@/lib/domain/projects"
import { reindexWorkspace, search, type SearchHit } from "@/lib/search"

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name the project").max(120),
  description: z.string().trim().max(2000).optional(),
  organizationId: z.string().trim().optional(),
})

export async function createProjectAction(
  workspace: string,
  formData: FormData
): Promise<ActionResult<{ id: string; slug: string }>> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    const parsed = projectSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return fromZodError(parsed.error)

    const project = await createProject(db, ctx, {
      name: parsed.data.name,
      description: parsed.data.description,
      organizationId: parsed.data.organizationId || undefined,
    })

    revalidatePath(`/w/${workspace}`, "layout")
    return ok({ id: project.id, slug: project.slug })
  })
}

const organizationSchema = z.object({
  name: z.string().trim().min(1, "Name the client").max(120),
  kind: z.enum(["CLIENT", "VENDOR", "PARTNER", "EMPLOYER", "OTHER"]).default("CLIENT"),
  website: z.string().trim().url("Enter a valid URL").or(z.literal("")).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export async function createOrganizationAction(
  workspace: string,
  formData: FormData
): Promise<ActionResult<{ id: string; slug: string }>> {
  return guard(async () => {
    const { db, ctx } = await workspaceContext(workspace)

    const parsed = organizationSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return fromZodError(parsed.error)

    const organization = await createOrganization(db, ctx, {
      name: parsed.data.name,
      kind: parsed.data.kind,
      website: parsed.data.website || undefined,
      notes: parsed.data.notes,
    })

    revalidatePath(`/w/${workspace}`, "layout")
    return ok({ id: organization.id, slug: organization.slug })
  })
}

/**
 * Search, exposed as an action so the command palette can call it directly.
 *
 * Hrefs come back workspace-relative and are prefixed here, which is the one
 * place that knows which workspace the caller is in.
 */
export async function searchAction(
  workspace: string,
  query: string
): Promise<ActionResult<SearchHit[]>> {
  return guard(async () => {
    const { tenant } = await workspaceContext(workspace)

    const hits = await search(tenant.id, query, { limit: 25 })

    return ok(
      hits.map((hit) => ({
        ...hit,
        href: hit.href ? `/w/${workspace}${hit.href}` : null,
      }))
    )
  })
}

export async function reindexAction(
  workspace: string
): Promise<ActionResult<{ indexed: number }>> {
  return guard(async () => {
    const { db } = await workspaceContext(workspace)
    return ok({ indexed: await reindexWorkspace(db) })
  })
}

export async function markNotificationsReadAction(
  workspace: string,
  notificationId?: string
): Promise<ActionResult<{ marked: number }>> {
  return guard(async () => {
    const { db } = await workspaceContext(workspace)

    const { count } = await db.notification.updateMany({
      where: notificationId ? { id: notificationId, readAt: null } : { readAt: null },
      data: { readAt: new Date() },
    })

    revalidatePath(`/w/${workspace}`, "layout")
    return ok({ marked: count })
  })
}
