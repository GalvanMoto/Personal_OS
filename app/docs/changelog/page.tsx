import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "Versioning & Release Notes", url: "#versioning-release-notes", depth: 2 },
        { title: "v2.0 — Personal OS (Current)", url: "#v20-personal-os-current", depth: 2 },
        { title: "v1.x — Earlier", url: "#v1x-earlier", depth: 2 },
        { title: "Roadmap — Next", url: "#roadmap-next", depth: 2 },
        { title: "Migration Guides", url: "#migration-guides", depth: 2 },
      ]}
    >
      <DocsTitle>Changelog — Version History & Roadmap</DocsTitle>
      <DocsDescription>
        What's new, what's fixed, what's next. Covers v2.0 Personal OS, earlier versions, and upcoming MDX, vector search, and offline queue.
      </DocsDescription>
      <DocsBody>
        <h2 id="versioning-release-notes">Versioning &amp; Release Notes</h2>
        <p>DLRS follows <strong>Semver</strong>: <code>MAJOR.MINOR.PATCH</code></p>
        <ul>
          <li><code>MAJOR</code> — Breaking (e.g., DB schema, auth)</li>
          <li><code>MINOR</code> — Features (e.g., new agent, integration)</li>
          <li><code>PATCH</code> — Fixes, perf</li>
        </ul>
        <p>
          Located: <code>package.json: version</code> (currently <code>0.0.1</code> → will become <code>2.0.0</code> after docs launch).
        </p>

        <h2 id="v21-daily-journals-tiptap">v2.1 — Daily Journals &amp; Tiptap Intelligence (Current)</h2>
        <Callout title="Release Date: 2026-08-28">
          Daily Journals with Smart AI Day Synthesis, interactive Calendar streaks, full-height Tiptap Document Editor with screen wrapping, Public Link Sharing, and private instance security lockdown.
        </Callout>
        <Accordion>
          <AccordionItem value="v21-features" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Features</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Daily Journals (<code>/w/[workspace]/journal</code>)</strong>: Connected with AI Assistant, interactive calendar view, logged dates status dots, and consistency streak counter.</li>
                <li><strong>Smart AI Day Synthesis</strong>: Synthesizes completed tasks, financial movements, calendar sessions, and authored notes while filtering out background noise.</li>
                <li><strong>Interactive Tiptap Document Editor (<code>/w/[workspace]/documents/[id]</code>)</strong>: Dedicated full-viewport editing canvas with sticky toolbar, tables, headings, checklists, and screen word wrapping.</li>
                <li><strong>Universal Public Share (<code>/share/[token]</code>)</strong>: Public viewer for shared tasks and documents supporting both share tokens and direct IDs with read-only formatting.</li>
                <li><strong>Private Instance Lockdown</strong>: Disabled public signups, removed registration links, and added edge redirects from <code>/signup</code> to <code>/login</code>.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="v21-fixes" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Fixes &amp; Stability</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="list-disc pl-4 space-y-1">
                <li>Fixed Turbopack webpack bundler compiler races on Linux VPS via <code>next build --webpack</code>.</li>
                <li>Fixed Edge authentication middleware redirect handling for expired sessions.</li>
                <li>Aligned Prisma query field definitions across transactions and calendar events in domain extractors.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 id="v20-personal-os-current">v2.0 — Personal OS</h2>
        <Callout title="Release Date: 2025-12-01">Major: docs system, PWA, tenancy, finance vault, Glass → Docs layout migration, integrations.</Callout>
        <Accordion>
          <AccordionItem value="v20-features" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Features</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Docs layout</strong> (<code>fumadocs-ui/layouts/docs</code>) + <code>docs.css</code> with <code>--fd-layout-width:1400px</code>, shadcn preset</li>
                <li><strong>PWA</strong> + <code>public/sw.js</code>, installable, <code>manifest.json</code></li>
                <li><strong>Redis live sync</strong> (<code>ioredis</code>) for badges, inbox, notifications, SSE <code>/api/realtime/:workspace/stream</code></li>
                <li><strong>Universal Inbox</strong> → Inbox Agent → Task extraction with 5 capture modes (text, image, PDF, voice, URL)</li>
                <li><strong>Task living objects</strong>: 9 statuses, auto priority 0–100, at-risk, dependencies, Context Packs, work sessions</li>
                <li><strong>Finance vault</strong>: AES-256, deterministic parser via <code>unpdf</code>, subscription detection</li>
                <li><strong>Multi-agent</strong>: Inbox, Task, Project, Email, Drive, Document, Finance, Calendar, Search + Orchestrator</li>
                <li><strong>Integrations</strong>: Gmail/Drive/Calendar OAuth with encrypted tokens, job queue</li>
                <li><strong>Daily copilot</strong>: briefing cron 08:00, next-best-action scoring</li>
                <li><strong>Tenancy guard</strong>: <code>scripts/check-tenant-isolation.ts</code> + <code>npm run check:tenancy</code></li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="v20-fixes" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Fixes</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="list-disc pl-4 space-y-1">
                <li>Fixed ChunkLoadError reload loop with <code>sessionStorage</code> guard in <code>app/layout.tsx</code></li>
                <li>Fixed Accordion <code>type="single"</code> mismatch with base-ui (now uses <code>AccordionPrimitive.Root</code> props)</li>
                <li>Fixed <code>getSettings</code> cast to satisfy <code>WorkspaceSettings</code> outputSchema</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="v20-tech" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Technical</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="list-disc pl-4 space-y-1">
                <li>Prisma 7.10 + <code>@prisma/adapter-pg</code> with <code>prisma7.config.ts</code></li>
                <li><code>@tanstack/ai</code> + Azure OpenAI <code>gpt-5.4-nano</code> as default, heuristic fallback</li>
                <li>Tailwind v4 + <code>shadcn/tailwind.css</code> + <code>fumadocs-ui/css/shadcn.css</code></li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 id="v1x-earlier">v1.x — Earlier</h2>
        <Accordion>
          <AccordionItem value="v1-2" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">v1.2 — Dashboard & Finance v1</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="list-disc pl-4 space-y-1">
                <li>Basic dashboard at <code>/dashboard</code>, workspaces at <code>/w/[workspace]</code></li>
                <li>Finance: manual transaction entry, no vault</li>
                <li>Tasks: simple CRUD, no AI</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="v1-0" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">v1.0 — Initial</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p>Next.js + Prisma init, auth, workspaces, basic inbox. No agents, no PWA.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 id="roadmap-next">Roadmap — Next</h2>
        <Accordion>
          <AccordionItem value="next-1" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">🚀 v2.1 — Content & Search</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>MDX collection</strong> (<code>source.config.ts</code> + <code>content/docs</code>) for prose + auto TOC</li>
                <li><strong>Vector search</strong> (pgvector) for “Find similar briefs”</li>
                <li><strong>Ask-AI in header</strong> (Glass header <code>aiChat</code> prop with <code>useState</code>)</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="next-2" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">📱 v2.2 — Mobile & Offline</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="list-disc pl-4 space-y-1">
                <li>Offline queue: capture while offline → sync when online via <code>sw.js</code></li>
                <li>Telegram bot for capture (replaces Gmail for mobile)</li>
                <li>Push with sound + quiet hours</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="next-3" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">🔮 v3.0 — Proactive OS</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="list-disc pl-4 space-y-1">
                <li>“You have 4 things needing attention” proactive nudges</li>
                <li>Client hasn't replied 3 days → follow-up draft</li>
                <li>Deadline tomorrow but assets missing → alert</li>
                <li>Spending 28% more on software → insight</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 id="migration-guides">Migration Guides</h2>
        <Accordion>
          <AccordionItem value="migrate-docs" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Docs: Glass → Docs Layout</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <pre><code>{`// app/docs/layout.tsx
- import { GlassLayout } from "fumadocs-ui/layouts/glass"
+ import { DocsLayout } from "fumadocs-ui/layouts/docs"

// app/docs/docs.css
- @import "fumadocs-ui/css/generated/glass.css"
  Keep shadcn + preset in globals.css
// pages
- from "fumadocs-ui/layouts/glass/page"
+ from "fumadocs-ui/layouts/docs/page"`}</code></pre>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="migrate-prisma7" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Prisma 6 → 7</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p>
                Add <code>prisma7.config.ts</code> and <code>@prisma/adapter-pg</code>. See <code>prisma7.config.ts</code> and <code>lib/db.ts</code>.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocsBody>
    </DocsPage>
  )
}


