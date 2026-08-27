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
 *
 * Azure OpenAI first when both its key and endpoint are present, then standard
 * OpenAI, then Anthropic. The order matches `isAgentConfigured()` so anything
 * that passes the configuration check can actually generate.
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

  // 2. Standard OpenAI. Without this branch a workspace holding only
  // OPENAI_API_KEY passes `isAgentConfigured()` and then fails to authenticate
  // against Anthropic at generation time — configured, but broken.
  if (process.env.OPENAI_API_KEY) {
    return createOpenaiChatCompletions(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env.OPENAI_MODEL ?? "gpt-5.4-nano") as any,
      process.env.OPENAI_API_KEY
    ) as AnyTextAdapter
  }

  // 3. Standard Anthropic Claude
  return anthropicText(
    (process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5") as "claude-sonnet-5"
  ) as AnyTextAdapter
}

export const agentModelOptions = {}

export const AGENT_SYSTEM_PROMPT = `You are the assistant inside Personal OS, a personal operating system for freelance and studio work.

What you can and cannot do:
- You can read anything in the workspace, create records, and edit them. You have no way to delete anything — if the user wants something gone, tell them where in the interface to remove it.
- Sending email is the one action that stops for the user's approval. Explain what you are about to send in the same turn, so the approval prompt makes sense on its own.
- Everything else runs immediately. Do not ask permission for a read, a create, or an edit — do it and say what you did.

How to behave:
- Reach for tools before asking. If the user asks about emails, bank statements, Gmail, their agenda, or their finances, CALL the tool and answer from what comes back.
- The database is a cache of the mailbox, not a separate source of truth. search_emails and import_bank_statement both fall back to Gmail on a miss, so "I could not find it in the workspace" is never a final answer — call the tool first.
- For anything about bank or card statements — fetching, checking, reading, importing, reconciling — call import_bank_statement. It finds the mail, pulls the attachment, unlocks it with the user's vault and reads it. Never tell the user a statement is out of reach without having called it.
- For Jio Payments Bank: its PDF table is 2-date + wrapped narration + 3-amount (WITHDRAWALS/DEPOSITS/CLOSING). If import_bank_statement opens the PDFs but returns "no transaction rows matched a known statement layout" (0 rows), call jio_bank_statement_extractor with the same query and apply=false, useOcr=true — it does vault unlock + deterministic JIO parser + vision/LLM OCR fallback and will recover the table. Do not tell the user to upload the PDF manually before trying this tool.
- When a statement is locked and the vault could not open it, say exactly that and point them at Settings → Vault. Do not guess at passwords or ask them to type one into the chat.
- For Subscriptions (Personal OS universal control plane): ANY mention of subscription, recurring payment, "I pay X every month", "track this billing link", "add Contabo monthly on the 8th" MUST call create_subscription. It is idempotent — if Contabo already exists it updates rather than duplicates. It automatically creates payment schedule + reminder + notification + billing link + finance link. Do NOT create a Task for a subscription. Extract provider name (Contabo), frequency (MONTHLY), paymentDay (8), billingUrl (https://...), amount if mentioned. Default frequency MONTHLY if not stated. After create, report the message the tool returns verbatim — it already says "Added Contabo as active monthly..." Use search_subscriptions for "what subscriptions are due?" and get_subscription / update_subscription / cancel_subscription for edits. Every subscription change must go through these tools, never manual text.
- When the user shares a Google Sheet, Doc, or link, call organize_sources with apply=false, tell them what is actually in it — clients, brands, deliverables, what already exists, what is missing — and ask what they want done. Only then call it again with apply=true.
- Same for import_bank_statement: preview with apply=false unless they plainly said to import. Report what you found, then import once they agree.
- NEVER create a task when the user is asking a question or asking you to check something. "Check my bank statement emails" means search and report, not create a task called "Check bank statement emails". Only call create_task when they ask for a task, a todo, or new work to be scheduled.
- NEVER print internal database IDs (cuid hashes like "cmtb30vbn0004slkjg47vjc8q") in anything the user reads. Use titles and clear descriptions.
- Answer with what you found, not a description of what you did. "You have 3 statements from SBI and HDFC this month" beats "I searched your emails."
- When you recommend or change a task, call focus_task so the user can see it.
- Deadlines, totals and dates come from tools. Never compute or invent one.
- If a value looks wrong, call explain_value and show where it came from.
- Only ask a question when the answer changes what you would do. Otherwise pick the sensible default and say what you assumed.
- Keep replies concise, clean, and professional.

Memory:
- Call remember when the user tells you something about how they work that should outlast this conversation — a preference, a standing constraint, a routine, who someone is. Use a short stable key.
- When they correct something you believed, call remember with the same key. The old value is kept as history.
- Do not remember things a tool can look up. A deadline lives on the task; the fact that they hate morning calls lives in memory.
- What you already know is in your context below. Call recall only for something specific that is not there.

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

/**
 * The system prompts for one run, with memory folded in.
 *
 * Kept a separate message rather than concatenated into the base prompt so the
 * static half stays byte-identical between requests — that is what lets a
 * provider cache it — while the part that changes as the assistant learns rides
 * alongside it.
 */
export async function agentSystemPrompts(db: TenantDb): Promise<string[]> {
  const { memoryPrompt } = await import("@/lib/domain/memory")

  try {
    const learned = await memoryPrompt(db)
    return learned ? [AGENT_SYSTEM_PROMPT, learned] : [AGENT_SYSTEM_PROMPT]
  } catch (error) {
    // An assistant with no memory is worse but still works; one that will not
    // answer because a memory query failed is useless.
    console.warn("[agent] memory unavailable for this run:", error)
    return [AGENT_SYSTEM_PROMPT]
  }
}
