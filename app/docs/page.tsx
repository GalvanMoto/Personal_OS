import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Card, Cards } from "fumadocs-ui/components/card"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { FileText, Camera, Link2, Mic, Mail, Upload, Forward, Smartphone, Inbox, AtSign, HardDrive, FileSearch, ShieldCheck, AlertTriangle, Check, Brain } from "lucide-react"
import { Step, Steps } from "fumadocs-ui/components/steps"
import Link from "next/link"

export default function Page() {
  const toc = [
    { title: "What is DLRS Personal OS?", url: "#what-is-dlrs-personal-os", depth: 2 },
    { title: "Core Philosophy", url: "#core-philosophy", depth: 2 },
    { title: "How It Works - The Three-Layer Flow", url: "#how-it-works-the-three-layer-flow", depth: 2 },
    { title: "Key Concepts for Beginners", url: "#key-concepts-for-beginners", depth: 2 },
    { title: "The 8 Core Modules", url: "#the-8-core-modules", depth: 2 },
    { title: "Tech Stack Overview", url: "#tech-stack-overview", depth: 2 },
    { title: "Getting Started Path", url: "#getting-started-path", depth: 2 },
  ]

  return (
    <DocsPage toc={toc}>
      <DocsTitle>DLRS — Personal OS Documentation</DocsTitle>
      <DocsDescription>
        Complete technical documentation for DLRS Personal OS - an autonomous AI-powered personal operating system.
        Capture via screenshot, email, or voice — AI extracts tasks, links Drive assets, and plans your day.
      </DocsDescription>

      <DocsBody>
        <Callout title="Who is this for?">
          This documentation is written for **developers of all levels**. Whether you're new to Next.js/TypeScript or an experienced engineer,
          each section includes beginner-friendly explanations alongside technical depth. Look for "Beginner Tip" and "Technical Deep-Dive" callouts.
        </Callout>

        <h2 id="what-is-dlrs-personal-os">What is DLRS Personal OS?</h2>
        <p>
          <strong>DLRS Personal OS</strong> (Personal Operating System) is an AI-assisted productivity platform that acts as your
          <em>digital chief of staff</em>. Unlike traditional task managers where you manually create, organize, and maintain everything,
          DLRS inverts the model: <strong>you provide raw information, the system does the organizing.</strong>
        </p>

        <div className="not-prose my-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-fd-card p-4">
            <p className="text-sm font-semibold text-fd-primary">Traditional Tools (Notion, Todoist, ClickUp)</p>
            <ul className="text-sm text-fd-muted-foreground mt-2 list-disc pl-4 space-y-1">
              <li>You create projects, tasks, deadlines manually</li>
              <li>You attach files, links, emails one by one</li>
              <li>You set reminders, recurring tasks yourself</li>
              <li>Context switching between apps</li>
              <li>Information lives in silos</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-fd-card p-4">
            <p className="text-sm font-semibold text-emerald-500">DLRS Personal OS</p>
            <ul className="text-sm text-fd-muted-foreground mt-2 list-disc pl-4 space-y-1">
              <li>Paste a screenshot → AI extracts client, project, 3 tasks, deadline</li>
              <li>Forward an email → System creates tasks, finds Drive assets, schedules reminders</li>
              <li>Upload a bank statement → Auto-categorizes transactions, detects subscriptions</li>
              <li>Ask "What should I do now?" → Gets prioritized recommendation with context</li>
              <li>Everything connected in one unified graph</li>
            </ul>
          </div>
        </div>

        <h2 id="core-philosophy">Core Philosophy</h2>
        <p>DLRS is built on five principles:</p>

        <Steps>
          <Step>
            <h3>1. Capture Everything</h3>
            <p>Zero-friction input: text, screenshot, PDF, voice, email, URL, file upload. One universal Inbox — no deciding "where does this go?"</p>
          </Step>
          <Step>
            <h3>2. Understand Automatically</h3>
            <p>Specialized AI agents classify content, extract entities (client → project → task → deadline → people → priority), and detect relationships.</p>
          </Step>
          <Step>
            <h3>3. Connect Everything</h3>
            <p>Tasks, emails, files, clients, projects, calendar events, and financial records form a single relationship graph. No more silos.</p>
          </Step>
          <Step>
            <h3>4. Act Proactively</h3>
            <p>Morning briefings, at-risk alerts, subscription renewal warnings, follow-up reminders — the system surfaces what needs attention before you ask.</p>
          </Step>
          <Step>
            <h3>5. Keep Humans in Control</h3>
            <p>AI recommends and organizes; sensitive actions (send email, delete file, modify finances) require explicit approval. Full audit trail for every action.</p>
          </Step>
        </Steps>

        <h2 id="how-it-works-the-three-layer-flow">How It Works — The Three-Layer Flow</h2>
        <p>Every piece of information flows through three stages:</p>

        <Tabs items={["Layer 1: Capture", "Layer 2: Intelligence", "Layer 3: Action"]}>
          <Tab value="Layer 1: Capture">
            <h4>Universal Inbox — Single Entry Point</h4>
            <div className="not-prose my-4 rounded-2xl border bg-fd-card p-4 shadow-sm">
              <div className="rounded-xl border bg-fd-popover p-3 text-center">
                <div className="text-sm font-bold tracking-wide">UNIVERSAL INBOX</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="flex flex-col items-center gap-1.5 rounded-lg bg-fd-muted/40 px-2 py-2.5"><FileText className="size-4 text-sky-500" /><span>Text</span></div>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg bg-fd-muted/40 px-2 py-2.5"><Camera className="size-4 text-violet-500" /><span>Screenshot</span></div>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg bg-fd-muted/40 px-2 py-2.5"><FileText className="size-4 text-orange-500" /><span>PDF / Doc</span></div>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg bg-fd-muted/40 px-2 py-2.5"><Link2 className="size-4 text-blue-500" /><span>URL</span></div>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg bg-fd-muted/40 px-2 py-2.5"><Mic className="size-4 text-rose-500" /><span>Voice</span></div>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg bg-fd-muted/40 px-2 py-2.5"><Mail className="size-4 text-red-500" /><span>Email (Gmail)</span></div>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg bg-fd-muted/40 px-2 py-2.5"><Upload className="size-4 text-emerald-500" /><span>File Upload</span></div>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg bg-fd-muted/40 px-2 py-2.5"><Forward className="size-4 text-amber-500" /><span>Forwarded</span></div>
                  <div className="flex flex-col items-center gap-1.5 rounded-lg bg-fd-muted/30 px-2 py-2.5 opacity-70"><Smartphone className="size-4" /><span>Telegram (future)</span></div>
                </div>
              </div>
              <div className="flex flex-col items-center py-3">
                <div className="h-6 w-px bg-fd-border" />
                <div className="flex size-7 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground shadow-sm">▼</div>
                <div className="mt-2 rounded-full border bg-fd-popover px-3 py-1 text-xs font-medium">Ingestion Pipeline</div>
                <div className="mt-1 font-mono text-xs text-fd-muted-foreground">(OCR → Text Extraction → Queue)</div>
              </div>
            </div>
            <p><strong>Key point:</strong> You never "create a task." You dump information. The system figures out the rest.</p>
          </Tab>
          <Tab value="Layer 2: Intelligence">
            <h4>Multi-Agent Processing</h4>
            <div className="not-prose my-4 space-y-3">
              <div className="text-center text-xs font-medium text-fd-muted-foreground">Orchestrator routes to specialized agents</div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border bg-fd-popover p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-semibold"><Inbox className="size-4 text-violet-500" /> Inbox Agent</div>
                  <ul className="mt-2 list-disc pl-4 text-xs leading-relaxed text-fd-muted-foreground"><li>Classify</li><li>Extract entities</li><li>Detect relationships</li></ul>
                </div>
                <div className="rounded-xl border bg-fd-popover p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-semibold"><AtSign className="size-4 text-sky-500" /> Email Agent</div>
                  <ul className="mt-2 list-disc pl-4 text-xs leading-relaxed text-fd-muted-foreground"><li>Ingest Gmail</li><li>Classify (task, invoice, meeting)</li></ul>
                </div>
                <div className="rounded-xl border bg-fd-popover p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-semibold"><HardDrive className="size-4 text-emerald-500" /> Drive Agent</div>
                  <ul className="mt-2 list-disc pl-4 text-xs leading-relaxed text-fd-muted-foreground"><li>Index files</li><li>Link to projects/clients</li><li>Extract text</li></ul>
                </div>
              </div>
              <div className="flex justify-center"><div className="h-6 w-px bg-fd-border" /></div>
              <div className="mx-auto max-w-[280px] rounded-xl border bg-fd-popover p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-sm font-semibold"><FileSearch className="size-4 text-orange-500" /> Document Agent</div>
                <ul className="mt-1 list-disc pl-4 text-xs text-fd-muted-foreground"><li>Parse PDF/DOC</li><li>Tables, dates, requirements</li></ul>
              </div>
              <div className="flex justify-center"><div className="h-4 w-px bg-fd-border" /></div>
              <div className="mx-auto max-w-[280px] rounded-xl border bg-fd-popover p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-sm font-semibold"><Brain className="size-4 text-amber-500" /> Finance Agent</div>
                <ul className="mt-1 list-disc pl-4 text-xs text-fd-muted-foreground"><li>Bank statement</li><li>Categorize</li><li>Subscriptions</li></ul>
              </div>
            </div>
          </Tab>
          <Tab value="Layer 3: Action">
            <h4>Orchestrator Executes</h4>
            <div className="not-prose my-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-emerald-500/5 p-4">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400"><ShieldCheck className="size-4" /> Safe (auto-execute)</div>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed">
                  <li className="flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />Create task, project, client</li>
                  <li className="flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />Extract deadline, priority</li>
                  <li className="flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />Categorize email/transaction</li>
                  <li className="flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />Create reminder, note</li>
                  <li className="flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />Attach file, link Drive folder</li>
                  <li className="flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />Index for search</li>
                </ul>
              </div>
              <div className="rounded-2xl border bg-amber-500/5 p-4">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400"><AlertTriangle className="size-4" /> Sensitive (require confirmation)</div>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed">
                  <li className="flex gap-1.5"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />Send email</li>
                  <li className="flex gap-1.5"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />Delete file/email</li>
                  <li className="flex gap-1.5"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />Modify financial records</li>
                  <li className="flex gap-1.5"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />Cancel subscription</li>
                  <li className="flex gap-1.5"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />Make payment</li>
                  <li className="flex gap-1.5"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />Change deadline on blocked task</li>
                </ul>
              </div>
            </div>
            <div className="not-prose rounded-xl border bg-fd-muted/30 px-3 py-2 text-center text-xs font-medium">Result: Structured records + Context Pack + Notifications</div>
          </Tab>
        </Tabs>

        <h2 id="key-concepts-for-beginners">Key Concepts for Beginners</h2>

        <Callout type="info" title="Beginner Glossary">
          <strong>Workspace</strong> — Your isolated data container. Like a "team" in Slack. All data (tasks, clients, emails) belongs to one workspace.
          <br/><br/>
          <strong>Context Pack</strong> — When you open a task, the system auto-assembles everything related: brief, assets, emails, files, checklist. You don't search; it's just there.
          <br/><br/>
          <strong>Agent</strong> — A specialized AI worker with specific tools. Inbox Agent handles capture; Finance Agent handles bank statements; etc.
          <br/><br/>
          <strong>Orchestrator</strong> — The "manager" agent that decides which agent handles your request and coordinates multi-agent workflows.
          <br/><br/>
          <strong>Provenance/Source</strong> — Every fact knows where it came from. "Deadline: Friday" → Source: "Gmail ID abc123, confidence 94%".
          <br/><br/>
          <strong>Tenancy</strong> — Database-level isolation. Workspace A can never see Workspace B's data. Enforced at query level.
        </Callout>

        <h2 id="the-8-core-modules">The 8 Core Modules</h2>
        <p>These aren't separate apps — they're <strong>views over one unified graph</strong>:</p>

        <Cards>
          <Card
            title="🧠 Personal Intelligence"
            description="Assistant, Memory, Search, Context Engine, Recommendations. Ask 'What should I do now?' → scored recommendation."
            href="/docs/agents"
          />
          <Card
            title="💼 Work Management"
            description="Tasks, Projects, Clients, Dependencies, Deadlines, Work sessions, Milestones, At-risk calculation."
            href="/docs/features/tasks"
          />
          <Card
            title="📥 Inbox & Capture"
            description="Text, Screenshot, File, PDF, URL, Voice, AI extraction, Relationship detection — all in one place."
            href="/docs/features/inbox"
          />
          <Card
            title="📧 Communication"
            description="Gmail ingestion, Reply generation, Follow-ups, People, Attachments — classified, not just dumped."
            href="/docs/integrations/gmail"
          />
          <Card
            title="📚 Knowledge & Files"
            description="Drive indexing, Documents, Notes, Context Packs, Personal search across all sources."
            href="/docs/features/files"
          />
          <Card
            title="📅 Calendar & Planning"
            description="Events, Meetings, Time planning, Daily briefing, Conflict detection, Commitment graph."
            href="/docs/features/calendar"
          />
          <Card
            title="💰 Finance"
            description="Accounts, Transactions, Expenses, Subscriptions, Invoices, Vault-encrypted statements."
            href="/docs/features/finance"
          />
          <Card
            title="⚙️ Automation & System"
            description="Agents, Automations, Jobs, Reminders, Notifications, Integrations, Audit log."
            href="/docs/features/automations"
          />
        </Cards>

        <h2 id="tech-stack-overview">Tech Stack Overview</h2>

        <Tabs items={["Frontend", "Backend", "AI & Agents", "Infrastructure"]}>
          <Tab value="Frontend">
            <ul>
              <li><strong>Next.js 16.2</strong> (App Router, React 19, Turbopack)</li>
              <li><strong>Tailwind CSS v4</strong> + <strong>shadcn/ui base-mira</strong></li>
              <li><strong>Fumadocs UI</strong> (Docs layout, Glass theme components)</li>
              <li><strong>PWA</strong> (Service Worker, installable, offline-ready)</li>
              <li><strong>next-themes</strong> (Dark/light mode, system sync)</li>
            </ul>
          </Tab>
          <Tab value="Backend">
            <ul>
              <li><strong>Prisma 7.10</strong> + <strong>@prisma/adapter-pg</strong> (PostgreSQL)</li>
              <li><strong>DAL (Data Access Layer)</strong> with tenancy guards</li>
              <li><strong>ioredis</strong> (Pub/sub for realtime badges, notifications)</li>
              <li><strong>Next.js Route Handlers</strong> (/api/*)</li>
              <li><strong>File storage</strong> (Local FS, pluggable to R2/S3)</li>
            </ul>
          </Tab>
          <Tab value="AI & Agents">
            <ul>
              <li><strong>@tanstack/ai</strong> (Agent framework, tool calling)</li>
              <li><strong>Providers:</strong> Anthropic (Claude), OpenAI, Gemini, Azure OpenAI</li>
              <li><strong>Heuristic fallback</strong> (no API key needed for basic extraction)</li>
              <li><strong>unpdf</strong> (PDF text/table extraction)</li>
              <li><strong>Deterministic core</strong> for dates, math, cron — AI only for understanding</li>
            </ul>
          </Tab>
          <Tab value="Infrastructure">
            <ul>
              <li><strong>PostgreSQL</strong> (Prisma Postgres or self-hosted)</li>
              <li><strong>Redis</strong> (Upstash or local) — live sync, job queue</li>
              <li><strong>Docker</strong> ready for deployment</li>
              <li><strong>GitHub Actions</strong> CI/CD ready</li>
              <li><strong>Telegram Bot API</strong> (future) for mobile capture</li>
            </ul>
          </Tab>
        </Tabs>

        <h2 id="getting-started-path">Getting Started Path</h2>
        <p>Follow this sequence for the smoothest onboarding:</p>

        <Steps>
          <Step>
            <h3><Link href="/docs/installation">1. Installation</Link></h3>
            <p>Prerequisites, environment setup, database, Redis, and running locally.</p>
          </Step>
          <Step>
            <h3><Link href="/docs/quick-start">2. Quick Start</Link></h3>
            <p>Create workspace, capture first item, see AI extraction, open Context Pack.</p>
          </Step>
          <Step>
            <h3><Link href="/docs/architecture">3. Architecture</Link></h3>
            <p>Understand the data flow, agent system, and entity graph.</p>
          </Step>
          <Step>
            <h3><Link href="/docs/features/inbox">4. Deep Dive: Inbox</Link></h3>
            <p>Master capture modes, extraction review, and automation.</p>
          </Step>
          <Step>
            <h3><Link href="/docs/features/tasks">5. Deep Dive: Tasks</Link></h3>
            <p>Statuses, priority scoring, Context Packs, work sessions.</p>
          </Step>
          <Step>
            <h3><Link href="/docs/integrations/gmail">6. Connect Integrations</Link></h3>
            <p>Gmail, Drive, Calendar OAuth setup and what each unlocks.</p>
          </Step>
        </Steps>

        <Callout title="Need help?">
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li><Link href="/docs/api" className="underline">API Reference</Link> — All endpoints with examples</li>
            <li><Link href="/docs/security" className="underline">Security & Database</Link> — Tenancy, vault, audit</li>
            <li><Link href="/docs/changelog" className="underline">Changelog</Link> — What's new in each version</li>
          </ul>
        </Callout>
      </DocsBody>
    </DocsPage>
  )
}