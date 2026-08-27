import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { heuristicProvider } from "@/lib/ai/providers/heuristic"

// Wednesday, 26 August 2026.
const NOW = new Date(2026, 7, 26, 10, 30)

const extract = (text: string, knownOrganizations: string[] = []) =>
  heuristicProvider.extract({ text, now: NOW, knownOrganizations })

describe("heuristic extraction", () => {
  it("splits a dictated brief into one task per item", async () => {
    const result = await extract(
      "Bro please make 3 reels for GB Banquet. First one should be event highlights, " +
        "second should show decoration and third should focus on the food. " +
        "Need them before Saturday. Photos are in Drive."
    )

    assert.equal(result.tasks.length, 3)
    assert.deepEqual(
      result.tasks.map((task) => task.title),
      ["Make event highlights reel", "Make decoration reel", "Make food reel"]
    )
  })

  it("does not let the last item swallow the rest of the message", async () => {
    const result = await extract(
      "Make 2 videos. First should be the intro, second should be the outro. Send them Friday."
    )

    for (const task of result.tasks) {
      assert.ok(
        !/send them/i.test(task.title),
        `task title leaked a later sentence: ${task.title}`
      )
    }
  })

  it("prefers an organization already in the graph", async () => {
    const result = await extract("three edits for GB Banquet please", ["GB Banquet"])

    assert.equal(result.organization?.name, "GB Banquet")
    assert.ok(result.organization!.confidence >= 0.9)
  })

  it("reads explicit lists with high confidence", async () => {
    const result = await extract(
      ["Tasks for Tanniaqua Zone:", "- Edit the product video", "- Write the LinkedIn post"].join("\n")
    )

    assert.equal(result.tasks.length, 2)
    assert.ok(result.tasks.every((task) => task.confidence >= 0.9))
    assert.equal(result.organization?.name, "Tanniaqua Zone")
  })

  it("strips packaging and the deadline out of task titles", async () => {
    const result = await extract(
      "Client says: Please edit the new restaurant reel by Friday."
    )

    assert.equal(result.tasks[0].title, "Edit the new restaurant reel")
  })

  it("applies the message deadline to every task it produced", async () => {
    const result = await extract(
      "Make 2 reels for Acme Foods. First the teaser, second the full cut. Due Friday."
    )

    assert.ok(result.deadline)
    assert.ok(result.tasks.length >= 2)
    assert.ok(result.tasks.every((task) => task.dueAt === result.deadline!.dueAt))
  })

  it("detects urgency from wording", async () => {
    const result = await extract("Please fix the checkout page ASAP")
    assert.equal(result.tasks[0].priority, "URGENT")
  })

  it("lists the assets the work depends on", async () => {
    const result = await extract(
      "Edit the reel. Use the new logo, the photos are in Drive, menu items in the document."
    )

    const kinds = result.assets.map((asset) => asset.kind)
    assert.ok(kinds.includes("LOGO"))
    assert.ok(kinds.includes("IMAGE"))
    assert.ok(kinds.includes("FOLDER"))
  })

  it("asks to confirm an interpreted date but not an explicit one", async () => {
    const vague = await extract("Ship the edit by Friday")
    assert.ok(vague.questions.some((question) => /Is that right/.test(question)))

    const explicit = await extract("Ship the edit by 2026-09-04")
    assert.ok(!explicit.questions.some((question) => /Is that right/.test(question)))
  })

  it("names people it was told to contact", async () => {
    const result = await extract("Please send the updated version to Sarah tomorrow.")
    assert.deepEqual(
      result.people.map((person) => person.name),
      ["Sarah"]
    )
  })

  it("always produces something actionable", async () => {
    const result = await extract("the thing we discussed on the call")
    assert.ok(result.tasks.length >= 1)
    assert.ok(result.tasks[0].title.length > 0)
  })
})
