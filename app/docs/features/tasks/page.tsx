import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "What is a Task Object?", url: "#what-is-a-task-object", depth: 2 },
        { title: "Fields Explained (Beginner)", url: "#fields-explained-beginner", depth: 2 },
        { title: "Statuses — Not Just Done/Not Done", url: "#statuses-not-just-done-not-done", depth: 2 },
        { title: "Priority — Auto Scoring 0–100", url: "#priority-auto-scoring-0100", depth: 2 },
        { title: "Checklist, Subtasks & Dependencies", url: "#checklist-subtasks-dependencies", depth: 2 },
        { title: "Context Pack — Your Workspace", url: "#context-pack-your-workspace", depth: 2 },
        { title: "Work Sessions (Timer)", url: "#work-sessions-timer", depth: 2 },
        { title: "At-Risk & Blocked Logic", url: "#at-risk-blocked-logic", depth: 2 },
        { title: "UI: List, Drawer, Page", url: "#ui-list-drawer-page", depth: 2 },
        { title: "Database & Tips", url: "#database-tips", depth: 2 },
      ]}
    >
      <DocsTitle>Tasks &amp; Work Management — Living Objects</DocsTitle>
      <DocsDescription>
        A task is not a checkbox. It's a connected object with source, client, project, files, emails, checklist, timer, and automation. Every field explained.
      </DocsDescription>
      <DocsBody>
        <h2 id="what-is-a-task-object">What is a Task Object?</h2>
        <Callout title="Beginner: Task vs Todo">
          In DLRS, a task knows <em>why</em> it exists (source Gmail ID), <em>what</em> is needed (Drive assets, checklist), <em>who</em> is waiting (Sarah), and{" "}
          <em>what's next</em> (AI nextAction). It's alive, not static.
        </Callout>
        <pre><code>{`Task {
  id, workspace_id,
  title: "Create GB Event Reel",
  description, requirements, expectedOutcome,
  type: ClientWork|Design|SEO|...,
  status: Inbox→Planned→InProgress→Waiting/Blocked→Review→Completed,
  status_mode: auto | manual_override,
  priority: Critical|High|Medium|Low,  priority_mode: auto|manual, priority_score: 0–100,
  project_id, client_id, parent_task_id, milestone_id,
  assignee_id, requested_by_id,
  start_date, due_date, completed_at,
  estimated_minutes, remaining_minutes, actual_minutes,
  next_action: "Download photos from Drive",
  blocked_reason, waiting_for, follow_up_date,
  recurrence_rule, reminder_policy,
  source_type: "gmail"|"inbox"|"manual", source_id, ai_confidence,
  created_at, updated_at, last_activity_at
}`}</code></pre>

        <h2 id="fields-explained-beginner">Fields Explained (Beginner)</h2>
        <Tabs items={["Basics", "People & Project", "Dates & Time", "Provenance"]}>
          <Tab value="Basics">
            <ul>
              <li><code>title</code> — Short action: “Create event highlights reel”.</li>
              <li><code>description</code> — Details. <code>requirements</code> — bullet checklist items (AI splits “Use logo, add music”).</li>
              <li><code>expectedOutcome</code> — “Final MP4 ready for client approval” — helps agent know when done.</li>
              <li><code>task_type</code> — ClientWork, Development, Design, Content, Marketing, SEO, Research, etc.</li>
            </ul>
          </Tab>
          <Tab value="People & Project">
            <ul>
              <li><code>project_id</code> → <code>projects</code> table, <code>client_id</code> → <code>clients</code>.</li>
              <li><code>assignee_id</code> — who does it (you). <code>requested_by_id</code> — who asked (Sarah).</li>
              <li><code>parent_task_id</code> — for subtasks: “Create reels” parent → 3 children.</li>
            </ul>
          </Tab>
          <Tab value="Dates & Time">
            <ul>
              <li><code>due_date</code> — from AI or picker. Supports time: 2025-12-06 17:00.</li>
              <li><code>estimated_minutes</code> — AI guesses (90) or you set. <code>actual_minutes</code> — sum of <code>work_sessions</code>.</li>
              <li><code>remaining_minutes</code> — auto calc if <code>checklist</code> progress.</li>
            </ul>
          </Tab>
          <Tab value="Provenance">
            <ul>
              <li><code>source_type</code> — manual|inbox|gmail|calendar</li>
              <li><code>source_id</code> — e.g., <code>email_abc123</code></li>
              <li><code>ai_generated</code> + <code>ai_confidence</code> — 0.92 = high</li>
              <li>Click “Source” in UI → opens original Gmail.</li>
            </ul>
          </Tab>
        </Tabs>

        <h2 id="statuses-not-just-done-not-done">Statuses — Not Just Done/Not Done</h2>
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">When</th>
              <th className="p-2 text-left">Example</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t"><td className="p-2 font-mono">Inbox</td><td className="p-2">Just created, not reviewed</td><td className="p-2">Newly extracted, needs triage</td></tr>
            <tr className="border-t"><td className="p-2 font-mono">Not Started</td><td className="p-2">Reviewed, but not planned</td><td className="p-2">Backlog</td></tr>
            <tr className="border-t"><td className="p-2 font-mono">Planned</td><td className="p-2">Added to Today/Calendar</td><td className="p-2">Scheduled for tomorrow</td></tr>
            <tr className="border-t"><td className="p-2 font-mono">In Progress</td><td className="p-2">After [Start Work]</td><td className="p-2">Work session active</td></tr>
            <tr className="border-t"><td className="p-2 font-mono">Waiting</td><td className="p-2">Needs someone else</td><td className="p-2">Waiting for client logo</td></tr>
            <tr className="border-t"><td className="p-2 font-mono">Blocked</td><td className="p-2">Dependency / problem</td><td className="p-2">Blocked: software crash</td></tr>
            <tr className="border-t"><td className="p-2 font-mono">Review</td><td className="p-2">Checklist done, needs verification</td><td className="p-2">Exported, await approval</td></tr>
            <tr className="border-t"><td className="p-2 font-mono">Completed</td><td className="p-2">Verified done</td><td className="p-2">Client approved</td></tr>
          </tbody>
        </table>
        <Callout type="info" title="status_mode">
          <code>status_mode=manual_override</code> prevents automation from overriding your manual change. Auto mode allows <code>Blocked</code> when dependency unresolved.
        </Callout>

        <h2 id="priority-auto-scoring-0100">Priority — Auto Scoring 0–100</h2>
        <div className="not-prose my-6 overflow-hidden rounded-2xl border bg-fd-card shadow-sm">
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="divide-y divide-fd-border">
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5"><span className="text-sm">Due ≤7 days</span><span className="inline-flex rounded-full bg-fd-muted px-2.5 py-0.5 text-xs font-mono font-medium">+10</span></div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5"><span className="text-sm">Due ≤3 days</span><span className="inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-mono font-medium text-amber-600 dark:text-amber-400">+20</span></div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5"><span className="text-sm">Due ≤1 day</span><span className="inline-flex rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-mono font-medium text-orange-600 dark:text-orange-400">+30</span></div>
              <div className="flex items-center justify-between bg-red-500/5 px-4 py-2.5 sm:px-5"><span className="text-sm font-medium">Overdue</span><span className="inline-flex rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-mono font-medium text-white">+40</span></div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5"><span className="text-sm">Client waiting</span><span className="inline-flex rounded-full bg-fd-muted px-2.5 py-0.5 text-xs font-mono font-medium">+20</span></div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5"><span className="text-sm">Blocks other tasks</span><span className="inline-flex rounded-full bg-fd-muted px-2.5 py-0.5 text-xs font-mono font-medium">+15</span></div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5"><span className="text-sm">High-value client</span><span className="inline-flex rounded-full bg-fd-muted px-2.5 py-0.5 text-xs font-mono font-medium">+10</span></div>
              <div className="flex items-center justify-between px-4 py-2.5 sm:px-5"><span className="text-sm">Project at risk</span><span className="inline-flex rounded-full bg-fd-muted px-2.5 py-0.5 text-xs font-mono font-medium">+15</span></div>
            </div>
            <div className="border-t bg-fd-muted/20 p-4 sm:border-l sm:border-t-0 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">Maps to</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border bg-fd-popover p-3"><div className="text-xs text-fd-muted-foreground">0–24</div><div className="mt-1 inline-flex rounded-full bg-zinc-500/15 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">Low</div></div>
                <div className="rounded-xl border bg-fd-popover p-3"><div className="text-xs text-fd-muted-foreground">25–49</div><div className="mt-1 inline-flex rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">Medium</div></div>
                <div className="rounded-xl border bg-fd-popover p-3"><div className="text-xs text-fd-muted-foreground">50–74</div><div className="mt-1 inline-flex rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">High</div></div>
                <div className="rounded-xl border bg-fd-primary p-3 text-fd-primary-foreground"><div className="text-xs opacity-80">75+</div><div className="mt-1 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">Critical</div></div>
              </div>
              <div className="mt-4 rounded-lg bg-fd-popover px-3 py-2 text-center text-xs">Badge: <span className="font-medium">“High · 84 · Due tomorrow + blocks 1”</span> · <code>priority_mode=Locked</code> freezes</div>
            </div>
          </div>
          <div className="border-t bg-fd-muted/30 px-4 py-2 text-center text-xs text-fd-muted-foreground">→ Normalize 0–100</div>
        </div>

        <h2 id="checklist-subtasks-dependencies">Checklist, Subtasks &amp; Dependencies</h2>
        <Tabs items={["Checklist vs Subtask", "Dependencies"]}>
          <Tab value="Checklist vs Subtask">
            <ul>
              <li><strong>Checklist</strong> (<code>task_checklist_items</code>): tiny actions: “Download assets, Select photos, Add music”. Progress bar 3/6.</li>
              <li><strong>Subtask</strong> (<code>parent_task_id</code>): full task lifecycle (own status, due, assignee). For meaningful work like “Edit video”.</li>
            </ul>
            <p>AI creates checklist from brief. You can promote checklist item to subtask.</p>
          </Tab>
          <Tab value="Dependencies">
            <pre><code>{`Task A depends_on B → B must complete first
Blocks: A blocks C → C waits
UI: Dependency Status = Ready | Waiting | Blocked
Auto: When B completes → A re-evaluates → Ready → reminder`}</code></pre>
          </Tab>
        </Tabs>

        <h2 id="context-pack-your-workspace">Context Pack — Your Workspace</h2>
        <div className="not-prose my-6 grid gap-3 rounded-2xl border bg-fd-card p-4 shadow-sm sm:grid-cols-2">
          <div className="space-y-2 rounded-xl border bg-fd-popover p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Create GB Event Reel</div>
              <span className="rounded-full bg-fd-primary px-2 py-0.5 text-xs font-medium text-fd-primary-foreground">[Start Work]</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">High · In Progress · Due Dec 6 · 84</div>
            <div className="h-px w-full bg-fd-border" />
            <div className="text-xs font-semibold">Description | Requirements (checklist)</div>
            <div className="rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs">Next Action: <span className="font-medium">Download GB-Dec-2025 photos from Drive</span></div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-xl border bg-fd-popover p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">Context</div>
              <div className="mt-2 space-y-1.5 text-sm">
                <div>Project: Social Media</div>
                <div>Client: GB Banquet</div>
                <div>Emails (2) · Files (Drive) · Documents · Links</div>
              </div>
            </div>
            <div className="rounded-xl border bg-fd-popover p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">Details</div>
              <div className="mt-2 space-y-1.5 text-sm">
                <div>Priority: High</div>
                <div>Due: Dec 6 5pm</div>
                <div>Est: 90m | Actual: 42m</div>
                <div>Status: In Progress</div>
                <div>Assignee: You · Source: Gmail abc123</div>
              </div>
            </div>
          </div>
        </div>
        <p>All pulled via relationship graph: <code>tasks → projects → clients → files → emails</code>.</p>

        <h2 id="work-sessions-timer">Work Sessions (Timer)</h2>
        <Steps>
          <Step><p>Click [Start Work] → creates <code>task_work_sessions {"{ started_at }"}</code>.</p></Step>
          <Step><p>Timer shows Focus Mode 01:24:12 (in header).</p></Step>
          <Step><p>Stop → asks “What did you accomplish?” → logs, updates <code>actual_minutes</code>.</p></Step>
        </Steps>
        <p>Used for At-Risk calc and daily report.</p>

        <h2 id="at-risk-blocked-logic">At-Risk &amp; Blocked Logic</h2>
        <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border bg-fd-card p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">At-Risk Formula</div>
            <div className="mt-2 rounded-xl border bg-fd-popover p-3 font-mono text-xs leading-relaxed">
              <div>remaining = estimated − actual</div>
              <div className="text-fd-muted-foreground">e.g., 90 − 42 = 48m</div>
              <div className="mt-2">available = working_hours_between(now, due)</div>
              <div className="text-fd-muted-foreground">e.g., 2h</div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400">if remaining &gt; available → <span className="rounded-full bg-red-500 px-2 py-0.5 text-white">At Risk</span></div>
            </div>
          </div>
          <div className="rounded-2xl border bg-fd-card p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">Blocked</div>
            <div className="mt-2 rounded-xl border bg-fd-popover p-3 font-mono text-xs leading-relaxed">
              <div>if depends_on unresolved → Blocked</div>
              <div className="mt-2 flex items-center gap-2 text-xs"><span className="size-2 rounded-full bg-amber-500" /> Waiting vs <span className="size-2 rounded-full bg-red-500" /> Blocked</div>
            </div>
            <div className="mt-3 text-xs text-fd-muted-foreground">Auto re-evaluates when dependency completes → Ready</div>
          </div>
        </div>

        <h2 id="ui-list-drawer-page">UI: List, Drawer, Page</h2>
        <ul>
          <li><strong>List</strong> <code>/w/[workspace]/tasks</code> — filters: Status, Priority, Due, Client, Project, Tags; smart: Overdue, At Risk, Waiting.</li>
          <li><strong>Drawer</strong> — Click row → right drawer (quick edit, Start Work, Open Full).</li>
          <li><strong>Page</strong> <code>/w/[workspace]/tasks/[id]</code> — full Context Pack, tabs: Overview, Checklist, Context, Files, Emails, Notes, Activity, Reminders.</li>
        </ul>

        <h2 id="database-tips">Database &amp; Tips</h2>
        <Accordion>
          <AccordionItem value="db" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Core Tables</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <pre><code>{`tasks, task_checklist_items, task_dependencies, task_work_sessions,
task_files, task_links, task_notes, task_activity, task_reminders`}</code></pre>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="tip" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Beginner Tips</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="list-disc pl-4 space-y-1">
                <li>Only fill Title + Project + Due when creating manually — AI does rest.</li>
                <li>Use Checklist for small steps, Subtasks for big pieces.</li>
                <li>Set <code>Waiting for</code> + <code>follow_up_date</code> to auto-remind.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocsBody>
    </DocsPage>
  )
}
