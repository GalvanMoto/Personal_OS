import "server-only"

import { cache } from "react"
import { notFound, redirect } from "next/navigation"

import { readSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { tenantDb } from "@/lib/db/tenant"
import type { MemberRole } from "@/lib/generated/prisma/enums"

/// Single place every server component, action and route handler asks "who is
/// this?". Memoised per render pass so a page with a dozen components still
/// hits the database once.
export const getCurrentSession = cache(readSession)

export const getCurrentUser = cache(async () => {
  const session = await getCurrentSession()
  return session?.user ?? null
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

/// Workspaces the signed-in user can actually open. Drives the switcher.
export const getWorkspaces = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return []

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { tenant: true },
    orderBy: { createdAt: "asc" },
  })

  return memberships.map((membership) => ({
    id: membership.tenant.id,
    slug: membership.tenant.slug,
    name: membership.tenant.name,
    role: membership.role,
  }))
})

export type WorkspaceContext = {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
  tenant: { id: string; slug: string; name: string }
  role: MemberRole
  db: ReturnType<typeof tenantDb>
}

/**
 * Resolves a workspace slug into a tenant-scoped database handle, proving
 * membership first. Every workspace route and action starts here — that is what
 * makes the tenant boundary a property of the system rather than a convention.
 */
export const requireWorkspace = cache(
  async (slug: string): Promise<WorkspaceContext> => {
    const user = await requireUser()

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, tenant: { slug } },
      include: { tenant: true },
    })

    if (!membership) {
      // 1. If user has other valid workspaces, route them to their primary workspace
      const userWorkspaces = await prisma.membership.findMany({
        where: { userId: user.id },
        include: { tenant: true },
        orderBy: { createdAt: "asc" },
      })
      if (userWorkspaces.length > 0) {
        redirect(`/w/${userWorkspaces[0].tenant.slug}/today`)
      }

      // 2. If user has NO workspaces at all, auto-provision their initial workspace
      const safeSlug =
        slug && slug !== "null" && slug !== "undefined"
          ? slug
          : user.email
            ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "")
            : "my-workspace"

      const tenant = await prisma.tenant.create({
        data: {
          slug: safeSlug,
          name: user.name || "My Workspace",
          memberships: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
      })

      return {
        user,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
        },
        role: "OWNER",
        db: tenantDb(tenant.id),
      }
    }

    return {
      user,
      tenant: {
        id: membership.tenant.id,
        slug: membership.tenant.slug,
        name: membership.tenant.name,
      },
      role: membership.role,
      db: tenantDb(membership.tenantId),
    }
  }
)

const ROLE_RANK: Record<MemberRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
  VIEWER: 0,
}

export function hasRole(role: MemberRole, minimum: MemberRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum]
}

export class AuthorizationError extends Error {
  constructor(minimum: MemberRole) {
    super(`This action requires the ${minimum} role.`)
    this.name = "AuthorizationError"
  }
}

export function requireRole(role: MemberRole, minimum: MemberRole) {
  if (!hasRole(role, minimum)) throw new AuthorizationError(minimum)
}
