import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { Callout } from "fumadocs-ui/components/callout"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Page() {
  return (
    <DocsPage
      toc={[
        { title: "Overview — Finance Intelligence", url: "#overview-finance-intelligence", depth: 2 },
        { title: "Bank Statement Pipeline (4 Steps)", url: "#bank-statement-pipeline-4-steps", depth: 2 },
        { title: "Vault & Security Model", url: "#vault-security-model", depth: 2 },
        { title: "Categorization & Deterministic Math", url: "#categorization-deterministic-math", depth: 2 },
        { title: "Subscriptions & Invoices", url: "#subscriptions-invoices", depth: 2 },
        { title: "Dashboard & Reports", url: "#dashboard-reports", depth: 2 },
        { title: "Database Schema", url: "#database-schema", depth: 2 },
        { title: "Beginner Tips", url: "#beginner-tips", depth: 2 },
      ]}
    >
      <DocsTitle>Finance &amp; Statements — Vault, Parsing, Reports</DocsTitle>
      <DocsDescription>
        Upload password-protected bank statements. Vault decrypts transiently, deterministic parser validates totals, AI categorizes. All beginner-friendly with security deep-dive.
      </DocsDescription>
      <DocsBody>
        <h2 id="overview-finance-intelligence">Overview — Finance Intelligence</h2>
        <Callout title="What Finance Module Does">
          Not a spreadsheet. From <strong>emails + bank PDFs</strong> it extracts: transactions, opening/closing balance, credits/debits, categories (Food, Software…), and subscriptions (Netflix, Adobe). Validates math, not just AI guess.
        </Callout>
        <p>Located: <code>/w/[workspace]/finance</code> → Overview, Transactions, Subscriptions, Invoices. Handles sensitive data via <code>SECRET_ENCRYPTION_KEY</code> vault.</p>

        <h2 id="bank-statement-pipeline-4-steps">Bank Statement Pipeline (4 Steps)</h2>
        <Steps>
          <Step>
            <h3>1. Upload — Vault Hints</h3>
            <p>Finance → Import → choose PDF (SBI/HDFC/ICICI). Enter vault hints: PAN, DOB, phone last 4 (stored encrypted).</p>
            <pre><code>{`Route: POST /api/finance/import
Body: multipart/form-data { file, workspace_id }
Store: STORAGE_DIR/finance/<workspace>/<id>.pdf`}</code></pre>
          </Step>
          <Step>
            <h3>2. In-Memory Unlock (Secure)</h3>
            <pre><code>{`Vault: AES-256 decrypt hints → try patterns:
- DDMMYYYY, MMDDYYYY, DDMMYY
- PAN(5)+DOB(4), Name+DOB
- Phone last 4 + combinations
Each try in-memory, not logged. Stops at first success.
If none → show "Try password" modal.`}</code></pre>
            <Callout type="warn" title="🔒 Security: No Password Logging">
              Passwords tried transiently, never written to <code>activity_log</code> or job payload. Vault blob encrypted at rest with <code>SECRET_ENCRYPTION_KEY</code>.
            </Callout>
          </Step>
          <Step>
            <h3>3. Parse &amp; Validate (Deterministic)</h3>
            <pre><code>{`Parser: unpdf → text → table detection (regex for dates, amounts)
Rows: { date, description, amountMinor (int), currency, type: credit|debit }
Totals:
  openingMinor + sum(credits) - sum(debits) === closingMinor
  If mismatch → flag "Statement totals don't match" (red).
Integer math: ₹18,420.50 → 1842050 minor units (no float errors).`}</code></pre>
          </Step>
          <Step>
            <h3>4. Categorize &amp; Review</h3>
            <p>AI proposes category per row; low-confidence (&lt;0.7) shown in Review modal.</p>
            <Tabs items={["Categories", "Review UI"]}>
              <Tab value="Categories">
                <ul>
                  <li>Food, Travel, Shopping, Software, Subscriptions, Bills, Business, Salary, Transfers, ATM, Unknown</li>
                  <li>Heuristic + LLM: merchant “Swiggy” → Food, “Adobe” → Software/Subscription</li>
                </ul>
              </Tab>
              <Tab value="Review UI">
                <p>Modal: table with Date | Description | Amount | Category dropdown | Confidence | Checkbox. Edit category, then Confirm.</p>
              </Tab>
            </Tabs>
          </Step>
        </Steps>

        <h2 id="vault-security-model">Vault &amp; Security Model</h2>
        <pre><code>{`Encryption:
- Key: SECRET_ENCRYPTION_KEY (32-byte hex, generate via ` + "`node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"`)" + `
- Algorithm: AES-256-GCM (in lib/security/vault.ts)
- Stored: oauth_tokens, pan, dob, phone fragments encrypted
- Decrypt: only in worker, in-memory, per request

Tables:
- vault_items { id, workspace_id, kind, encrypted_blob }
- Only workspace owner can read/write via DAL guard`}</code></pre>
        <Callout type="error" title="Production Warning">
          Rotating <code>SECRET_ENCRYPTION_KEY</code> breaks existing vault rows (can't decrypt). Migrate by re-encrypting with new key, don't just change env.
        </Callout>

        <h2 id="categorization-deterministic-math">Categorization &amp; Deterministic Math</h2>
        <Callout title="Why Deterministic > LLM for Totals">
          LLM never does arithmetic. Parser sums <code>amountMinor</code> ints, validates. LLM only labels merchant. This avoids “₹500 + ₹500 = ₹900” errors.
        </Callout>
        <pre><code>{`Example transaction:
{ date: "2025-12-01", description: "UPI-ADOBE", amountMinor: 167500, type: "debit" }
→ Category: Software (Adobe keyword)
→ Subscription? Expense 1675 monthly → detect → create subscriptions row`}</code></pre>

        <h2 id="subscriptions-invoices">Subscriptions &amp; Invoices</h2>
        <Tabs items={["Subscriptions", "Invoices/Receipts"]}>
          <Tab value="Subscriptions">
            <pre><code>{`Detection from emails ("Your Netflix receipt") + transactions ("NETFLIX" monthly):
subscriptions {
  id, workspace_id, name: "Netflix", amountMinor, currency,
  frequency: monthly|yearly, next_expected_payment, payment_method,
  source: "gmail"|"transaction", status: active
}
UI: /finance/subscriptions → Upcoming payments: Adobe ₹1675 due 2 Sep`}</code></pre>
            <p>Reminder automation: 3 days before due → notify.</p>
          </Tab>
          <Tab value="Invoices/Receipts">
            <pre><code>{`invoices { id, workspace_id, title, amountMinor, currency, issuer, date, file_id }
Linked to transactions for audit: invoice_123 → transaction_456`}</code></pre>
            <p>Upload invoice PDF → Document Agent extracts issuer, amount, date.</p>
          </Tab>
        </Tabs>

        <h2 id="dashboard-reports">Dashboard &amp; Reports</h2>
        <p><code>/w/[workspace]/finance</code> shows:</p>
        <ul>
          <li>Total spent this month: <code>₹18,420</code> vs last month (+12%)</li>
          <li>By category: Food ₹4,200 (22%), Software ₹2,400…</li>
          <li>By day chart (Recharts), by merchant, by account</li>
        </ul>
        <p>All computed via SQL <code>GROUP BY category</code> on minor units, formatted with <code>Intl.NumberFormat</code>.</p>

        <h2 id="database-schema">Database Schema</h2>
        <pre><code>{`accounts { id, workspace_id, name, type: bank|wallet, openingMinor }
transactions { id, workspace_id, account_id, date, description, amountMinor, currency, type, category, confidence }
subscriptions { ... as above }
invoices { ... }
expenses { id, workspace_id, title, amountMinor, category, receipt_file_id }
audit: activity_log records every finance change`}</code></pre>

        <h2 id="beginner-tips">Beginner Tips</h2>
        <Accordion>
          <AccordionItem value="tip1" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">One Statement at a Time</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">Upload one PDF, review, confirm. Don't batch 12 months at once — easier to catch parser errors.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="tip2" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Vault Hints Optional</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">If no vault, you can enter password manually per upload. Vault just saves re-typing.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="tip3" className="border-b">
            <AccordionTrigger className="px-4 py-3 font-medium">Categories Editable</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">AI guesses, you correct. Corrections improve future heuristics (stored as rules, not LLM fine-tune).</AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocsBody>
    </DocsPage>
  )
}
