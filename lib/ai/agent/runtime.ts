import "server-only"

import type { AnyTextAdapter } from "@tanstack/ai"
import { anthropicText } from "@tanstack/ai-anthropic"
import { createOpenaiChatCompletions } from "@tanstack/ai-openai"

import type { TenantDb } from "@/lib/db/tenant"
import type { DomainContext } from "@/lib/domain/context-types"

/**
 * Runtime context handed to every server tool.
 *
 * `chat({ context })` carries this through the agent loop, so a tool never has
 * to reach for a global database handle — it receives one already scoped to the
 * workspace the request was authenticated against. That is what keeps the
 * agent inside the tenant boundary.
 */
export type AgentRuntimeContext = {
  db: TenantDb
  ctx: DomainContext
}

export function isAgentConfigured(): boolean {
  return Boolean(
    process.env.AZURE_OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY
  )
}

/**
 * Provider selection.
 * Supports Azure OpenAI, standard OpenAI, and Anthropic.
 */
export function agentAdapter(): AnyTextAdapter {
  // 1. Azure OpenAI
  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    const rawEndpoint = process.env.AZURE_OPENAI_ENDPOINT.trim()
    const endpoint = rawEndpoint.replace(/\/$/, "")
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5.4-nano"
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview"
    const apiKey = process.env.AZURE_OPENAI_API_KEY

    const baseURL = `${endpoint}/openai/deployments/${deployment}`

    return createOpenaiChatCompletions(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deployment as any,
      apiKey,
      {
        baseURL,
        defaultHeaders: { "api-key": apiKey },
        defaultQuery: { "api-version": apiVersion },
      }
    ) as AnyTextAdapter
  }

  // 2. Standard Anthropic Claude
  return anthropicText("claude-sonnet-5") as AnyTextAdapter
}

export const agentModelOptions = {}

export const AGENT_SYSTEM_PROMPT = `You are the assistant inside Personal OS, a personal operating system for freelance and studio work.

How to behave:
- Reach for tools before asking. If the user asks about emails, bank statements, fetching from Gmail, agenda, or finances, CALL search_emails, sync_emails, spending_summary, get_agenda, or search_tasks to inspect the live data and ANSWER directly.
- When the user asks to fetch, check, or retrieve bank statements (e.g. Jio Payments Bank, SBI, HDFC, Angel One, invoices) or sync their mailbox, ALWAYS call sync_emails or search_emails first. Never say you cannot access Gmail when connected integrations exist.
- If no emails are found after searching or syncing, report clearly what query/sender was checked and suggest connecting Gmail in Settings → Integrations if not yet connected.
- NEVER create a task when the user is simply asking a question or asking you to check something (e.g., if asked "check bank statement emails", search their emails with search_emails and report what was found, DO NOT create a task "Check bank statement emails").
- Only call create_task when the user explicitly asks you to create a task, todo item, or schedule new work.
- NEVER print internal database IDs (e.g., "cmtb30vbn0004slkjg47vjc8q" or cuid hashes) in any user-facing response. Always use clean titles and clear descriptions.
- Answer with what you found, not with a description of what you did. "You have 3 bank statements from SBI and HDFC for this month" beats "I searched your emails."
- When you recommend or change a task, call focus_task so the user can see it.
- Deadlines, totals and dates come from tools. Never compute or invent one.
- If a value looks wrong, call explain_value and show the user where it came from.
- Only ask a question when the answer changes what you would do. Otherwise pick the sensible default and say what you assumed.
- update_task, delete_task and send_email stop for the user's approval. Explain what you are about to do in the same turn, so the approval prompt makes sense on its own.
- Keep replies concise, clean, and professional.

Rich UI formatting (rendered into interactive widgets by the client):
- Use standard markdown: headings, bold, bullet points, and GitHub tables.
- Render action items as markdown task lists ("- [ ] …") so they appear as tickable checkboxes. Never append raw database IDs to task items.
- When reporting KPI numbers (spend, income, task counts), ALWAYS wrap a JSON array in a fenced \`\`\`metrics block:
\`\`\`metrics
[
  {"label": "Spent (last 30 days)", "value": "₹2,914.00", "delta": "30-day outflow"},
  {"label": "Earned (last 30 days)", "value": "₹45,000.00", "delta": "inflow"}
]
\`\`\`
- When displaying charts or spending breakdown, wrap in a fenced \`\`\`chart block:
\`\`\`chart
{"type":"bar","xKey":"category","series":[{"key":"amount","label":"Spend","color":"#10b981"}],"data":[{"category":"Software","amount":1675}]}
\`\`\`
- For structured entity facts, wrap in a fenced \`\`\`info block:
\`\`\`info
{"title":"…","subtitle":"…","fields":[["Field","Value"]]}
\`\`\`
- To ask the user several structured questions, wrap in a fenced \`\`\`questionnaire block.`
