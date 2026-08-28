import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Step, Steps } from "fumadocs-ui/components/steps"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "Files vs Documents vs Notes", url: "#files-vs-documents-vs-notes", depth: 2 },
        { title: "Drive Indexing — How Search Works", url: "#drive-indexing-how-search-works", depth: 2 },
        { title: "Upload & Storage", url: "#upload-storage", depth: 2 },
        { title: "Document Intelligence (PDF/DOCX)", url: "#document-intelligence-pdf-docx", depth: 2 },
        { title: "Personal Search — One Query, All Sources", url: "#personal-search-one-query-all-sources", depth: 2 },
        { title: "Context Pack Revisited", url: "#context-pack-revisited", depth: 2 },
        { title: "Database & Keywords", url: "#database-keywords", depth: 2 },
      ]}
    >
      <DocsTitle>Files &amp; Documents — Global Knowledge Graph</DocsTitle>
      <DocsDescription>
        Drive files, uploaded PDFs, notes, and links form one searchable graph. Learn indexing, parsing, and the “ask, don't browse” search.
      </DocsDescription>
      <DocsBody>
        <h2 id="files-vs-documents-vs-notes">Files vs Documents vs Notes</h2>
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Where</th>
              <th className="p-2 text-left">Example</th>
              <th className="p-2 text-left">Table</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2 font-medium">File</td>
              <td className="p-2">Any binary</td>
              <td className="p-2">logo.png, reels.zip</td>
              <td className="p-2 font-mono">files</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-medium">Document</td>
              <td className="p-2">Parsed, searchable</td>
              <td className="p-2">brief.pdf with tables</td>
              <td className="p-2 font-mono">documents</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-medium">Note</td>
              <td className="p-2">User-written markdown</td>
              <td className="p-2">“Client prefers shorter reel”</td>
              <td className="p-2 font-mono">notes</td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-medium">Link</td>
              <td className="p-2">URL reference</td>
              <td className="p-2">https://drive.google.com/...</td>
              <td className="p-2 font-mono">links</td>
            </tr>
          </tbody>
        </table>
        <Callout title="Beginner: One Graph">
          File “GB-logo.png” can be linked to Client GB, Project Social Media, Task “Create reel”, and Email thread — all at once. Search finds it regardless of where you look.
        </Callout>

        <h2 id="drive-indexing-how-search-works">Drive Indexing — How Search Works</h2>
        <Steps>
          <Step>
            <h3>Connect Drive</h3>
            <p>OAuth as in Integrations → stores token in vault. No file content stored long-term, just metadata + index.</p>
          </Step>
          <Step>
            <h3>Indexing Job</h3>
            <pre><code>{`Job: drive_index (weekly or manual POST /api/integrations/drive/sync)
For each file in Drive:
- files { id, workspace_id, name, mime, folder_path, drive_id, parent_id, size }
- Extract text: Drive export → unpdf for PDFs, text for Docs
- Link: heuristics — name contains client/project → link
- Index: push to search (lib/search: fuse-like + vector optional)`}</code></pre>
          </Step>
          <Step>
            <h3>Example</h3>
            <pre><code>{`Folder: "GB-Banquet/Assets/logo-final.png"
→ Linked to client=GB Banquet (name match)
→ Query "GB logo" → returns file with highlight`}</code></pre>
          </Step>
        </Steps>

        <h2 id="upload-storage">Upload &amp; Storage</h2>
        <Tabs items={["Local FS (Default)", "Cloud (R2/S3)"]}>
          <Tab value="Local FS (Default)">
            <pre><code>{`STORAGE_DIR="./.storage"
Path: .storage/<workspace>/files/<id>-<filename>
DB: files { storage_path, mime, size, uploaded_by }

Pluggable: lib/storage/index.ts -> LocalAdapter
Swap: change adapter to R2Adapter (S3 API)`}</code></pre>
          </Tab>
          <Tab value="Cloud (R2/S3)">
            <pre><code>{`Env: R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET
Adapter: R2Adapter implements upload(path, buffer), download(path), delete(path)
No code change elsewhere — just adapter swap`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="document-intelligence-pdf-docx">Document Intelligence (PDF/DOCX)</h2>
        <Callout title="Keyword: Document Intelligence">
          Turns a 15-page PDF into searchable knowledge: extracts text, tables, dates, requirements, and makes it part of the graph.
        </Callout>
        <div className="not-prose my-6 rounded-2xl border bg-fd-card shadow-sm">
          <div className="border-b bg-fd-muted/40 px-4 py-3">
            <div className="text-sm font-semibold">Parser: <span className="font-mono text-fd-primary">unpdf</span> + custom table detector</div>
          </div>
          <div className="divide-y divide-fd-border">
            <div className="flex gap-3 px-4 py-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fd-primary text-xs font-bold text-fd-primary-foreground">1</div>
              <div><div className="text-sm font-medium">PDF → text blocks with bbox</div><div className="text-xs text-fd-muted-foreground">Preserves position for table detection</div></div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fd-primary text-xs font-bold text-fd-primary-foreground">2</div>
              <div><div className="text-sm font-medium">Detect tables via line alignment</div><div className="text-xs text-fd-muted-foreground">Finds columns: Requirements | Deliverable | Due</div></div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fd-primary text-xs font-bold text-fd-primary-foreground">3</div>
              <div><div className="text-sm font-medium">Extract columns</div><div className="font-mono text-xs text-fd-muted-foreground">Requirements | Deliverable | Due</div></div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white">4</div>
              <div><div className="text-sm font-medium">Summarize via LLM</div><div className="text-xs text-fd-muted-foreground">3-sentence summary for search</div></div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">5</div>
              <div><div className="text-sm font-medium">Store</div><div className="font-mono text-xs text-fd-muted-foreground">documents {"{ title, content_text, summary, extracted_json, file_id }"}</div></div>
            </div>
          </div>
          <div className="border-t bg-amber-500/10 px-4 py-3 text-xs">
            Use: Brief says <span className="font-medium">“Requirements: a) Use latest logo b) 9 photos”</span> → becomes checklist items
          </div>
        </div>

        <h2 id="personal-search-one-query-all-sources">Personal Search — One Query, All Sources</h2>
        <p>Route: <code>/w/[workspace]/search</code> or <code>⌘ K</code> or Assistant “Show everything for GB Banquet”.</p>
        <div className="not-prose my-6 space-y-3 rounded-2xl border bg-fd-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border bg-fd-popover px-3 py-1 text-xs font-mono shadow-sm">Query: "Where is GB latest logo?"</div>
            <span className="text-fd-muted-foreground">→</span>
            <span className="text-sm font-semibold">Search Agent</span>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between rounded-xl border bg-fd-popover px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-sm"><span className="size-2 rounded-full bg-emerald-500" /> Drive: GB-logo.png</div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">0.95</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border bg-fd-popover px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-sm">Emails: attachment in Sarah's email</div>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-mono font-medium text-amber-600">0.82</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border bg-fd-popover px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-sm">Tasks: previous task "Use logo"</div>
              <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs font-mono font-medium">0.77</span>
            </div>
            <div className="rounded-xl border border-dashed bg-fd-muted/30 px-3 py-2.5 text-sm">Notes: "Use summer banner"</div>
          </div>
          <div className="rounded-lg bg-fd-muted/50 px-3 py-2 text-xs text-fd-muted-foreground">Ranking: recency + exact match + workspace_id filter → ranked list with file preview, provenance</div>
        </div>
        <p>Implementation: <code>lib/search</code> — current is keyword (Fuse), vector (pgvector) optional for future.</p>

        <h2 id="context-pack-revisited">Context Pack Revisited</h2>
        <p>Every File/Document can appear in Task's Context Pack:</p>
        <div className="not-prose my-6 grid gap-3 rounded-2xl border bg-fd-card p-4 shadow-sm sm:grid-cols-2">
          <div className="rounded-xl border bg-fd-popover p-3">
            <div className="text-xs font-semibold">GB reel — Context Pack</div>
            <div className="mt-2 space-y-1.5 text-sm">
              <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-500" /> Files: logo-final.png <span className="rounded-full bg-fd-muted px-1.5 py-0.5 text-[10px]">Open Drive</span></div>
              <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-orange-500" /> Documents: brief.pdf <span className="rounded-full bg-fd-muted px-1.5 py-0.5 text-[10px]">View Parsed</span></div>
              <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-sky-500" /> Links: drive.google.com/GB-Dec-2025</div>
              <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-violet-500" /> Related emails: thread</div>
            </div>
          </div>
          <div className="rounded-xl border border-dashed bg-fd-muted/40 p-3 flex items-center justify-center text-center text-sm text-fd-muted-foreground">Click logo → preview without leaving task</div>
        </div>

        <h2 id="tiptap-document-editor-sharing">Tiptap Document Editor &amp; Public Sharing</h2>
        <p>
          Every Document has its own full-viewport editor page at <code>/w/[workspace]/documents/[id]</code> with an embedded <strong>Tiptap rich text canvas</strong>, live word wrapping, and fixed pinned controls:
        </p>
        <ul>
          <li><strong>Rich Authoring:</strong> Tables, headings, checklists, links, bold/italic, and quotes.</li>
          <li><strong>AI Summary &amp; Context:</strong> Author or update the AI semantic summary used across agent context packs.</li>
          <li><strong>Public Link Sharing:</strong> Toggle public access and generate read-only sharing URLs (<code>/share/[token]</code> or <code>/share/[id]</code>) with downloadable source files.</li>
        </ul>

        <h2 id="database-keywords">Database &amp; Keywords</h2>
        <div className="not-prose my-6 overflow-hidden rounded-2xl border bg-fd-card shadow-sm">
          <div className="divide-y divide-fd-border font-mono text-xs">
            <div className="bg-fd-muted/30 px-4 py-2 font-semibold">files <span className="text-fd-muted-foreground">— binary</span></div>
            <div className="px-4 py-2 truncate">{"{ id, workspace_id, name, mime, size, storage_path, drive_id, folder_path, linked_client_id, linked_project_id }"}</div>
            <div className="bg-fd-muted/30 px-4 py-2 font-semibold">documents <span className="text-fd-muted-foreground">— parsed</span></div>
            <div className="px-4 py-2 truncate">{"{ id, workspace_id, file_id, title, content_text, summary, extracted_json }"}</div>
            <div className="bg-fd-muted/30 px-4 py-2 font-semibold">notes / links</div>
            <div className="px-4 py-2 truncate">{"{ id, workspace_id, title, content_md, linked_task_id }"}</div>
          </div>
          <div className="border-t bg-fd-muted/20 px-4 py-2 text-xs text-fd-muted-foreground">Keywords: files (binary), documents (parsed), notes (markdown), links (URL), vault_items (encrypted)</div>
        </div>
      </DocsBody>
    </DocsPage>
  )
}
