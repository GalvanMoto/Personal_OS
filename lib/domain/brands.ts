import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "brand"
}

export type CreateBrandInput = {
  organizationId: string
  name: string
  website?: string
  industry?: string
  color?: string
  socialLinks?: Record<string, string>
  notes?: string
}

export async function createBrand(
  db: TenantDb,
  ctx: DomainContext,
  input: CreateBrandInput
) {
  const slug = slugify(input.name)

  const brand = await db.brand.create({
    data: {
      organizationId: input.organizationId,
      name: input.name.trim(),
      slug,
      website: input.website?.trim() || null,
      industry: input.industry?.trim() || null,
      color: input.color?.trim() || null,
      socialLinks: input.socialLinks ? (input.socialLinks as never) : undefined,
      notes: input.notes?.trim() || null,
    } as never,
  })

  return brand
}

export async function listBrandsByOrganization(
  db: TenantDb,
  organizationId: string
) {
  return db.brand.findMany({
    where: { organizationId },
    include: {
      commitments: {
        where: { status: "ACTIVE" },
      },
    },
    orderBy: { name: "asc" },
  })
}

export async function resolveBrand(
  db: TenantDb,
  ctx: DomainContext,
  organizationId: string,
  name: string
) {
  const slug = slugify(name)
  const existing = await db.brand.findFirst({
    where: { organizationId, slug },
  })

  if (existing) return { brand: existing, created: false }

  const brand = await createBrand(db, ctx, { organizationId, name })
  return { brand, created: true }
}
