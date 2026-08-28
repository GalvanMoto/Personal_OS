import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "What Drive Integration Does", url: "#what-drive-integration-does", depth: 2 },
        { title: "OAuth Setup", url: "#oauth-setup", depth: 2 },
        { title: "Indexing — How Files Get Found", url: "#indexing-how-files-get-found", depth: 2 },
        { title: "Linking to Clients/Projects", url: "#linking-to-clients-projects", depth: 2 },
        { title: "Search Example", url: "#search-example", depth: 2 },
        { title: "Storage & Database", url: "#storage-database", depth: 2 },
      ]}
    >
      <DocsTitle>Google Drive — Index Once, Find Everywhere</DocsTitle>
      <DocsDescription>
        Connect Drive to auto-index filenames, folders, and file contents. Ask “latest logo” from anywhere and get it instantly — beginner-friendly with technical depth.
      </DocsDescription>
      <DocsBody>
        <h2 id="what-drive-integration-does">What Drive Integration Does</h2>
        <Callout title="Beginner: Why Index?">
          Without indexing, you'd browse 5 folders deep to find <code>GB-logo-final.png</code>. With indexing, DLRS knows: file in <code>GB-Banquet/Assets</code>,
          linked to client GB, contains logo, last modified 2025-12-01. Search finds it in one query across Drive + Tasks + Emails.
        </Callout>
        <ul>
          <li>Indexes <strong>metadata</strong>: name, folder path, mime, size, modified time</li>
          <li>Extracts <strong>content</strong>: text from Docs/Sheets/PDFs via export</li>
          <li>Links to <strong>clients/projects</strong>: name heuristics</li>
          <li>Powers <strong>Context Pack</strong>: task “GB reel” auto-shows Drive folder link</li>
        </ul>

        <h2 id="oauth-setup">OAuth Setup</h2>
        <Steps>
          <Step>
            <h3>Google Cloud — Same as Gmail</h3>
            <p>Enable <code>Drive API</code>. Use same or separate OAuth credentials. Redirect:</p>
            <pre><code>{`http://localhost:3000/api/integrations/drive/callback`}</code></pre>
          </Step>
          <Step>
            <h3>.env</h3>
            <pre><code>{`GOOGLE_DRIVE_CLIENT_ID="..."
GOOGLE_DRIVE_CLIENT_SECRET="..."
SECRET_ENCRYPTION_KEY="..."`}</code></pre>
          </Step>
          <Step>
            <h3>Connect</h3>
            <p>Settings → Integrations → Drive → Connect → consent (read-only scope <code>.../auth/drive.readonly</code>) → token encrypted in vault.</p>
          </Step>
        </Steps>

        <h2 id="indexing-how-files-get-found">Indexing — How Files Get Found</h2>
        <pre><code>{`Trigger: manual POST /api/integrations/drive/sync or job weekly

Job: drive_index
Steps:
1. Decrypt token transiently
2. List files via Drive API (files.list, pageSize 100, trashed=false)
3. For each file:
   - files { id, workspace_id, name, mime, folder_path, drive_id, parent_id, size, modified_at }
   - If mime is Google Doc/Sheet/Slide/PDF → export to text (via Drive export)
   - Store text in documents.content_text
4. Index for search: lib/search indexing (keyword now, vector later)

Code: lib/integrations/drive/sync.ts`}</code></pre>
        <Tabs items={["Which Files Indexed?", "Not Indexed"]}>
          <Tab value="Which Files Indexed?">
            <ul>
              <li>All non-trashed files you have access to</li>
              <li>Google Docs/Sheets/Slides → exported as text</li>
              <li>PDFs → via unpdf extraction</li>
              <li>Images with text → OCR if possible</li>
            </ul>
          </Tab>
          <Tab value="Not Indexed">
            <ul>
              <li>Trashed files</li>
              <li>Shared drives you haven't added? Need additional scope</li>
              <li>Large videos (metadata only, no transcription yet)</li>
            </ul>
          </Tab>
        </Tabs>

        <h2 id="linking-to-clients-projects">Linking to Clients/Projects</h2>
        <pre><code>{`Heuristics in lib/integrations/drive/link.ts:
- File name contains client name: "GB-logo.png" → client_id = GB Banquet
- Folder path contains project: "/GB-Banquet/Assets" → project_id = GB Banquet Assets
- Content mentions client: Doc says "For GB Banquet event"

Result: files.linked_client_id, linked_project_id
Used in Context Pack: task for GB → shows linked files automatically`}</code></pre>

        <h2 id="search-example">Search Example</h2>
        <pre><code>{`User query: "Find Tanniaqua product spec"
→ Search Agent:
   Drive: Tanniaqua-Product-Spec.pdf (score 0.95, path /TanniaquaZone/Product/)
   Tasks: "Update product post" (0.72)
   Emails: Sarah email mentioning spec (0.68)

Ranking: exact name match > folder path > content mention > recency

Returns: file card with [Open Drive] + [Preview] + provenance`}</code></pre>

        <h2 id="storage-database">Storage &amp; Database</h2>
        <pre><code>{`Tables:
files {
  id, workspace_id, name, mime, size, storage_path, drive_id,
  folder_path, parent_id, linked_client_id, linked_project_id, modified_at
}
documents {
  id, workspace_id, file_id, title, content_text, summary, extracted_json
}

Keywords: drive_id (Google's ID), folder_path ("/GB/Assets"), linked_* (graph edges)

Storage: Drive files not duplicated locally (only metadata); uploaded files stored in STORAGE_DIR`}</code></pre>
      </DocsBody>
    </DocsPage>
  )
}
