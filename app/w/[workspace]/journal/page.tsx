import { requireWorkspace } from "@/lib/auth/dal"
import { JournalView } from "@/components/journal/journal-view"
import { getDayActivityData } from "@/lib/domain/journal-ai"

export const metadata = {
  title: "Daily Journal & AI Reflection · Personal OS",
}

export default async function JournalPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>
  searchParams?: Promise<{ date?: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const todayStr = new Date().toISOString().split("T")[0]
  const targetDateStr = resolvedSearchParams?.date || todayStr

  const targetDate = new Date(`${targetDateStr}T00:00:00`)
  const titlePrefix = `Daily Journal — ${targetDateStr}`

  // 1. Fetch existing journal document for this date if present
  const doc = await db.document.findFirst({
    where: {
      tenantId: tenant.id,
      title: { startsWith: titlePrefix },
    },
  })

  // 2. Fetch all logged journal dates to mark on calendar
  const journals = await db.document.findMany({
    where: {
      tenantId: tenant.id,
      title: { startsWith: "Daily Journal —" },
    },
    select: { title: true, createdAt: true },
    take: 365,
  })

  const loggedDates = new Set<string>()
  for (const j of journals) {
    const match = j.title.match(/Daily Journal — (\d{4}-\d{2}-\d{2})/)
    if (match && match[1]) {
      loggedDates.add(match[1])
    } else {
      loggedDates.add(j.createdAt.toISOString().split("T")[0])
    }
  }

  // 3. Gather real workspace activity for the day
  const activity = await getDayActivityData(db, tenant.id, targetDate)

  return (
    <JournalView
      workspace={workspace}
      initialDate={targetDateStr}
      initialDoc={
        doc
          ? {
              id: doc.id,
              title: doc.title,
              content: doc.content,
              summary: doc.summary,
              updatedAt: doc.updatedAt.toISOString(),
            }
          : null
      }
      initialActivity={activity}
      initialLoggedDates={Array.from(loggedDates)}
    />
  )
}
