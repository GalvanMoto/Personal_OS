import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "Security Model Overview", url: "#security-model-overview", depth: 2 },
        { title: "Workspace Isolation (Tenancy)", url: "#workspace-isolation-tenancy", depth: 2 },
        { title: "Authentication & Sessions", url: "#authentication-sessions", depth: 2 },
        { title: "Vault — Encrypted Secrets", url: "#vault-encrypted-secrets", depth: 2 },
        { title: "Bank Statement Security", url: "#bank-statement-security", depth: 2 },
        { title: "Database Schema & Prisma", url: "#database-schema-prisma", depth: 2 },
        { title: "Audit & Provenance", url: "#audit-provenance", depth: 2 },
        { title: "Checklist for Production", url: "#checklist-for-production", depth: 2 },
      ]}
    >
      <DocsTitle>Security &amp; Database — Tenancy, Vault, Audit</DocsTitle>
      <DocsDescription>
        How DLRS keeps your data isolated, vault-encrypted, and fully auditable. Covers tenancy guards, session security, vault design, and Prisma schema — beginner to advanced.
      </DocsDescription>
      <DocsBody>
        <h2 id="security-model-overview">Security Model Overview</h2>
        <pre><code>{`DLRS Security Layers:

1. Tenancy (DB level)     → workspace_id on every row, DAL guards
2. Auth (Session)         → signed cookie, HttpOnly, SameSite, SESSION_SECRET
3. Vault (Encryption)     → AES-256-GCM for OAuth tokens, PAN/DOB fragments
4. Provenance (Audit)     → every action logged with source + approved_by
5. Permissions (Agent)    → SAFE vs SENSITIVE tool risk`}</code></pre>
        <Callout title="Beginner: Why Tenancy Matters">
          Tenancy = your workspace data never leaks to another workspace. Even if code has bug, DAL check <code>WHERE workspace_id = ?</code> prevents cross-tenant read. It's iron-clad, not just UI filtering.
        </Callout>

        <h2 id="workspace-isolation-tenancy">Workspace Isolation (Tenancy)</h2>
        <Tabs items={["How It Works", "Check Script", "Example Violation"]}>
          <Tab value="How It Works">
            <pre><code>{`// lib/db/tenant.ts — wraps Prisma
export function tenantDb(workspaceId: string) {
  return {
    task: {
      findMany: (args) => prisma.task.findMany({ ...args, where: { ...args.where, workspaceId } }),
      create: (args) => prisma.task.create({ data: { ...args.data, workspaceId } }),
      // update, delete likewise
    }
  }
}

// In every route:
const user = await getCurrentUser()
await requireWorkspaceMember(params.workspace, user.id)
const db = tenantDb(params.workspace)
await db.task.findMany({ where: { status: "InProgress" } }) // auto-scoped
`}</code></pre>
          </Tab>
          <Tab value="Check Script">
            <pre><code>{`npm run check:tenancy
# Runs scripts/check-tenant-isolation.ts
# Scans lib/** for patterns like:
# db.task.findMany({ where: { status: "x" } }) WITHOUT workspaceId → FAIL
# Ensures every query includes workspace_id

# CI gate: fails build if unscoped query found`}</code></pre>
          </Tab>
          <Tab value="Example Violation">
            <pre><code>{`// ❌ Bad: no tenancy
await prisma.task.findMany({ where: { status: "InProgress" } })
// → check:tenancy fails

// ✅ Good: tenant wrapper
await db.task.findMany({ where: { status: "InProgress" } })
// → expands to WHERE workspaceId = 'my-studio' AND status = ...`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="authentication-sessions">Authentication &amp; Sessions</h2>
        <pre><code>{`Env: SESSION_SECRET (32-byte hex)
Cookie: session=base64(JSON.stringify({ userId, workspaceId })) + HMAC(SHA256, SESSION_SECRET)
Flags: HttpOnly, Secure (in prod), SameSite=Lax, Path=/, Max-Age=30d

Flow:
1. POST /login { email, password } → verify via bcrypt
2. Create session → Set-Cookie
3. Subsequent requests: getSession() decrypts + verifies HMAC
4. getCurrentUser() → db.user.findUnique

Logout: clear cookie
Middleware: app/middleware.ts protects /w/* → redirect /login if no session`}</code></pre>
        <Callout type="warn" title="🔒 Must Change Default">
          Generate unique <code>SESSION_SECRET</code> per deployment. If leaked, all sessions forgeable. Rotate: invalidate all cookies.
        </Callout>

        <h2 id="vault-encrypted-secrets">Vault — Encrypted Secrets</h2>
        <Tabs items={["What is Vault?", "How Encryption Works", "Vault Items"]}>
          <Tab value="What is Vault?">
            <p>Vault stores sensitive data that would be plaintext in DB if naive: OAuth tokens, bank password hints.</p>
            <pre><code>{`Table: vault_items {
  id, workspace_id, kind: "gmail"|"drive"|"pan"|"dob",
  encrypted_blob: string (base64 of AES-GCM ciphertext),
  created_at, updated_at
}`}</code></pre>
          </Tab>
          <Tab value="How Encryption Works">
            <pre><code>{`Key: SECRET_ENCRYPTION_KEY (32-byte hex, e.g., a1b2… from node -e crypto...)
Algorithm: AES-256-GCM (lib/security/vault.ts)
Encrypt: vault = encrypt(JSON.stringify({ access_token, refresh_token }), SECRET_ENCRYPTION_KEY)
Decrypt: JSON.parse(decrypt(vault_items.encrypted_blob, SECRET_ENCRYPTION_KEY)) // in-memory, per request

No plaintext at rest. Decrypt only transiently, never logged.`}</code></pre>
          </Tab>
          <Tab value="Vault Items">
            <pre><code>{`Kinds:
- gmail: { access_token, refresh_token, expiry }
- drive: same
- calendar: same
- pan: "ABCDE1234F" (if provided)
- dob: "1990-01-01"
- phone: "98xxxxxx10"

Decrypt example in handler:
const blob = await db.vault_items.findFirst({ where: { workspace_id, kind: "gmail" } })
const tokens = JSON.parse(decrypt(blob.encrypted_blob, process.env.SECRET_ENCRYPTION_KEY))`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="bank-statement-security">Bank Statement Security</h2>
        <div className="space-y-3">
          <div>
            <h3>Vault Hints</h3>
            <p>Store PAN/DOB/phone fragments encrypted. Not full passwords — just hints to try patterns.</p>
          </div>
          <div>
            <h3>Transient Trial</h3>
            <pre><code>{`for (pattern of ["DDMMYYYY", "PAN+DD", "phone+..."]) {
  password = build(pattern, decryptHints())
  try { pdf.unlock(password) } catch {}
  if (success) break
}
 // Password variable goes out of scope, garbage collected. Never stored.`}</code></pre>
          </div>
          <div>
            <h3>Validation</h3>
            <p>After parse, validate totals with integer minor units; if mismatch, flag. Finance Agent never trusts LLM for arithmetic.</p>
          </div>
        </div>

        <h2 id="database-schema-prisma">Database Schema &amp; Prisma</h2>
        <Accordion>
          <AccordionItem value="prisma-setup" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">🗃️ Core Tables Overview</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <pre><code>{`users { id, email, name, timezone, password_hash }
workspaces { id, name, slug, owner_id }
workspace_members { workspace_id, user_id, role: owner|member }

clients { id, workspace_id, name, contact_email }
projects { id, workspace_id, client_id, name, status }
tasks { ... as in Tasks docs }

emails, attachments, files, documents, notes, links
calendar_events, transactions, subscriptions, invoices
automation_rules, jobs, job_runs
activity_log, vault_items, inbox_items`}</code></pre>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="prisma-commands" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">⚙️ Prisma Commands</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <pre><code>{`npm run db:generate → generates @prisma/client to node_modules/.prisma
npm run db:migrate → creates migration SQL in prisma/migrations, applies to DB
npm run db:seed    → runs prisma/seed.ts (demo data)
npm run db:studio  → opens Prisma Studio at http://localhost:5555 (GUI)`}</code></pre>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="prisma7" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Prisma 7 Adapter Note</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <pre><code>{`// prisma7.config.ts required for Postgres in Prisma 7
import { defineConfig } from "prisma/config"
export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
})

// lib/db.ts uses @prisma/adapter-pg with pg Pool
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })`}</code></pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 id="audit-provenance">Audit &amp; Provenance</h2>
        <pre><code>{`Tables:
activity_log { id, workspace_id, actor, action, target_id, details, created_at }
task_extractions { id, task_id, inbox_item_id, extracted_json, confidence, model }
job_runs { id, job_id, output, error, started_at, finished_at }

Query example:
SELECT * FROM activity_log
WHERE workspace_id = 'my-studio' AND action = 'create_task'
ORDER BY created_at DESC;

UI: Task → Source → shows "Created from Gmail ID abc123, confidence 0.94, by Email Agent"`}</code></pre>

        <h2 id="checklist-for-production">Checklist for Production</h2>
        <Callout type="error" title="🔒 Security Checklist">
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li>Unique strong <code>SESSION_SECRET</code>, <code>SECRET_ENCRYPTION_KEY</code>, <code>WEBHOOK_SECRET</code> — never default</li>
            <li><code>DATABASE_URL</code> with SSL (<code>?sslmode=require</code> for managed DB)</li>
            <li><code>NODE_ENV=production</code> → Secure cookies, no stack traces to client</li>
            <li><code>npm run check:tenancy</code> passes in CI</li>
            <li>Backup vault: export encrypted blobs + keep <code>SECRET_ENCRYPTION_KEY</code> safe (like master password)</li>
            <li>Rate limit: 100 req/min per IP (in next.config or reverse proxy)</li>
            <li>Rotate OAuth refresh tokens periodically</li>
          </ul>
        </Callout>
      </DocsBody>
    </DocsPage>
  )
}
