import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { DRIVE_SCOPES, driveAuthUrl } from "../lib/integrations/drive"
import { CALENDAR_SCOPES, calendarAuthUrl } from "../lib/integrations/calendar"

describe("Google Drive & Calendar Integrations", () => {
  it("declares drive scopes covering readonly and metadata", () => {
    assert.ok(DRIVE_SCOPES.some((s) => s.includes("drive.readonly")))
    assert.ok(DRIVE_SCOPES.some((s) => s.includes("drive.metadata.readonly")))
  })

  it("declares calendar scopes covering readonly and events", () => {
    assert.ok(CALENDAR_SCOPES.some((s) => s.includes("calendar.readonly")))
    assert.ok(CALENDAR_SCOPES.some((s) => s.includes("calendar.events")))
  })

  it("builds valid Drive OAuth consent URL with state carrying workspace slug", () => {
    process.env.GOOGLE_DRIVE_CLIENT_ID = "mock-drive-client-id"
    const url = driveAuthUrl("http://localhost:3000/api/integrations/drive/callback", "studio")

    assert.ok(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth"))
    assert.ok(url.includes("client_id=mock-drive-client-id"))
    assert.ok(url.includes("state=studio"))
    assert.ok(url.includes("drive.readonly"))
  })

  it("builds valid Calendar OAuth consent URL", () => {
    process.env.GOOGLE_CALENDAR_CLIENT_ID = "mock-cal-client-id"
    const url = calendarAuthUrl("http://localhost:3000/api/integrations/calendar/callback", "personal")

    assert.ok(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth"))
    assert.ok(url.includes("client_id=mock-cal-client-id"))
    assert.ok(url.includes("state=personal"))
    assert.ok(url.includes("calendar.events"))
  })
})
