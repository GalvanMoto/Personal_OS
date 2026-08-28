import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "What You Will Build", url: "#what-you-will-build", depth: 2 },
        { title: "Step 1 — Create Workspace", url: "#step-1-create-workspace", depth: 2 },
        { title: "Step 2 — Create Client & Project", url: "#step-2-create-client-project", depth: 2 },
        { title: "Step 3 — Capture: Text/Screenshot", url: "#step-3-capture-text-screenshot", depth: 2 },
        { title: "Step 4 — Review AI Extraction", url: "#step-4-review-ai-extraction", depth: 2 },
        { title: "Step 5 — Start Work & Context Pack", url: "#step-5-start-work-context-pack", depth: 2 },
        { title: "Daily Flow — Today", url: "#daily-flow-today", depth: 2 },
        { title: "Finance in 2 Minutes", url: "#finance-in-2-minutes", depth: 2 },
        { title: "Keyboard Shortcuts & Search", url: "#keyboard-shortcuts-search", depth: 2 },
        { title: "Next Steps", url: "#next-steps", depth: 2 },
      ]}
    >
      <DocsTitle>Quick Start — 5 Minutes to First Task</DocsTitle>
      <DocsDescription>
        From empty workspace to AI-extracted tasks and your first Context Pack. No prior knowledge needed — every step explained for beginners.
      </DocsDescription>
      <DocsBody>
        <Callout title="What you'll learn">
          By the end: create workspace → capture raw info → let AI extract tasks → open Context Pack → use daily flow. All 8 modules touched lightly.
        </Callout>

        <h2 id="what-you-will-build">What You Will Build</h2>
        <p>Imagine a client sends this on WhatsApp:</p>
        <pre><code>{`Bro please make 3 reels for GB Banquet.
Event highlights / decoration / food.
Before Saturday. Photos in Drive folder "GB-Dec-2025".`}</code></pre>
        <p>
          In DLRS you <strong>don't</strong> manually create 3 tasks. You paste the message → DLRS creates:
        </p>
        <ul>
          <li>Client: GB Banquet (auto-created if missing)</li>
          <li>Project: Social Media — GB (linked)</li>
          <li>3 Tasks with checklist, deadline Saturday, asset search queued</li>
          <li>Reminders: 7 days / 3 days / 1 day before + morning-of</li>
        </ul>

        <h2 id="step-1-create-workspace">Step 1 — Create Workspace</h2>
        <Callout type="info" title="Keyword: Workspace">
          <strong>Workspace</strong> = isolated container for all data (like a Slack workspace). Tenancy enforced: Workspace A never sees Workspace B's rows.
        </Callout>
        <Steps>
          <Step>
            <h3>Sign up / Log in</h3>
            <p>
              Open <code>http://localhost:3000</code> → Sign up with email → verify. You get a <code>users</code> row + session cookie (signed with{" "}
              <code>SESSION_SECRET</code>).
            </p>
          </Step>
          <Step>
            <h3>Create workspace</h3>
            <pre><code>{`Route: /workspaces/new
Input: "My Studio"  (or freelance name)
Result: /w/[workspace] → Today Executive Dashboard`}</code></pre>
            <p>
              Behind the scenes: creates <code>workspaces</code> + <code>workspace_members</code> (you = owner). ID is slug (e.g.{" "}
              <code>my-studio</code>). Used in every URL: <code>/w/my-studio/tasks</code>.
            </p>
          </Step>
        </Steps>

        <h2 id="step-2-create-client-project">Step 2 — Create Client &amp; Project</h2>
        <Tabs items={["Via UI (Beginner)", "Via AI (Advanced)"]}>
          <Tab value="Via UI (Beginner)">
            <Steps>
              <Step>
                <h3>Clients → New</h3>
                <pre><code>{`Name: GB Banquet
Type: Client
Contact: +91… (optional)`}</code></pre>
              </Step>
              <Step>
                <h3>Projects → New</h3>
                <pre><code>{`Name: Social Media — GB
Client: GB Banquet (dropdown)
Status: Active`}</code></pre>
              </Step>
            </Steps>
            <p>Creates <code>clients</code> + <code>projects</code> rows, both with <code>workspace_id</code>.</p>
          </Tab>
          <Tab value="Via AI (Advanced)">
            <p>Skip manual creation. Paste the same message in Inbox — AI will auto-create Client/Project if name matches existing or is new, with evidence.</p>
            <pre><code>{`Inbox → Paste → Extract
Detected: client=GB Banquet (new), project=GB (new) → [Create & Organize]
Creates rows + links in one go`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="step-3-capture-text-screenshot">Step 3 — Capture: Text / Screenshot / File</h2>
        <Callout title="Keyword: Universal Inbox">
          <strong>Inbox</strong> = single entry for all raw info. Keywords: <code>ingestion</code>, <code>extraction</code>, <code>entity</code>. Every capture goes through same pipeline.
        </Callout>
        <Tabs items={["Text Paste", "Screenshot / Image", "PDF / File", "Voice / URL"]}>
          <Tab value="Text Paste">
            <p>Inbox → textarea: paste any message.</p>
            <pre><code>{`Example:
"Please update pricing section on website by Thursday.
See pricing.pdf attached. High priority."`}</code></pre>
          </Tab>
          <Tab value="Screenshot / Image">
            <p>
              Drag screenshot of WhatsApp/Email. Uses <code>unpdf</code> + OCR path: image → text → entities. Try uploading{" "}
              <code>birthday.png</code> from repo.
            </p>
          </Tab>
          <Tab value="PDF / File">
            <p>Upload file → stored in <code>STORAGE_DIR/.storage</code> per workspace → parsed for tables/dates.</p>
          </Tab>
          <Tab value="Voice / URL">
            <p>Paste URL → fetch → extract. Voice → transcription → same extractor. All queued via <code>ioredis</code> job.</p>
          </Tab>
        </Tabs>

        <h2 id="step-4-review-ai-extraction">Step 4 — Review AI Extraction</h2>
        <Steps>
          <Step>
            <h3>Click Extract</h3>
            <p>Calls <code>POST /api/inbox</code> → queued → Inbox Agent + Task Agent run.</p>
            <pre><code>{`Input → Inbox Agent (classify)
→ Task Agent (client/project/task/requirements/deadline)
→ Relationship detection
→ Proposal`}</code></pre>
          </Step>
          <Step>
            <h3>Review modal</h3>
            <p>Shows:</p>
            <ul>
              <li>Client: GB Banquet ✓</li>
              <li>Project: Social Media ✓</li>
              <li>Tasks: 3 (reel 1/2/3) with checklist</li>
              <li>Deadline: Saturday 2025-12-06 (AI parses relative dates using <code>date-fns</code>)</li>
              <li>Assets: Drive search “GB-Dec-2025” queued</li>
              <li>Priority: High (due &lt;7d + buzzwords)</li>
              <li>Confidence: 92%</li>
            </ul>
          </Step>
          <Step>
            <h3>Create &amp; Organize</h3>
            <p>Creates <code>tasks</code> rows with <code>source_type=inbox</code>, <code>source_id</code>, <code>ai_confidence</code>. Attaches search placeholder for Drive.</p>
          </Step>
        </Steps>
        <Callout type="warn" title="Technical Deep-Dive">
          Extraction uses <code>@tanstack/ai</code> with provider <code>ANTHROPIC_API_KEY</code> etc. Fallback <code>heuristic</code> uses regex if no key. Evidence stored: <code>task_extractions</code> with <code>extracted_json</code> + <code>confidence</code>. Sensitive actions blocked until confirmation.
        </Callout>

        <h2 id="step-5-start-work-context-pack">Step 5 — Start Work &amp; Context Pack</h2>
        <Callout title="Keyword: Context Pack">
          <strong>Context Pack</strong> = auto-assembled workspace when you click <code>Start Work</code>. Contains brief, assets, emails, links, checklist — no searching.
        </Callout>
        <Steps>
          <Step>
            <h3>Open task</h3>
            <p>
              Tasks → click newly created task → Drawer opens (right). Shows <code>nextAction</code> AI-generated: “Download GB-Dec-2025 photos”.
            </p>
          </Step>
          <Step>
            <h3>Start Work</h3>
            <pre><code>{`Button: [Start Work]
Creates: work_sessions { task_id, started_at, user_id }
Updates: task.status → In Progress`}</code></pre>
          </Step>
          <Step>
            <h3>See Context Pack</h3>
            <p>Full page <code>/w/[workspace]/tasks/[id]</code> shows 2 columns:</p>
            <ul>
              <li><strong>Left — Context:</strong> Project, Client, Emails (Gmail), Files (Drive), Documents, Links</li>
              <li><strong>Right — Details:</strong> Priority score, Due date, Estimated minutes, Status, Assignee</li>
              <li>Checklist: ☑ Download assets ☐ Select photos ☐ Edit ☐ Export</li>
            </ul>
          </Step>
        </Steps>

        <h2 id="daily-flow-today">Daily Flow — Today</h2>
        <p>Route <code>/w/[workspace]/today</code> is your cockpit. It runs queries like:</p>
        <pre><code>{`🔴 Due today       → tasks WHERE due_date = today AND status NOT IN (Completed)
🟠 Due soon        → due within 3 days
🟡 Waiting         → status = Waiting (waiting_for person)
🟢 Completed       → completed_at = today`}</code></pre>
        <ul>
          <li><strong>Morning:</strong> Briefing at 08:00 via Reminder Agent (if enabled). Pick focus task.</li>
          <li><strong>During day:</strong> Work sessions timed. If idle 3h, nudge: “Continue GB reel?”</li>
          <li><strong>Evening:</strong> Wrap-up: completed / pending / blocked / tomorrow. One click to carry forward.</li>
        </ul>

        <h2 id="finance-in-2-minutes">Finance in 2 Minutes</h2>
        <Steps>
          <Step>
            <h3>Finance → Import</h3>
            <p>Upload password-protected PDF (e.g. SBI). Vault tries patterns: <code>DDMMYYYY</code>, <code>PAN+DOB</code>, phone.</p>
          </Step>
          <Step>
            <h3>Parse &amp; Categorize</h3>
            <pre><code>{`Parser (unpdf) → rows
Deterministic totals: opening + credits − debits = closing (validated)
AI → category: Food, Travel, Software, Bills…`}</code></pre>
          </Step>
          <Step>
            <h3>Review</h3>
            <p>Modal for low-confidence rows. Confirm → <code>transactions</code> + subscription detection (netflix, adobe…).</p>
          </Step>
        </Steps>
        <Callout type="warn" title="Security Note">
          Vault blobs AES-256 encrypted with <code>SECRET_ENCRYPTION_KEY</code>. Passwords tried in-memory, never logged.
        </Callout>

        <h2 id="keyboard-shortcuts-search">Keyboard Shortcuts &amp; Search</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Shortcut</th>
              <th className="text-left p-2">Action</th>
              <th className="text-left p-2">Keyword</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono">⌘ K</td>
              <td className="p-2">Command palette: “Show GB tasks”, “Create reminder”</td>
              <td className="p-2">Search Agent</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">D</td>
              <td className="p-2">Toggle dark/light (outside inputs)</td>
              <td className="p-2">Theme</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">/</td>
              <td className="p-2">Focus Inbox capture</td>
              <td className="p-2">Capture</td>
            </tr>
            <tr>
              <td className="p-2 font-mono">Ask in Inbox</td>
              <td className="p-2">“What did client say about food reel?” → provenance + snippet</td>
              <td className="p-2">Provenance</td>
            </tr>
          </tbody>
        </table>

        <h2 id="next-steps">Next Steps</h2>
        <Accordion>
          <AccordionItem value="next-1" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Connect Gmail &amp; Drive for full power</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              See <code>/docs/integrations/gmail</code> and <code>/docs/integrations/drive</code>. One OAuth, Drive indexing finds “latest logo” instantly.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="next-2" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Explore Automations</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <code>/docs/features/automations</code> — When due 2 days away → notify daily. When waiting 3 days → follow up.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="next-3" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Read Architecture before coding</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <code>/docs/architecture</code> explains DAL tenancy, job queue, and why AI not used for dates/math.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocsBody>
    </DocsPage>
  )
}
