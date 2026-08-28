import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { ScrollText, Bug, Lightbulb, KeyRound, Wrench } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "Why Multi-Agent? (Beginner)", url: "#why-multi-agent-beginner", depth: 2 },
        { title: "The 9 Agents — What Each Does", url: "#the-9-agents-what-each-does", depth: 2 },
        { title: "Tool Registry & Permissions", url: "#tool-registry-permissions", depth: 2 },
        { title: "How to Add a New Tool (Steps)", url: "#how-to-add-a-new-tool-steps", depth: 2 },
        { title: "Cost & Reliability Design", url: "#cost-reliability-design", depth: 2 },
        { title: "Database & Audit", url: "#database-audit", depth: 2 },
      ]}
    >
      <DocsTitle>Agents — 9 Specialized Workers</DocsTitle>
      <DocsDescription>
        DLRS is not one chatbot. It's 9 narrow agents coordinated by an Orchestrator. Learn each agent's job, tools, permissions, and how to extend them — beginner-friendly with code.
      </DocsDescription>
      <DocsBody>
        <h2 id="why-multi-agent-beginner">Why Multi-Agent? (Beginner)</h2>
        <Callout
          title={
            <span className="inline-flex items-center gap-1.5">
              <Lightbulb className="size-4" /> Analogy: Specialist Doctors
            </span>
          }
        >
          One general doctor (single LLM) tries to do everything and is mediocre. DLRS has 9 specialists: Inbox doctor for capture, Finance doctor for bank statements. The <strong>Orchestrator</strong> is the receptionist who routes you to the right specialist.
        </Callout>
        <ul>
          <li><strong>Single agent problem:</strong> one prompt with 50 tools → confusion, wrong tool, high token cost, permission bleed.</li>
          <li><strong>Multi-agent solution:</strong> Inbox Agent has 5 tools, Finance Agent has 4, each prompt narrow and accurate.</li>
          <li><strong>Beginner win:</strong> You can test Inbox Agent alone without loading Finance code.</li>
        </ul>

        <h2 id="the-9-agents-what-each-does">The 9 Agents — What Each Does</h2>
        <Tabs items={["Inbox & Task", "Email & Drive & Doc", "Finance & Calendar & Search"]}>
          <Tab value="Inbox & Task">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Agent</th>
                  <th className="p-2 text-left">Input Example</th>
                  <th className="p-2 text-left">Output</th>
                  <th className="p-2 text-left">Tools</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2 font-medium">Inbox Agent</td>
                  <td className="p-2">“3 reels for GB by Friday, photos in Drive”</td>
                  <td className="p-2">client=GB, 3 tasks, deadline, asset search</td>
                  <td className="p-2 font-mono text-xs">classify, extract_entities, link_project</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium">Task Agent</td>
                  <td className="p-2">All tasks for workspace</td>
                  <td className="p-2">Priority scores, at-risk, nextAction</td>
                  <td className="p-2 font-mono text-xs">prioritize, detect_blocked, estimate</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium">Project Agent</td>
                  <td className="p-2">Project health request</td>
                  <td className="p-2">Progress 60%, 2 tasks overdue, summary</td>
                  <td className="p-2 font-mono text-xs">health, milestones, summarize</td>
                </tr>
              </tbody>
            </table>
          </Tab>
          <Tab value="Email & Drive & Doc">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Agent</th>
                  <th className="p-2 text-left">Input</th>
                  <th className="p-2 text-left">Output</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2 font-medium">Email Agent</td>
                  <td className="p-2">Gmail webhook: “Update pricing by Thursday, see PDF”</td>
                  <td className="p-2">Task + attachment + reminder, classified as task_request</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium">Drive Agent</td>
                  <td className="p-2">“Where is GB logo?”</td>
                  <td className="p-2">GB-logo.png path + preview, linked to client</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium">Document Agent</td>
                  <td className="p-2">10-page PDF brief</td>
                  <td className="p-2">Tables, requirements, dates, summary</td>
                </tr>
              </tbody>
            </table>
          </Tab>
          <Tab value="Finance & Calendar & Search">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Agent</th>
                  <th className="p-2 text-left">Specialty</th>
                  <th className="p-2 text-left">Key Rule</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2 font-medium">Finance Agent</td>
                  <td className="p-2">Bank PDFs, categorization, subs</td>
                  <td className="p-2">Deterministic totals, LLM only for merchant label</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium">Calendar Agent</td>
                  <td className="p-2">Events, commitments, conflicts</td>
                  <td className="p-2">Links event to project/task graph</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium">Search Agent</td>
                  <td className="p-2">“Show GB everything”</td>
                  <td className="p-2">One query across Drive+emails+tasks</td>
                </tr>
              </tbody>
            </table>
          </Tab>
        </Tabs>

        <h2 id="tool-registry-permissions">Tool Registry &amp; Permissions</h2>
        <pre><code>{`lib/agents/tools.ts
tools = [
  { name: "create_task", risk: "SAFE", input: z.object({ title, project_id, due_date }), handler },
  { name: "send_email", risk: "SENSITIVE", handler }, // needs confirm
  { name: "search_drive", risk: "SAFE" },
  ...
]

Catalog shown to LLM:
listTools() → [{ name, description, risk, inputSchema }]

Permission matrix:
SAFE: auto-exec (create_task, categorize_email, attach_file)
SENSITIVE: pause → modal "Send this email?" → user confirms → execute
Engine: lib/agents/orchestrator.ts → handleToolCall() checks risk`}</code></pre>
        <Callout
          title={
            <span className="inline-flex items-center gap-1.5">
              <KeyRound className="size-4" /> Keyword: Risk vs Permission
            </span>
          }
        >
          <code>risk="SAFE"|"SENSITIVE"</code> in tool definition. Sensitive tool calls are not executed until user clicks Confirm. Logged to <code>activity_log</code> with <code>approved_by</code>.
        </Callout>

        <h2 id="how-to-add-a-new-tool-steps">How to Add a New Tool (Steps)</h2>
        <Steps>
          <Step>
            <h3>1. Define in lib/agents/tools.ts</h3>
            <pre><code>{`{
  name: "create_reminder",
  description: "Create reminder for task",
  risk: "SAFE",
  input: z.object({ task_id: z.string(), when: z.string() }),
  handler: async (args, { db, ctx }) => {
    // ctx.workspaceId enforced here
    const reminder = await db.reminder.create({ data: { workspace_id: ctx.workspaceId, task_id: args.task_id, when: new Date(args.when) }})
    return reminder
  }
}`}</code></pre>
          </Step>
          <Step>
            <h3>2. Add to agent's allowed list</h3>
            <pre><code>{`lib/agents/registry.ts
taskAgents = ["create_task", "update_task", "create_reminder"]`}</code></pre>
          </Step>
          <Step>
            <h3>3. Add server wrapper (optional for UI)</h3>
            <pre><code>{`lib/ai/agent/server-tools.ts
export const createReminder = createReminderDef.server<AgentRuntimeContext>(...)`}</code></pre>
          </Step>
          <Step>
            <h3>4. Test via Assistant</h3>
            <p>Ask in <code>/w/[workspace]/assistant</code>: “Remind me about GB reel tomorrow 10am” → orchestrator → Inbox Agent → create_reminder tool.</p>
          </Step>
        </Steps>

        <h2 id="cost-reliability-design">Cost &amp; Reliability Design</h2>
        <Callout
          type="info"
          title={
            <span className="inline-flex items-center gap-1.5">
              <Lightbulb className="size-4" /> Why Not AI Everywhere?
            </span>
          }
        >
          AI is expensive and non-deterministic. DLRS uses <strong>heuristic first, LLM second</strong>. Dates, math, cron = TypeScript <code>date-fns</code>. Only understanding uses LLM. Saves tokens and avoids “2+2=5” errors.
        </Callout>
        <ul>
          <li>Model: <code>AGENT_MODEL=claude-3-5-sonnet</code> for quality, <code>haiku</code> for cheap</li>
          <li>Fallback: if no API key, heuristic regex still creates tasks (lower accuracy)</li>
          <li>Limit: max 5 tool calls per turn, loop detection in orchestrator</li>
        </ul>

        <h2 id="database-audit">Database &amp; Audit</h2>
        <Accordion className="mt-2">
          <AccordionItem value="audit" className="border-b">
            <AccordionTrigger className="px-3 py-2 font-medium">
              <span className="inline-flex items-center gap-2">
                <ScrollText className="size-4 text-fd-muted-foreground" /> Audit Trail
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <pre className="!my-2"><code>{`activity_log {
  id, workspace_id, actor: "agent:InboxAgent", action: "create_task",
  target_id, details: { confidence: 0.92, source_id: "email_abc" },
  created_at
}
query: SELECT * FROM activity_log WHERE workspace_id = 'my-studio' ORDER BY created_at DESC`}</code></pre>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="debug" className="border-b last:border-0">
            <AccordionTrigger className="px-3 py-2 font-medium">
              <span className="inline-flex items-center gap-2">
                <Bug className="size-4 text-fd-muted-foreground" /> Debugging an Agent
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 pt-1">
              <p className="!mt-0">Check <code>job_runs</code> for output/error. Check <code>task_extractions</code> for confidence. In UI, click task → “Source” → see original extraction JSON.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocsBody>
    </DocsPage>
  )
}
