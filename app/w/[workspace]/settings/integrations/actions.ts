"use server"

import { requireWorkspace } from "@/lib/auth/dal"
import { enqueue } from "@/lib/jobs/queue"

export async function syncNow(workspace: string) {
  const { db, tenant } = await requireWorkspace(workspace)

  const integration = await db.integration.findUnique({
    where: { tenantId_provider: { tenantId: tenant.id, provider: "GMAIL" } },
  })
  if (!integration) throw new Error("Gmail is not connected yet.")

  await enqueue(db, "email.sync", { integrationId: integration.id })

  // No standing worker in the self-hosted single-user setup: run the queue now
  // so the user sees results immediately (PRD §34 — workers execute jobs).
  const { drain } = await import("@/lib/jobs/runner")
  await drain(2)
}

export async function disconnectGmail(workspace: string) {
  const { db, tenant } = await requireWorkspace(workspace)

  await db.integration.updateMany({
    where: { tenantId: tenant.id, provider: "GMAIL" },
    data: { status: "DISCONNECTED", secretCipher: null },
  })
}

export async function disconnectDrive(workspace: string) {
  const { db, tenant } = await requireWorkspace(workspace)

  await db.integration.updateMany({
    where: { tenantId: tenant.id, provider: "GOOGLE_DRIVE" },
    data: { status: "DISCONNECTED", secretCipher: null },
  })
}

export async function disconnectCalendar(workspace: string) {
  const { db, tenant } = await requireWorkspace(workspace)

  await db.integration.updateMany({
    where: { tenantId: tenant.id, provider: "GOOGLE_CALENDAR" },
    data: { status: "DISCONNECTED", secretCipher: null },
  })
}
