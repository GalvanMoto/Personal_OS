import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Step, Steps } from "fumadocs-ui/components/steps"
import {
  MonitorSmartphone,
  Server,
  Bot,
  Brain,
  Database,
  Layers,
  ArrowDown,
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  CreditCard,
  FileText,
  Link2,
  StickyNote,
  ListChecks,
  Clock3,
  Network,
  Mail,
  Paperclip,
  Bell,
  ScrollText,
  Workflow,
} from "lucide-react"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "High-Level System", url: "#high-level-system", depth: 2 },
        { title: "Tech Stack: Every Layer Explained", url: "#tech-stack-every-layer-explained", depth: 2 },
        { title: "Entity Graph — How Everything Connects", url: "#entity-graph-how-everything-connects", depth: 2 },
        { title: "Data Flow: Capture → Intelligence → Action", url: "#data-flow-capture-intelligence-action", depth: 2 },
        { title: "Orchestrator & 9 Agents", url: "#orchestrator-9-agents", depth: 2 },
        { title: "Permissions & Safety", url: "#permissions-safety", depth: 2 },
        { title: "Context Engine & Packs", url: "#context-engine-packs", depth: 2 },
        { title: "Priority Scoring & At-Risk", url: "#priority-scoring-at-risk", depth: 2 },
        { title: "Jobs, Queue & Tenancy", url: "#jobs-queue-tenancy", depth: 2 },
        { title: "Why Deterministic > AI for Some Tasks", url: "#why-deterministic-ai-for-some-tasks", depth: 2 },
      ]}
    >
      <DocsTitle>Architecture — Full System Design</DocsTitle>
      <DocsDescription>
        Beginner to advanced: how DLRS works end-to-end. Covers every module, data flow, database, agents, and design decisions with keywords explained.
      </DocsDescription>
      <DocsBody>
        <h2 id="high-level-system">High-Level System</h2>
        <div className="not-prose my-6 rounded-2xl border bg-gradient-to-br from-fd-card via-fd-card to-fd-muted/30 p-4 sm:p-6 shadow-sm">
          {/* Top */}
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-fd-primary px-4 py-1.5 text-sm font-semibold text-fd-primary-foreground shadow-sm">
              <Layers className="size-4" />
              DLRS Personal OS
            </div>
            <div className="h-6 w-px bg-fd-border" />
            <div className="h-px w-full max-w-3xl bg-fd-border" />
            <div className="grid w-full max-w-3xl grid-cols-3 gap-2 sm:gap-4">
              <div className="flex justify-center">
                <div className="h-6 w-px bg-fd-border" />
              </div>
              <div className="flex justify-center">
                <div className="h-6 w-px bg-fd-border" />
              </div>
              <div className="flex justify-center">
                <div className="h-6 w-px bg-fd-border" />
              </div>
            </div>
          </div>

          {/* Three columns */}
          <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-fd-popover p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MonitorSmartphone className="size-4 text-indigo-500" />
                Web App (PWA)
              </div>
              <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">
                Next.js 16 + React 19 + Tailwind + shadcn
              </div>
              <div className="mt-2 inline-flex items-center rounded-full bg-fd-muted px-2 py-0.5 text-[10px] font-medium">App Router</div>
            </div>
            <div className="rounded-xl border bg-fd-popover p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Server className="size-4 text-emerald-500" />
                API (/api/*)
              </div>
              <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">Tenancy Guards (DAL)</div>
              <div className="mt-2 inline-flex items-center rounded-full bg-fd-muted px-2 py-0.5 text-[10px] font-medium">Route handlers</div>
            </div>
            <div className="rounded-xl border bg-fd-popover p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bot className="size-4 text-violet-500" />
                Assistant
              </div>
              <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">Multi-Agent System (9 agents)</div>
              <div className="mt-2 inline-flex items-center rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-300">
                Orchestrator
              </div>
            </div>
          </div>

          {/* Converge */}
          <div className="mx-auto flex w-full max-w-3xl justify-center">
            <div className="grid w-full grid-cols-3 gap-2 sm:gap-4">
              <div className="flex justify-center">
                <div className="h-6 w-px bg-fd-border" />
              </div>
              <div className="flex justify-center">
                <div className="h-6 w-px bg-fd-border" />
              </div>
              <div className="flex justify-center">
                <div className="h-6 w-px bg-fd-border" />
              </div>
            </div>
          </div>
          <div className="mx-auto h-px w-full max-w-3xl bg-fd-border" />
          <div className="flex justify-center">
            <div className="flex h-6 w-px bg-fd-border" />
          </div>
          <div className="flex justify-center">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground shadow-sm">
              <ArrowDown className="size-3.5" />
            </div>
          </div>

          {/* Middle layers */}
          <div className="mx-auto mt-2 flex w-full max-w-xl flex-col items-center gap-2">
            <div className="w-full rounded-xl border bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-emerald-500/10 p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                <Brain className="size-4 text-violet-500" />
                Intelligence Layer
              </div>
              <div className="mt-1 text-xs text-fd-muted-foreground">Agents · Extraction · Scoring · Context Engine</div>
            </div>
            <div className="h-6 w-px bg-fd-border" />
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground shadow-sm">
              <ArrowDown className="size-3.5" />
            </div>
            <div className="w-full rounded-xl border bg-fd-popover p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                <Database className="size-4 text-emerald-600" />
                PostgreSQL (Prisma 7.10)
              </div>
              <div className="text-xs text-fd-muted-foreground">+ @prisma/adapter-pg · DAL tenancy guards</div>
            </div>
            <div className="h-6 w-px bg-fd-border" />
            <div className="w-full rounded-xl border border-dashed bg-fd-muted/40 p-3 text-center">
              <div className="text-sm font-semibold">Background Job Queue</div>
              <div className="text-xs text-fd-muted-foreground">ioredis · extract · gmail_ingest · reminders</div>
              <div className="mt-2 text-[10px] font-mono text-fd-muted-foreground">npm run worker</div>
            </div>
          </div>
        </div>
        <Callout title="Beginner: Monolith vs Platform">
          DLRS is a <strong>Next.js monolith</strong> that acts like a platform: web app, API, and agents live together for simplicity, but
          background jobs run separately via Redis queue. No microservices complexity for beginners.
        </Callout>

        <h2 id="tech-stack-every-layer-explained">Tech Stack: Every Layer Explained</h2>
        <Tabs items={["Frontend (What User Sees)", "Backend (API & DB)", "AI & Extraction", "Realtime & Storage"]}>
          <Tab value="Frontend (What User Sees)">
            <ul>
              <li>
                <strong>Next.js 16.2 (App Router)</strong> — File-based routing: <code>app/w/[workspace]/tasks/page.tsx</code> becomes{" "}
                <code>/w/my-studio/tasks</code>. Server Components by default, Client Components with <code>"use client"</code>.
              </li>
              <li>
                <strong>React 19.2</strong> — UI library. Tailwind handles styling.
              </li>
              <li>
                <strong>Tailwind CSS v4</strong> — Utility classes (<code>flex p-4 bg-muted</code>) compiled via <code>@tailwindcss/postcss</code>.
              </li>
              <li>
                <strong>shadcn/base-mira</strong> — Pre-built components (<code>Button, Card, Dialog</code>) in{" "}
                <code>components/ui</code>. Customizable via CSS vars in <code>app/globals.css</code>.
              </li>
              <li>
                <strong>Fumadocs UI</strong> — Docs theme (this site). Imports <code>fumadocs-ui/css/shadcn.css</code> +{" "}
                <code>preset.css</code>.
              </li>
              <li>
                <strong>PWA</strong> — <code>public/manifest.json</code> + <code>public/sw.js</code> make it installable on phone/desktop, offline queue.
              </li>
              <li>
                <strong>next-themes</strong> — Light/dark toggle (`D` hotkey), <code>ThemeProvider</code> in <code>app/layout.tsx</code>.
              </li>
            </ul>
          </Tab>
          <Tab value="Backend (API & DB)">
            <ul>
              <li>
                <strong>Next.js Route Handlers</strong> — <code>app/api/*</code> folders export <code>GET/POST</code> functions.
              </li>
              <li>
                <strong>Prisma 7.10</strong> — ORM: define schema in <code>prisma/schema.prisma</code>, generate client, migrations.
              </li>
              <li>
                <strong>@prisma/adapter-pg</strong> — Connects Prisma to <code>pg</code> pool (required in Prisma 7 for Postgres).
              </li>
              <li>
                <strong>DAL (Data Access Layer)</strong> — <code>lib/db/tenant.ts</code> wraps every query with <code>where: {`{workspaceId}`}</code> —
                <strong>tenancy guard</strong>.
              </li>
              <li>
                <strong>Zod</strong> — Schema validation for all inputs.
              </li>
            </ul>
          </Tab>
          <Tab value="AI & Extraction">
            <ul>
              <li>
                <strong>@tanstack/ai</strong> — Agent framework: <code>defineTool</code>, <code>runAgent</code>, tool calling loop.
              </li>
              <li>
                <strong>Providers</strong>: Anthropic (<code>claude-3-5-sonnet</code>), OpenAI (<code>gpt-4o-mini</code>), Gemini, Azure OpenAI.
              </li>
              <li>
                <strong>Heuristic fallback</strong> — Regex + keywords if no API key (see <code>lib/ai/heuristic.ts</code>).
              </li>
              <li>
                <strong>unpdf</strong> — PDF → text + tables (bank statements, briefs).
              </li>
            </ul>
          </Tab>
          <Tab value="Realtime & Storage">
            <ul>
              <li>
                <strong>ioredis</strong> — Redis client. Pub/sub for live badges, inbox updates. <code>REDIS_URL</code> or Upstash REST.
              </li>
              <li>
                <strong>File System adapter</strong> — <code>STORAGE_DIR/.storage</code> per workspace; swap to R2/S3 by changing adapter.
              </li>
              <li>
                <strong>date-fns</strong> — All date math, relative parsing (“Friday” → 2025-12-06), formatting.
              </li>
            </ul>
          </Tab>
        </Tabs>

        <h2 id="entity-graph-how-everything-connects">Entity Graph — How Everything Connects</h2>
        <p>Not just “tasks” — a graph of 20+ entities. Every row has <code>workspace_id</code>.</p>
        <div className="not-prose my-6 space-y-3 rounded-2xl border bg-gradient-to-br from-fd-card via-fd-card to-fd-muted/20 p-4 sm:p-6 shadow-sm">
          {/* Top: users → workspaces */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-fd-popover px-3 py-1 shadow-sm">
                <Users className="size-3.5 text-indigo-500" /> users
              </span>
              <span className="text-fd-muted-foreground">—</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-fd-popover px-3 py-1 shadow-sm">
                <Network className="size-3.5 text-slate-500" /> workspace_members
              </span>
              <span className="text-fd-muted-foreground">—</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-fd-primary px-3 py-1 font-semibold text-fd-primary-foreground shadow-sm">
                <Building2 className="size-3.5" /> workspaces
              </span>
            </div>
            <div className="h-5 w-px bg-fd-border" />
          </div>

          {/* Row: clients projects tasks calendar transactions */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div className="rounded-xl border bg-fd-popover p-2.5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                <Building2 className="size-3.5 text-emerald-500" /> clients
              </div>
              <div className="mt-1 text-[10px] leading-tight text-fd-muted-foreground">contact_email</div>
            </div>
            <div className="rounded-xl border bg-fd-popover p-2.5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                <FolderKanban className="size-3.5 text-blue-500" /> projects
              </div>
              <div className="mt-1 text-[10px] leading-tight text-fd-muted-foreground">client_id</div>
            </div>
            <div className="rounded-xl border bg-fd-primary p-2.5 text-center text-fd-primary-foreground shadow-sm ring-2 ring-fd-primary/20">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                <CheckSquare className="size-3.5" /> tasks
              </div>
              <div className="mt-1 text-[10px] leading-tight opacity-90">project_id · client_id</div>
            </div>
            <div className="rounded-xl border bg-fd-popover p-2.5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                <CalendarDays className="size-3.5 text-amber-500" /> calendar_events
              </div>
              <div className="mt-1 text-[10px] leading-tight text-fd-muted-foreground">starts_at</div>
            </div>
            <div className="rounded-xl border bg-fd-popover p-2.5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                <CreditCard className="size-3.5 text-rose-500" /> transactions
              </div>
              <div className="mt-1 text-[10px] leading-tight text-fd-muted-foreground">subscriptions</div>
            </div>
          </div>

          {/* Central Task expanded */}
          <div className="relative mx-auto w-full max-w-2xl">
            <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-fd-border" />
            <div className="mt-4 grid gap-2 rounded-xl border bg-fd-popover/80 p-3 shadow-sm backdrop-blur-sm sm:grid-cols-[1.1fr_1.9fr]">
              <div className="flex flex-col items-center justify-center rounded-lg bg-fd-primary px-3 py-4 text-fd-primary-foreground shadow-sm">
                <CheckSquare className="size-6" />
                <div className="mt-1 text-sm font-bold">Task</div>
                <div className="text-center text-[10px] leading-tight opacity-80">task_files → files (Drive/uploads)</div>
                <div className="mt-2 h-px w-full bg-fd-primary-foreground/20" />
                <div className="mt-2 text-center text-[10px] font-mono">workspace_id · ai_confidence</div>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <div className="flex items-center gap-2 rounded-lg border bg-fd-card px-2.5 py-1.5 text-xs">
                  <Link2 className="size-3.5 text-fd-muted-foreground" /> task_links <span className="text-fd-muted-foreground">— links</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-fd-card px-2.5 py-1.5 text-xs">
                  <StickyNote className="size-3.5 text-fd-muted-foreground" /> task_notes
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-fd-card px-2.5 py-1.5 text-xs">
                  <ListChecks className="size-3.5 text-fd-muted-foreground" /> task_checklist_items
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-fd-card px-2.5 py-1.5 text-xs">
                  <Clock3 className="size-3.5 text-fd-muted-foreground" /> task_work_sessions <span className="text-fd-muted-foreground">(timer)</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-fd-card px-2.5 py-1.5 text-xs">
                  <Network className="size-3.5 text-fd-muted-foreground" /> task_dependencies <span className="text-fd-muted-foreground">(blocks)</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-fd-card px-2.5 py-1.5 text-xs">
                  <ScrollText className="size-3.5 text-fd-muted-foreground" /> task_activity <span className="text-fd-muted-foreground">(audit)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom chains */}
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
            <div className="h-4 w-px bg-fd-border" />
            <div className="flex w-full flex-wrap items-center justify-center gap-1.5 rounded-full border bg-fd-popover px-3 py-1.5 shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                <Mail className="size-3.5 text-sky-500" /> emails
              </span>
              <span className="text-fd-muted-foreground">—</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                <Paperclip className="size-3.5 text-slate-500" /> attachments
              </span>
              <span className="text-fd-muted-foreground">—</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                <FileText className="size-3.5 text-orange-500" /> documents
              </span>
            </div>
            <div className="h-4 w-px bg-fd-border" />
            <div className="flex w-full flex-wrap items-center justify-center gap-1.5 rounded-full border bg-fd-popover px-3 py-1.5 shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                <Clock3 className="size-3.5 text-amber-500" /> reminders
              </span>
              <span className="text-fd-muted-foreground">—</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                <Bell className="size-3.5 text-violet-500" /> notifications
              </span>
              <span className="text-fd-muted-foreground">—</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                <ScrollText className="size-3.5 text-slate-500" /> activity_log
              </span>
            </div>
            <div className="h-4 w-px bg-fd-border" />
            <div className="flex w-full flex-wrap items-center justify-center gap-1.5 rounded-full border border-dashed bg-fd-muted/50 px-3 py-1.5 shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                <Workflow className="size-3.5 text-indigo-500" /> automation_rules
              </span>
              <span className="text-fd-muted-foreground">—</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono">jobs</span>
              <span className="text-fd-muted-foreground">—</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono">job_runs</span>
            </div>
          </div>
        </div>
        <Callout title="Beginner: Why Graph > List">
          A task isn't isolated. “GB reel” task links to client GB, project Social Media, 3 emails, Drive folder, 2 previous reels, and a calendar hold. Click <strong>Start Work</strong> and you get it all. No manual linking.
        </Callout>
        <p>Every row has <code>workspace_id</code>. Every important field has <strong>provenance</strong>:</p>
        <pre><code>{`tasks row: {
  title: "Create 3 reels",
  source_type: "gmail",
  source_id: "email_abc123",
  ai_confidence: 0.94,
  created_by: "Email Intelligence Agent"
}`}</code></pre>
        <p>Ask “Why deadline Friday?” → shows snippet from Gmail ID abc123.</p>

        <h2 id="data-flow-capture-intelligence-action">Data Flow: Capture → Intelligence → Action</h2>
        <Steps>
          <Step>
            <h3>Capture (Ingestion)</h3>
            <pre><code>{`User: paste/screenshot/file/voice/URL/Gmail webhook
→ POST /api/inbox or /api/webhooks/inbox
→ Store raw in inbox_items { content, type, workspace_id }
→ Enqueue job: "extract" via ioredis`}</code></pre>
          </Step>
          <Step>
            <h3>Intelligence (Agents)</h3>
            <pre><code>{`Worker picks job → Inbox Agent:
- Classify: task|invoice|meeting|subscription|personal
- Extract: client, project, tasks[], deadline (date-fns), people, links, priority
- Detect relationships: does client exist? link to project?

If email → Email Agent adds classification.
If file → Drive Agent indexes, Document Agent parses tables/dates.
If statement → Finance Agent validates totals.`}</code></pre>
          </Step>
          <Step>
            <h3>Action (Proposal → Execution)</h3>
            <pre><code>{`Orchestrator proposes:
- Create tasks (safe, auto)
- Find Drive assets (safe)
- Schedule reminders (safe)
- Send email (sensitive → needs confirm)

User reviews modal → Confirm → rows created, search indexed, notifications sent.`}</code></pre>
          </Step>
        </Steps>

        <h2 id="orchestrator-9-agents">Orchestrator &amp; 9 Agents</h2>
        <div className="not-prose my-6 grid gap-2 rounded-2xl border bg-fd-card p-4 shadow-sm sm:grid-cols-2">
          <div className="rounded-xl border bg-fd-popover p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="size-4 text-violet-500" /> Inbox Agent
            </div>
            <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">Classify input, extract entities &amp; relationships</div>
          </div>
          <div className="rounded-xl border bg-fd-popover p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CheckSquare className="size-4 text-emerald-500" /> Task Agent
            </div>
            <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">Prioritize, deps, at-risk, next-action, score 0–100</div>
          </div>
          <div className="rounded-xl border bg-fd-popover p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FolderKanban className="size-4 text-blue-500" /> Project Agent
            </div>
            <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">Health, milestones, summaries, progress</div>
          </div>
          <div className="rounded-xl border bg-fd-popover p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="size-4 text-sky-500" /> Email Agent
            </div>
            <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">Gmail ingest → task vs receipt vs subscription</div>
          </div>
          <div className="rounded-xl border bg-fd-popover p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4 text-orange-500" /> Drive / File Agent
            </div>
            <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">Index Drive, link to client/project, search</div>
          </div>
          <div className="rounded-xl border bg-fd-popover p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4 text-amber-600" /> Document Agent
            </div>
            <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">PDF/DOCX tables, requirements, dates, summarization</div>
          </div>
          <div className="rounded-xl border bg-fd-popover p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4 text-amber-500" /> Calendar Agent
            </div>
            <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">Events, conflicts, commitment graph, daily briefing</div>
          </div>
          <div className="rounded-xl border bg-fd-popover p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="size-4 text-rose-500" /> Finance Agent
            </div>
            <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">Statements (deterministic totals), categorization, subs</div>
          </div>
          <div className="rounded-xl border bg-fd-popover p-3 sm:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Network className="size-4 text-indigo-500" /> Search Agent
            </div>
            <div className="mt-1 text-xs leading-relaxed text-fd-muted-foreground">Personal memory: Drive + emails + tasks in one query</div>
          </div>
        </div>
        <Tabs items={["Example: WhatsApp Message", "Example: Email", "Example: Bank Statement"]}>
          <Tab value="Example: WhatsApp Message">
            <p>Input: “Bro 3 reels for GB before Saturday. Photos in Drive.”</p>
            <pre><code>{`Inbox Agent → Tasks: 3 reels, Deadline: Saturday, Assets: Drive
→ Creates project if missing, queues Drive search
→ Notification Agent schedules reminders`}</code></pre>
          </Tab>
          <Tab value="Example: Email">
            <pre><code>{`Gmail webhook → Email Agent:
Email: "Update pricing by Thursday. See pricing.pdf"
→ Task: "Update pricing section" | Deadline: Thursday | Attachment: pricing.pdf
→ Links to project, creates reminder`}</code></pre>
          </Tab>
          <Tab value="Example: Bank Statement">
            <pre><code>{`Upload SBI PDF (password in vault)
→ Finance Agent: tries PAN+DOB, parses table, validates opening+credits−debits=closing
→ Categorizes: Food, Software… → Subscription detection`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="permissions-safety">Permissions &amp; Safety</h2>
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Class</th>
              <th className="p-2 text-left">Examples</th>
              <th className="p-2 text-left">Needs Confirm?</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2 font-medium">Read</td>
              <td className="p-2">Read emails, Drive, calendar, finance</td>
              <td className="p-2">No (scoped to workspace)</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-medium">Write (Safe)</td>
              <td className="p-2">Create task, note, reminder, attach file</td>
              <td className="p-2">No</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-medium">Sensitive</td>
              <td className="p-2">Send email, delete file, modify finance, cancel sub</td>
              <td className="p-2">Yes — modal + audit</td>
            </tr>
          </tbody>
        </table>
        <p>Every tool call logged to <code>activity_log</code> with <code>workspace_id, user_id, tool, args, result, provenance</code>.</p>

        <h2 id="context-engine-packs">Context Engine &amp; Packs</h2>
        <p>For task “Create GB Event Reel” — tap <strong>Start Work</strong> to open:</p>
        <div className="not-prose my-6 grid gap-3 rounded-2xl border bg-fd-card p-4 shadow-sm sm:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-fd-popover p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">Context</div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="size-4 text-emerald-500" /> GB Banquet
              <span className="text-fd-muted-foreground">→</span> brand, contacts
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FolderKanban className="size-4 text-blue-500" /> Social Media
              <span className="text-fd-muted-foreground">→</span> milestones
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-orange-500" /> Drive
              <span className="text-fd-muted-foreground">logo, GB-Dec-2025 photos, previous reels</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="size-4 text-sky-500" /> 2 threads mentioning GB
            </div>
            <div className="flex items-center gap-2 text-sm">
              <StickyNote className="size-4 text-amber-500" /> “Use summer banner”
            </div>
          </div>
          <div className="space-y-2 rounded-xl border bg-fd-popover p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">Details</div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
              High · Score 84 · Due Saturday
            </div>
            <div className="space-y-1 pt-1 text-sm">
              <div className="flex items-center gap-1.5">
                <ListChecks className="size-3.5 text-fd-muted-foreground" /> Checklist: <span className="text-emerald-600">☑ Download</span> ☐ Select ☐ Edit ☐ Export
              </div>
              <div className="flex items-center gap-1.5">
                <Network className="size-3.5 text-fd-muted-foreground" /> Blocked by “Client sends photos”
              </div>
              <div className="flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-fd-muted-foreground" /> Next: “Ask client for final logo”
              </div>
            </div>
          </div>
          <div className="sm:col-span-2 rounded-lg bg-fd-muted/50 px-3 py-2 text-xs text-fd-muted-foreground">
            Requirements from extraction → Instructions + Files + Emails + Checklist assembled — no manual hunting.
          </div>
        </div>
        <Callout title="Beginner: Where is it?">
          Click any task → <strong>Start Work</strong> → full page <code>/w/[workspace]/tasks/[id]</code> has two columns: Context (left) + Details (right). Also available as drawer from any page.
        </Callout>

        <h2 id="priority-scoring-at-risk">Priority Scoring &amp; At-Risk</h2>
        <div className="not-prose my-6 overflow-hidden rounded-2xl border bg-fd-card shadow-sm">
          <div className="border-b bg-fd-muted/40 px-4 py-3 sm:px-5">
            <div className="text-sm font-semibold">Score 0–100 — auto, transparent</div>
            <div className="text-xs text-fd-muted-foreground">Adds up from deadline + context. No manual guessing.</div>
          </div>
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="divide-y divide-fd-border">
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <span className="text-sm">Due ≤7 days</span>
                <span className="inline-flex items-center rounded-full bg-fd-muted px-2.5 py-0.5 text-xs font-mono font-medium">+10</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <span className="text-sm">Due ≤3 days</span>
                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-mono font-medium text-amber-600 dark:text-amber-400">+20</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <span className="text-sm">Due ≤1 day</span>
                <span className="inline-flex items-center rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-mono font-medium text-orange-600 dark:text-orange-400">+30</span>
              </div>
              <div className="flex items-center justify-between bg-red-500/5 px-4 py-2.5 sm:px-5">
                <span className="text-sm font-medium">Overdue</span>
                <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-mono font-medium text-white">+40</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <span className="text-sm">Client waiting</span>
                <span className="inline-flex items-center rounded-full bg-fd-muted px-2.5 py-0.5 text-xs font-mono font-medium">+20</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <span className="text-sm">Blocks other tasks</span>
                <span className="inline-flex items-center rounded-full bg-fd-muted px-2.5 py-0.5 text-xs font-mono font-medium">+15</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <span className="text-sm">High-value client</span>
                <span className="inline-flex items-center rounded-full bg-fd-muted px-2.5 py-0.5 text-xs font-mono font-medium">+10</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <span className="text-sm">Project at risk</span>
                <span className="inline-flex items-center rounded-full bg-fd-muted px-2.5 py-0.5 text-xs font-mono font-medium">+15</span>
              </div>
            </div>
            <div className="border-t bg-fd-muted/20 p-4 sm:border-l sm:border-t-0 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">Maps to</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border bg-fd-popover p-3">
                  <div className="text-xs font-medium text-fd-muted-foreground">0–24</div>
                  <div className="mt-1 inline-flex items-center rounded-full bg-zinc-500/15 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">Low</div>
                </div>
                <div className="rounded-xl border bg-fd-popover p-3">
                  <div className="text-xs font-medium text-fd-muted-foreground">25–49</div>
                  <div className="mt-1 inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">Medium</div>
                </div>
                <div className="rounded-xl border bg-fd-popover p-3">
                  <div className="text-xs font-medium text-fd-muted-foreground">50–74</div>
                  <div className="mt-1 inline-flex items-center rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">High</div>
                </div>
                <div className="rounded-xl border bg-fd-primary p-3 text-fd-primary-foreground">
                  <div className="text-xs font-medium opacity-80">75+</div>
                  <div className="mt-1 inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">Critical</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-dashed bg-fd-popover p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Clock3 className="size-3.5" /> At-Risk
                </div>
                <div className="mt-1 font-mono text-xs leading-relaxed text-fd-muted-foreground">
                  remaining_estimated (90m) &gt; available_working_time (2h before deadline) → badge red
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                  <span className="size-1.5 rounded-full bg-white" /> At-Risk
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-fd-popover px-3 py-2 text-center text-xs">
                Displayed: <span className="font-medium">“High · Due Aug 28 · 84 score · Blocks 1”</span>
              </div>
            </div>
          </div>
        </div>

        <h2 id="jobs-queue-tenancy">Jobs, Queue &amp; Tenancy</h2>
        <Steps>
          <Step>
            <h3>Job Queue (ioredis)</h3>
            <pre><code>{`Queue: "extract", "gmail_ingest", "drive_index", "reminder"
Worker: npm run worker (separate process)
Job: { id, workspace_id, type, payload, attempts }
Run: jobs → job_runs (logs output/error)`}</code></pre>
          </Step>
          <Step>
            <h3>Tenancy Enforcement</h3>
            <pre><code>{`Every query: db.task.findMany({ where: { workspaceId } })
Check: npm run check:tenancy → scans lib/** for unscoped findMany/update/delete
Fail CI if missing workspaceId`}</code></pre>
          </Step>
        </Steps>

        <h2 id="why-deterministic-ai-for-some-tasks">Why Deterministic &gt; AI for Some Tasks</h2>
        <Callout type="warn" title="Design Decision">
          <strong>AI for:</strong> understanding messages, extraction, summarization, classification, planning.<br />
          <strong>Code for:</strong> dates, reminders, cron, recurring, totals, balances — cheaper, reliable, testable. Never let LLM do arithmetic.
        </Callout>
        <p>Example: Bank totals validated in TypeScript: <code>openingMinor + sum(credits) − sum(debits) === closingMinor</code> — LLM only categorizes merchant names.</p>
      </DocsBody>
    </DocsPage>
  )
}
