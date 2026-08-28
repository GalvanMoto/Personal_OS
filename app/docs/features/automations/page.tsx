import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "What is Automation?", url: "#what-is-automation", depth: 2 },
        { title: "Concepts — Rules, Jobs, Runs", url: "#concepts-rules-jobs-runs", depth: 2 },
        { title: "Built-in Automations", url: "#built-in-automations", depth: 2 },
        { title: "Triggers & Conditions (Examples)", url: "#triggers-conditions-examples", depth: 2 },
        { title: "Cron & Scheduling", url: "#cron-scheduling", depth: 2 },
        { title: "Worker & Queue", url: "#worker-queue", depth: 2 },
        { title: "Creating Your First Rule", url: "#creating-your-first-rule", depth: 2 },
      ]}
    >
      <DocsTitle>Automations — Rules, Jobs & Cron</DocsTitle>
      <DocsDescription>
        Make DLRS proactive: auto-reminders, deadline monitors, follow-ups. Covers triggers, conditions, scheduling, and the Redis queue — beginner-friendly.
      </DocsDescription>
      <DocsBody>
        <h2 id="what-is-automation">What is Automation?</h2>
        <Callout title="Beginner: If This Then That">
          <strong>Automation = Rule</strong>: <em>When</em> something happens <em>and</em> condition true → <em>do</em> action. Like “If task due in 2 days, notify me daily.”
        </Callout>
        <p>
          Located: <code>/w/[workspace]/automations</code>. Table: <code>automation_rules</code> — each row is a rule with <code>trigger, condition, action, enabled</code>. Runs create{" "}
          <code>jobs</code> → <code>job_runs</code> log.
        </p>

        <h2 id="concepts-rules-jobs-runs">Concepts — Rules, Jobs, Runs</h2>
        <pre><code>{`automation_rules {
  id, workspace_id,
  name: "Deadline 2 days notify",
  trigger: "task.due_approaching",  // event
  condition: { days_before: 2 },   // when to fire
  action: { type: "notify", channel: "push", template: "GB reel due tomorrow..." },
  enabled: true,
  last_run_at
}

jobs {
  id, rule_id, payload: { task_id }, status: "pending"|"running"|"done"|"failed", run_at
}

job_runs {
  id, job_id, started_at, finished_at, output, error
}`}</code></pre>
        <p>Keywords: <code>trigger</code> (event), <code>condition</code> (filter), <code>action</code> (what to do), <code>job</code> (queued work), <code>run</code> (execution log).</p>

        <h2 id="built-in-automations">Built-in Automations</h2>
        <Tabs items={["Reminders & Deadlines", "Email & Finance", "System"]}>
          <Tab value="Reminders & Deadlines">
            <ul>
              <li><strong>Reminder Engine</strong> — Contextual: “GB reel due tomorrow, export pending” (not just “Task due”).</li>
              <li><strong>Overdue monitor</strong> — Daily check: <code>due_date &lt; today AND status NOT IN (Completed)</code> → notify + increase priority.</li>
              <li><strong>At-risk</strong> — If remaining &gt; available → badge + notify.</li>
            </ul>
          </Tab>
          <Tab value="Email & Finance">
            <ul>
              <li><strong>Email ingestion</strong> — Gmail webhook → Email Agent → tasks.</li>
              <li><strong>Statement parsing</strong> — Upload → Finance Agent → transactions.</li>
              <li><strong>Subscription detection</strong> — From emails + transactions → upcoming payments.</li>
            </ul>
          </Tab>
          <Tab value="System">
            <ul>
              <li><strong>Calendar sync</strong> — Every 15m fetch new events → commitment graph.</li>
              <li><strong>Daily briefing</strong> — Cron 08:00 → Orchestrator → “3 overdue, 2 due today”.</li>
              <li><strong>Drive indexing</strong> — Hourly or on-demand.</li>
            </ul>
          </Tab>
        </Tabs>

        <h2 id="triggers-conditions-examples">Triggers &amp; Conditions (Examples)</h2>
        <pre><code>{`Trigger: task.created         → Condition: client = GB → Action: create checklist
Trigger: task.due_approaching → Condition: days_before = 2 → Action: notify push
Trigger: task.overdue          → Condition: priority = High → Action: notify daily
Trigger: task.waiting          → Condition: waiting_days > 3 → Action: follow-up email draft
Trigger: transaction.created   → Condition: merchant = "Netflix" → Action: detect subscription
Trigger: cron "0 8 * * 1-5"    → Action: morning briefing (weekdays 8am)`}</code></pre>
        <Callout title="Beginner: Cron Syntax">
          <code>0 8 * * 1-5</code> = minute hour day month weekday. <br />
          <code>*</code> = any. <code>1-5</code> = Mon-Fri. So <code>0 8 * * 1-5</code> = weekdays 8:00am. Use{" "}
          <a href="https://crontab.guru" target="_blank" className="underline">
            crontab.guru
          </a>{" "}
          to test.
        </Callout>

        <h2 id="cron-scheduling">Cron &amp; Scheduling</h2>
        <Steps>
          <Step><h3>Per-Task Policy</h3><p>Task → Reminders tab → Policy: Automatic (7d, 3d, 1d, morning-of, overdue) | Custom | None. Auto adapts to priority.</p></Step>
          <Step><h3>Global Rules</h3><p>Automations → New → Trigger cron <code>0 9 * * *</code> → Action: notify “Daily briefing”.</p></Step>
          <Step><h3>Recurrence</h3><p>Task → Repeat: Never/Daily/Weekdays/Weekly/Monthly/Custom. Stored as <code>recurrence_rule</code> (iCal RRULE), not expanded rows.</p></Step>
        </Steps>

        <h2 id="worker-queue">Worker &amp; Queue</h2>
        <pre><code>{`Producer: API route → ioredis.lpush("queue:jobs", JSON.stringify(job))

Consumer: npm run worker (lib/jobs/worker.ts)
- BLPOP queue, run handler, update job_runs
- Retry 3x with backoff on failure
- Logs to activity_log

Deployment:
- Local: separate terminal npm run worker
- Prod: separate service (Docker, PM2, systemd)
- Health: check Redis + job_runs for failed`}</code></pre>
        <Callout type="warn" title="Technical: Tenancy in Jobs">
          Jobs include <code>workspace_id</code>. Worker always scopes DB queries via tenant DAL — no cross-workspace leak.
        </Callout>

        <h2 id="creating-your-first-rule">Creating Your First Rule</h2>
        <Steps>
          <Step><h3>Open Automations</h3><p>Go to <code>/w/[workspace]/automations</code> → New Rule.</p></Step>
          <Step><h3>Configure</h3><pre><code>{`Name: Follow up waiting tasks
Trigger: task.waiting
Condition: waiting_for != null AND days_waiting > 3
Action: Create notification "Follow up with {{waiting_for}} about {{task_title}}"
Enabled: true`}</code></pre></Step>
          <Step><h3>Test</h3><p>Create a task → set Waiting, follow_up_date = tomorrow → check <code>job_runs</code> after cron or manual trigger.</p></Step>
        </Steps>
      </DocsBody>
    </DocsPage>
  )
}
