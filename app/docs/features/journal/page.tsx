import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "Overview", url: "#overview", depth: 2 },
        { title: "Smart AI Day Synthesis", url: "#smart-ai-day-synthesis", depth: 2 },
        { title: "Interactive Calendar & Streak Tracking", url: "#interactive-calendar-streak-tracking", depth: 2 },
        { title: "Tiptap Rich Editor", url: "#tiptap-rich-editor", depth: 2 },
        { title: "Assistant Agent Integration", url: "#assistant-agent-integration", depth: 2 },
        { title: "Data Storage & Search Indexing", url: "#data-storage-search-indexing", depth: 2 },
      ]}
    >
      <DocsTitle>Daily Journals &amp; AI Reflection</DocsTitle>
      <DocsDescription>
        Capture reflections, synthesize day-to-day execution with AI, maintain journaling streaks, and edit daily logs using rich Tiptap formatting.
      </DocsDescription>
      <DocsBody>
        <h2 id="overview">Overview</h2>
        <p>
          The <strong>Daily Journal</strong> in Personal OS bridges day-to-day operational execution with reflective knowledge synthesis. Instead of manually copy-pasting what you did, the system inspects real workspace activity across tasks, calendar events, documents, and financial transactions to compose structured daily reviews.
        </p>

        <Callout title="Smart Signal-to-Noise Filtering">
          The AI synthesizes real accomplishments (closed loops, client milestones, key transactions) while filtering out background noise and routine system pings.
        </Callout>

        <h2 id="smart-ai-day-synthesis">Smart AI Day Synthesis</h2>
        <p>
          Clicking the <strong>Smart AI Log</strong> button analyzes the selected date across all workspace domains:
        </p>
        <ul>
          <li><strong>🎯 Closed Tasks:</strong> Identifies completed work items and their priority weighting.</li>
          <li><strong>⚡ Ongoing Momentum:</strong> Highlights active deliverables and progress.</li>
          <li><strong>📅 Meetings &amp; Schedule:</strong> Summarizes sessions attended with time intervals.</li>
          <li><strong>💰 Financial Summary:</strong> Aggregates inflow and outflow movements for the day.</li>
          <li><strong>🧠 Reflections &amp; Notes:</strong> Pulls authored notes and generates key takeaways.</li>
        </ul>

        <h2 id="interactive-calendar-streak-tracking">Interactive Calendar &amp; Streak Tracking</h2>
        <p>
          The built-in calendar drawer allows fast date jumping and consistency tracking:
        </p>
        <Steps>
          <Step>
            <h3>Logged Days Indicators</h3>
            <p>Any day with a saved daily journal entry displays an emerald status dot directly on the date cell.</p>
          </Step>
          <Step>
            <h3>Consistency Streak</h3>
            <p>Consecutive days logged up to today are automatically counted and badged with the <code>🔥 Streak</code> indicator.</p>
          </Step>
          <Step>
            <h3>Quick Jump</h3>
            <p>Navigate effortlessly with previous/next day arrows or click <strong>Today</strong> to jump back to the current date.</p>
          </Step>
        </Steps>

        <h2 id="tiptap-rich-editor">Tiptap Rich Editor</h2>
        <p>
          Journals use the full-height Tiptap canvas with a pinned formatting toolbar:
        </p>
        <ul>
          <li><strong>Formatting:</strong> Headings (H1, H2, H3), Bold, Italic, Quotes, and Code blocks.</li>
          <li><strong>Lists:</strong> Bulleted, Numbered, and Task Checklists.</li>
          <li><strong>Interactive Tables:</strong> Insert structured tables for metrics, time breakdowns, or goals.</li>
          <li><strong>Word &amp; Screen Wrap:</strong> Responsive canvas designed so only the editor scrolls while headers remain fixed.</li>
        </ul>

        <h2 id="assistant-agent-integration">Assistant Agent Integration</h2>
        <p>
          You can interact with your Daily Journal directly from the AI Assistant chat interface:
        </p>
        <Tabs items={["Ask in Assistant", "Agent Tools"]}>
          <Tab value="Ask in Assistant">
            <pre><code>{`"Summarize my work today in my daily journal"
"What were my main accomplishments on August 28th?"
"Add a reflection note to today's journal about our client launch"`}</code></pre>
          </Tab>
          <Tab value="Agent Tools">
            <pre><code>{`// Tools available to the AI Assistant runtime:
- get_daily_journal: { date: "YYYY-MM-DD" }
- create_daily_journal: { date: "YYYY-MM-DD", summary?: string, notes?: string }`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="data-storage-search-indexing">Data Storage &amp; Search Indexing</h2>
        <p>
          Every journal entry is stored as a structured document titled <code>Daily Journal — YYYY-MM-DD</code> and indexed in full-text PostgreSQL search (<code>search_documents</code>), ensuring your past insights are instantly searchable from Global Search (<code>Cmd + K</code>).
        </p>
      </DocsBody>
    </DocsPage>
  )
}
