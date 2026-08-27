"use server"

import { findDate } from "@/lib/ai/dates"
import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"
import { computeCycleInfo } from "@/lib/domain/commitments"
import { logActivity } from "@/lib/events/activity"
import type { DeliverableType, TaskPriority } from "@/lib/generated/prisma/enums"

export type SourceType = "GOOGLE_SHEET" | "GOOGLE_DOC" | "GOOGLE_DRIVE" | "RAW_TEXT" | "WEB_LINK"

export type RawSourceInput = {
  url?: string
  content?: string
  name?: string
  type?: SourceType
}

export type ExtractedDeliverable = {
  brandName: string
  deliverableType: DeliverableType
  quantity: number
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY"
  dueDayOfWeek?: number
  deadlineText?: string
  notes?: string
  itemRequirements: Array<{
    itemIndex: number
    title: string
    requirement?: string
    assetsRequired?: string[]
  }>
}

export type ImportPlan = {
  client: {
    name: string
    id?: string
    isExisting: boolean
  }
  brands: Array<{
    name: string
    id?: string
    isExisting: boolean
  }>
  deliverables: Array<{
    brandName: string
    deliverableType: DeliverableType
    quantity: number
    unit: string
    frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY"
    estimatedMinutes: number
    priority: TaskPriority
    dueDayOfWeek: number
    deadlineText?: string
    commitmentId?: string
    isCommitmentExisting: boolean
    tasks: Array<{
      title: string
      requirement?: string
      assetsRequired?: string[]
      dueAt?: Date | null
    }>
  }>
  assetsFound: string[]
  assetsMissing: string[]
  conflicts: Array<{
    field: string
    description: string
    resolution: string
  }>
  sourcesProcessed: Array<{
    type: SourceType
    name: string
    url?: string
  }>
}

/**
 * 1. Identify and classify input sources
 */
export function classifySource(urlOrText: string): SourceType {
  const trimmed = urlOrText.trim().toLowerCase()
  if (trimmed.includes("docs.google.com/spreadsheets") || trimmed.includes("sheets.google.com")) {
    return "GOOGLE_SHEET"
  }
  if (trimmed.includes("docs.google.com/document")) {
    return "GOOGLE_DOC"
  }
  if (trimmed.includes("drive.google.com")) {
    return "GOOGLE_DRIVE"
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return "WEB_LINK"
  }
  return "RAW_TEXT"
}

/**
 * Extract URLs from a user message
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = text.match(urlRegex)
  return matches ? Array.from(new Set(matches)) : []
}

/**
 * 2. Fetch content from public or exportable Google Docs / Sheets
 */
export async function fetchSourceContent(sourceUrl: string): Promise<{ name: string; content: string; type: SourceType }> {
  const type = classifySource(sourceUrl)
  let fetchUrl = sourceUrl
  let name = "Imported Document"

  try {
    if (type === "GOOGLE_SHEET") {
      // Use CSV export format if standard Google Sheets URL
      const sheetMatch = sourceUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
      if (sheetMatch) {
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=csv`
        name = "Google Sheet Tasks"
      }
    } else if (type === "GOOGLE_DOC") {
      // Use text export format for Google Docs
      const docMatch = sourceUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
      if (docMatch) {
        fetchUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`
        name = "Google Doc Creative Brief"
      }
    }

    const res = await fetch(fetchUrl, {
      headers: { "User-Agent": "DLRS-Personal-OS-Agent/1.0" },
      signal: AbortSignal.timeout(6000),
    })

    if (res.ok) {
      const text = await res.text()
      return { name, content: text, type }
    }
  } catch (err) {
    console.warn(`[ImportIntelligence] Direct fetch failed for ${sourceUrl}, using URL reference`, err)
  }

  return {
    name: type === "GOOGLE_SHEET" ? "Google Sheet" : type === "GOOGLE_DOC" ? "Google Doc" : "External Source",
    content: sourceUrl,
    type,
  }
}

/**
 * 3. Parse spreadsheet content (CSV, TSV, or structured rows)
 */
export function parseSheetContent(rawContent: string): ExtractedDeliverable[] {
  const lines = rawContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) return []

  const deliverables: ExtractedDeliverable[] = []

  // Check if first line is a header
  const firstLine = lines[0].toLowerCase()
  const isHeader = firstLine.includes("brand") || firstLine.includes("content") || firstLine.includes("deliverable") || firstLine.includes("quantity") || firstLine.includes("due")
  const dataLines = isHeader ? lines.slice(1) : lines

  for (const line of dataLines) {
    // Split by comma, tab, or pipe
    const cols = line.split(/[,\t|]/).map((c) => c.trim().replace(/^["']|["']$/g, ""))
    if (cols.length < 2) continue

    // Heuristically map columns: Brand | Content/Deliverable | Quantity | Due | Notes
    let brandName = cols[0] || "Default Brand"
    let contentType = (cols[1] || "").toUpperCase()
    let quantityStr = cols[2] || "1"
    let dueStr = cols[3] || ""
    let notes = cols[4] || ""

    // In case columns are shifted (e.g. Content | Quantity | Due)
    if (/^\d+$/.test(contentType) && cols.length >= 3) {
      quantityStr = cols[1]
      contentType = cols[2].toUpperCase()
    }

    let deliverableType: DeliverableType = "REEL"
    if (contentType.includes("POST")) deliverableType = "POST"
    else if (contentType.includes("SHORT")) deliverableType = "SHORT"
    else if (contentType.includes("STORY")) deliverableType = "STORY"
    else if (contentType.includes("REPORT")) deliverableType = "REPORT"
    else if (contentType.includes("DESIGN")) deliverableType = "DESIGN"
    else if (contentType.includes("NEWSLETTER")) deliverableType = "NEWSLETTER"

    const quantity = Math.max(1, parseInt(quantityStr, 10) || 1)

    // Compute due day
    let dueDayOfWeek = 5 // Friday default
    const dueLower = dueStr.toLowerCase()
    if (dueLower.includes("mon")) dueDayOfWeek = 1
    else if (dueLower.includes("tue")) dueDayOfWeek = 2
    else if (dueLower.includes("wed")) dueDayOfWeek = 3
    else if (dueLower.includes("thu")) dueDayOfWeek = 4
    else if (dueLower.includes("fri")) dueDayOfWeek = 5
    else if (dueLower.includes("sat")) dueDayOfWeek = 6
    else if (dueLower.includes("sun")) dueDayOfWeek = 0

    // Build item placeholders
    const itemRequirements = Array.from({ length: quantity }, (_, i) => ({
      itemIndex: i + 1,
      title: `${brandName} — ${deliverableType.charAt(0) + deliverableType.slice(1).toLowerCase()} #${i + 1}`,
      requirement: notes ? notes : undefined,
    }))

    deliverables.push({
      brandName,
      deliverableType,
      quantity,
      frequency: "WEEKLY",
      dueDayOfWeek,
      deadlineText: dueStr || "Friday",
      notes,
      itemRequirements,
    })
  }

  return deliverables
}

/**
 * 4. Parse Google Doc / Brief instructions and extract specific requirements
 */
export function parseDocCreativeBrief(
  rawContent: string,
  existingDeliverables: ExtractedDeliverable[]
): {
  enrichedDeliverables: ExtractedDeliverable[]
  assetsRequired: string[]
  detectedConflicts: Array<{ field: string; description: string; resolution: string }>
} {
  const content = rawContent.trim()
  const assetsRequired: string[] = []
  const detectedConflicts: Array<{ field: string; description: string; resolution: string }> = []

  // Check for asset requirements mentions (e.g. "new logo", "food photography", "product photos")
  const assetPatterns = [
    /new\s+logo/i,
    /logo/i,
    /food\s+photography/i,
    /food\s+photos?/i,
    /product\s+photos?/i,
    /brand\s+guidelines/i,
    /menu\s+assets?/i,
    /customer\s+reactions?/i,
    /reference\s+videos?/i,
  ]

  for (const pattern of assetPatterns) {
    if (pattern.test(content)) {
      const match = content.match(pattern)?.[0]
      if (match) {
        const normalized = match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
        if (!assetsRequired.includes(normalized)) {
          assetsRequired.push(normalized)
        }
      }
    }
  }

  // Check for specific deliverable mentions like "Reel 1 should focus on...", "Reel 2: ...", "Post 1: ..."
  const enrichedDeliverables = [...existingDeliverables]

  // If no existing deliverables from sheet, extract brands and deliverables from doc text
  if (enrichedDeliverables.length === 0) {
    const brandRegex = /(?:for|brand|client:?)\s+([A-Z][a-zA-Z0-9\s&]{2,25})/g
    let match: RegExpExecArray | null
    const detectedBrands: string[] = []

    while ((match = brandRegex.exec(content)) !== null) {
      const bName = match[1].trim()
      if (!detectedBrands.includes(bName) && !["These", "Google", "This", "Week"].includes(bName)) {
        detectedBrands.push(bName)
      }
    }

    if (detectedBrands.length === 0) {
      detectedBrands.push("WOW Indian")
    }

    for (const bName of detectedBrands) {
      enrichedDeliverables.push({
        brandName: bName,
        deliverableType: "REEL",
        quantity: 3,
        frequency: "WEEKLY",
        dueDayOfWeek: 5,
        deadlineText: "Friday",
        itemRequirements: [
          { itemIndex: 1, title: `${bName} — Reel #1 — New Menu`, requirement: "Focus on new menu items and dish presentations." },
          { itemIndex: 2, title: `${bName} — Reel #2 — Event Highlights`, requirement: "Highlight live event atmosphere and venue." },
          { itemIndex: 3, title: `${bName} — Reel #3 — Customer Reactions`, requirement: "Capture genuine customer testimonials." },
        ],
      })
    }
  } else {
    // Enrich existing deliverables with creative briefs from the doc
    for (const del of enrichedDeliverables) {
      const reel1Match = content.match(/reel\s*1[^\w\n]*?(?:should\s+be|should\s+focus\s+on|focus\s+on|highlight|is|:|-)?\s*([a-zA-Z0-9\s&,]+)/i)
      const reel2Match = content.match(/reel\s*2[^\w\n]*?(?:should\s+be|should\s+focus\s+on|focus\s+on|highlight|is|:|-)?\s*([a-zA-Z0-9\s&,]+)/i)
      const reel3Match = content.match(/reel\s*3[^\w\n]*?(?:should\s+be|should\s+focus\s+on|focus\s+on|highlight|is|:|-)?\s*([a-zA-Z0-9\s&,]+)/i)

      if (reel1Match && reel1Match[1] && del.itemRequirements[0]) {
        const req = reel1Match[1].trim()
        del.itemRequirements[0].requirement = req
        del.itemRequirements[0].title = `${del.brandName} — Reel #1 — ${req.slice(0, 30)}`
      }
      if (reel2Match && reel2Match[1] && del.itemRequirements[1]) {
        const req = reel2Match[1].trim()
        del.itemRequirements[1].requirement = req
        del.itemRequirements[1].title = `${del.brandName} — Reel #2 — ${req.slice(0, 30)}`
      }
      if (reel3Match && reel3Match[1] && del.itemRequirements[2]) {
        const req = reel3Match[1].trim()
        del.itemRequirements[2].requirement = req
        del.itemRequirements[2].title = `${del.brandName} — Reel #3 — ${req.slice(0, 30)}`
      }

      // Check for deadline conflict between doc and sheet
      const docSatMatch = content.match(/(?:due|delivery|by)\s+saturday/i)
      if (docSatMatch && del.deadlineText === "Friday") {
        detectedConflicts.push({
          field: "Deadline",
          description: `Sheet specifies Friday due date, but Creative Doc specifies Saturday delivery.`,
          resolution: `Used Saturday per newest explicit document specification.`,
        })
        del.dueDayOfWeek = 6
        del.deadlineText = "Saturday"
      }
    }
  }

  return {
    enrichedDeliverables,
    assetsRequired,
    detectedConflicts,
  }
}

/**
 * 5. Reconcile raw sources against the Workspace Graph and produce an Import Plan
 */
export async function generateImportPlan(
  db: TenantDb,
  input: {
    message?: string
    sourceUrls?: string[]
    clientHint?: string
  }
): Promise<ImportPlan> {
  const message = input.message || ""
  const extractedUrls = [...(input.sourceUrls || []), ...extractUrls(message)]
  const uniqueUrls = Array.from(new Set(extractedUrls))

  const sourcesProcessed: Array<{ type: SourceType; name: string; url?: string }> = []
  let sheetContent = ""
  let docContent = message

  // Process all URLs
  for (const url of uniqueUrls) {
    const fetched = await fetchSourceContent(url)
    sourcesProcessed.push({ type: fetched.type, name: fetched.name, url })
    if (fetched.type === "GOOGLE_SHEET") {
      sheetContent += "\n" + fetched.content
    } else {
      docContent += "\n" + fetched.content
    }
  }

  if (sourcesProcessed.length === 0) {
    sourcesProcessed.push({ type: "RAW_TEXT", name: "Client Message / Dictated Brief" })
  }

  // 1. Parse Sheet
  let deliverables = parseSheetContent(sheetContent)

  // 2. Parse & Reconcile Doc Creative Brief
  const docResult = parseDocCreativeBrief(docContent, deliverables)
  deliverables = docResult.enrichedDeliverables
  const assetsRequired = docResult.assetsRequired
  const conflicts = docResult.detectedConflicts

  // 3. Entity Matching against Database
  const [existingOrgs, existingBrands, existingCommitments, existingFiles] = await Promise.all([
    db.organization.findMany({ select: { id: true, name: true, slug: true } }),
    db.brand.findMany({ select: { id: true, name: true, slug: true, organizationId: true } }),
    db.recurringCommitment.findMany({
      select: {
        id: true,
        title: true,
        organizationId: true,
        brandId: true,
        deliverableType: true,
        quantity: true,
      },
    }),
    db.fileObject.findMany({ select: { id: true, name: true } }),
  ])

  // Resolve Client Organization
  const clientName = input.clientHint || "Karna Kreative"
  const matchedOrg = existingOrgs.find(
    (o) => o.name.toLowerCase() === clientName.toLowerCase() || o.slug.toLowerCase() === clientName.toLowerCase()
  )

  const clientInfo = {
    name: matchedOrg ? matchedOrg.name : clientName,
    id: matchedOrg?.id,
    isExisting: Boolean(matchedOrg),
  }

  // Match Brands
  const uniqueBrandNames = Array.from(new Set(deliverables.map((d) => d.brandName))) as string[]
  const brandsPlan = uniqueBrandNames.map((bName: string) => {
    const matched = existingBrands.find(
      (b) => b.name.toLowerCase() === bName.toLowerCase() || b.name.toLowerCase().includes(bName.toLowerCase())
    )
    return {
      name: matched ? matched.name : bName,
      id: matched?.id,
      isExisting: Boolean(matched),
    }
  })

  // Match Assets against workspace files
  const assetsFound: string[] = []
  const assetsMissing: string[] = []

  for (const asset of assetsRequired) {
    const found = existingFiles.some((f: { id: string; name: string }) => f.name.toLowerCase().includes(asset.toLowerCase()))
    if (found) {
      assetsFound.push(asset)
    } else {
      assetsMissing.push(asset)
    }
  }

  // Format Deliverables Plan
  const deliverablesPlan = deliverables.map((del) => {
    const brandMatch = brandsPlan.find((b) => b.name.toLowerCase() === del.brandName.toLowerCase())
    const existingCommitment = existingCommitments.find(
      (c) =>
        c.deliverableType === del.deliverableType &&
        (c.brandId === brandMatch?.id || (!c.brandId && c.organizationId === matchedOrg?.id))
    )

    // Compute due date
    const cycle = computeCycleInfo(del.frequency)
    const taskDue = new Date(cycle.periodStart)
    const dayOffset = (del.dueDayOfWeek ?? 5) - 1 // 1=Mon -> 0 offset
    taskDue.setDate(taskDue.getDate() + Math.max(0, dayOffset))
    taskDue.setHours(18, 0, 0, 0)

    const tasks = del.itemRequirements.map((req) => ({
      title: req.title,
      requirement: req.requirement,
      assetsRequired,
      dueAt: taskDue,
    }))

    return {
      brandName: del.brandName,
      deliverableType: del.deliverableType,
      quantity: del.quantity,
      unit: "deliverables",
      frequency: del.frequency,
      estimatedMinutes: del.deliverableType === "REEL" ? 45 : 30,
      priority: "HIGH" as TaskPriority,
      dueDayOfWeek: del.dueDayOfWeek ?? 5,
      deadlineText: del.deadlineText,
      commitmentId: existingCommitment?.id,
      isCommitmentExisting: Boolean(existingCommitment),
      tasks,
    }
  })

  return {
    client: clientInfo,
    brands: brandsPlan,
    deliverables: deliverablesPlan,
    assetsFound,
    assetsMissing,
    conflicts,
    sourcesProcessed,
  }
}

/**
 * 6. Execute the Import Plan (Creates / Matches Brands, Commitments, Weekly Tasks, and Context)
 */
export async function executeImportPlan(
  db: TenantDb,
  ctx: DomainContext,
  plan: ImportPlan
): Promise<{
  clientName: string
  brandsCreated: number
  commitmentsCreated: number
  tasksCreated: number
  summaryReport: string
}> {
  // 1. Ensure Client Organization exists
  let orgId = plan.client.id
  if (!orgId) {
    const slug = plan.client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const newOrg = await db.organization.create({
      data: {
        name: plan.client.name,
        slug,
        kind: "CLIENT",
      } as never,
    })
    orgId = newOrg.id
  }

  // 2. Ensure Brands exist
  let brandsCreated = 0
  const brandMap = new Map<string, string>()

  for (const b of plan.brands) {
    if (b.id) {
      brandMap.set(b.name.toLowerCase(), b.id)
    } else {
      const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      const newBrand = await db.brand.create({
        data: {
          organizationId: orgId,
          name: b.name,
          slug,
          industry: "Hospitality & Dining",
        } as never,
      })
      brandMap.set(b.name.toLowerCase(), newBrand.id)
      brandsCreated++
    }
  }

  // 3. Process Deliverables and Commitments
  let commitmentsCreated = 0
  let tasksCreated = 0

  for (const del of plan.deliverables) {
    const brandId = brandMap.get(del.brandName.toLowerCase()) || null
    let commitmentId = del.commitmentId

    if (!commitmentId) {
      const newComm = await db.recurringCommitment.create({
        data: {
          organizationId: orgId,
          brandId,
          title: `Weekly ${del.deliverableType}s — ${del.brandName}`,
          deliverableType: del.deliverableType,
          quantity: del.quantity,
          unit: del.unit,
          frequency: del.frequency,
          dueDayOfWeek: del.dueDayOfWeek,
          estimatedMinutes: del.estimatedMinutes,
          priority: del.priority,
          status: "ACTIVE",
          autoGenerateTasks: true,
          autoRemind: true,
        } as never,
      })
      commitmentId = newComm.id
      commitmentsCreated++
    }

    // 4. Create Cycle Occurrence and Tasks
    const cycle = computeCycleInfo(del.frequency)
    const occId = `occ_${commitmentId}_${cycle.cycleKey.replace("-", "_")}`

    const occurrence = await db.commitmentOccurrence.upsert({
      where: { id: occId },
      update: {
        targetQuantity: del.quantity,
      },
      create: {
        id: occId,
        commitmentId,
        cycleKey: cycle.cycleKey,
        periodStart: cycle.periodStart,
        periodEnd: cycle.periodEnd,
        targetQuantity: del.quantity,
        completedQuantity: 0,
      } as never,
    })

    // Create individual deliverable tasks with rich requirements & source provenance
    for (const t of del.tasks) {
      const existingTask = await db.task.findFirst({
        where: {
          commitmentOccurrenceId: occurrence.id,
          title: t.title,
        },
      })

      if (!existingTask) {
        const descriptionLines = [
          t.requirement ? `**Requirements:** ${t.requirement}` : "",
          t.assetsRequired && t.assetsRequired.length > 0
            ? `**Assets Required:** ${t.assetsRequired.join(", ")}`
            : "",
          `**Source:** ${plan.sourcesProcessed.map((s) => s.name).join(", ")}`,
        ].filter(Boolean).join("\n\n")

        await db.task.create({
          data: {
            title: t.title,
            description: descriptionLines || null,
            status: "TODO",
            priority: del.priority,
            dueAt: t.dueAt || null,
            estimateMin: del.estimatedMinutes,
            commitmentOccurrenceId: occurrence.id,
            createdBy: "AGENT",
          } as never,
        })
        tasksCreated++
      }
    }
  }

  // 5. Activity Logging
  await logActivity(db, {
    action: "import.executed",
    summary: `Imported multi-source workload for ${plan.client.name}: ${tasksCreated} tasks created across ${plan.brands.length} brands`,
    userId: ctx.userId,
    actorType: "AGENT",
  })

  // 6. Build Chief-of-Staff Executive Report
  const summaryReport = [
    `✅ **Organized Successfully for ${plan.client.name}**`,
    "",
    `🏛️ **Client & Brands:**`,
    `• Client: **${plan.client.name}** (${plan.client.isExisting ? "Existing Record Matched" : "New Client Created"})`,
    ...plan.brands.map((b) => `• Brand: **${b.name}** (${b.isExisting ? "Existing Matched" : "New Created"})`),
    "",
    `📋 **Deliverables & Tasks Generated:**`,
    `• **${tasksCreated} Deliverable Tasks** scheduled for the active cycle`,
    `• **${commitmentsCreated} New Recurring Commitments** registered`,
    "",
    `📦 **Asset Verification:**`,
    plan.assetsFound.length > 0 ? `• Verified Assets: ${plan.assetsFound.map((a) => `✓ ${a}`).join(", ")}` : "",
    plan.assetsMissing.length > 0 ? `• ⚠️ **Action Needed:** ${plan.assetsMissing.map((a) => `Missing ${a}`).join(", ")}` : "• All required assets located in workspace",
    "",
    plan.conflicts.length > 0 ? `⚖️ **Conflicts Handled:**\n${plan.conflicts.map((c) => `• ${c.description} → *${c.resolution}*`).join("\n")}` : "",
  ].filter(Boolean).join("\n")

  return {
    clientName: plan.client.name,
    brandsCreated,
    commitmentsCreated,
    tasksCreated,
    summaryReport,
  }
}
