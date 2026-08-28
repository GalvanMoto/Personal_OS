"use client"

import { Check, X, Shield, Lock, Cpu, Server, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const comparisonItems = [
  {
    feature: "Data Sovereignty & Privacy",
    traditional: "Data stored in vendor cloud, mined for corporate telemetry, vendor lock-in.",
    dlrs: "100% Open Source & Self-Hostable. Your PostgreSQL, your files, AES-256 encrypted vault.",
  },
  {
    feature: "Universal Assistant Control",
    traditional: "Siloed chatbots that only search text or suggest grammar. No action capability.",
    dlrs: "Universal Control Plane: Assistant creates subscriptions, tasks, invoices, reminders across all modules.",
  },
  {
    feature: "AI Model Choice",
    traditional: "Forced vendor models with monthly recurring markups and telemetry.",
    dlrs: "Bring your own LLM: Local Ollama / vLLM for offline privacy, or Azure / Anthropic / OpenAI.",
  },
  {
    feature: "Input Overhead",
    traditional: "Manual clicking, filling 10 fields, picking tags, setting dates by hand.",
    dlrs: "Drop raw screenshots, voice memos, or forward emails. Multi-agent pipeline structures everything.",
  },
  {
    feature: "Financial & Ledger Math",
    traditional: "Disjointed third-party spreadsheets or SaaS with floating-point errors.",
    dlrs: "In-memory bank statement decryption + paise/cents integer minor unit precision.",
  },
  {
    feature: "Subscription Pricing",
    traditional: "$20-$45/user/month forever. Costs balloon with team size.",
    dlrs: "Free & Open Source under MIT. Run on your own VPS or local machine with 0 licensing fees.",
  },
]

export function ComparisonSection() {
  return (
    <section id="comparison" className="py-16 sm:py-24 border-b border-zinc-800 bg-[#09090b] text-[#f4f4f5] relative">
      <div className="mx-auto max-w-[1831px] px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="outline" className="font-mono text-xs gap-1.5 px-3 py-1 border-[#6FFF00]/30 text-[#6FFF00] bg-[#6FFF00]/10">
            <Server className="size-3.5" /> Open Source vs Closed Cloud
          </Badge>
          <h2 className="font-grotesk text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#f4f4f5]">
            Why Own Your Personal OS?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base font-mono leading-relaxed">
            Closed-source SaaS turns you into a paying data-entry clerk. Personal OS gives you complete ownership and autonomous execution.
          </p>
        </div>

        <div className="max-w-5xl mx-auto overflow-hidden rounded-[32px] border border-zinc-800 liquid-glass-card shadow-2xl">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1.1fr_1fr_1.1fr] gap-4 px-7 py-5 border-b border-zinc-800 bg-zinc-950/70 text-xs font-grotesk tracking-wider uppercase">
            <span className="text-zinc-400">Architectural Dimension</span>
            <span className="text-zinc-400">Closed Cloud SaaS</span>
            <span className="text-[#6FFF00] font-bold">Personal OS (Open Source)</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-800/80">
            {comparisonItems.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr_1.1fr] gap-3 md:gap-4 p-5 md:px-7 md:py-5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-grotesk uppercase text-sm text-[#f4f4f5]">{item.feature}</span>
                </div>

                <div className="flex items-start gap-2 text-xs font-mono text-zinc-400 bg-zinc-950/60 md:bg-transparent p-3 md:p-0 rounded-xl border md:border-0 border-zinc-800">
                  <X className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item.traditional}</span>
                </div>

                <div className="flex items-start gap-2 text-xs font-mono text-zinc-200 bg-[#6FFF00]/5 md:bg-transparent p-3 md:p-0 rounded-xl border md:border-0 border-[#6FFF00]/20">
                  <Check className="size-4 text-[#6FFF00] shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{item.dlrs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
