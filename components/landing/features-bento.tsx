"use client"

import {
  Inbox,
  Bot,
  FolderGit2,
  Receipt,
  Mail,
  ShieldCheck,
  Zap,
  Sparkles,
  Clock,
  Cpu,
  Terminal,
  Lock,
  GitBranch,
  Database,
  Repeat,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function FeaturesBento() {
  return (
    <section id="features" className="py-16 sm:py-24 border-b border-zinc-800 bg-[#09090b] text-[#f4f4f5] relative overflow-hidden">
      <div className="mx-auto max-w-[1831px] px-6 sm:px-10 lg:px-16 relative">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="outline" className="font-mono text-xs gap-1.5 px-3 py-1 border-[#6FFF00]/30 text-[#6FFF00] bg-[#6FFF00]/10">
            <Cpu className="size-3.5" /> Open Source Multi-Agent Architecture
          </Badge>
          <h2 className="font-grotesk text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#f4f4f5]">
            An Operating System, Not Another Siloed App
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base font-mono leading-relaxed">
            Every module is Assistant-manageable. The Assistant is the universal control layer for tasks, finance, files,
            subscriptions, and notifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Universal Control Plane */}
          <div className="liquid-glass-card rounded-[28px] p-6 relative group overflow-hidden border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center">
                  <Bot className="size-5.5 text-[#6FFF00]" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-300 border-zinc-700 bg-zinc-800">
                  Core
                </Badge>
              </div>
              <h3 className="font-grotesk uppercase text-lg text-[#f4f4f5]">Universal Control Plane</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                One sentence creates subscriptions, links billing URLs, schedules deterministic reminders, and notifies you before due dates.
              </p>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono space-y-1">
              <div className="text-[#6FFF00] font-semibold">Assistant → Universal Resolver</div>
              <div className="text-zinc-300">“Contabo on 8th” → Sub + Reminder + Ledger</div>
            </div>
          </div>

          {/* Card 2: Local & Pluggable AI Runtime */}
          <div className="liquid-glass-card rounded-[28px] p-6 relative group overflow-hidden border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-xl bg-zinc-800 border border-zinc-700 text-[#6FFF00] flex items-center justify-center">
                  <Terminal className="size-5.5" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-[#6FFF00] border-[#6FFF00]/30 bg-[#6FFF00]/10">
                  Local / Cloud
                </Badge>
              </div>
              <h3 className="font-grotesk uppercase text-lg text-[#f4f4f5]">Pluggable Model Runtime</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Connect your local Ollama or vLLM instance for 100% offline privacy, or switch to Azure OpenAI, Anthropic, or Gemini with one ENV flag.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-[10px] font-mono text-zinc-200">Ollama</span>
              <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-[10px] font-mono text-zinc-200">vLLM</span>
              <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-[10px] font-mono text-zinc-200">OpenAI</span>
              <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-[10px] font-mono text-zinc-200">Anthropic</span>
            </div>
          </div>

          {/* Card 3: Encrypted Vault & Privacy */}
          <div className="liquid-glass-card rounded-[28px] p-6 relative group overflow-hidden border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center">
                  <Lock className="size-5.5 text-[#6FFF00]" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-300 border-zinc-700 bg-zinc-800">
                  AES-256-GCM
                </Badge>
              </div>
              <h3 className="font-grotesk uppercase text-lg text-[#f4f4f5]">Zero-Knowledge Vault</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Store bank passwords (PAN, DOB, account suffix) securely. Statements decrypt in-memory; raw passwords are never logged or exported.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
              <ShieldCheck className="size-4 text-[#6FFF00]" /> Tenant-scoped &amp; local-first
            </div>
          </div>

          {/* Card 4: Deterministic Integer Ledger */}
          <div className="liquid-glass-card rounded-[28px] p-6 relative group overflow-hidden border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center">
                  <Receipt className="size-5.5 text-[#6FFF00]" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-300 border-zinc-700 bg-zinc-800">
                  Exact Math
                </Badge>
              </div>
              <h3 className="font-grotesk uppercase text-lg text-[#f4f4f5]">Integer Ledger Engine</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Minor-unit (cents/paise) precision. Automated multi-bank parsers (HDFC, SBI, ICICI, Chase, Jio) extract and reconcile ledgers automatically.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300">
              <Zap className="size-3 text-[#6FFF00]" /> Paise / cents minor-unit arithmetic
            </div>
          </div>

          {/* Card 5: Universal Storage & Drive Tree */}
          <div className="liquid-glass-card rounded-[28px] p-6 relative group overflow-hidden border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center">
                  <FolderGit2 className="size-5.5 text-[#6FFF00]" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-300 border-zinc-700 bg-zinc-800">
                  Auto-Sorted
                </Badge>
              </div>
              <h3 className="font-grotesk uppercase text-lg text-[#f4f4f5]">Asset &amp; Drive Hierarchy</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Connect Google Drive or local folders. Incoming briefs, logos, and invoices are automatically filed into deterministic folders with 1-click links.
              </p>
            </div>
            <div className="mt-4 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono flex items-center justify-between">
              <span className="text-zinc-300">📁 Personal_OS/Clients/Acme/</span>
              <span className="text-[#6FFF00] font-semibold">Synced</span>
            </div>
          </div>

          {/* Card 6: Central Event Automation */}
          <div className="liquid-glass-card rounded-[28px] p-6 relative group overflow-hidden border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center">
                  <Repeat className="size-5.5 text-[#6FFF00]" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-300 border-zinc-700 bg-zinc-800">
                  Cross-Module
                </Badge>
              </div>
              <h3 className="font-grotesk uppercase text-lg text-[#f4f4f5]">Central Event Automation</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Subscriptions, invoice deadlines, task schedules, and calendar events publish to a single automation engine. No duplicate notifications.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-xs text-zinc-300 font-mono">
              <Clock className="size-3.5 text-[#6FFF00]" /> Deterministic scheduler + cron engine
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
