import "server-only"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import type {
  CommitmentFrequency,
  CommitmentStatus,
  DeliverableType,
  TaskPriority,
} from "@/lib/generated/prisma/enums"
import { logActivity } from "@/lib/events/activity"

export type CreateCommitmentInput = {
  organizationId: string
  brandId?: string | null
  projectId?: string | null
  title: string
  description?: string | null
  deliverableType?: DeliverableType
  quantity?: number
  unit?: string
  frequency?: CommitmentFrequency
  dueDayOfWeek?: number // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
  estimatedMinutes?: number
  priority?: TaskPriority
  status?: CommitmentStatus
  autoGenerateTasks?: boolean
  autoRemind?: boolean
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function computeCycleInfo(frequency: CommitmentFrequency, refDate: Date = new Date()) {
  const year = refDate.getFullYear()

  if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    const week = getWeekNumber(refDate)
    const cycleKey = `${year}-W${String(week).padStart(2, "0")}`

    // Calculate Monday of this week
    const day = refDate.getDay() // 0 is Sunday
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(refDate)
    monday.setDate(refDate.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    return { cycleKey, periodStart: monday, periodEnd: sunday, label: `Week ${week}` }
  }

  // Monthly / Quarterly default
  const month = refDate.getMonth() + 1
  const cycleKey = `${year}-${String(month).padStart(2, "0")}`
  const monthStart = new Date(year, refDate.getMonth(), 1, 0, 0, 0, 0)
  const monthEnd = new Date(year, refDate.getMonth() + 1, 0, 23, 59, 59, 999)

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return {
    cycleKey,
    periodStart: monthStart,
    periodEnd: monthEnd,
    label: `${monthNames[refDate.getMonth()]} ${year}`,
  }
}

export async function createRecurringCommitment(
  db: TenantDb,
  ctx: DomainContext,
  input: CreateCommitmentInput
) {
  const commitment = await db.recurringCommitment.create({
    data: {
      organizationId: input.organizationId,
      brandId: input.brandId || null,
      projectId: input.projectId || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      deliverableType: input.deliverableType ?? "REEL",
      quantity: input.quantity ?? 1,
      unit: input.unit ?? "deliverables",
      frequency: input.frequency ?? "WEEKLY",
      dueDayOfWeek: input.dueDayOfWeek ?? 5, // Default Friday
      estimatedMinutes: input.estimatedMinutes ?? 45,
      priority: input.priority ?? "HIGH",
      status: input.status ?? "ACTIVE",
      autoGenerateTasks: input.autoGenerateTasks ?? true,
      autoRemind: input.autoRemind ?? true,
    } as never,
    include: {
      organization: { select: { name: true } },
      brand: { select: { name: true } },
    },
  })

  await logActivity(db, {
    action: "commitment.created",
    summary: `Created recurring commitment: ${commitment.title} (${commitment.quantity} ${commitment.unit}/${commitment.frequency.toLowerCase()})`,
    userId: ctx.userId,
    actorType: ctx.actorType ?? "SYSTEM",
  })

  // Automatically spawn initial cycle tasks if active
  if (commitment.autoGenerateTasks && commitment.status === "ACTIVE") {
    await generateCycleTasks(db, ctx, commitment.id)
  }

  return commitment
}

export async function generateCycleTasks(
  db: TenantDb,
  ctx: DomainContext,
  commitmentId: string,
  refDate: Date = new Date()
) {
  const commitment = await db.recurringCommitment.findUnique({
    where: { id: commitmentId },
    include: {
      organization: { select: { name: true } },
      brand: { select: { name: true } },
    },
  })

  if (!commitment || commitment.status !== "ACTIVE") return { generated: 0 }

  const cycle = computeCycleInfo(commitment.frequency, refDate)

  // 1. Find or create occurrence for this cycle
  let occurrence = await db.commitmentOccurrence.findFirst({
    where: {
      commitmentId: commitment.id,
      cycleKey: cycle.cycleKey,
    },
    include: { tasks: true },
  })

  if (!occurrence) {
    occurrence = await db.commitmentOccurrence.create({
      data: {
        commitmentId: commitment.id,
        cycleKey: cycle.cycleKey,
        periodStart: cycle.periodStart,
        periodEnd: cycle.periodEnd,
        targetQuantity: commitment.quantity,
        completedQuantity: 0,
      } as never,
      include: { tasks: true },
    })
  }

  const existingCount = occurrence.tasks.length
  if (existingCount >= commitment.quantity) {
    return { generated: 0, occurrence }
  }

  // 2. Compute due date based on dueDayOfWeek
  // 1=Mon ... 5=Fri
  const targetDue = new Date(cycle.periodStart)
  const dueDayOffset = commitment.dueDayOfWeek === 0 ? 6 : commitment.dueDayOfWeek - 1
  targetDue.setDate(cycle.periodStart.getDate() + dueDayOffset)
  targetDue.setHours(18, 0, 0, 0) // Default 6:00 PM

  const brandOrOrg = commitment.brand?.name || commitment.organization.name
  const deliverableName = commitment.deliverableType.charAt(0) + commitment.deliverableType.slice(1).toLowerCase()

  let generated = 0

  for (let i = existingCount + 1; i <= commitment.quantity; i++) {
    const title =
      commitment.quantity === 1
        ? `${brandOrOrg} — ${commitment.title} — ${cycle.label}`
        : `${brandOrOrg} — ${deliverableName} #${i} — ${cycle.label}`

    await db.task.create({
      data: {
        title,
        description: commitment.description || `Deliverable #${i} for recurring commitment: ${commitment.title}`,
        priority: commitment.priority,
        status: "TODO",
        dueAt: targetDue,
        estimateMin: commitment.estimatedMinutes,
        projectId: commitment.projectId,
        commitmentOccurrenceId: occurrence.id,
        createdBy: "SYSTEM",
      } as never,
    })
    generated++
  }

  return { generated, occurrence }
}

export async function generateAllActiveCommitmentTasks(
  db: TenantDb,
  ctx: DomainContext,
  refDate: Date = new Date()
) {
  const activeCommitments = await db.recurringCommitment.findMany({
    where: { status: "ACTIVE", autoGenerateTasks: true },
  })

  let totalGenerated = 0
  for (const c of activeCommitments) {
    const res = await generateCycleTasks(db, ctx, c.id, refDate)
    totalGenerated += res.generated
  }

  return { totalGenerated }
}

export type CommitmentMatrixItem = {
  id: string
  title: string
  clientName: string
  clientSlug: string
  brandName?: string | null
  deliverableType: DeliverableType
  quantity: number
  unit: string
  frequency: CommitmentFrequency
  estimatedMinutes: number
  priority: TaskPriority
  status: CommitmentStatus
  currentCycle: {
    cycleKey: string
    label: string
    targetQuantity: number
    completedQuantity: number
    progressPercent: number
    status: "ON_TRACK" | "AT_RISK" | "BEHIND" | "COMPLETED"
    remainingQuantity: number
  }
}

export async function getCommitmentsProgressSummary(
  db: TenantDb,
  refDate: Date = new Date()
) {
  const commitments = await db.recurringCommitment.findMany({
    where: { status: "ACTIVE" },
    include: {
      organization: { select: { name: true, slug: true } },
      brand: { select: { name: true } },
      occurrences: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          tasks: { select: { id: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  let totalExpected = 0
  let totalCompleted = 0
  let totalMinutesEstimated = 0

  const items: CommitmentMatrixItem[] = commitments.map((c) => {
    const cycle = computeCycleInfo(c.frequency, refDate)
    const occ = c.occurrences[0]
    const tasks = occ?.tasks || []
    const completedTasks = tasks.filter((t) => t.status === "DONE").length
    const target = occ?.targetQuantity ?? c.quantity

    totalExpected += target
    totalCompleted += completedTasks
    totalMinutesEstimated += target * c.estimatedMinutes

    const percent = target === 0 ? 100 : Math.round((completedTasks / target) * 100)
    const remaining = Math.max(0, target - completedTasks)

    // Evaluate health
    const now = new Date()
    const diffDays = Math.max(0, Math.ceil((cycle.periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    let health: "ON_TRACK" | "AT_RISK" | "BEHIND" | "COMPLETED" = "ON_TRACK"
    if (remaining === 0) {
      health = "COMPLETED"
    } else if (diffDays <= 1 && remaining >= 2) {
      health = "AT_RISK"
    } else if (diffDays === 0 && remaining > 0) {
      health = "BEHIND"
    }

    return {
      id: c.id,
      title: c.title,
      clientName: c.organization.name,
      clientSlug: c.organization.slug,
      brandName: c.brand?.name ?? null,
      deliverableType: c.deliverableType,
      quantity: c.quantity,
      unit: c.unit,
      frequency: c.frequency,
      estimatedMinutes: c.estimatedMinutes,
      priority: c.priority,
      status: c.status,
      currentCycle: {
        cycleKey: cycle.cycleKey,
        label: cycle.label,
        targetQuantity: target,
        completedQuantity: completedTasks,
        progressPercent: percent,
        status: health,
        remainingQuantity: remaining,
      },
    }
  })

  const overallPercent = totalExpected === 0 ? 100 : Math.round((totalCompleted / totalExpected) * 100)

  return {
    totalExpected,
    totalCompleted,
    totalRemaining: Math.max(0, totalExpected - totalCompleted),
    totalHoursEstimated: Math.round((totalMinutesEstimated / 60) * 10) / 10,
    overallPercent,
    items,
  }
}
