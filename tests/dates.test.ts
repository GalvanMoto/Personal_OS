import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { findDate } from "@/lib/ai/dates"

// Wednesday, 26 August 2026, mid-morning.
const NOW = new Date(2026, 7, 26, 10, 30)

function iso(text: string) {
  const found = findDate(text, NOW)
  if (!found) return null
  const { date } = found
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

describe("findDate", () => {
  it("reads a weekday as the next occurrence", () => {
    assert.equal(iso("please deliver by Friday"), "2026-08-28")
  })

  it("treats the current weekday as today", () => {
    assert.equal(iso("need it by Wednesday"), "2026-08-26")
  })

  it("skips a week for 'next'", () => {
    assert.equal(iso("let's aim for next Wednesday"), "2026-09-02")
  })

  it("handles tomorrow and the day after", () => {
    assert.equal(iso("send it tomorrow"), "2026-08-27")
    assert.equal(iso("day after tomorrow works"), "2026-08-28")
  })

  it("handles today and end of day", () => {
    assert.equal(iso("I need this today"), "2026-08-26")
    assert.equal(iso("by EOD please"), "2026-08-26")
  })

  it("reads explicit day-month forms", () => {
    assert.equal(iso("deadline is 28 Aug"), "2026-08-28")
    assert.equal(iso("deadline is August 28th, 2026"), "2026-08-28")
    assert.equal(iso("deadline is 2026-08-28"), "2026-08-28")
  })

  it("reads day-first numeric dates", () => {
    assert.equal(iso("due 28/08"), "2026-08-28")
    assert.equal(iso("due 01-09-2026"), "2026-09-01")
  })

  it("rolls a bare past date into next year", () => {
    // 3 March already passed in 2026, so it must mean 2027.
    assert.equal(iso("invoice dated 3 Mar"), "2027-03-03")
  })

  it("handles relative offsets", () => {
    assert.equal(iso("in 3 days"), "2026-08-29")
    assert.equal(iso("in 2 weeks"), "2026-09-09")
  })

  it("resolves end of week to Friday and end of month", () => {
    assert.equal(iso("by end of week"), "2026-08-28")
    assert.equal(iso("by end of the month"), "2026-08-31")
  })

  it("sets deadlines to the end of the named day", () => {
    const found = findDate("by Friday", NOW)
    assert.ok(found)
    assert.equal(found.date.getHours(), 23)
    assert.equal(found.date.getMinutes(), 59)
  })

  it("prefers an explicit date over a vague phrase", () => {
    const found = findDate("sometime next week, hard stop 2026-09-04", NOW)
    assert.ok(found)
    assert.equal(found.confidence, 1)
    assert.equal(found.date.getDate(), 4)
  })

  it("keeps the phrase it matched for the confirmation prompt", () => {
    const found = findDate("please deliver by Friday", NOW)
    assert.ok(found)
    assert.match(found.phrase.toLowerCase(), /friday/)
  })

  it("returns null when there is no date", () => {
    assert.equal(findDate("make three reels for the client", NOW), null)
  })
})
