import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "What is Universal Inbox?", url: "#what-is-universal-inbox", depth: 2 },
        { title: "Capture Modes — Every Input Type", url: "#capture-modes-every-input-type", depth: 2 },
        { title: "Extraction Pipeline (Step-by-Step)", url: "#extraction-pipeline-step-by-step", depth: 2 },
        { title: "AI Extraction — What Gets Extracted", url: "#ai-extraction-what-gets-extracted", depth: 2 },
        { title: "Review & Create Modal", url: "#review-create-modal", depth: 2 },
        { title: "Database & Storage", url: "#database-storage", depth: 2 },
        { title: "Tips for Best Results", url: "#tips-for-best-results", depth: 2 },
      ]}
    >
      <DocsTitle>Universal Inbox — Capture Anything</DocsTitle>
      <DocsDescription>
        One place for all raw information. Learn every capture mode, how AI extraction works, and how to get 95%+ accuracy — beginner to advanced.
      </DocsDescription>
      <DocsBody>
        <h2 id="what-is-universal-inbox">What is Universal Inbox?</h2>
        <Callout title="Beginner: Why Inbox?">
          Traditional apps force you to decide: “Is this a task? A note? An email?” In DLRS, you <strong>never decide</strong>. You dump raw info into Inbox (like a physical inbox tray). The system classifies it — task, invoice, meeting, or personal — and routes it.
        </Callout>
        <p>
          UI: <code>/w/[workspace]/inbox</code> — textarea + 5 capture buttons. API: <code>POST /api/inbox</code>. Every item becomes{" "}
          <code>inbox_items</code> row with <code>workspace_id, content, type, created_at</code>.
        </p>
        <p>Keywords: <code>inbox_items</code>, <code>ingestion pipeline</code>, <code>entity extraction</code>, <code>provenance</code>.</p>

        <h2 id="capture-modes-every-input-type">Capture Modes — Every Input Type</h2>
        <Tabs items={["Text Paste", "Screenshot / Image", "PDF / Document", "File Upload", "Voice & URL"]}>
          <Tab value="Text Paste">
            <h3>Plain Text / Chat Message</h3>
            <p>Paste any message, brief, or note. Most accurate mode.</p>
            <pre><code>{`Example inputs that work well:
- "Need 3 reels for GB Banquet by Friday. Use new logo from Drive."
- "Client XYZ wants pricing section updated by Thursday. See pricing.pdf"
- "Tanniaqua product launch — need LinkedIn post with new photo, due Friday"
- "Remind me to call Sarah about GB invoice tomorrow 10am"`}</code></pre>
            <p>Behind: direct to Inbox Agent → entity extraction.</p>
          </Tab>
          <Tab value="Screenshot / Image">
            <h3>Screenshot, WhatsApp Image, Photo</h3>
            <Steps>
              <Step>
                <p>Drag or paste image. Stored in <code>STORAGE_DIR/inbox/&lt;workspace&gt;/&lt;id&gt;.png</code>.</p>
              </Step>
              <Step>
                <p>OCR path: image → Document Agent (vision or unpdf text layer) → text → same extractor.</p>
              </Step>
              <Step>
                <p>
                  Best for: client briefs sent as image, phone screenshots. Tip: ensure text is readable, avoid blurry images. For best accuracy,
                  also paste the text if possible.
                </p>
              </Step>
            </Steps>
          </Tab>
          <Tab value="PDF / Document">
            <h3>PDF, DOCX, XLSX</h3>
            <p>Upload via Inbox file button or Gmail attachment. Parsed by <code>unpdf</code>:</p>
            <ul>
              <li>Extracts text + tables + dates (e.g., 15-page brief → requirements list).</li>
              <li>Stores original file in <code>files</code> table, linked to <code>inbox_items</code>.</li>
              <li>Document Agent summarizes, extracts tables like “Requirements | Deliverable | Due”.</li>
            </ul>
            <pre><code>{`Example: Client sends 10-page PDF brief
→ Extracts: client=Acme, project=Website, tasks=[Design, Develop, SEO], dates, budget
→ Creates 3 tasks + links PDF`}</code></pre>
          </Tab>
          <Tab value="File Upload">
            <h3>Any File (Image, Video, Zip)</h3>
            <p>
              Uploaded to <code>POST /api/inbox/upload</code> → <code>STORAGE_DIR</code>. If image/PDF, parsed; if video/zip, stored with description you
              provide, linked to task via AI.
            </p>
          </Tab>
          <Tab value="Voice & URL">
            <h3>Voice & URL</h3>
            <ul>
              <li><strong>Voice:</strong> Record in Inbox → transcription (via provider) → text → extraction.</li>
              <li><strong>URL:</strong> Paste link → fetch HTML → extract → create task with <code>task_links</code>.</li>
              <li><strong>Gmail:</strong> Forward email or connect Gmail (see Integrations) — auto-ingested via webhook.</li>
            </ul>
          </Tab>
        </Tabs>

        <h2 id="extraction-pipeline-step-by-step">Extraction Pipeline (Step-by-Step)</h2>
        <div className="not-prose my-6 rounded-2xl border bg-fd-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-fd-popover px-3 py-1 shadow-sm">User Action</span>
            <span className="text-fd-muted-foreground">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-fd-popover px-3 py-1 shadow-sm">API</span>
            <span className="text-fd-muted-foreground">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-fd-popover px-3 py-1 shadow-sm">Job Queue</span>
            <span className="text-fd-muted-foreground">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-fd-primary px-3 py-1 font-semibold text-fd-primary-foreground shadow-sm">Agents</span>
          </div>
          <div className="mt-4 grid gap-3 pl-2 sm:pl-4">
            <div className="relative border-l border-dashed border-fd-border pl-4 sm:pl-6">
              <div className="absolute -left-1.5 top-2 size-3 rounded-full border-2 border-fd-primary bg-fd-background" />
              <div className="rounded-xl border bg-fd-popover p-3 shadow-sm">
                <div className="text-xs font-semibold">Worker <span className="font-mono text-fd-muted-foreground">(npm run worker)</span></div>
                <div className="mt-2 grid gap-1.5">
                  <div className="flex items-center gap-2 rounded-lg bg-fd-muted/50 px-2.5 py-1.5 text-xs"><span className="size-1.5 rounded-full bg-violet-500" /> Inbox Agent: classify → extract entities</div>
                  <div className="flex items-center gap-2 rounded-lg bg-fd-muted/50 px-2.5 py-1.5 text-xs"><span className="size-1.5 rounded-full bg-emerald-500" /> Task Agent: prioritize, deadline, dependencies</div>
                  <div className="flex items-center gap-2 rounded-lg bg-fd-muted/50 px-2.5 py-1.5 text-xs"><span className="size-1.5 rounded-full bg-sky-500" /> Drive Agent: queue asset search</div>
                </div>
              </div>
            </div>
            <div className="relative border-l border-dashed border-fd-border pl-4 sm:pl-6">
              <div className="absolute -left-1.5 top-2 size-3 rounded-full border-2 border-fd-primary bg-fd-background" />
              <div className="rounded-xl border bg-fd-popover p-3 shadow-sm">
                <div className="font-mono text-xs font-semibold">POST /api/inbox {"{ content, type: 'text' | 'image' | 'file' }"}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-fd-muted-foreground">
                  <span className="rounded-full bg-fd-muted px-2 py-0.5">→ Create inbox_items row</span>
                  <span className="rounded-full bg-fd-muted px-2 py-0.5">→ Enqueue job id=extract_123</span>
                </div>
              </div>
            </div>
            <div className="relative border-l border-dashed border-fd-border pl-4 sm:pl-6">
              <div className="absolute -left-1.5 top-2 size-3 rounded-full bg-fd-primary" />
              <div className="rounded-xl border bg-fd-primary p-3 text-fd-primary-foreground shadow-sm">
                <div className="text-xs font-semibold">Click [Extract] in UI</div>
                <div className="text-xs opacity-90">→ polls job_runs until done</div>
              </div>
            </div>
          </div>
        </div>
        <Steps>
          <Step>
            <h3>Ingestion</h3>
            <pre><code>{`Route: app/api/inbox/route.ts
- Validate with Zod: { content: string, source_type?: string }
- Check workspace tenancy via lib/auth/dal
- Create inbox_items + job in Redis (ioredis)`}</code></pre>
          </Step>
          <Step>
            <h3>AI Extraction (Inbox Agent)</h3>
            <p>
              Prompt includes: role “Extract client, project, tasks, requirements, deadline, people, links, priority from this content”. Returns
              JSON validated by Zod.
            </p>
            <pre><code>{`Output: {
  client: "GB Banquet",
  project: "Social Media",
  tasks: [{ title: "Event highlights reel", requirements: ["Use latest logo"], estimatedMinutes: 90 }],
  deadline: "2025-12-06",  // parsed via date-fns
  people: ["Sarah"],
  priority: "high",
  confidence: 0.92
}`}</code></pre>
            <p>
              Provider: <code>ANTHROPIC_API_KEY</code> etc., fallback <code>heuristic</code> = regex for dates/people. Evidence saved in
              <code>task_extractions</code>.
            </p>
          </Step>
          <Step>
            <h3>Proposal &amp; Confirmation</h3>
            <p>Result shown in Review modal. Safe auto-actions (create task) wait for Confirm; sensitive (send email) require explicit approval.</p>
          </Step>
        </Steps>

        <h2 id="ai-extraction-what-gets-extracted">AI Extraction — What Gets Extracted</h2>
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Field</th>
              <th className="p-2 text-left">How Detected</th>
              <th className="p-2 text-left">Example</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2 font-mono">client</td>
              <td className="p-2">LLM NER + existing clients table match</td>
              <td className="p-2">“for GB Banquet” → GB Banquet</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-mono">project</td>
              <td className="p-2">Keyword + client context</td>
              <td className="p-2">“Social Media” → Social Media — GB</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-mono">tasks[]</td>
              <td className="p-2">Sentence segmentation + action verbs</td>
              <td className="p-2">“Make 3 reels” → 3 tasks</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-mono">deadline</td>
              <td className="p-2">date-fns parse + relative (“Friday” → 2025-12-06)</td>
              <td className="p-2">“before Saturday”</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-mono">priority</td>
              <td className="p-2">Heuristic: due &lt;3d, words “urgent”, client importance</td>
              <td className="p-2">high / medium / low</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-mono">people</td>
              <td className="p-2">NER for names/emails</td>
              <td className="p-2">“Sarah” → people[0]</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-mono">requirements</td>
              <td className="p-2">Checklist items, “use logo”, “add music”</td>
              <td className="p-2">Checklist generation</td>
            </tr>
          </tbody>
        </table>

        <h2 id="review-create-modal">Review &amp; Create Modal</h2>
        <Steps>
          <Step>
            <h3>Review Screen Shows</h3>
            <ul>
              <li>Detected Client/Project (editable dropdown)</li>
              <li>Tasks list with title, description, checklist, estimated minutes (90)</li>
              <li>Deadline with calendar picker (AI suggestion shown, you can override)</li>
              <li>Assets: Drive search results (if connected)</li>
              <li>Confidence badge (e.g., 92% — low if ambiguous)</li>
            </ul>
          </Step>
          <Step>
            <h3>Click Create &amp; Organize</h3>
            <pre><code>{`Creates:
- clients (if new)
- projects (if new)
- tasks[] with { workspace_id, project_id, client_id, title, due_date, priority, source_type: "inbox", source_id, ai_confidence }
- task_checklist_items
- job to index for search`}</code></pre>
          </Step>
        </Steps>

        <h2 id="database-storage">Database &amp; Storage</h2>
        <pre><code>{`Tables:
- inbox_items: id, workspace_id, content, type, created_at
- task_extractions: id, inbox_item_id, extracted_json, confidence, model
- tasks: as above + next_action AI, priority_score

Storage:
- STORAGE_DIR/.storage/<workspace>/inbox/<id>.png
- Pluggable adapter: lib/storage (local → R2)

Queue:
- Redis key: queue:extract → worker picks → job_runs logs`}</code></pre>

        <h2 id="tips-for-best-results">Tips for Best Results</h2>
        <Accordion>
          <AccordionItem value="tip1" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Be Specific with Deadlines</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p>
                “Friday” is parsed as next Friday. Better: “Friday 6 Dec 5pm”. The system uses <code>date-fns</code> with workspace timezone
                (default Asia/Kolkata). You can always override in Review modal.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="tip2" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Include Client/Project Names Explicitly</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p>
                “For GB Banquet” → exact match to existing client. If ambiguous (“GB” could be GB Banquet or Green Bowl), Review modal lets you
                pick. Pro tip: keep client names short and unique.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="tip3" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">One Message, Multiple Tasks</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p>
                Paste “Make 3 reels: event highlights / decoration / food” → AI creates 3 separate tasks with shared deadline. Better than one giant
                task with vague description.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocsBody>
    </DocsPage>
  )
}
