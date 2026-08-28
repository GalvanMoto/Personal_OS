"use client"

import * as React from "react"
import {
  Sparkles,
  Image as ImageIcon,
  Mic,
  Mail,
  CheckCircle2,
  Clock,
  FolderGit2,
  Layers,
  Receipt,
  Code2,
  Terminal,
  ArrowRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DemoScenario {
  id: string
  title: string
  icon: React.ElementType
  inputBadge: string
  rawText: string
  outputProject: string
  deadline: string
  priority: "High" | "Medium" | "Urgent"
  subtasks: string[]
  connectedAssets: string[]
  aiNote: string
  toolCallJson: object
}

const scenarios: DemoScenario[] = [
  {
    id: "subscription",
    title: "Subscription / Obligation",
    icon: Receipt,
    inputBadge: "Raw Prompt / Chat",
    rawText: `"I pay Contabo €12.50 every month on the 8th. Track it with this billing link: https://new.contabo.com/account/billing/invoices"`,
    outputProject: "Contabo Server Subscription",
    deadline: "Monthly on the 8th",
    priority: "High",
    subtasks: [
      "Create Subscription: Contabo (€12.50 / Monthly)",
      "Set next payment due: 8th of next month",
      "Attach billing URL to Subscription record",
      "Schedule deterministic reminder 3 days prior",
      "Link to Infrastructure expense category",
    ],
    connectedAssets: ["Universal Resolver", "Reminder Engine", "Ledger / Infrastructure"],
    aiNote: "Assistant creates the source subscription entity and schedules recurring reminders automatically without manual forms.",
    toolCallJson: {
      tool: "create_subscription",
      arguments: {
        name: "Contabo Server",
        vendor: "Contabo",
        amountMinor: 1250,
        currency: "EUR",
        billingCycle: "MONTHLY",
        dueDay: 8,
        billingUrl: "https://new.contabo.com/account/billing/invoices",
        remindDaysBefore: 3,
        category: "Infrastructure",
      },
    },
  },
  {
    id: "whatsapp",
    title: "WhatsApp Project Brief",
    icon: ImageIcon,
    inputBadge: "Image / Screenshot (OCR)",
    rawText: `[Screenshot] "Hey, can you design the Summer Sale campaign assets by Thursday? Need 3 banner sizes, Instagram story, and discount badge. Code: SUMMER40"`,
    outputProject: "Summer Sale Campaign",
    deadline: "Thursday, 6:00 PM",
    priority: "Urgent",
    subtasks: [
      "Design 3 banner sizes (1200x628, 1080x1080, 300x250)",
      "Create animated 9:16 Instagram Story",
      "Export discount badge vector",
      "Send review link to client",
    ],
    connectedAssets: ["📁 Drive / Marketing / Summer26", "Figma / Summer-Sale.fig", "Brand Kit v2"],
    aiNote: "OCR extracted deliverables, created Drive asset folder, and scheduled timeline tasks.",
    toolCallJson: {
      tool: "create_project_with_tasks",
      arguments: {
        name: "Summer Sale Campaign",
        client: "Direct Message",
        dueDate: "2026-09-03T18:00:00Z",
        priority: "URGENT",
        tasks: [
          { title: "Design 3 banner sizes" },
          { title: "Create Instagram story" },
          { title: "Configure coupon SUMMER40" },
        ],
      },
    },
  },
  {
    id: "bank",
    title: "Encrypted Statement",
    icon: Receipt,
    inputBadge: "Bank PDF (AES-256)",
    rawText: `[Encrypted PDF] SBI_EStatement_August.pdf — 48 transactions decrypted locally in-memory — ₹2,914.00 total debit outflow detected.`,
    outputProject: "August Statement Reconciliation",
    deadline: "Auto-Processed",
    priority: "Medium",
    subtasks: [
      "3 SaaS subscriptions categorized",
      "1 unknown ₹1,675 debit flagged for review",
      "Paise-exact minor unit ledger updated",
      "Filed to Drive / Finance / August",
    ],
    connectedAssets: ["Integer Ledger Engine", "Subscription Radar", "📁 Drive / Finance /"],
    aiNote: "Decrypted in-memory with local vault key. Passwords are never saved in logs.",
    toolCallJson: {
      tool: "import_bank_statement",
      arguments: {
        file: "SBI_EStatement_August.pdf",
        vaultKeyLookup: "sbi_passphrase_v1",
        exactMath: true,
        precision: "MINOR_UNIT_PAISE",
      },
      result: {
        rowsParsed: 48,
        balanceReconciled: true,
        discrepancyMinor: 0,
      },
    },
  },
  {
    id: "voice",
    title: "Voice Memo",
    icon: Mic,
    inputBadge: "Voice Note (Whisper)",
    rawText: `"Just finished meeting with Happy Rewards. They need an animated promo for their loyalty app by Monday. Budget is ₹95,000. Start storyboarding today."`,
    outputProject: "Happy Rewards Promo",
    deadline: "Monday, 10:00 AM",
    priority: "High",
    subtasks: [
      "Draft 6-scene storyboard",
      "Generate milestone deposit invoice (₹47,500)",
      "Gather vector icons & Figma mockups",
      "Submit draft for review",
    ],
    connectedAssets: ["CRM: Happy Rewards Inc.", "📁 Drive / Briefs / Proposal.pdf", "Invoice #INV-2026-09"],
    aiNote: "Audio transcribed locally, financial milestones extracted, deliverable tasks created.",
    toolCallJson: {
      tool: "orchestrate_client_onboarding",
      arguments: {
        clientName: "Happy Rewards",
        budgetMinor: 9500000,
        currency: "INR",
        initialDepositPercent: 50,
        deadline: "2026-09-07T10:00:00Z",
      },
    },
  },
]

export function InteractiveDemo() {
  const [selectedScenario, setSelectedScenario] = React.useState<DemoScenario>(scenarios[0])
  const [viewMode, setViewMode] = React.useState<"ui" | "json">("ui")

  return (
    <section id="demo" className="py-16 sm:py-24 border-b border-zinc-800 bg-[#09090b] text-[#f4f4f5] relative">
      <div className="mx-auto max-w-[1831px] px-4 sm:px-8 lg:px-16">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-8 sm:mb-12">
          <Badge variant="outline" className="font-mono text-xs gap-1.5 px-3 py-1 border-[#6FFF00]/30 text-[#6FFF00] bg-[#6FFF00]/10">
            <Sparkles className="size-3.5" /> Interactive Execution Engine
          </Badge>
          <h2 className="font-grotesk text-[26px] sm:text-[38px] md:text-[46px] lg:text-[54px] uppercase tracking-tight text-[#f4f4f5] leading-tight">
            See the Autonomous Pipeline in Action
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono max-w-xl mx-auto leading-relaxed">
            Select a raw input scenario below to see how DLRS parses unstructured chaos into structured database records and executable agent actions.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
          {/* Scenario Picker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {scenarios.map((s) => {
              const Icon = s.icon
              const isSelected = selectedScenario.id === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s)}
                  className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800 text-white border-zinc-600 shadow-lg shadow-black/50"
                      : "liquid-glass-card border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <div
                    className={`size-8 sm:size-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? "bg-zinc-700 border-zinc-600 text-[#6FFF00]"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <Icon className="size-3.5 sm:size-4" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-grotesk uppercase tracking-wide truncate">
                    {s.title}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Liquid Glass Showcase Card */}
          <div className="liquid-glass-card rounded-[24px] sm:rounded-[32px] overflow-hidden border border-zinc-800 shadow-2xl">
            {/* View Mode Switcher Header: stacked on mobile, inline on tablet+ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <span className="font-bold text-[#f4f4f5]">{selectedScenario.title}</span>
                <span>•</span>
                <span className="text-[#6FFF00]">Provenance Maintained</span>
              </div>
              <div className="w-full sm:w-auto flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setViewMode("ui")}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer text-center ${
                    viewMode === "ui" ? "bg-zinc-800 text-white border border-zinc-700 shadow-xs" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Visual Output
                </button>
                <button
                  onClick={() => setViewMode("json")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer text-center ${
                    viewMode === "json" ? "bg-zinc-800 text-white border border-zinc-700 shadow-xs" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Code2 className="size-3.5" />
                  Agent Tool Call
                </button>
              </div>
            </div>

            {viewMode === "ui" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
                {/* Raw Input */}
                <div className="p-4 sm:p-7 space-y-4 bg-zinc-950/30">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-grotesk uppercase tracking-wider inline-flex items-center gap-2 text-zinc-300">
                      <selectedScenario.icon className="size-4 text-[#6FFF00]" />
                      Raw Unstructured Input
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-zinc-300 bg-zinc-900">
                      {selectedScenario.inputBadge}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm font-mono leading-relaxed">
                    <p className="italic text-zinc-200">{selectedScenario.rawText}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono">
                    <span className="font-semibold inline-flex items-center gap-1.5 mb-1.5 text-[#6FFF00]">
                      <Sparkles className="size-4" /> Universal Resolver Action
                    </span>
                    <p className="text-zinc-400 leading-relaxed mt-1">{selectedScenario.aiNote}</p>
                  </div>
                </div>

                {/* Structured Output */}
                <div className="p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-grotesk uppercase tracking-wider inline-flex items-center gap-2 text-[#6FFF00]">
                      <Layers className="size-4" />
                      Structured OS Execution
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono text-[#6FFF00] bg-[#6FFF00]/10 border border-[#6FFF00]/25 font-semibold">
                      Zero Manual Forms
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-grotesk uppercase text-base text-[#f4f4f5]">{selectedScenario.outputProject}</h4>
                      <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-zinc-300">
                        {selectedScenario.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono mt-2 inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 text-[#6FFF00]" />
                      Cadence / Due: {selectedScenario.deadline}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 block">
                      Automated Domain Actions
                    </span>
                    {selectedScenario.subtasks.map((task, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs font-mono text-zinc-300">
                        <CheckCircle2 className="size-4 text-[#6FFF00] shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-zinc-800">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                      Linked Services &amp; Assets
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedScenario.connectedAssets.map((asset, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300"
                        >
                          <FolderGit2 className="size-3.5 text-zinc-400" />
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-zinc-950 font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800 text-xs text-zinc-400">
                  <span>Tool invocation schema dispatched by orchestrator</span>
                  <span className="text-[#6FFF00] font-semibold">100% Deterministic execution</span>
                </div>
                <pre className="text-zinc-200 leading-relaxed whitespace-pre font-mono p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  {JSON.stringify(selectedScenario.toolCallJson, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <p className="text-center text-xs font-mono text-zinc-400 pt-1">
            Deterministic PostgreSQL schema • LLM extracts &amp; plans • Audit trail preserved
          </p>
        </div>
      </div>
    </section>
  )
}
