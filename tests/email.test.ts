import { test } from "node:test"
import assert from "node:assert/strict"

import { classifyEmail } from "@/lib/domain/email"
import { normalizeGmailMessage } from "@/lib/integrations/gmail"

test("normalizeGmailMessage parses headers, addresses and body", () => {
  const msg = {
    id: "msg_123",
    threadId: "thread_1",
    snippet: "quick snippet",
    internalDate: "1700000000000",
    payload: {
      headers: [
        { name: "From", value: "Jane Doe <jane@acme.com>" },
        { name: "To", value: "me@home.com, you@home.com" },
        { name: "Subject", value: "Reel due Friday" },
        { name: "Date", value: "Mon, 14 Nov 2023 10:00:00 +0000" },
      ],
      parts: [
        { mimeType: "text/plain", body: { data: Buffer.from("Please send the edit by Friday", "utf8").toString("base64url") } },
      ],
    },
  }

  const normalized = normalizeGmailMessage(msg as never)

  assert.equal(normalized.externalId, "msg_123")
  assert.equal(normalized.fromEmail, "jane@acme.com")
  assert.equal(normalized.fromName, "Jane Doe")
  assert.deepEqual(normalized.toEmails, ["me@home.com", "you@home.com"])
  assert.equal(normalized.subject, "Reel due Friday")
  assert.equal(normalized.body, "Please send the edit by Friday")
  assert.equal(normalized.receivedAt.getTime(), 1700000000000)
})

test("classifyEmail labels task requests, invoices and noise", () => {
  assert.equal(
    classifyEmail("Hi, please send the edited reel by Friday, it's due."),
    "TASK_REQUEST"
  )
  assert.equal(
    classifyEmail("Your invoice #42 is attached. Payment received, thank you."),
    "INVOICE"
  )
  assert.equal(
    classifyEmail("Your Netflix subscription renews soon, manage your plan."),
    "SUBSCRIPTION"
  )
  assert.equal(
    classifyEmail("50% OFF everything this weekend, unsubscribe here."),
    "NOISE"
  )
})
