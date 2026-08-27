import assert from "node:assert/strict"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { canExtract, extractText, isTextual } from "@/lib/ai/extract-text"
import {
  assertSafeKey,
  buildKey,
  keyBelongsTo,
  safeFileName,
} from "@/lib/storage/keys"
import { localStorage } from "@/lib/storage/local"

describe("storage keys", () => {
  it("strips directory components from a filename", () => {
    assert.equal(safeFileName("../../etc/passwd"), "passwd")
    assert.equal(safeFileName("C:\\Windows\\system32\\evil.dll"), "evil.dll")
  })

  it("never produces a name that starts with a dot", () => {
    assert.ok(!safeFileName("...hidden").startsWith("."))
    assert.ok(!safeFileName(".env").startsWith("."))
  })

  it("always yields a usable name", () => {
    assert.ok(safeFileName("").length > 0)
    assert.ok(safeFileName("///").length > 0)
    assert.ok(safeFileName("😀😀😀").length > 0)
  })

  it("prefixes keys with the tenant", () => {
    const key = buildKey("tenant-abc", "brief.pdf")
    assert.ok(key.startsWith("tenant-abc/"))
    assert.ok(key.endsWith("-brief.pdf"))
  })

  it("recognises which tenant a key belongs to", () => {
    const key = buildKey("tenant-abc", "x.txt")
    assert.equal(keyBelongsTo(key, "tenant-abc"), true)
    assert.equal(keyBelongsTo(key, "tenant-xyz"), false)
    // A prefix that merely starts the same must not pass.
    assert.equal(keyBelongsTo("tenant-abcdef/f.txt", "tenant-abc"), false)
  })

  it("rejects keys that try to escape", () => {
    for (const bad of ["../secret", "a/../../b", "/etc/passwd", "a\0b", ""]) {
      assert.throws(() => assertSafeKey(bad), /Unsafe storage key/, `allowed: ${bad}`)
    }
  })
})

describe("local storage adapter", () => {
  async function withRoot() {
    const root = await mkdtemp(join(tmpdir(), "personal-os-storage-"))
    return { root, store: localStorage(root) }
  }

  it("round-trips a file", async () => {
    const { store } = await withRoot()
    const data = Buffer.from("hello brief")

    const stored = await store.put("t1/2026/08/a.txt", data, "text/plain")
    assert.equal(stored.size, data.byteLength)
    assert.match(stored.checksum, /^[0-9a-f]{64}$/)

    assert.equal((await store.get("t1/2026/08/a.txt")).toString(), "hello brief")
  })

  it("reports existence and deletes", async () => {
    const { store } = await withRoot()
    await store.put("t1/x.txt", Buffer.from("x"), "text/plain")

    assert.equal(await store.exists("t1/x.txt"), true)
    await store.delete("t1/x.txt")
    assert.equal(await store.exists("t1/x.txt"), false)
  })

  it("refuses to delete a file that was never there", async () => {
    const { store } = await withRoot()
    await store.delete("t1/missing.txt")
  })

  it("cannot be walked out of its root", async () => {
    const { root, store } = await withRoot()
    const secret = join(root, "..", "personal-os-secret.txt")
    await writeFile(secret, "top secret")

    await assert.rejects(
      () => store.get("../personal-os-secret.txt"),
      /Unsafe storage key/
    )
    await assert.rejects(
      () => store.put("../escaped.txt", Buffer.from("x"), "text/plain"),
      /Unsafe storage key/
    )

    // The file outside the root is untouched.
    assert.equal((await readFile(secret)).toString(), "top secret")
  })
})

describe("text extraction", () => {
  it("reads textual formats", async () => {
    assert.ok(canExtract("text/plain"))
    assert.ok(canExtract("application/json"))

    const outcome = await extractText(Buffer.from("client wants 3 reels"), "text/plain")
    assert.equal(outcome.supported, true)
    assert.match(outcome.supported ? outcome.text : "", /3 reels/)
  })

  it("says plainly when it cannot read a format", async () => {
    for (const type of ["video/mp4", "application/zip"]) {
      const outcome = await extractText(Buffer.from([0]), type)
      assert.equal(outcome.supported, false)
      assert.ok(
        !outcome.supported && outcome.reason.length > 0,
        "an unreadable file must explain itself"
      )
    }
  })

  it("pulls text out of a real PDF without a model", async () => {
    const pdf = await readFile("tests/fixtures/brief.pdf")
    const outcome = await extractText(pdf, "application/pdf")

    assert.equal(outcome.supported, true)
    assert.equal(outcome.supported && outcome.via, "pdf")
    assert.match(outcome.supported ? outcome.text : "", /GB Banquet/)
  })

  it("explains a PDF with no text layer instead of returning nothing", async () => {
    // Header only, no page content — stands in for a scan.
    const outcome = await extractText(Buffer.from("%PDF-1.4\n%%EOF\n"), "application/pdf")

    assert.equal(outcome.supported, false)
    assert.ok(!outcome.supported && outcome.reason.length > 0)
  })

  it("separates 'could read' from 'is plain text'", () => {
    assert.ok(isTextual("text/plain"))
    assert.ok(!isTextual("application/pdf"))

    assert.ok(canExtract("application/pdf"))
    assert.ok(canExtract("image/png"))
    assert.ok(!canExtract("video/mp4"))
  })

  it("degrades honestly for images when no model key is configured", async () => {
    const hadKey = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY

    try {
      const outcome = await extractText(Buffer.from([0x89, 0x50]), "image/png")
      assert.equal(outcome.supported, false)
      assert.match(
        !outcome.supported ? outcome.reason : "",
        /ANTHROPIC_API_KEY/,
        "it should say why rather than fail silently"
      )
    } finally {
      if (hadKey) process.env.ANTHROPIC_API_KEY = hadKey
    }
  })

  it("caps how much text it pulls out of a huge file", async () => {
    const huge = Buffer.alloc(5 * 1024 * 1024, 0x61)
    const outcome = await extractText(huge, "text/plain")
    assert.equal(outcome.supported, true)
    assert.ok(
      (outcome.supported ? outcome.text.length : 0) <= 2 * 1024 * 1024,
      "extraction should be bounded"
    )
  })
})
