import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "What Orchestrator Does", url: "#what-orchestrator-does", depth: 2 },
        { title: "Flow — Intent to Tools", url: "#flow-intent-to-tools", depth: 2 },
        { title: "Prompt & Context Pack", url: "#prompt-context-pack", depth: 2 },
        { title: "Multi-Agent Coordination", url: "#multi-agent-coordination", depth: 2 },
        { title: "Code Walkthrough", url: "#code-walkthrough", depth: 2 },
        { title: "Tenancy & Safety", url: "#tenancy-safety", depth: 2 },
      ]}
    >
      <DocsTitle>Orchestrator — The Manager Agent</DocsTitle>
      <DocsDescription>
        The brain that routes “What should I do now?” to the right specialist, builds context packs, and ensures workspace isolation. Beginner to advanced.
      </DocsDescription>
      <DocsBody>
        <h2 id="what-orchestrator-does">What Orchestrator Does</h2>
        <Callout title="Beginner: One Brain, Many Hands">
          You talk to <strong>one</strong> assistant (<code>/w/[workspace]/assistant</code>), but behind it the Orchestrator picks which of 9 agents acts, what tools they can use, and when to ask you for confirmation.
        </Callout>
        <p>Located: <code>lib/agents/orchestrator.ts</code>. Single entry: <code>runOrchestrator(workspaceId, userInput)</code>.</p>

        <h2 id="flow-intent-to-tools">Flow — Intent to Tools</h2>
        <pre><code>{`User: "What should I do now?" or Gmail webhook
        │
        ▼
Orchestrator (Step 1: Intent Detection)
  "Is this: create_task? query? set_reminder? finance?"
        │
        ▼
Select Agent(s) — e.g., Task Agent + Calendar Agent
        │
        ▼
Gather Context (Step 2)
  SELECT * FROM tasks WHERE workspace_id = 'my-studio' AND due_date = today
  SELECT * FROM calendar_events WHERE starts_at = today
        │
        ▼
Rank & Propose (Step 3)
  Task scoring 0–100 + available time → "Do GB Reel now (score 88)"
        │
        ▼
Execute Safe Tools (Step 4)
  create_task, search_drive → auto
        │
        ▼
Pause for Sensitive (Step 5)
  send_email → modal: "Send this?" → user confirms → execute
        │
        ▼
Audit & Notify (Step 6)
  Write activity_log, push via Redis → UI badge`}</code></pre>

        <h2 id="prompt-context-pack">Prompt &amp; Context Pack</h2>
        <p>Each agent gets <strong>workspace-scoped</strong> context, not full DB dump:</p>
        <pre><code>{`Prompt for Task Agent:
"You are Task Agent for workspace my-studio.
Context Pack for task GB-reel-123:
- client: GB Banquet, project: Social Media, deadline: 2025-12-06, priority: High 84
- checklist: [x] Download [ ] Select [ ] Edit
- related emails: 2, files: GB-logo.png
- user recently asked: 'What should I do now?'
Available tools: create_task, update_task, prioritize
Do not use finance tools."

Token saving: only GB task, not all 200 tasks.`}</code></pre>
        <Callout type="info" title="Keyword: Context Pack = Token Efficient">
          Narrow context → cheaper, more accurate. The orchestrator builds a mini-pack per request, not “send entire DB to LLM”.
        </Callout>

        <h2 id="multi-agent-coordination">Multi-Agent Coordination</h2>
        <Tabs items={["Example 1: Create Task", "Example 2: Query", "Example 3: Finance Query"]}>
          <Tab value="Example 1: Create Task">
            <pre><code>{`User: "Make 3 reels for GB before Saturday"

Orchestrator → Inbox Agent (tools: extract_entities)
  → Returns: 3 tasks JSON

Orchestrator → Task Agent (tools: create_task x3)
  → Creates tasks, returns IDs

Orchestrator → Notification Agent (tool: create_reminder)
  → Schedules 7d/3d/1d reminders

Final: "Created 3 tasks for GB Banquet, due Saturday. Reminders set."`}</code></pre>
          </Tab>
          <Tab value="Example 2: Query">
            <pre><code>{`User: "Where is GB latest logo?"

Orchestrator → Search Agent (tool: search_drive)
  → Returns: GB-logo-final.png

Orchestrator → Drive Agent (tool: get_drive_file)
  → Returns preview URL

No task creation — just answer.`}</code></pre>
          </Tab>
          <Tab value="Example 3: Finance Query">
            <pre><code>{`User: "How much did I spend on food last month?"

Orchestrator → Finance Agent (tool: spending_summary)
  → SQL: SELECT sum(amountMinor) WHERE category=Food AND date BETWEEN ...

Returns formatted: "₹4,200 on Food (22% of ₹18,420)"

LLM just reports, never computes math.`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="code-walkthrough">Code Walkthrough</h2>
        <Steps>
          <Step>
            <h3>Entry: lib/agents/orchestrator.ts</h3>
            <pre><code>{`export async function runOrchestrator(ctx: AgentRuntimeContext, input: string) {
  const intent = await detectIntent(input) // LLM or heuristic
  const agents = selectAgents(intent) // e.g., ["task", "calendar"]
  const contextPack = await buildContextPack(ctx.workspaceId, agents)
  const plan = await planActions(intent, contextPack, agents)
  for (const action of plan) {
    if (action.risk === "SENSITIVE") await askConfirmation(action)
    else await executeTool(action)
  }
}`}</code></pre>
          </Step>
          <Step>
            <h3>Tool Execution: lib/agents/tools.ts</h3>
            <pre><code>{`tools = registry of { name, risk, input: Zod, handler: (args, { db, ctx }) => result }
// ctx: { workspaceId, userId } — enforced tenancy
handler always does: db.task.findMany({ where: { workspaceId: ctx.workspaceId } })`}</code></pre>
          </Step>
        </Steps>

        <h2 id="tenancy-safety">Tenancy &amp; Safety</h2>
        <pre><code>{`// Every DB call in handler:
await db.task.create({ data: { workspace_id: ctx.workspaceId, title: args.title } })

// Check: npm run check:tenancy
// Scans lib/** for ` + "`" + `db.*.findMany\(` + "`" + ` without workspace_id → fails CI`}</code></pre>
        <Callout type="warn" title="🔒 Design Rule: No Global Queries">
          If you add a new query, always include <code>workspace_id</code>. The isolation script is the gate. This is why beginners should copy existing handler patterns.
        </Callout>
      </DocsBody>
    </DocsPage>
  )
}
