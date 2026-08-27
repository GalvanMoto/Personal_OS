import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { emit } from "@/lib/events/bus"
import { logActivity } from "@/lib/events/activity"
import { indexEntity } from "@/lib/search"

/**
 * Universal Subscription Orchestrator – operational.txt §1-4, §14-15, §29-30.
 * One natural-language request → Subscription + Payment Schedule + Reminder + Notification.
 * Idempotent: find existing by (tenantId, vendor/name) then update, never duplicate.
 * Cross-module: emits domain events, creates EntityLinks, central Reminder/Notification.
 */

export type SubscriptionOrchestratorInput = {
  provider: string // e.g. "Contabo"
  service?: string // e.g. "Server"
  amountMinor?: number // paise/cents, optional until known
  currency?: string // default INR
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"
  paymentDay?: number // 1-31, for monthly
  billingUrl?: string
  category?: string
  remindDaysBefore?: number // default 1, operational.txt §11 supports "3 days before"
}

export type SubscriptionOrchestratorResult = {
  subscription: { id: string; name: string; vendor: string | null; cycle: string; nextDueAt: string | null }
  reminder?: { id: string; remindAt: string } | null
  notification?: { id: string } | null
  isNew: boolean
  message: string
}

function nextDueDate(frequency: string, paymentDay?: number): Date | null {
  const now = new Date()
  if (frequency === "MONTHLY" && paymentDay) {
    const day = Math.min(31, Math.max(1, paymentDay))
    // Use UTC to keep day stable across timezones for billing
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, 9, 0, 0))
    // need to handle months with fewer days: clamp
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
    if (day > lastDay) d.setUTCDate(lastDay)
    if (d.getTime() <= now.getTime()) {
      d.setUTCMonth(d.getUTCMonth() + 1)
      const nextLastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
      if (day > nextLastDay) d.setUTCDate(nextLastDay)
      else d.setUTCDate(day)
    }
    return d
  }
  if (frequency === "WEEKLY") {
    const d = new Date(now)
    d.setDate(d.getDate() + 7)
    d.setHours(9, 0, 0, 0)
    return d
  }
  if (frequency === "QUARTERLY") {
    const d = new Date(now)
    d.setMonth(d.getMonth() + 3)
    d.setHours(9, 0, 0, 0)
    return d
  }
  if (frequency === "YEARLY") {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() + 1)
    d.setHours(9, 0, 0, 0)
    return d
  }
  // monthly without day => next month same date
  if (frequency === "MONTHLY") {
    const d = new Date(now)
    d.setMonth(d.getMonth() + 1)
    d.setHours(9, 0, 0, 0)
    return d
  }
  return null
}

function buildName(vendor: string, service?: string) {
  return service ? `${vendor} – ${service}` : vendor
}

export async function createOrUpdateSubscription(
  db: TenantDb,
  ctx: DomainContext,
  input: SubscriptionOrchestratorInput
): Promise<SubscriptionOrchestratorResult> {
  const vendor = input.provider.trim()
  if (!vendor) throw new Error("Provider name is required")
  const name = buildName(vendor, input.service?.trim() || undefined)
  const cycle = input.frequency
  const nextDueAt = nextDueDate(input.frequency, input.paymentDay)

  // Idempotent: find existing by tenant + vendor/name (case-insensitive)
  // Tenant scoping is automatic via TenantDb extension.
  const existing =
    (await db.subscription.findFirst({
      where: {
        OR: [
          { vendor: { equals: vendor, mode: "insensitive" } },
          { name: { equals: name, mode: "insensitive" } },
          { name: { equals: vendor, mode: "insensitive" } },
        ],
      },
    })) ?? null

  let subscription
  let isNew = false
  if (existing) {
    subscription = await db.subscription.update({
      where: { id: existing.id },
      data: {
        name,
        vendor,
        cycle: cycle as any,
        nextDueAt,
        active: true,
        ...(input.amountMinor !== undefined ? { amountMinor: BigInt(input.amountMinor) } : {}),
        ...(input.currency ? { currency: input.currency } : {}),
      },
    })
  } else {
    subscription = await db.subscription.create({
      data: {
        name,
        vendor,
        amountMinor: BigInt(input.amountMinor ?? 0),
        currency: input.currency ?? "INR",
        cycle: cycle as any,
        nextDueAt,
        active: true,
      } as never,
    })
    isNew = true
  }

  // Index for universal search (operational.txt §7)
  await indexEntity(db, {
    entityType: "SUBSCRIPTION",
    entityId: subscription.id,
    title: subscription.name,
    body: [subscription.vendor, input.billingUrl, input.category, subscription.cycle].filter(Boolean).join(" "),
    href: `/w/${ctx.tenantId}/finance/subscriptions`,
  }).catch(() => {})

  // Billing URL → LinkResource + EntityLink (isolated, not disturbing Subscription table until migration)
  let linkId: string | null = null
  if (input.billingUrl) {
    const url = input.billingUrl.trim()
    try {
      const existingLink = await db.linkResource.findFirst({
        where: { url },
      })
      if (existingLink) {
        linkId = existingLink.id
      } else {
        const created = await db.linkResource.create({
          data: {
            url,
            title: `${vendor} Billing`,
            summary: `Billing portal for ${vendor} subscription`,
          } as never,
        })
        linkId = created.id
      }
      // Relationship: Subscription RELATED_TO Link
      await db.entityLink
        .create({
          data: {
            fromType: "SUBSCRIPTION",
            fromId: subscription.id,
            toType: "LINK",
            toId: linkId,
            relation: "RELATED_TO",
            createdBy: "AGENT",
          } as never,
        })
        .catch(() => {
          // unique constraint => already linked
        })
    } catch {
      // non-fatal
    }
  }

  // Reminder: central engine (operational.txt §11)
  let reminder: { id: string; remindAt: string } | null = null
  if (nextDueAt) {
    const daysBefore = input.remindDaysBefore ?? 1
    const remindAt = new Date(nextDueAt)
    remindAt.setDate(remindAt.getDate() - Math.min(30, Math.max(1, daysBefore)))
    remindAt.setHours(9, 0, 0, 0)
    // Don't create reminder in the past
    if (remindAt.getTime() > Date.now()) {
      try {
        // Idempotent: reuse SCHEDULED reminder for this vendor
        const existingReminder = await db.reminder.findFirst({
          where: {
            title: { contains: vendor, mode: "insensitive" },
            status: "SCHEDULED",
          },
        })
        if (existingReminder) {
          // Update time if drifted
          if (Math.abs(existingReminder.remindAt.getTime() - remindAt.getTime()) > 60 * 60 * 1000) {
            const updated = await db.reminder.update({
              where: { id: existingReminder.id },
              data: { remindAt, title: `Pay ${vendor} — ${name}` },
            })
            reminder = { id: updated.id, remindAt: updated.remindAt.toISOString() }
          } else {
            reminder = { id: existingReminder.id, remindAt: existingReminder.remindAt.toISOString() }
          }
        } else {
          const r = await db.reminder.create({
            data: {
              title: `Pay ${vendor} — ${name}`,
              body: `Subscription payment due for ${vendor}${input.billingUrl ? ` – ${input.billingUrl}` : ""}. Next due ${nextDueAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
              remindAt,
              status: "SCHEDULED",
            } as never,
          })
          reminder = { id: r.id, remindAt: r.remindAt.toISOString() }
          await emit(db, ctx.tenantId, {
            type: "reminder.scheduled",
            payload: { reminderId: r.id, subscriptionId: subscription.id, vendor },
            actorType: ctx.actorType ?? "AGENT",
            actorId: ctx.agent ?? ctx.userId,
          }).catch(() => {})
          // Link subscription → reminder
          await db.entityLink
            .create({
              data: {
                fromType: "SUBSCRIPTION",
                fromId: subscription.id,
                toType: "REMINDER",
                toId: r.id,
                relation: "REQUIRES",
                createdBy: "AGENT",
              } as never,
            })
            .catch(() => {})
        }
      } catch {
        // reminder creation is best-effort
      }
    }
  }

  // Notification: central engine (operational.txt §10), single creation per orchestration
  let notification: { id: string } | null = null
  if (nextDueAt) {
    try {
      const n = await db.notification.create({
        data: {
          title: isNew
            ? `Added ${vendor} as ${cycle.toLowerCase()} subscription`
            : `Updated ${vendor} subscription — next due ${nextDueAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
          body: `${name} · ${cycle.toLowerCase()} · next payment ${nextDueAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}${input.billingUrl ? ` · ${input.billingUrl}` : ""}${input.amountMinor ? ` · ${input.currency ?? "INR"} ${(input.amountMinor / 100).toFixed(2)}` : ""}`,
          level: "REMINDER",
          href: `/w/${ctx.tenantId}/finance/subscriptions`,
        } as never,
      })
      notification = { id: n.id }
    } catch {
      // best-effort
    }
  }

  // Domain events for automation engine
  await emit(db, ctx.tenantId, {
    type: "subscription.detected",
    payload: {
      subscriptionId: subscription.id,
      vendor,
      name,
      cycle,
      nextDueAt: nextDueAt?.toISOString() ?? null,
      billingUrl: input.billingUrl ?? null,
      isNew,
    },
    actorType: ctx.actorType ?? "AGENT",
    actorId: ctx.agent ?? ctx.userId,
  }).catch(() => {})

  await logActivity(db, {
    action: isNew ? "subscription.created" : "subscription.updated",
    summary: isNew
      ? `Added ${vendor} as ${cycle.toLowerCase()} subscription — next due ${nextDueAt ? nextDueAt.toLocaleDateString("en-IN") : "unknown"}`
      : `Updated ${vendor} subscription — next due ${nextDueAt ? nextDueAt.toLocaleDateString("en-IN") : "unknown"}`,
    userId: ctx.userId,
    actorType: ctx.actorType ?? "AGENT",
    actorId: ctx.agent,
    targetType: "SUBSCRIPTION",
    targetId: subscription.id,
    metadata: { vendor, cycle, nextDueAt: nextDueAt?.toISOString(), billingUrl: input.billingUrl },
  }).catch(() => {})

  const message = isNew
    ? `Added ${vendor} as an active ${cycle.toLowerCase()} subscription${input.paymentDay ? `, payment on the ${input.paymentDay}th` : ""}${input.billingUrl ? `, billing link attached` : ""}. Next payment ${nextDueAt ? nextDueAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""} — reminder configured.`
    : `Updated ${vendor} subscription — already tracked as ${existing?.name ?? name}. Next due ${nextDueAt ? nextDueAt.toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : ""}${input.billingUrl ? ` (billing link updated)` : ""}.`

  return {
    subscription: {
      id: subscription.id,
      name: subscription.name,
      vendor: subscription.vendor,
      cycle: subscription.cycle,
      nextDueAt: subscription.nextDueAt?.toISOString() ?? null,
    },
    reminder,
    notification,
    isNew,
    message,
  }
}

export async function searchSubscriptions(db: TenantDb, query?: string) {
  if (!query) return db.subscription.findMany({ orderBy: { nextDueAt: "asc" }, take: 20 })
  return db.subscription.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { vendor: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { nextDueAt: "asc" },
    take: 20,
  })
}

export async function getSubscription(db: TenantDb, id: string) {
  return db.subscription.findUnique({ where: { id } })
}

export async function updateSubscription(
  db: TenantDb,
  ctx: DomainContext,
  id: string,
  patch: {
    name?: string
    vendor?: string
    amountMinor?: number
    currency?: string
    cycle?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"
    nextDueAt?: string | null
    active?: boolean
    billingUrl?: string
  }
) {
  const existing = await db.subscription.findUnique({ where: { id } })
  if (!existing) throw new Error("Subscription not found")

  const data: Record<string, unknown> = {}
  if (patch.name !== undefined) data.name = patch.name
  if (patch.vendor !== undefined) data.vendor = patch.vendor
  if (patch.amountMinor !== undefined) data.amountMinor = BigInt(patch.amountMinor)
  if (patch.currency !== undefined) data.currency = patch.currency
  if (patch.cycle !== undefined) data.cycle = patch.cycle
  if (patch.nextDueAt !== undefined) data.nextDueAt = patch.nextDueAt ? new Date(patch.nextDueAt) : null
  if (patch.active !== undefined) data.active = patch.active

  const updated = await db.subscription.update({ where: { id }, data: data as never })

  if (patch.billingUrl) {
    const url = patch.billingUrl.trim()
    const existingLink = await db.linkResource.findFirst({ where: { url } })
    let linkId: string
    if (existingLink) linkId = existingLink.id
    else {
      const created = await db.linkResource.create({
        data: { url, title: `${updated.vendor ?? updated.name} Billing`, summary: `Billing portal for ${updated.vendor ?? updated.name}` } as never,
      })
      linkId = created.id
    }
    await db.entityLink
      .create({
        data: { fromType: "SUBSCRIPTION", fromId: id, toType: "LINK", toId: linkId, relation: "RELATED_TO", createdBy: "AGENT" } as never,
      })
      .catch(() => {})
  }

  await indexEntity(db, {
    entityType: "SUBSCRIPTION",
    entityId: updated.id,
    title: updated.name,
    body: [updated.vendor, updated.cycle].filter(Boolean).join(" "),
    href: `/w/${ctx.tenantId}/finance/subscriptions`,
  }).catch(() => {})

  await logActivity(db, {
    action: "subscription.updated",
    summary: `Updated subscription "${updated.name}"`,
    userId: ctx.userId,
    actorType: ctx.actorType ?? "AGENT",
    actorId: ctx.agent,
    targetType: "SUBSCRIPTION",
    targetId: id,
  }).catch(() => {})

  return updated
}

export async function cancelSubscription(db: TenantDb, ctx: DomainContext, id: string) {
  const sub = await db.subscription.findUnique({ where: { id } })
  if (!sub) throw new Error("Subscription not found")
  const updated = await db.subscription.update({ where: { id }, data: { active: false } })
  // cancel any scheduled reminders
  await db.reminder.updateMany({ where: { title: { contains: sub.vendor ?? sub.name, mode: "insensitive" }, status: "SCHEDULED" }, data: { status: "CANCELLED" } }).catch(() => {})
  await logActivity(db, {
    action: "subscription.cancelled",
    summary: `Cancelled subscription "${sub.name}"`,
    userId: ctx.userId,
    actorType: ctx.actorType ?? "AGENT",
    actorId: ctx.agent,
    targetType: "SUBSCRIPTION",
    targetId: id,
  }).catch(() => {})
  await emit(db, ctx.tenantId, { type: "subscription.detected", payload: { subscriptionId: id, cancelled: true }, actorType: ctx.actorType ?? "AGENT", actorId: ctx.agent ?? ctx.userId }).catch(() => {})
  return updated
}

export async function pauseSubscription(db: TenantDb, ctx: DomainContext, id: string) {
  return cancelSubscription(db, ctx, id)
}
