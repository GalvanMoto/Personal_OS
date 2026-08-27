import test from "node:test"
import assert from "node:assert/strict"
import {
  classifySource,
  extractUrls,
  parseSheetContent,
  parseDocCreativeBrief,
} from "../lib/domain/import-intelligence"

test("classifySource identifies Google Docs, Sheets, and Web Links", () => {
  assert.equal(
    classifySource("https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"),
    "GOOGLE_SHEET"
  )
  assert.equal(
    classifySource("https://docs.google.com/document/d/1uD9WbE4-90aWj12X/edit"),
    "GOOGLE_DOC"
  )
  assert.equal(
    classifySource("https://example.com/brief.pdf"),
    "WEB_LINK"
  )
  assert.equal(
    classifySource("Just a regular message from client"),
    "RAW_TEXT"
  )
})

test("extractUrls pulls all URLs from a mixed client message", () => {
  const message = `
    Karna sent this. Organize it.
    https://docs.google.com/spreadsheets/d/sheet123/edit
    and here is the creative brief:
    https://docs.google.com/document/d/doc456/edit
  `
  const urls = extractUrls(message)
  assert.equal(urls.length, 2)
  assert.ok(urls.some((u) => u.includes("sheet123")))
  assert.ok(urls.some((u) => u.includes("doc456")))
})

test("parseSheetContent parses multi-brand deliverable grid rows", () => {
  const csvData = `
Brand,Content,Quantity,Due,Notes
WOW Indian,Reels,3,Friday,Event content
WOW Indian,Posts,2,Friday,Promo
Restaurant B,Reels,2,Saturday,New menu
Restaurant C,Shorts,3,Sunday,Food
  `.trim()

  const deliverables = parseSheetContent(csvData)
  assert.equal(deliverables.length, 4)

  const wowReels = deliverables.find((d) => d.brandName === "WOW Indian" && d.deliverableType === "REEL")
  assert.ok(wowReels)
  assert.equal(wowReels.quantity, 3)
  assert.equal(wowReels.dueDayOfWeek, 5) // Friday
  assert.equal(wowReels.itemRequirements.length, 3)

  const restC = deliverables.find((d) => d.brandName === "Restaurant C")
  assert.ok(restC)
  assert.equal(restC.deliverableType, "SHORT")
  assert.equal(restC.quantity, 3)
  assert.equal(restC.dueDayOfWeek, 0) // Sunday
})

test("parseDocCreativeBrief merges specific reel requirements, assets, and detects deadline conflicts", () => {
  const deliverables = [
    {
      brandName: "WOW Indian",
      deliverableType: "REEL" as const,
      quantity: 3,
      frequency: "WEEKLY" as const,
      dueDayOfWeek: 5,
      deadlineText: "Friday",
      itemRequirements: [
        { itemIndex: 1, title: "WOW Indian — Reel #1" },
        { itemIndex: 2, title: "WOW Indian — Reel #2" },
        { itemIndex: 3, title: "WOW Indian — Reel #3" },
      ],
    },
  ]

  const docBrief = `
    WOW Indian needs 3 reels this week.
    Reel 1 should focus on the new menu and presentation.
    Reel 2 should highlight the live event ambiance.
    Reel 3 should be customer reactions and reviews.
    Use the new logo and food photography.
    Final delivery due Saturday.
  `

  const res = parseDocCreativeBrief(docBrief, deliverables)

  // 1. Assets extracted
  assert.ok(res.assetsRequired.includes("New logo"))
  assert.ok(res.assetsRequired.includes("Food photography"))

  // 2. Specific reel requirements enriched
  assert.ok(res.enrichedDeliverables[0].itemRequirements[0].requirement?.includes("new menu"))
  assert.ok(res.enrichedDeliverables[0].itemRequirements[1].requirement?.includes("live event"))
  assert.ok(res.enrichedDeliverables[0].itemRequirements[2].requirement?.includes("customer reactions"))

  // 3. Deadline conflict detected and resolved to Saturday
  assert.equal(res.detectedConflicts.length, 1)
  assert.equal(res.enrichedDeliverables[0].deadlineText, "Saturday")
  assert.equal(res.enrichedDeliverables[0].dueDayOfWeek, 6)
})
