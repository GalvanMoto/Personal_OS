import "server-only"

import { tenantDb, type TenantDb } from "@/lib/db/tenant"
import { buildBriefing } from "@/lib/domain/briefing"
import type { DomainContext } from "@/lib/domain/context-types"
import { syncIntegrationEmails } from "@/lib/domain/email"
import { applyProposal, processItem } from "@/lib/domain/inbox"
import { syncSubscriptions, upcomingPayments } from "@/lib/domain/finance"
import { formatMoney, money } from "@/lib/domain/money"
import { dueReminders, markReminderSent } from "@/lib/domain/reminders"
import { prisma } from "@/lib/db/client"
import { publishRealtime } from "@/lib/realtime/bus"

/// Handlers receive a tenant-scoped handle, so a job for one workspace cannot
/// read another's data even if its payload is wrong.
export type JobHandler = (
  payload: Record<string, unknown>,
  context: { db: TenantDb; ctx: DomainContext }
) => Promise<unknown>

export const jobHandlers: Record<string, JobHandler> = {
  /// Turns due reminders into notifications (PRD §14, §22).
  "reminder.dispatch": async (_payload, { db, ctx }) => {
    const ready = await dueReminders(db)

    for (const reminder of ready) {
      const n = await db.notification.create({
        data: {
          level: "REMINDER",
          title: reminder.title,
          body: reminder.body,
          href: reminder.taskId ? `/tasks/${reminder.taskId}` : null,
        } as never,
      })
      publishRealtime({ type: "notification", tenantId: ctx.tenantId, payload: { id: n.id, level: n.level, title: n.title }, at: new Date().toISOString() }).catch(() => {})
      publishRealtime({ type: "badge", tenantId: ctx.tenantId, payload: {}, at: new Date().toISOString() }).catch(() => {})

      await markReminderSent(db, ctx, reminder.id)
    }

    return { dispatched: ready.length }
  },

  /// The morning briefing, delivered as one notification rather than one per
  /// task — the point is to reduce noise, not add to it.
  "briefing.daily": async (_payload, { db, ctx }) => {
    const user = ctx.userId
      ? await prisma.user.findUnique({ where: { id: ctx.userId } })
      : null

    const briefing = await buildBriefing(db, user?.name ?? "there")

    const n2 = await db.notification.create({
      data: {
        level: "INFO",
        title: briefing.headline,
        body: briefing.nextBest
          ? `Start with "${briefing.nextBest.title}" — ${briefing.nextBest.why}`
          : briefing.question,
        href: "/today",
      } as never,
    })
    publishRealtime({ type: "notification", tenantId: ctx.tenantId, payload: { id: n2.id, level: n2.level, title: n2.title }, at: new Date().toISOString() }).catch(() => {})
    publishRealtime({ type: "badge", tenantId: ctx.tenantId, payload: {}, at: new Date().toISOString() }).catch(() => {})

    return { headline: briefing.headline }
  },

  /// Re-runs extraction for an item captured while the extractor was down.
  "inbox.process": async (payload, { db, ctx }) => {
    const inboxItemId = String(payload.inboxItemId ?? "")
    if (!inboxItemId) throw new Error("inbox.process needs an inboxItemId")

    const item = await processItem(db, ctx, inboxItemId)

    // Only auto-apply when the extractor had no questions and the caller asked
    // for it; otherwise the user reviews first.
    if (payload.autoApply === true && item.status === "NEEDS_REVIEW") {
      const proposal = item.proposal as { questions?: string[] } | null
      if (!proposal?.questions?.length) {
        return applyProposal(db, ctx, inboxItemId)
      }
    }

    return { status: item.status }
  },

  /// Pulls recent mail for a connected Gmail integration and feeds task
  /// requests through the universal inbox (PRD §35).
  "email.sync": async (payload, { db, ctx }) => {
    const integrationId = String(payload.integrationId ?? "")
    if (!integrationId) throw new Error("email.sync needs an integrationId")

    const integration = await db.integration.findUnique({
      where: { id: integrationId },
    })
    if (!integration) throw new Error("Integration not found")
    if (integration.provider !== "GMAIL") {
      throw new Error(`email.sync does not support ${integration.provider}`)
    }

    return syncIntegrationEmails(db, ctx, integration)
  },

  /// Re-detects recurring payments and warns before the next charge (PRD §9).
  "finance.subscriptions": async (_payload, { db, ctx }) => {
    const result = await syncSubscriptions(db, ctx)
    const soon = await upcomingPayments(db, 3)

    for (const payment of soon) {
      const n3 = await db.notification.create({
        data: {
          level: "REMINDER",
          title: `${payment.name} renews in ${payment.daysAway} day${
            payment.daysAway === 1 ? "" : "s"
          }`,
          body: `${formatMoney(money(payment.amountMinor, payment.currency))} — ${payment.cycle.toLowerCase()}`,
          href: "/finance",
        } as never,
      })
      publishRealtime({ type: "notification", tenantId: ctx.tenantId, payload: { id: n3.id, level: n3.level, title: n3.title }, at: new Date().toISOString() }).catch(() => {})
    }
    if (soon.length) publishRealtime({ type: "badge", tenantId: ctx.tenantId, payload: {}, at: new Date().toISOString() }).catch(() => {})

    return { ...result, warned: soon.length }
  },

  /// Flags deadlines that are close but whose task has not been started.
  "deadline.sweep": async (_payload, { db, ctx }) => {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const atRisk = await db.task.findMany({
      where: {
        status: { in: ["TODO", "BACKLOG"] },
        dueAt: { lte: soon, gte: new Date() },
      },
    })

    for (const task of atRisk) {
      const n4 = await db.notification.create({
        data: {
          level: "IMPORTANT",
          title: `${task.title} is due soon and hasn't been started`,
          href: `/tasks/${task.id}`,
        } as never,
      })
      publishRealtime({ type: "notification", tenantId: ctx.tenantId, payload: { id: n4.id, level: n4.level, title: n4.title }, at: new Date().toISOString() }).catch(() => {})
    }
    if (atRisk.length) publishRealtime({ type: "badge", tenantId: ctx.tenantId, payload: {}, at: new Date().toISOString() }).catch(() => {})

    return { flagged: atRisk.length }
  },
}

export function handlerFor(kind: string): JobHandler | null {
  return jobHandlers[kind] ?? null
}

export function contextForTenant(tenantId: string) {
  return {
    db: tenantDb(tenantId),
    ctx: { tenantId, actorType: "SYSTEM" as const },
  }
}
