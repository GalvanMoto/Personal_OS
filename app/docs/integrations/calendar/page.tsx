import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "Calendar as Commitment Intelligence", url: "#calendar-as-commitment-intelligence", depth: 2 },
        { title: "OAuth & Sync Flow", url: "#oauth-sync-flow", depth: 2 },
        { title: "Commitment Graph in Action", url: "#commitment-graph-in-action", depth: 2 },
        { title: "Daily Briefing & Planning", url: "#daily-briefing-planning", depth: 2 },
        { title: "Next-Best-Action", url: "#next-best-action", depth: 2 },
        { title: "Tables & Keywords", url: "#tables-keywords", depth: 2 },
      ]}
    >
      <DocsTitle>Google Calendar — Commitments, Not Just Events</DocsTitle>
      <DocsDescription>
        Sync Google Calendar to power commitment graph, daily briefing, and “What should I do now?” — with OAuth, linking, and planning logic explained for beginners.
      </DocsDescription>
      <DocsBody>
        <h2 id="calendar-as-commitment-intelligence">Calendar as Commitment Intelligence</h2>
        <Callout title="Beginner: Why “Commitment”">
          Your calendar is promises to people. DLRS treats each event as a <strong>commitment</strong>: Who, What, When, What tasks depend on it, What files you need. Not just “Meeting 4pm”.
        </Callout>
        <p>
          UI: <code>/w/[workspace]/calendar</code> (month/week/day + Today). Backend: <code>calendar_events</code> per workspace, synced via Google
          Calendar API.
        </p>

        <h2 id="oauth-sync-flow">OAuth &amp; Sync Flow</h2>
        <Steps>
          <Step>
            <h3>Setup</h3>
            <p>Same as Gmail/Drive. Redirect:</p>
            <pre><code>{`http://localhost:3000/api/integrations/calendar/callback
Scope: .../auth/calendar.readonly
Env: GOOGLE_CALENDAR_CLIENT_ID, SECRET_ENCRYPTION_KEY`}</code></pre>
            <p>Connect in Settings → Integrations → Calendar.</p>
          </Step>
          <Step>
            <h3>Initial Sync</h3>
            <pre><code>{`POST /api/integrations/calendar/sync
- google.calendar.events.list(calendarId: primary, maxResults: 250, timeMin: now, timeMax: +30d)
- For each event: calendar_events {
    id, workspace_id, external_id, title, description,
    starts_at, ends_at, all_day, attendees: json, location, status
  }`}</code></pre>
          </Step>
          <Step>
            <h3>Incremental (Job)</h3>
            <pre><code>{`Job: calendar_sync every 15m
- Use syncToken (Google's incremental token) → only new/updated/deleted
- Update or create rows, delete removed
- Trigger: calendar.event_created → notify if linked to urgent task`}</code></pre>
          </Step>
        </Steps>

        <h2 id="commitment-graph-in-action">Commitment Graph in Action</h2>
        <Tabs items={["Example: Client Call", "Linking Rules"]}>
          <Tab value="Example: Client Call">
            <pre><code>{`Event: "Website Redesign — Client Call" 2025-12-03 16:00, attendees: sarah@acme.com, description: "Review pricing.pdf"

Linked automatically:
- Project: Website Redesign (title match)
- Client: Acme (attendee email sarah@acme.com → clients.contact_email)
- Tasks: 3 outstanding for that project (Update pricing, Review copy, SEO)
- Files: pricing.pdf in Drive
- Action: Assistant 1h before: "You have 3 tasks for this client. Review pricing.pdf before call."

Keywords: commitment graph = event ↔ project ↔ task ↔ file ↔ person`}</code></pre>
          </Tab>
          <Tab value="Linking Rules">
            <ul>
              <li><strong>Title</strong> contains project/client name (fuzzy match).</li>
              <li><strong>Attendee email</strong> matches <code>clients.contact_email</code> or <code>users.email</code>.</li>
              <li><strong>Description</strong> contains Drive link → <code>links</code> table.</li>
              <li><strong>Location</strong> if it's a Drive folder link.</li>
            </ul>
          </Tab>
        </Tabs>

        <h2 id="daily-briefing-planning">Daily Briefing &amp; Planning</h2>
        <pre><code>{`Cron: 0 8 * * 1-5 (weekdays 8am) → Reminder Agent:
"Good morning!
Today:
🔴 Due today: GB reel (export pending) — 2 tasks
🟠 Due soon: Tanniaqua post (Friday)
🟡 Waiting: GB — waiting for photos (3 days)
🟢 Completed: 2 tasks yesterday
Calendar: 2 events (10am standup, 4pm client call)
What's your focus today?"

Generation: lib/agents/orchestrator + lib/domain/planning
- Queries tasks where due_date = today AND calendar_events today
- No LLM math, just counts and priority sort`}</code></pre>

        <h2 id="next-best-action">Next-Best-Action</h2>
        <p>Ask “What should I do now?” in Assistant:</p>
        <pre><code>{`Scoring (same as Task priority + time):
- Due today + assets available + 45m estimate + no blocks → score 88
- Calendar: you have 2h free before 4pm call → fits 45m task

Answer: "Do GB Reel now (45m, due today, assets ready, no dependencies). Why? Client waiting, 2h free."
Code: lib/domain/planning.ts → nextBestAction(workspaceId)`}</code></pre>

        <h2 id="tables-keywords">Tables &amp; Keywords</h2>
        <pre><code>{`calendar_events {
  id, workspace_id, external_id (Google's id), title, description,
  starts_at, ends_at, all_day, attendees: jsonb, location, status, created_at
}
Indexes: workspace_id, starts_at (for Today queries)

Keywords:
- external_id: Google's id, used for delta sync
- syncToken: Google's incremental token, stored per workspace
- commitment: event as promise, not just time block
- attendees: array of emails, linked to clients`}</code></pre>
      </DocsBody>
    </DocsPage>
  )
}
