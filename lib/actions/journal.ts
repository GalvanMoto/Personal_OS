"use server"

import { revalidatePath } from "next/cache"
import { requireWorkspace } from "@/lib/auth/dal"
import { getDayActivityData, synthesizeDailyJournal } from "@/lib/domain/journal-ai"
import { indexEntity } from "@/lib/search"

export async function getJournalForDateAction(workspace: string, dateString: string) {
  const { db, tenant } = await requireWorkspace(workspace)
  const targetDate = new Date(`${dateString}T00:00:00`)
  const titlePrefix = `Daily Journal — ${dateString}`

  const doc = await db.document.findFirst({
    where: {
      tenantId: tenant.id,
      title: { startsWith: titlePrefix },
    },
    include: { file: true },
  })

  const activity = await getDayActivityData(db, tenant.id, targetDate)

  return {
    ok: true,
    document: doc
      ? {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          summary: doc.summary,
          shareToken: (doc as any).shareToken,
          isPublic: (doc as any).isPublic,
          updatedAt: doc.updatedAt.toISOString(),
        }
      : null,
    activity,
  }
}

export async function saveJournalAction(
  workspace: string,
  dateString: string,
  data: { title: string; content: string; summary?: string }
) {
  const { db, tenant } = await requireWorkspace(workspace)
  const titlePrefix = `Daily Journal — ${dateString}`

  try {
    const existing = await db.document.findFirst({
      where: {
        tenantId: tenant.id,
        title: { startsWith: titlePrefix },
      },
    })

    let doc
    if (existing) {
      doc = await db.document.update({
        where: { id: existing.id },
        data: {
          title: data.title || titlePrefix,
          content: data.content,
          summary: data.summary || null,
        },
      })
    } else {
      doc = await db.document.create({
        data: {
          tenantId: tenant.id,
          title: data.title || titlePrefix,
          content: data.content,
          summary: data.summary || null,
        } as never,
      })
    }

    await indexEntity(db, {
      entityType: "DOCUMENT",
      entityId: doc.id,
      title: doc.title,
      body: doc.content || doc.summary || "",
    })

    revalidatePath(`/w/${workspace}/journal`)
    revalidatePath(`/w/${workspace}/documents`)
    return { ok: true, id: doc.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save journal" }
  }
}

export async function generateAIJournalAction(workspace: string, dateString: string) {
  const { db, tenant } = await requireWorkspace(workspace)
  const targetDate = new Date(`${dateString}T00:00:00`)

  try {
    const activity = await getDayActivityData(db, tenant.id, targetDate)
    const synthesis = await synthesizeDailyJournal(activity)
    return { ok: true, synthesis, activity }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to synthesize journal" }
  }
}

export async function getJournalCalendarDatesAction(
  workspace: string,
  year: number,
  month: number
) {
  const { db, tenant } = await requireWorkspace(workspace)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)

  const journals = await db.document.findMany({
    where: {
      tenantId: tenant.id,
      title: { startsWith: "Daily Journal —" },
      createdAt: { gte: start, lte: end },
    },
    select: { title: true, createdAt: true },
  })

  // Extract dates from title "Daily Journal — YYYY-MM-DD" or createdAt
  const loggedDates = new Set<string>()
  for (const j of journals) {
    const match = j.title.match(/Daily Journal — (\d{4}-\d{2}-\d{2})/)
    if (match && match[1]) {
      loggedDates.add(match[1])
    } else {
      loggedDates.add(j.createdAt.toISOString().split("T")[0])
    }
  }

  return { ok: true, dates: Array.from(loggedDates) }
}
