import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { tenantDb } from "@/lib/db/tenant"
import { capture } from "@/lib/domain/inbox"
import { storeUpload } from "@/lib/domain/files"

/**
 * Direct Ingestion Webhook (PRD §6).
 *
 * Allows external automation (e.g. shortcuts, webhooks, voice capture)
 * to push raw text, links, or attachments directly into the tenant's Universal Inbox.
 */
export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.WEBHOOK_SECRET
    if (!expectedSecret) {
      return NextResponse.json({ error: "WEBHOOK_SECRET is not configured." }, { status: 503 })
    }
    const authHeader = req.headers.get("authorization")
    const customHeader = req.headers.get("x-webhook-token")
    const token = authHeader?.replace(/^Bearer\s+/i, "") || customHeader
    if (!token || token !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized webhook token." }, { status: 401 })
    }

    const body = await req.json()
    const workspaceSlug = body.workspace || "studio"
    const source = body.source || "WEBHOOK"

    // Find the workspace tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: workspaceSlug },
    })

    if (!tenant) {
      return NextResponse.json({ error: `Workspace '${workspaceSlug}' not found.` }, { status: 404 })
    }

    const db = tenantDb(tenant.id)
    const ctx = { tenantId: tenant.id, actor: "SYSTEM" as const }

    if (body.text) {
      const item = await capture(db, ctx, {
        rawText: String(body.text),
        title: body.title || String(body.text).slice(0, 80),
        sourceType: "USER_INPUT",
        sourceRef: `Webhook (${source})`,
      })

      return NextResponse.json({
        success: true,
        inboxItemId: item.id,
        message: "Captured into Universal Inbox and queued for extraction.",
      })
    }

    if (body.attachment && body.attachment.dataBase64) {
      const buffer = Buffer.from(body.attachment.dataBase64, "base64")
      const item = await capture(db, ctx, {
        rawText: body.text || body.attachment.name || "Attachment via webhook",
        title: body.attachment.name || "Attachment",
        sourceType: "USER_INPUT",
        sourceRef: `Webhook (${source})`,
      })

      await storeUpload(db, ctx, {
        name: body.attachment.name || "webhook_attachment.bin",
        mimeType: body.attachment.mimeType || "application/octet-stream",
        bytes: buffer,
        inboxItemId: item.id,
      })

      return NextResponse.json({
        success: true,
        inboxItemId: item.id,
        message: "Captured file attachment into Universal Inbox.",
      })
    }

    return NextResponse.json({ error: "No 'text' or 'attachment' provided in body." }, { status: 400 })
  } catch (error) {
    console.error("Webhook Ingest Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
