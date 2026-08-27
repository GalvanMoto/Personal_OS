/**
 * File capture against a real database and a temporary storage root.
 * Run with: npm run test:db
 */
import "dotenv/config"

import assert from "node:assert/strict"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { after, before, describe, it } from "node:test"

import { prisma } from "@/lib/db/client"
import { tenantDb, type TenantDb } from "@/lib/db/tenant"
import {
  captureFile,
  deleteStoredFile,
  inboxKindFor,
  readStoredFile,
  storeUpload,
} from "@/lib/domain/files"
import { search } from "@/lib/search"
import { setStorage } from "@/lib/storage"
import { localStorage } from "@/lib/storage/local"

let tenantId: string
let otherId: string
let db: TenantDb
const ctx = () => ({ tenantId })

before(async () => {
  const root = await mkdtemp(join(tmpdir(), "personal-os-files-"))
  setStorage(localStorage(root))

  const stamp = Date.now()
  const tenant = await prisma.tenant.create({
    data: { slug: `files-${stamp}`, name: "Files Test" },
  })
  const other = await prisma.tenant.create({
    data: { slug: `files-other-${stamp}`, name: "Other" },
  })

  tenantId = tenant.id
  otherId = other.id
  db = tenantDb(tenantId)
})

after(async () => {
  setStorage(null)
  await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, otherId] } } })
  await prisma.$disconnect()
})

describe("inbox kind detection", () => {
  it("distinguishes a screenshot from a plain image", () => {
    assert.equal(inboxKindFor("image/png", "Screenshot 2026-08-26.png"), "SCREENSHOT")
    assert.equal(inboxKindFor("image/png", "logo.png"), "IMAGE")
  })

  it("maps the rest by mime type", () => {
    assert.equal(inboxKindFor("application/pdf", "brief.pdf"), "PDF")
    assert.equal(inboxKindFor("text/plain", "notes.txt"), "DOCUMENT")
    assert.equal(inboxKindFor("audio/mpeg", "voice.mp3"), "VOICE")
    assert.equal(inboxKindFor("application/zip", "assets.zip"), "FILE")
  })
})

describe("uploads", () => {
  it("captures a readable file and pulls its text out", async () => {
    const { item, file, extracted } = await captureFile(db, ctx(), {
      name: "brief.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("Make 2 reels for GB Banquet by Friday"),
    })

    assert.equal(extracted, true)
    assert.equal(item.kind, "DOCUMENT")
    assert.match(item.extractedText ?? "", /GB Banquet/)
    assert.equal(file.inboxItemId, item.id)
    assert.ok(file.storageKey.startsWith(`${tenantId}/`))
  })

  it("stores an unreadable file and says why it was not read", async () => {
    const { item, extracted } = await captureFile(db, ctx(), {
      name: "scan.pdf",
      mimeType: "application/pdf",
      bytes: Buffer.from("%PDF-1.7 binary"),
    })

    assert.equal(extracted, false)
    assert.equal(item.status, "NEEDS_REVIEW")
    assert.match(item.error ?? "", /(?:not connected yet|Could not read that PDF|Invalid PDF)/)
  })

  it("makes an uploaded document searchable by its contents", async () => {
    await captureFile(db, ctx(), {
      name: "requirements.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("The kickoff needs a hydroplane sequence"),
    })

    const hits = await search(tenantId, "hydroplane")
    assert.ok(hits.length > 0)
  })

  it("dedupes identical bytes instead of storing them twice", async () => {
    const bytes = Buffer.from("exactly the same content")

    const first = await storeUpload(db, ctx(), {
      name: "a.txt",
      mimeType: "text/plain",
      bytes,
    })
    const second = await storeUpload(db, ctx(), {
      name: "b.txt",
      mimeType: "text/plain",
      bytes,
    })

    assert.equal(second.id, first.id, "the same bytes should reuse the row")
  })

  it("refuses an empty file", async () => {
    await assert.rejects(
      () =>
        storeUpload(db, ctx(), {
          name: "empty.txt",
          mimeType: "text/plain",
          bytes: Buffer.alloc(0),
        }),
      /empty/i
    )
  })

  it("refuses a file over the size cap", async () => {
    await assert.rejects(
      () =>
        storeUpload(db, ctx(), {
          name: "huge.bin",
          mimeType: "application/octet-stream",
          bytes: Buffer.alloc(26 * 1024 * 1024),
        }),
      /under \d+ MB/
    )
  })
})

describe("reading files back", () => {
  it("returns the stored bytes", async () => {
    const { file } = await captureFile(db, ctx(), {
      name: "readme.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("round trip"),
    })

    const found = await readStoredFile(db, tenantId, file.id)
    assert.ok(found)
    assert.equal(found.bytes.toString(), "round trip")
  })

  it("refuses to serve a file whose key belongs to another workspace", async () => {
    const { file } = await captureFile(db, ctx(), {
      name: "private.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("not yours"),
    })

    // The row is reachable, but the key check is the last line of defence.
    await assert.rejects(
      () => readStoredFile(db, otherId, file.id),
      /does not belong to this workspace/
    )
  })

  it("returns null for an unknown id rather than throwing", async () => {
    assert.equal(await readStoredFile(db, tenantId, "does-not-exist"), null)
  })
})

describe("deleting files", () => {
  it("removes the row, the object and the index entry", async () => {
    const { file } = await captureFile(db, ctx(), {
      name: "temporary.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("a fleeting xylophone reference"),
    })

    assert.ok((await search(tenantId, "xylophone")).length > 0)

    assert.equal(await deleteStoredFile(db, ctx(), file.id), true)

    assert.equal(await db.fileObject.count({ where: { id: file.id } }), 0)
    assert.equal(
      (await search(tenantId, "xylophone")).length,
      0,
      "a deleted file must leave the index"
    )
  })

  it("reports when there was nothing to delete", async () => {
    assert.equal(await deleteStoredFile(db, ctx(), "nope"), false)
  })
})
