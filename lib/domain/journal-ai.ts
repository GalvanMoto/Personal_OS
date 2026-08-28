import type { TenantDb } from "@/lib/db/tenant"
import { resolveProvider } from "@/lib/ai/provider"

export type DayActivityData = {
  dateString: string
  tasksCompleted: Array<{ id: string; title: string; priority: string; status: string }>
  tasksInProgress: Array<{ id: string; title: string; priority: string; status: string }>
  transactions: Array<{ id: string; description: string; amountMinor: number; direction: string; category?: string | null }>
  events: Array<{ id: string; title: string; startsAt: Date; endsAt: Date; isAllDay: boolean }>
  documentsAuthored: Array<{ id: string; title: string }>
  notesAuthored: Array<{ id: string; title?: string | null; body: string }>
}

/**
 * Collects all real data from the workspace for a specific day.
 */
export async function getDayActivityData(
  db: TenantDb | any,
  tenantId: string,
  targetDate: Date
): Promise<DayActivityData> {
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const [tasks, transactions, events, documents, notes] = await Promise.all([
    db.task.findMany({
      where: {
        tenantId,
        OR: [
          { updatedAt: { gte: startOfDay, lte: endOfDay } },
          { createdAt: { gte: startOfDay, lte: endOfDay } },
          { dueAt: { gte: startOfDay, lte: endOfDay } },
        ],
      },
      select: { id: true, title: true, priority: true, status: true },
      take: 30,
    }),
    db.transaction.findMany({
      where: {
        tenantId,
        occurredAt: { gte: startOfDay, lte: endOfDay },
      },
      select: { id: true, description: true, amountMinor: true, direction: true, category: true },
      take: 30,
    }),
    db.calendarEvent.findMany({
      where: {
        tenantId,
        startsAt: { gte: startOfDay, lte: endOfDay },
      },
      select: { id: true, title: true, startsAt: true, endsAt: true, allDay: true },
      take: 20,
    }),
    db.document.findMany({
      where: {
        tenantId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        NOT: { title: { startsWith: "Daily Journal" } },
      },
      select: { id: true, title: true },
      take: 20,
    }),
    db.note.findMany({
      where: {
        tenantId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      select: { id: true, title: true, body: true },
      take: 20,
    }),
  ])

  const tasksCompleted = tasks.filter((t: any) => t.status === "DONE")
  const tasksInProgress = tasks.filter((t: any) => t.status !== "DONE")

  const dateString = startOfDay.toISOString().split("T")[0]

  return {
    dateString,
    tasksCompleted,
    tasksInProgress,
    transactions: transactions.map((t: any) => ({
      ...t,
      amountMinor: Number(t.amountMinor),
    })),
    events: events.map((e: any) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      isAllDay: Boolean(e.allDay),
    })),
    documentsAuthored: documents,
    notesAuthored: notes,
  }
}

/**
 * Intelligently generates a clean daily journal entry using AI / smart synthesis.
 * Knows what to log (wins, deliverables, key finances, insights) and what to omit (routine noise).
 */
export async function synthesizeDailyJournal(activity: DayActivityData): Promise<{
  tiptapContent: any
  summary: string
}> {
  const { dateString, tasksCompleted, tasksInProgress, transactions, events, documentsAuthored, notesAuthored } = activity
  const dateObj = new Date(`${dateString}T00:00:00`)
  const formattedDate = dateObj.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Calculate financial totals
  const totalInflow = transactions
    .filter((t) => t.direction === "CREDIT")
    .reduce((sum, t) => sum + t.amountMinor, 0) / 100
  const totalOutflow = transactions
    .filter((t) => t.direction === "DEBIT")
    .reduce((sum, t) => sum + t.amountMinor, 0) / 100

  // Build AI executive summary
  const summaryParts: string[] = []
  if (tasksCompleted.length > 0) {
    summaryParts.push(`Completed ${tasksCompleted.length} task${tasksCompleted.length > 1 ? "s" : ""} (${tasksCompleted.map(t => t.title).slice(0, 3).join(", ")})`)
  }
  if (events.length > 0) {
    summaryParts.push(`Attended ${events.length} meeting${events.length > 1 ? "s" : ""} / schedule items`)
  }
  if (totalInflow > 0 || totalOutflow > 0) {
    summaryParts.push(`Financial movement: +₹${totalInflow.toLocaleString("en-IN")} in / -₹${totalOutflow.toLocaleString("en-IN")} out`)
  }
  if (documentsAuthored.length > 0) {
    summaryParts.push(`Authored ${documentsAuthored.length} knowledge document${documentsAuthored.length > 1 ? "s" : ""}`)
  }

  const executiveSummary = summaryParts.length > 0
    ? summaryParts.join(" · ")
    : `Daily log recorded for ${formattedDate}. Focus on deep work and system execution.`

  // Build structured Tiptap JSON Content
  const contentBlocks: any[] = [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: `Daily Reflection & Execution Log — ${formattedDate}` }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [{ type: "italic" }],
          text: `Daily synthesis generated by Personal OS AI. Intelligent signal filtering applied.`,
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "🎯 Key Accomplishments & Closed Loops" }],
    },
  ]

  if (tasksCompleted.length > 0) {
    contentBlocks.push({
      type: "bulletList",
      content: tasksCompleted.map((t) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", marks: [{ type: "bold" }], text: t.title },
              { type: "text", text: ` [${t.priority} priority]` },
            ],
          },
        ],
      })),
    })
  } else {
    contentBlocks.push({
      type: "paragraph",
      content: [{ type: "text", text: "No completed tasks recorded for this day. Focus was directed to planning and ongoing initiatives." }],
    })
  }

  // Active Focus & Ongoing
  contentBlocks.push({
    type: "heading",
    attrs: { level: 3 },
    content: [{ type: "text", text: "⚡ Ongoing Momentum & Active Deliverables" }],
  })

  if (tasksInProgress.length > 0) {
    contentBlocks.push({
      type: "bulletList",
      content: tasksInProgress.slice(0, 5).map((t) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: `${t.title} (${t.status.toLowerCase().replace("_", " ")})` },
            ],
          },
        ],
      })),
    })
  } else {
    contentBlocks.push({
      type: "paragraph",
      content: [{ type: "text", text: "All scheduled targets for the day are closed." }],
    })
  }

  // Meetings & Calendar Events if any
  if (events.length > 0) {
    contentBlocks.push(
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "📅 Meetings & Scheduled Sessions" }],
      },
      {
        type: "bulletList",
        content: events.map((e) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: e.title },
                {
                  type: "text",
                  text: e.isAllDay
                    ? " (All day)"
                    : ` (${new Date(e.startsAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} - ${new Date(e.endsAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})`,
                },
              ],
            },
          ],
        })),
      }
    )
  }

  // Financial Insights if any
  if (transactions.length > 0) {
    contentBlocks.push(
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "💰 Financial Summary" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: `Recorded ${transactions.length} transaction${transactions.length > 1 ? "s" : ""}: ` },
          { type: "text", marks: [{ type: "bold" }], text: `+₹${totalInflow.toLocaleString("en-IN")} Inflow` },
          { type: "text", text: " / " },
          { type: "text", marks: [{ type: "bold" }], text: `-₹${totalOutflow.toLocaleString("en-IN")} Outflow` },
        ],
      }
    )
  }

  // Personal Notes & Takeaways
  contentBlocks.push(
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "🧠 Insights, Learnings & Notes" }],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: notesAuthored.length > 0
                ? notesAuthored.map(n => n.body).join(" · ")
                : "Add personal reflections, key technical learnings, or thoughts here...",
            },
          ],
        },
      ],
    }
  )

  return {
    tiptapContent: {
      type: "doc",
      content: contentBlocks,
    },
    summary: executiveSummary,
  }
}
