import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Step, Steps } from "fumadocs-ui/components/steps"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "Calendar as Intelligence, Not Just View", url: "#calendar-as-intelligence-not-just-view", depth: 2 },
        { title: "Sync — OAuth & Fetch", url: "#sync-oauth-fetch", depth: 2 },
        { title: "Commitment Graph", url: "#commitment-graph", depth: 2 },
        { title: "Daily Planning & Briefing", url: "#daily-planning-briefing", depth: 2 },
        { title: "Next-Best-Action Scoring", url: "#next-best-action-scoring", depth: 2 },
        { title: "Database & Tips", url: "#database-tips", depth: 2 },
      ]}
    >
      <DocsTitle>Calendar &amp; Planning — Commitments Made Intelligent</DocsTitle>
      <DocsDescription>
        Not just a calendar view. The Calendar Agent understands commitments, links them to tasks/clients, and powers the “What should I do now?” engine.
      </DocsDescription>
      <DocsBody>
        <h2 id="calendar-as-intelligence-not-just-view">Calendar as Intelligence, Not Just View</h2>
        <Callout title="Beginner: Calendar vs Commitment">
          Traditional calendar shows “Meeting at 4pm”. DLRS shows: “Meeting at 4pm for Website Redesign — 2 unfinished tasks, 1 waiting approval, pricing doc linked. Review before call.” It's context, not just time.
        </Callout>
        <p>UI: <code>/w/[workspace]/calendar</code> — month/week/day view + Today briefing. Data: <code>calendar_events</code> table per workspace.</p>

        <h2 id="sync-oauth-fetch">Sync — OAuth &amp; Fetch</h2>
        <Steps>
          <Step><h3>Connect</h3><p>Settings → Integrations → Calendar → OAuth (Google). Redirect <code>/api/integrations/calendar/callback</code> saves encrypted token in vault.</p></Step>
          <Step><h3>Initial Sync</h3><pre><code>{`Route: POST /api/integrations/calendar/sync
- Fetch events via Google Calendar API (next 30 days)
- Store calendar_events { id, workspace_id, title, starts_at, ends_at, attendees, location, description }`}</code></pre></Step>
          <Step><h3>Incremental</h3><p>Job every 15m: fetch delta via <code>syncToken</code>. Also creates <code>automation_rules</code> trigger <code>calendar.event_created</code>.</p></Step>
        </Steps>

        <h2 id="commitment-graph">Commitment Graph</h2>
        <Tabs items={["Example: Client Call", "Linking Logic"]}>
          <Tab value="Example: Client Call">
            <pre><code>{`Event: "Client call — Website Redesign" at 2025-12-03 16:00
Linked:
- Project: Website Redesign (via title/client map)
- Tasks: 3 outstanding (Update pricing, Review copy, Fix SEO)
- Waiting: 1 (client approval on pricing.pdf)
- Files: Drive folder "Website-Redesign"

Assistant says before meeting: "You have 3 tasks for this client. Review pricing.pdf."

Keywords: commitment graph = event ↔ project ↔ task ↔ file`}</code></pre>
          </Tab>
          <Tab value="Linking Logic">
            <ul>
              <li>Title match: event title contains project/client name.</li>
              <li>Attendee match: event attendee email matches <code>clients.contact_email</code>.</li>
              <li>Description links: Drive link in description → <code>task_links</code>.</li>
            </ul>
          </Tab>
        </Tabs>

        <h2 id="daily-planning-briefing">Daily Planning &amp; Briefing</h2>
        <pre><code>{`Cron: 0 8 * * 1-5 → Reminder Agent:
"Good morning! Today:
 🔴 Due today: GB reel (export pending), XYZ pricing
 🟠 Due soon: Tanniaqua post (Friday)
 🟡 Waiting: GB — waiting for photos (3 days)
 🟢 Completed: 2 tasks yesterday
 What's your focus today?"`}</code></pre>
        <p>Generates via <code>lib/agents/orchestrator.ts</code> analyzing <code>tasks where due_date = today</code> + <code>calendar_events today</code>.</p>

        <h2 id="next-best-action-scoring">Next-Best-Action Scoring</h2>
        <p>Ask “What should I do now?” in Assistant (<code>/w/[workspace]/assistant</code>):</p>
        <pre><code>{`Scoring same as Task priority + time:
- Due today + assets available + 45m estimate + no blocks → score 88 → recommend "Do GB Reel now"
Explanation: "Why? Due today, client waiting, assets ready, 45m, no dependencies."

Implementation: lib/domain/planning.ts → nextBestAction(workspaceId)`}</code></pre>

        <h2 id="database-tips">Database &amp; Tips</h2>
        <pre><code>{`calendar_events {
  id, workspace_id, external_id, title, description,
  starts_at, ends_at, all_day, attendees: json, location, status
}
Indexes: workspace_id, starts_at`}</code></pre>
        <Callout title="Beginner Tips">
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li>Add client name to calendar titles: “GB Banquet — call” links better.</li>
            <li>Keep one calendar per workspace for simplicity; multi-calendar sync supported via multiple integrations.</li>
          </ul>
        </Callout>
      </DocsBody>
    </DocsPage>
  )
}
