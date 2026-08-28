import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { memoryKey, recall, remember } from "@/lib/domain/memory"

/**
 * Workspace Settings — operational.txt §30 Settings module.
 * Every setting is fully operable via UI *and* Universal Assistant.
 * Persisted as AgentMemory (PREFERENCE, pinned) + User.timezone for canonical.
 * This avoids schema churn while remaining auditable via recall/history.
 */

export type WorkspaceSettings = {
  displayName?: string
  timezone: string
  currency: string
  dateFormat: string
  landingPage: string
  accent: string
  density: string
  theme: string
  selectedModel: string
  azureEndpoint?: string
  azureDeployment?: string
  azureApiVersion?: string
  soundEnabled: boolean
  quietHoursEnabled: boolean
  // CV / Employment — user-filled, generic (no hardcoded company names)
  employerCompany?: string
  employerRole?: string
  employerJoinedAt?: string
  employerStatus?: string // running | left | on_leave
  employerLeftAt?: string
  employerType?: string // full_time | part_time | contract | intern | freelance
  employerWebsite?: string
}

const DEFAULTS: WorkspaceSettings = {
  timezone: "Asia/Kolkata",
  currency: "INR (₹)",
  dateFormat: "DD/MM/YYYY",
  landingPage: "Today Executive Dashboard",
  accent: "emerald",
  density: "comfortable",
  theme: "dark",
  selectedModel: "azure-openai-gpt-5-4-nano",
  soundEnabled: true,
  quietHoursEnabled: true,
  employerCompany: undefined,
  employerRole: undefined,
  employerJoinedAt: undefined,
  employerStatus: undefined,
  employerLeftAt: undefined,
  employerType: undefined,
  employerWebsite: undefined,
}

const SETTINGS_KEYS: Record<keyof WorkspaceSettings, string> = {
  displayName: "settings.display-name",
  timezone: "settings.timezone",
  currency: "settings.currency",
  dateFormat: "settings.date-format",
  landingPage: "settings.landing-page",
  accent: "settings.accent",
  density: "settings.density",
  theme: "settings.theme",
  selectedModel: "settings.ai-model",
  azureEndpoint: "settings.azure-endpoint",
  azureDeployment: "settings.azure-deployment",
  azureApiVersion: "settings.azure-api-version",
  soundEnabled: "settings.sound-enabled",
  quietHoursEnabled: "settings.quiet-hours-enabled",
  employerCompany: "profile.employer.company",
  employerRole: "profile.employer.role",
  employerJoinedAt: "profile.employer.joined-at",
  employerStatus: "profile.employer.status",
  employerLeftAt: "profile.employer.left-at",
  employerType: "profile.employer.type",
  employerWebsite: "profile.employer.website",
}

function parseBool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback
  if (v === "true" || v === "1") return true
  if (v === "false" || v === "0") return false
  return fallback
}

export async function getWorkspaceSettings(db: TenantDb, user?: { name?: string; timezone?: string }): Promise<WorkspaceSettings> {
  const memories = await recall(db, { limit: 100 })
  const map = new Map(memories.map((m) => [m.key, m.value]))

  const get = (k: keyof WorkspaceSettings, fallback: string) => {
    const key = memoryKey(SETTINGS_KEYS[k])
    return map.get(key) ?? fallback
  }
  const getOpt = (k: keyof WorkspaceSettings) => {
    const v = map.get(memoryKey(SETTINGS_KEYS[k]))?.trim()
    return v && v.length > 0 ? v : undefined
  }

  // User name/timezone are canonical on User row; memory is fallback for other workspaces
  const tzMem = map.get(memoryKey(SETTINGS_KEYS.timezone))
  const timezone = user?.timezone ?? tzMem ?? DEFAULTS.timezone

  return {
    displayName: user?.name,
    timezone,
    currency: get("currency", DEFAULTS.currency),
    dateFormat: get("dateFormat", DEFAULTS.dateFormat),
    landingPage: get("landingPage", DEFAULTS.landingPage),
    accent: get("accent", DEFAULTS.accent),
    density: get("density", DEFAULTS.density),
    theme: get("theme", DEFAULTS.theme),
    selectedModel: get("selectedModel", DEFAULTS.selectedModel),
    azureEndpoint: map.get(memoryKey(SETTINGS_KEYS.azureEndpoint)) ?? undefined,
    azureDeployment: map.get(memoryKey(SETTINGS_KEYS.azureDeployment)) ?? undefined,
    azureApiVersion: map.get(memoryKey(SETTINGS_KEYS.azureApiVersion)) ?? undefined,
    soundEnabled: parseBool(map.get(memoryKey(SETTINGS_KEYS.soundEnabled)), DEFAULTS.soundEnabled),
    quietHoursEnabled: parseBool(map.get(memoryKey(SETTINGS_KEYS.quietHoursEnabled)), DEFAULTS.quietHoursEnabled),
    employerCompany: getOpt("employerCompany"),
    employerRole: getOpt("employerRole"),
    employerJoinedAt: getOpt("employerJoinedAt"),
    employerStatus: getOpt("employerStatus"),
    employerLeftAt: getOpt("employerLeftAt"),
    employerType: getOpt("employerType"),
    employerWebsite: getOpt("employerWebsite"),
  }
}

export async function updateWorkspaceSettings(
  db: TenantDb,
  ctx: DomainContext,
  patch: Partial<WorkspaceSettings> & { displayName?: string }
): Promise<WorkspaceSettings> {
  // displayName + timezone also update User row for auth/dal consistency
  if (patch.displayName !== undefined || patch.timezone !== undefined) {
    try {
      const userId = ctx.userId
      if (userId) {
        const data: Record<string, string> = {}
        if (patch.displayName !== undefined) data.name = patch.displayName.trim()
        if (patch.timezone !== undefined) data.timezone = patch.timezone.trim()
        if (Object.keys(data).length > 0) {
          await db.user.update({ where: { id: userId }, data } as never).catch(() => {})
          // also mirror to memory for cross-workspace recall
          if (patch.timezone !== undefined) {
            await remember(db, ctx, { key: SETTINGS_KEYS.timezone, value: patch.timezone, kind: "PREFERENCE", pinned: true }).catch(() => {})
          }
        }
      }
    } catch {}
  }

  for (const [field, value] of Object.entries(patch)) {
    if (field === "displayName") continue // already handled via User
    if (field === "timezone" && patch.timezone !== undefined) continue // mirrored above
    if (value === undefined) continue
    const k = SETTINGS_KEYS[field as keyof WorkspaceSettings]
    if (!k) continue
    const raw = typeof value === "boolean" ? String(value) : String(value)
    const trimmed = raw.trim()
    // Empty string means user cleared the field — remove the memory so it is not stuck as ""
    if (trimmed.length === 0) {
      await db.agentMemory.deleteMany({ where: { key: memoryKey(k) } }).catch(() => {})
      continue
    }
    await remember(db, ctx, { key: k, value: trimmed, kind: "PREFERENCE", pinned: true }).catch(() => {})
  }

  // Employer validation: leftAt must be >= joinedAt when status=left
  try {
    const company = (patch as Record<string, unknown>).employerCompany as string | undefined
    const status = (patch as Record<string, unknown>).employerStatus as string | undefined
    const joined = (patch as Record<string, unknown>).employerJoinedAt as string | undefined
    const left = (patch as Record<string, unknown>).employerLeftAt as string | undefined
    if ((status === "left" || status === "on_leave") && joined && left) {
      const j = new Date(joined)
      const l = new Date(left)
      if (!isNaN(j.getTime()) && !isNaN(l.getTime()) && l < j) {
        throw new Error("Left date cannot be before joined date.")
      }
    }
    if (status === "left" && left !== undefined && String(left).trim().length === 0) {
      throw new Error("Left date is required when status is Left.")
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("Left date")) throw e
  }

  // If employer company/website changed, keep Organization graph in sync (generic, not hardcoded)
  // Avoid orphan: reuse existing EMPLOYER org for this tenant if any, else create
  try {
    const companyRaw = (patch as Record<string, unknown>).employerCompany as string | undefined
    const websiteRaw = (patch as Record<string, unknown>).employerWebsite as string | undefined
    const hasCompanyPatch = companyRaw !== undefined
    const hasWebsitePatch = websiteRaw !== undefined
    if (hasCompanyPatch || hasWebsitePatch) {
      const nameTrim = hasCompanyPatch ? String(companyRaw).trim() : ""
      const websiteTrim = hasWebsitePatch ? String(websiteRaw).trim() : undefined
      // Company cleared -> archive employer orgs (don't delete, keep history)
      if (hasCompanyPatch && nameTrim.length === 0) {
        const existingEmps = await db.organization.findMany({ where: { kind: "EMPLOYER" as never } }).catch(() => [] as any[])
        for (const emp of existingEmps as any[]) {
          await db.organization.update({ where: { id: emp.id }, data: { archivedAt: new Date() } as never }).catch(() => {})
        }
      } else if (nameTrim.length >= 2) {
        // Reuse first EMPLOYER org else create by slug
        let target = await db.organization.findFirst({ where: { kind: "EMPLOYER" as never }, orderBy: { createdAt: "asc" } }).catch(() => null)
        if (!target) {
          const slugBase = memoryKey(nameTrim).slice(0, 40) || "employer"
          // ensure slug unique: if collision append short suffix
          let slug = slugBase
          let n = 0
          while (await db.organization.findFirst({ where: { slug } }).catch(() => null)) {
            n++
            slug = `${slugBase}-${n}`
            if (n > 5) break
          }
          await db.organization.create({
            data: { name: nameTrim, slug, kind: "EMPLOYER", website: websiteTrim || undefined } as never,
          }).catch(() => {})
        } else {
          const slugBase = memoryKey(nameTrim).slice(0, 40) || "employer"
          await db.organization.update({
            where: { id: (target as any).id },
            data: {
              name: nameTrim,
              slug: (target as any).slug || slugBase,
              kind: "EMPLOYER",
              archivedAt: null,
              ...(websiteTrim !== undefined ? { website: websiteTrim || null } : {}),
            } as never,
          }).catch(() => {})
        }
      } else if (hasWebsitePatch && websiteTrim !== undefined) {
        // website-only patch: update existing employer org's website
        const target = await db.organization.findFirst({ where: { kind: "EMPLOYER" as never } }).catch(() => null)
        if (target) {
          await db.organization.update({ where: { id: (target as any).id }, data: { website: websiteTrim || null } as never }).catch(() => {})
        }
      }
    }
  } catch {}

  // Recategorize existing CREDIT transactions that match new employer alias (no hardcode) — batched to handle >200
  try {
    const company = (patch as Record<string, unknown>).employerCompany as string | undefined
    if (company !== undefined) {
      const name = String(company).trim()
      if (name.length >= 3) {
        const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const org = await db.organization.findFirst({ where: { kind: "EMPLOYER" as never, name: { contains: name, mode: "insensitive" } }, select: { id: true } }).catch(() => null)
        const batchSize = 200
        let skip = 0
        while (true) {
          const batch = await db.transaction.findMany({
            where: {
              direction: "CREDIT" as never,
              description: { contains: name, mode: "insensitive" },
              OR: [{ category: null }, { category: { not: "INCOME" } }],
            },
            select: { id: true, description: true },
            take: batchSize,
            skip,
            orderBy: { occurredAt: "desc" },
          }).catch(() => [] as any[])
          if (!batch.length) break
          for (const t of batch as any[]) {
            if (!new RegExp(`\\b${esc}\\b`, "i").test(String(t.description))) continue
            await db.transaction.update({ where: { id: t.id }, data: { category: "INCOME", organizationId: (org as any)?.id ?? undefined } as never }).catch(() => {})
            try {
              const { recordInference } = await import("@/lib/domain/provenance")
              await recordInference(db, {
                targetType: "TRANSACTION",
                targetId: t.id,
                field: "category",
                value: { category: "INCOME", employer: name },
                confidence: 0.92,
                sourceType: "SYSTEM",
                evidence: `Retro-tagged after employer profile set to "${name}"`,
                agent: "settings.employer-sync",
              }).catch(() => {})
            } catch {}
          }
          if (batch.length < batchSize) break
          skip += batchSize
          if (skip > 5000) break // safety cap
        }
      }
    }
  } catch {}

  // Return fresh
  const userRow = ctx.userId ? await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true, timezone: true } }).catch(() => null) : null
  return getWorkspaceSettings(db, userRow ? { name: userRow.name, timezone: userRow.timezone } : undefined)
}

export async function getSettingsForAssistant(db: TenantDb): Promise<string> {
  const s = await getWorkspaceSettings(db)
  const employerLine = s.employerCompany
    ? `Employer: company=${s.employerCompany} role=${s.employerRole ?? "-"} joined=${s.employerJoinedAt ?? "-"} status=${s.employerStatus ?? "-"}${s.employerLeftAt ? ` left=${s.employerLeftAt}` : ""} type=${s.employerType ?? "-"}${s.employerWebsite ? ` website=${s.employerWebsite}` : ""} — use this to link CREDIT transactions containing the company name (any alias, case-insensitive) to INCOME/salary and to organization kind EMPLOYER.`
    : "Employer: not yet filled — ask user to complete Settings → Work & Planning → Employment / CV if income categorization is ambiguous."
  return [
    `Workspace settings: timezone=${s.timezone}, currency=${s.currency}, dateFormat=${s.dateFormat}, landingPage=${s.landingPage}, accent=${s.accent}, density=${s.density}, theme=${s.theme}, aiModel=${s.selectedModel}, sound=${s.soundEnabled ? "on" : "off"}, quietHours=${s.quietHoursEnabled ? "on" : "off"}`,
    employerLine,
  ].join("\n")
}
