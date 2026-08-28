import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Card, Cards } from "fumadocs-ui/components/card"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "What You Will Find Here", url: "#what-you-will-find-here", depth: 2 },
        { title: "Feature Overview", url: "#feature-overview", depth: 2 },
        { title: "How to Use This Section", url: "#how-to-use-this-section", depth: 2 },
      ]}
    >
      <DocsTitle>Features — Overview</DocsTitle>
      <DocsDescription>
        Every major capability of DLRS Personal OS — from capture to finance — broken into focused, beginner-friendly deep dives.
      </DocsDescription>
      <DocsBody>
        <h2 id="what-you-will-find-here">What You Will Find Here</h2>
        <p>
          The <code>Features</code> section is organized by <strong>module</strong>, not by screen. Each page is a self-contained deep dive with
          keywords, steps, and real data-flow. If you are new, start with <strong>Inbox → Tasks</strong>, then pick the module you need.
        </p>
        <Callout title="Beginner: How to Read Features">
          Each page uses the same pattern: <strong>What it does → How it works (steps) → Database &amp; Keywords → Tips</strong>. Look for plain-English explanations, keyword
          definitions, and technical code blocks.
        </Callout>

        <h2 id="feature-overview">Feature Overview</h2>
        <Cards>
          <Card
            href="/docs/features/inbox"
            title="Universal Inbox"
            description="One capture point for text, screenshot, PDF, voice, URL. How entity extraction turns raw dumps into tasks with confidence & provenance."
          />
          <Card
            href="/docs/features/tasks"
            title="Tasks & Work"
            description="Living objects: 9 statuses, auto priority 0–100, checklist vs subtask, Context Packs, work sessions, at-risk logic."
          />
          <Card
            href="/docs/features/automations"
            title="Automations"
            description="Rules → Jobs → Runs. Triggers, conditions, cron (0 8 * * 1-5), ioredis queue, and how to add your first rule."
          />
          <Card
            href="/docs/features/finance"
            title="Finance & Statements"
            description="Vault (AES-256) → transient unlock → unpdf deterministic totals → AI categorization → subscriptions. Integer minor units, never float."
          />
          <Card
            href="/docs/features/calendar"
            title="Calendar & Planning"
            description="Google sync, commitment graph (event ↔ project ↔ task), daily briefing 08:00, next-best-action scoring 0–100."
          />
          <Card
            href="/docs/features/files"
            title="Files & Documents"
            description="Drive indexing, Local vs R2 adapter, Document Intelligence (tables/dates), personal search across all sources."
          />
        </Cards>

        <h2 id="how-to-use-this-section">How to Use This Section</h2>
        <ul>
          <li>
            <strong>New developer?</strong> Read in order: <code>Inbox → Tasks → Automations → Finance</code>. Each builds on the graph concept.
          </li>
          <li>
            <strong>Integrating?</strong> Jump to <code>Calendar</code> for daily flow, <code>Files</code> for search, <code>Finance</code> for vault.
          </li>
          <li>
            <strong>Building agents?</strong> Then go to <code>/docs/agents</code> after Features — it shows how these modules become tools.
          </li>
        </ul>
        <p>
          Next: <code>Universal Inbox</code> is the best starting point — it shows how <em>capture → intelligence → action</em> works end-to-end.
        </p>
      </DocsBody>
    </DocsPage>
  )
}
