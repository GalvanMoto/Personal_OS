import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "What Gmail Integration Does", url: "#what-gmail-integration-does", depth: 2 },
        { title: "OAuth Setup (Step-by-Step)", url: "#oauth-setup-step-by-step", depth: 2 },
        { title: "Token Storage & Security", url: "#token-storage-security", depth: 2 },
        { title: "Ingestion & Classification", url: "#ingestion-classification", depth: 2 },
        { title: "From Email to Task (Example)", url: "#from-email-to-task-example", depth: 2 },
        { title: "Database & Search", url: "#database-search", depth: 2 },
        { title: "Troubleshooting", url: "#troubleshooting", depth: 2 },
      ]}
    >
      <DocsTitle>Gmail Integration — Email Intelligence</DocsTitle>
      <DocsDescription>
        Connect Gmail to auto-classify emails (task vs invoice vs meeting), extract tasks with deadlines, and keep provenance. Covers OAuth, vault, and ingestion — beginner-friendly.
      </DocsDescription>
      <DocsBody>
        <h2 id="what-gmail-integration-does">What Gmail Integration Does</h2>
        <Callout title="Beyond Inbox Dump">
          It doesn't copy all emails as tasks. The <strong>Email Agent</strong> classifies each email:
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li><code>task_request</code> → create task (e.g., “Update pricing by Thursday”)</li>
            <li><code>invoice</code> → Finance (subscriptions, receipts)</li>
            <li><code>meeting</code> → Calendar event</li>
            <li><code>personal</code> → low priority, no auto-task</li>
          </ul>
          Only high-confidence task emails become tasks (confidence &gt; 0.8).
        </Callout>

        <h2 id="oauth-setup-step-by-step">OAuth Setup (Step-by-Step)</h2>
        <Steps>
          <Step>
            <h3>1. Enable APIs in Google Cloud</h3>
            <p>Console → APIs &amp; Services → Enable: <code>Gmail API</code>, <code>Google Drive API</code>, <code>Calendar API</code>.</p>
          </Step>
          <Step>
            <h3>2. Configure Consent Screen</h3>
            <ul>
              <li>User Type: External (for personal use, add test user = your email)</li>
              <li>App name: DLRS Personal OS</li>
              <li>Scopes: <code>.../auth/gmail.readonly</code> (read-only, safer), <code>.../auth/drive.readonly</code>, <code>.../auth/calendar.readonly</code></li>
            </ul>
          </Step>
          <Step>
            <h3>3. Create OAuth Credentials</h3>
            <p>Credentials → Create → OAuth 2.0 Client → Web application:</p>
            <pre><code>{`Authorized redirect URIs (exact, no trailing slash):
http://localhost:3000/api/integrations/gmail/callback
http://localhost:3000/api/integrations/drive/callback
http://localhost:3000/api/integrations/calendar/callback

For production:
https://yourdomain.com/api/integrations/gmail/callback`}</code></pre>
          </Step>
          <Step>
            <h3>4. Add to .env</h3>
            <pre><code>{`GMAIL_CLIENT_ID="123.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-..."
# Same credentials can be reused for Drive/Calendar or separate
GOOGLE_DRIVE_CLIENT_ID="..."
GOOGLE_DRIVE_CLIENT_SECRET="..."
GOOGLE_CALENDAR_CLIENT_ID="..."
GOOGLE_CALENDAR_CLIENT_SECRET="..."
SECRET_ENCRYPTION_KEY="already generated via node -e ..." # encrypts tokens
`}</code></pre>
          </Step>
          <Step>
            <h3>5. Connect in UI</h3>
            <p>
              <code>/w/[workspace]/settings/integrations</code> → Gmail → Connect → consent → redirect back with <code>code</code> → exchange for{" "}
              <code>access_token + refresh_token</code>.
            </p>
          </Step>
        </Steps>

        <h2 id="token-storage-security">Token Storage &amp; Security</h2>
        <pre><code>{`Flow:
1. OAuth callback: GET /api/integrations/gmail/callback?code=...
2. Exchange code → tokens via googleapis
3. Encrypt: vault = AES-256-GCM(JSON.stringify({ access_token, refresh_token }), SECRET_ENCRYPTION_KEY)
4. Store: vault_items { workspace_id, kind: "gmail", encrypted_blob }
5. Use: decrypt transiently per request, refresh if expired

Key file: lib/security/vault.ts
Table: vault_items (encrypted at rest, never logged)`}</code></pre>
        <Callout type="warn" title="🔒 Production Must">
          Never commit <code>.env</code>. Rotating <code>SECRET_ENCRYPTION_KEY</code> invalidates existing vault rows — re-encrypt via migration script.
        </Callout>

        <h2 id="ingestion-classification">Ingestion &amp; Classification</h2>
        <Tabs items={["Polling vs Webhook", "Classification Labels"]}>
          <Tab value="Polling vs Webhook">
            <p>Current: webhook/poll hybrid.</p>
            <pre><code>{`Option A: Gmail push notification (watch)
  POST https://gmail.googleapis.com/users/me/watch
  → Pub/Sub → POST /api/webhooks/inbox (verified via WEBHOOK_SECRET)

Option B: Poll (fallback, current worker every 5m)
  Worker calls Gmail history.list → new messages → queue jobs`}</code></pre>
            <p>Both queue <code>gmail_ingest</code> jobs via Redis.</p>
          </Tab>
          <Tab value="Classification Labels">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Label</th>
                  <th className="p-2 text-left">Meaning</th>
                  <th className="p-2 text-left">Auto-Task?</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2 font-mono">task_request</td>
                  <td className="p-2">Has action + deadline</td>
                  <td className="p-2">Yes, if confidence &gt; 0.8</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-mono">invoice/receipt</td>
                  <td className="p-2">Billing email</td>
                  <td className="p-2">Finance, not task</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-mono">meeting</td>
                  <td className="p-2">Invite</td>
                  <td className="p-2">Calendar event</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-mono">subscription</td>
                  <td className="p-2">Receipt</td>
                  <td className="p-2">Subscriptions table</td>
                </tr>
              </tbody>
            </table>
          </Tab>
        </Tabs>

        <h2 id="from-email-to-task-example">From Email to Task (Example)</h2>
        <pre><code>{`Email from Sarah <sarah@acme.com>:
Subject: Website pricing update
Body: "Please update pricing section on website by Thursday. See pricing.pdf attached. High priority."
Attachment: pricing.pdf (1 page)

Steps:
1. Fetch via Gmail API → store raw in emails { gmail_id, thread_id, subject, body, attachments }
2. Email Agent: classify task_request, confidence 0.94
3. Inbox Agent: extract client=Acme (from email domain), project=Website, task="Update pricing section",
     deadline=Thursday 2025-12-04, attachment=pricing.pdf, priority=High
4. Propose → Review modal → Create task linked to client/project, attach file
5. Provenance: task.source_type=gmail, source_id=email_abc123, ai_confidence=0.94
6. Click Source in task → opens Gmail thread`}</code></pre>

        <h2 id="database-search">Database &amp; Search</h2>
        <pre><code>{`emails {
  id, workspace_id, gmail_id, thread_id, subject, body_text, snippet,
  from_email, to_email, date, has_attachments, classification, confidence
}
attachments { id, email_id, filename, mime, storage_path }

Search: lib/search includes emails content — query "pricing" finds this email + task + file.`}</code></pre>

        <h2 id="troubleshooting">Troubleshooting</h2>
        <Accordion>
          <AccordionItem value="redirect" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Error: redirect_uri_mismatch</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              Exact match needed. No trailing slash. For localhost use <code>http://</code> not https. Copy from .env, paste one per line in Google Console.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="403" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">403: Access blocked — app not verified</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              Add your email to “Test users” in Consent Screen. For production, submit verification if using sensitive scopes.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="no-tasks" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Emails not creating tasks</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              Only task_request with high confidence becomes task. Low confidence stays in Inbox for review. Check <code>emails.classification</code> table.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocsBody>
    </DocsPage>
  )
}
