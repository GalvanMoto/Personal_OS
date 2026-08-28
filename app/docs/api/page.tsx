import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "Authentication & Tenancy (Beginner)", url: "#authentication-tenancy-beginner", depth: 2 },
        { title: "Inbox & Capture Endpoints", url: "#inbox-capture-endpoints", depth: 2 },
        { title: "Tasks, Projects, Clients", url: "#tasks-projects-clients", depth: 2 },
        { title: "Finance Endpoints", url: "#finance-endpoints", depth: 2 },
        { title: "Calendar & Files", url: "#calendar-files", depth: 2 },
        { title: "Agent & Search", url: "#agent-search", depth: 2 },
        { title: "Integrations & Realtime", url: "#integrations-realtime", depth: 2 },
        { title: "Error Codes & Rate Limits", url: "#error-codes-rate-limits", depth: 2 },
        { title: "Example: Full Flow with curl", url: "#example-full-flow-with-curl", depth: 2 },
      ]}
    >
      <DocsTitle>API Reference — All Endpoints</DocsTitle>
      <DocsDescription>
        Workspace-scoped, tenancy-guarded REST API. Every request goes through session + DAL. Covers auth, all routes, examples, and how to extend — beginner-friendly with curl snippets.
      </DocsDescription>
      <DocsBody>
        <h2 id="authentication-tenancy-beginner">Authentication &amp; Tenancy (Beginner)</h2>
        <Callout title="Beginner: How Auth Works">
          <strong>Session cookie</strong> signed with <code>SESSION_SECRET</code> (like login token). Every request calls <code>getCurrentUser()</code> → if no session, 401 → redirect <code>/login</code>. Then <code>workspaceId</code> from URL (<code>/w/[workspace]</code>) is validated via DAL — you can only access your workspace's rows.
        </Callout>
        <pre><code>{`// lib/auth/dal.ts
export async function getCurrentUser() {
  const session = await getSession() // decrypt cookie
  if (!session) throw new Error("Unauthorized")
  return db.user.findUnique({ where: { id: session.userId } })
}

export async function requireWorkspaceMember(workspaceId: string, userId: string) {
  const member = await db.workspace_members.findFirst({ where: { workspace_id: workspaceId, user_id: userId }})
  if (!member) throw new Error("Forbidden")
}

// In every route handler (app/api/*):
export async function POST(req, { params }: { params: { workspace: string } }) {
  const user = await getCurrentUser()
  await requireWorkspaceMember(params.workspace, user.id)
  // now safe to query with workspace_id = params.workspace
}`}</code></pre>
        <p>
          All handlers use <code>lib/db/tenant.ts</code> wrapper. Check: <code>npm run check:tenancy</code> scans <code>lib/**</code> for missing{" "}
          <code>workspace_id</code> in <code>findMany/update/delete</code>.
        </p>

        <h2 id="inbox-capture-endpoints">Inbox &amp; Capture Endpoints</h2>
        <Tabs items={["Create Capture", "Extract", "List Inbox"]}>
          <Tab value="Create Capture">
            <pre><code>{`POST /api/inbox        # or /api/w/:workspace/inbox (scoped)
Headers: Cookie: session=...
Body: { content: "Make 3 reels for GB by Friday", source_type: "text" }
Response: { inbox_item: { id, workspace_id, content, type }, job: { id, status: "queued" } }

POST /api/inbox/upload
Body: multipart/form-data (file, source_type="image"|"file")
Response: { file: { id, storage_path }, inbox_item: { id } }

POST /api/webhooks/inbox
Headers: X-Webhook-Secret: WEBHOOK_SECRET
Body: { content, source: "gmail"|"telegram" }
Use: Gmail push Pub/Sub → verifies WEBHOOK_SECRET`}</code></pre>
          </Tab>
          <Tab value="Extract">
            <pre><code>{`POST /api/inbox/:id/extract
Body: {}
Response: {
  extraction: {
    client: "GB Banquet",
    project: "Social Media",
    tasks: [{ title: "Event highlights reel", checklist: [...] }],
    deadline: "2025-12-06",
    confidence: 0.92
  },
  job: { id, status: "done" }
}

POST /api/inbox/:id/confirm
Body: { tasks: [...], client_id?, project_id? }
Response: { created: { tasks: [{ id }], client, project } }`}</code></pre>
          </Tab>
          <Tab value="List Inbox">
            <pre><code>{`GET /api/inbox?workspace=MyStudio&limit=20
Response: { items: [{ id, content, type, created_at, status, extraction }] }

curl -b cookie.txt http://localhost:3000/api/inbox?workspace=MyStudio | jq`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="tasks-projects-clients">Tasks, Projects, Clients</h2>
        <Tabs items={["Tasks", "Projects & Clients", "Search"]}>
          <Tab value="Tasks">
            <pre><code>{`GET    /api/tasks?workspace=MyStudio&status=InProgress
POST   /api/tasks          Body: { title, project_id, due_date, priority }
GET    /api/tasks/:id
PATCH  /api/tasks/:id      Body: { status, priority, due_date, estimated_minutes }
DELETE /api/tasks/:id      → archive (soft delete, sets is_archived)
POST   /api/tasks/:id/start  Body: {} → creates work_sessions

Example curl:
curl -X POST http://localhost:3000/api/tasks \\
  -H "Content-Type: application/json" \\
  -b cookie.txt \\
  -d '{"workspace_id":"MyStudio","title":"Create reel","project_id":"proj_123","due_date":"2025-12-06"}'`}</code></pre>
          </Tab>
          <Tab value="Projects & Clients">
            <pre><code>{`GET  /api/projects?workspace=MyStudio
POST /api/projects  Body: { name: "Social Media — GB", client_id }
GET  /api/projects/:slug

GET  /api/clients?workspace=MyStudio
POST /api/clients   Body: { name: "GB Banquet", contact_email }
GET  /api/clients/:slug → includes projects, tasks, emails, files, transactions

# All require workspace_id in query/body, validated via DAL`}</code></pre>
          </Tab>
          <Tab value="Search">
            <pre><code>{`POST /api/search
Body: { workspace_id: "MyStudio", query: "Where is GB logo?" }
Response: {
  results: [
    { type: "file", title: "GB-logo-final.png", score: 0.95, url: "/w/MyStudio/files/123" },
    { type: "email", title: "Re: Logo", snippet: "attached logo..." },
    { type: "task", title: "Create reel" }
  ]
}

Implementation: lib/search (keyword Fuse + optional vector)
Provenance: each result has source_id for “why”`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="finance-endpoints">Finance Endpoints</h2>
        <pre><code>{`POST /api/finance/import
Body: multipart/form-data (file: bank statement PDF, workspace_id)
Response: { import: { id, status: "parsing", job_id } }

GET  /api/finance/transactions?workspace=MyStudio&from=2025-11-01&to=2025-11-30
Response: { transactions: [{ id, date, description, amountMinor, category, confidence }] }
PATCH /api/finance/transactions/:id  Body: { category }

GET  /api/finance/subscriptions?workspace=MyStudio
Response: { subscriptions: [{ name: "Netflix", amountMinor: 64900, next_expected_payment, frequency }] }

GET  /api/finance/invoices?workspace=MyStudio
POST /api/finance/invoices  Body: { title, amountMinor, currency, issuer, file_id }`}</code></pre>

        <h2 id="calendar-files">Calendar &amp; Files</h2>
        <Tabs items={["Calendar", "Files & Documents"]}>
          <Tab value="Calendar">
            <pre><code>{`GET  /api/calendar/events?workspace=MyStudio&from=2025-12-01&to=2025-12-07
Response: { events: [{ id, title, starts_at, ends_at, attendees }] }

POST /api/calendar/events  Body: { title, starts_at, ends_at, attendees: [] }
POST /api/integrations/calendar/sync  → job: calendar_sync

Linked commitment: GET /api/calendar/events/:id/context
Response: { project, tasks: [...], files: [...] }`}</code></pre>
          </Tab>
          <Tab value="Files & Documents">
            <pre><code>{`GET  /api/files?workspace=MyStudio&type=file|document|note
POST /api/files/upload  Body: multipart (file)
GET  /api/files/:id
GET  /api/files/:id/download → stream from STORAGE_DIR

GET  /api/documents?workspace=MyStudio
GET  /api/notes?workspace=MyStudio
POST /api/notes  Body: { title, content_md, linked_task_id }`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="agent-search">Agent &amp; Search</h2>
        <pre><code>{`POST /api/agent/:workspace
Body: { message: "What should I do now?" }
Headers: Cookie
Flow: Orchestrator → Task Agent + Calendar → scored recommendation
Response: { answer: "Do GB Reel now (45m, due today, score 88)", actions: [{ tool, args }] }

POST /api/assistant/ask (legacy)
Body: { query, workspace_id }
Response: { answer, sources: [{ type, id, snippet }] }

POST /api/search (as above)`}</code></pre>

        <h2 id="integrations-realtime">Integrations &amp; Realtime</h2>
        <Tabs items={["OAuth Callbacks", "Realtime Stream"]}>
          <Tab value="OAuth Callbacks">
            <pre><code>{`GET /api/integrations/gmail/connect?workspace=MyStudio
→ Redirect to Google OAuth

GET /api/integrations/gmail/callback?code=...&state=workspace:MyStudio
→ Exchange, encrypt, store vault_items, redirect to /w/MyStudio/settings/integrations

Same for /drive/callback, /calendar/callback

GET /api/integrations/:provider/status?workspace=MyStudio
Response: { connected: true, email: "you@gmail.com" }`}</code></pre>
          </Tab>
          <Tab value="Realtime Stream">
            <pre><code>{`GET /api/realtime/:workspace/stream
Headers: Accept: text/event-stream, Cookie
Response: SSE stream

Event: { type: "task_created", task: { id, title } }
Event: { type: "notification", notification: { title, level } }
Event: { type: "badge", counts: { inbox: 3, dueToday: 2 } }

Client: useRealtime(workspaceId) in hooks/realtime.ts → ioredis pub/sub
Fallback: polling every 30s if Redis unavailable`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="error-codes-rate-limits">Error Codes &amp; Rate Limits</h2>
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">When</th>
              <th className="p-2 text-left">Fix</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2 font-mono">401</td>
              <td className="p-2">No session or expired</td>
              <td className="p-2">Login again</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-mono">403</td>
              <td className="p-2">Workspace not member</td>
              <td className="p-2">Check workspace slug</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-mono">400</td>
              <td className="p-2">Zod validation failed</td>
              <td className="p-2">Check body fields, see error.issues</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-mono">429</td>
              <td className="p-2">Rate limit (100 req/min)</td>
              <td className="p-2">Backoff, retry after header</td>
            </tr>
          </tbody>
        </table>

        <h2 id="example-full-flow-with-curl">Example: Full Flow with curl</h2>
        <pre><code>{`# 1. Login (get cookie)
curl -c cookie.txt -X POST http://localhost:3000/api/login -d "email=you@example.com&password=..."

# 2. Create capture
curl -b cookie.txt -X POST http://localhost:3000/api/inbox \\
  -H "Content-Type: application/json" \\
  -d '{"workspace_id":"MyStudio","content":"Make 3 reels for GB before Saturday","source_type":"text"}'
# → inbox_item id: inbox_123

# 3. Extract
curl -b cookie.txt -X POST http://localhost:3000/api/inbox/inbox_123/extract | jq

# 4. Confirm create tasks
curl -b cookie.txt -X POST http://localhost:3000/api/inbox/inbox_123/confirm \\
  -H "Content-Type: application/json" \\
  -d '{"tasks":[{"title":"Reel 1"},{"title":"Reel 2"}]}'

# 5. List tasks
curl -b cookie.txt http://localhost:3000/api/tasks?workspace=MyStudio | jq

# 6. Ask agent
curl -b cookie.txt -X POST http://localhost:3000/api/agent/MyStudio \\
  -H "Content-Type: application/json" \\
  -d '{"message":"What should I do now?"}' | jq`}</code></pre>

        <Callout title="Beginner: How to Add a New Endpoint">
          Create file <code>app/api/my-feature/route.ts</code> → export <code>GET/POST</code> → validate session + workspace via DAL → use <code>db</code> from{" "}
          <code>lib/db</code> → return <code>NextResponse.json</code>. Add to docs here.
        </Callout>
      </DocsBody>
    </DocsPage>
  )
}
