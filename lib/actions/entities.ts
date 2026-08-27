"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireWorkspace } from "@/lib/auth/dal"
import { createProject } from "@/lib/domain/projects"
import { createOrganization } from "@/lib/domain/organizations"
import { indexEntity } from "@/lib/search"

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  organizationId: z.string().optional(),
})

export async function createProjectAction(workspace: string, formData: FormData) {
  const { db, user, tenant } = await requireWorkspace(workspace)
  const raw = {
    name: String(formData.get("name") || ""),
    description: formData.get("description") ? String(formData.get("description")) : undefined,
    targetDate: formData.get("targetDate") ? String(formData.get("targetDate")) : undefined,
    organizationId: formData.get("organizationId") ? String(formData.get("organizationId")) : undefined,
  }

  const parsed = createProjectSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Validation failed" }
  }

  try {
    const project = await createProject(
      db,
      { userId: user.id, tenantId: tenant.id, actorType: "USER" },
      {
        name: parsed.data.name,
        description: parsed.data.description,
        organizationId: parsed.data.organizationId,
        dueAt: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
      }
    )

    revalidatePath(`/w/${workspace}/projects`)
    revalidatePath(`/w/${workspace}/today`)
    return { ok: true, project: { id: project.id, slug: project.slug } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create project" }
  }
}

const createClientSchema = z.object({
  name: z.string().min(1, "Client / Company name is required"),
  industry: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
})

export async function createClientAction(workspace: string, formData: FormData) {
  const { db, user, tenant } = await requireWorkspace(workspace)
  const raw = {
    name: String(formData.get("name") || ""),
    industry: formData.get("industry") ? String(formData.get("industry")) : undefined,
    email: formData.get("email") ? String(formData.get("email")) : undefined,
  }

  const parsed = createClientSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Validation failed" }
  }

  try {
    const organization = await createOrganization(
      db,
      { userId: user.id, tenantId: tenant.id, actorType: "USER" },
      {
        name: parsed.data.name,
        kind: "CLIENT",
        notes: parsed.data.industry ? `Industry: ${parsed.data.industry}` : undefined,
      }
    )

    revalidatePath(`/w/${workspace}/clients`)
    return { ok: true, client: { id: organization.id, slug: organization.slug } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create client" }
  }
}

const createNoteSchema = z.object({
  title: z.string().min(1, "Note title is required"),
  body: z.string().min(1, "Note body is required"),
  projectId: z.string().optional(),
})

export async function createNoteAction(workspace: string, formData: FormData) {
  const { db } = await requireWorkspace(workspace)
  const raw = {
    title: String(formData.get("title") || ""),
    body: String(formData.get("body") || ""),
    projectId: formData.get("projectId") ? String(formData.get("projectId")) : undefined,
  }

  const parsed = createNoteSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Validation failed" }
  }

  try {
    const note = await db.note.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        projectId: parsed.data.projectId || null,
      } as never,
    })

    await indexEntity(db, {
      entityType: "NOTE",
      entityId: note.id,
      title: note.title || "Untitled Note",
      body: note.body,
    })

    revalidatePath(`/w/${workspace}/notes`)
    return { ok: true, note: { id: note.id } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create note" }
  }
}

const createDocumentSchema = z.object({
  title: z.string().min(1, "Document title is required"),
  content: z.string().optional(),
  summary: z.string().optional(),
  fileId: z.string().optional(),
})

export async function createDocumentAction(workspace: string, formData: FormData) {
  const { db } = await requireWorkspace(workspace)
  const raw = {
    title: String(formData.get("title") || ""),
    content: formData.get("content") ? String(formData.get("content")) : undefined,
    summary: formData.get("summary") ? String(formData.get("summary")) : undefined,
    fileId: formData.get("fileId") ? String(formData.get("fileId")) : undefined,
  }

  const parsed = createDocumentSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Validation failed" }
  }

  try {
    const doc = await db.document.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content || null,
        summary: parsed.data.summary || null,
        fileId: parsed.data.fileId || null,
      } as never,
    })

    await indexEntity(db, {
      entityType: "DOCUMENT",
      entityId: doc.id,
      title: doc.title,
      body: doc.content || doc.summary || "",
    })

    revalidatePath(`/w/${workspace}/documents`)
    return { ok: true, document: { id: doc.id } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create document" }
  }
}

const createTransactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  direction: z.enum(["DEBIT", "CREDIT"]),
  category: z.string().optional(),
})

export async function createTransactionAction(workspace: string, formData: FormData) {
  const { db } = await requireWorkspace(workspace)
  const raw = {
    description: String(formData.get("description") || ""),
    amount: String(formData.get("amount") || ""),
    direction: String(formData.get("direction") || "DEBIT"),
    category: formData.get("category") ? String(formData.get("category")) : undefined,
  }

  const parsed = createTransactionSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Validation failed" }
  }

  try {
    const amountNum = parseFloat(parsed.data.amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return { ok: false, error: "Please enter a valid positive amount" }
    }

    const amountMinor = BigInt(Math.round(amountNum * 100))

    const tx = await db.transaction.create({
      data: {
        description: parsed.data.description,
        amountMinor,
        direction: parsed.data.direction,
        category: parsed.data.category || "OTHER",
        occurredAt: new Date(),
      } as never,
    })

    revalidatePath(`/w/${workspace}/finance`)
    revalidatePath(`/w/${workspace}/finance/transactions`)
    return { ok: true, transaction: { id: tx.id } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to record transaction" }
  }
}

const createCalendarEventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  projectId: z.string().optional(),
  allDay: z.boolean().optional(),
})

export async function createCalendarEventAction(workspace: string, formData: FormData) {
  const { db } = await requireWorkspace(workspace)
  const raw = {
    title: String(formData.get("title") || ""),
    startsAt: String(formData.get("startsAt") || ""),
    endsAt: String(formData.get("endsAt") || ""),
    location: formData.get("location") ? String(formData.get("location")) : undefined,
    projectId: formData.get("projectId") ? String(formData.get("projectId")) : undefined,
    allDay: formData.get("allDay") === "true",
  }

  const parsed = createCalendarEventSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Validation failed" }
  }

  try {
    const startsAt = new Date(parsed.data.startsAt)
    const endsAt = new Date(parsed.data.endsAt)

    const event = await db.calendarEvent.create({
      data: {
        title: parsed.data.title,
        startsAt,
        endsAt,
        location: parsed.data.location || null,
        projectId: parsed.data.projectId || null,
        allDay: parsed.data.allDay || false,
      } as never,
    })

    await indexEntity(db, {
      entityType: "CALENDAR_EVENT",
      entityId: event.id,
      title: event.title,
      body: event.location || "Calendar Commitment",
    })

    revalidatePath(`/w/${workspace}/calendar`)
    revalidatePath(`/w/${workspace}/today`)
    return { ok: true, event: { id: event.id } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create calendar event" }
  }
}

const createEmailSchema = z.object({
  toEmail: z.string().email("Valid recipient email is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  category: z.string().optional(),
})

export async function createEmailAction(workspace: string, formData: FormData) {
  const { db, user } = await requireWorkspace(workspace)
  const raw = {
    toEmail: String(formData.get("toEmail") || ""),
    subject: String(formData.get("subject") || ""),
    body: String(formData.get("body") || ""),
    category: formData.get("category") ? String(formData.get("category")) : undefined,
  }

  const parsed = createEmailSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Validation failed" }
  }

  try {
    const email = await db.emailMessage.create({
      data: {
        externalId: `outbox-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        toEmails: [parsed.data.toEmail],
        fromEmail: user.email,
        fromName: user.name || "Personal OS",
        subject: parsed.data.subject,
        body: parsed.data.body,
        snippet: parsed.data.body.slice(0, 120),
        category: parsed.data.category || "CLIENT_COMMS",
        receivedAt: new Date(),
        isRead: true,
      } as never,
    })

    await indexEntity(db, {
      entityType: "EMAIL",
      entityId: email.id,
      title: email.subject || "Untitled Email",
      body: email.body || email.snippet || "",
    })

    revalidatePath(`/w/${workspace}/email`)
    revalidatePath(`/w/${workspace}/inbox`)
    return { ok: true, email: { id: email.id } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to record email message" }
  }
}
