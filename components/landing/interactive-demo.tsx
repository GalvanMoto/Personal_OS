"use client"

import * as React from "react"
import {
  Sparkles,
  Zap,
  Image as ImageIcon,
  Mic,
  Mail,
  CheckCircle2,
  Clock,
  FolderGit2,
  Layers,
  Receipt,
} from "lucide-react"
import { Card } from "@/components/ui/card"
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
}

const scenarios: DemoScenario[] = [
  {
    id: "screenshot",
    title: "WhatsApp Brief",
    icon: ImageIcon,
    inputBadge: "WhatsApp Clip",
    rawText: `"Hey Gautam, please update the hero section on our store by Thursday. Use the summer campaign banner from Google Drive and change the coupon to SUMMER40."`,
    outputProject: "Summer Campaign Update",
    deadline: "Thursday, 11:59 PM",
    priority: "High",
    subtasks: [
      "Fetch banner from Google Drive",
      "Update Hero Section & mobile breakpoints",
      "Configure coupon SUMMER40 in Shopify",
      "Send staging preview to client"
    ],
    connectedAssets: [
      "📁 Drive / Summer 2026 Assets",
      "Shopify Admin API",
      "Brand CSS Tokens",
    ],
    aiNote: "Deadline auto-detected, Drive asset links retrieved, zero manual entry."
  },
  {
    id: "voice",
    title: "Voice Memo",
    icon: Mic,
    inputBadge: "Telegram Voice 0:45s",
    rawText: `"Just finished meeting with Happy Rewards. They need an animated promo for their loyalty app by Monday. Budget is ₹95,000. Start storyboarding today."`,
    outputProject: "Happy Rewards Promo",
    deadline: "Monday, 10:00 AM",
    priority: "High",
    subtasks: [
      "Draft 6-scene storyboard",
      "Generate deposit invoice (₹47,500)",
      "Gather vector icons & Figma mockups",
      "Submit draft for review"
    ],
    connectedAssets: [
      "CRM: Happy Rewards Inc.",
      "📁 Drive / Briefs / Proposal.pdf",
      "Invoice #INV-2026-09",
    ],
    aiNote: "Audio transcribed, financial terms extracted, milestones scheduled."
  },
  {
    id: "bank",
    title: "Bank Statement",
    icon: Receipt,
    inputBadge: "SBI PDF Encrypted",
    rawText: `[Encrypted PDF] SBI_EStatement_August.pdf — 48 transactions decrypted locally — ₹2,914.00 total debit outflow detected.`,
    outputProject: "August Reconciliation",
    deadline: "Auto-Processed",
    priority: "Medium",
    subtasks: [
      "3 SaaS subscriptions categorized",
      "1 unknown ₹1,675 debit flagged",
      "Net treasury balance updated",
      "Filed to Drive / Finance / August"
    ],
    connectedAssets: [
      "Integer Ledger Engine",
      "Subscription Radar (3 Active)",
      "📁 Drive / Finance /",
    ],
    aiNote: "Decrypted locally, exact integer math, runway updated."
  },
  {
    id: "email",
    title: "Client Email",
    icon: Mail,
    inputBadge: "Gmail Thread",
    rawText: `"Subject: Re: Website Feedback — Hi team, attached is the revised Q4 retainer contract. Also please fix the contact form validation error reported this morning."`,
    outputProject: "Q4 Retainer & Bugfix",
    deadline: "Today, 5:00 PM",
    priority: "Urgent",
    subtasks: [
      "Fix contact form validation bug",
      "Save Q4 contract to Drive",
      "Draft acknowledgement reply"
    ],
    connectedAssets: [
      "Unified Multi-Mailbox",
      "📁 Drive / Briefs / Q4_Retainer.pdf",
      "Context Pack: Form Component",
    ],
    aiNote: "Thread triaged, contract filed to Drive, reply draft prepared."
  }
]

export function InteractiveDemo() {
  const [selectedScenario, setSelectedScenario] = React.useState<DemoScenario>(scenarios[0])

  return (
    <section id="demo" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
            Live Autonomous Engine
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Test the Extraction Pipeline
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Click a scenario to see raw inputs become structured projects with auto-linked Google Drive assets.
          </p>
        </div>

        {/* Interactive Playground */}
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Scenario Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {scenarios.map((s) => {
              const Icon = s.icon
              const isSelected = selectedScenario.id === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 text-foreground shadow-sm ring-1 ring-indigo-500/50"
                      : "border-border/80 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <div
                    className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <span className="font-semibold text-xs truncate">{s.title}</span>
                </button>
              )
            })}
          </div>

          {/* Scenario Execution Box */}
          <Card className="border border-border/80 bg-card/90 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/60">
              {/* Left Column: Raw Input */}
              <div className="p-5 space-y-3.5 bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <selectedScenario.icon className="size-3.5 text-indigo-400" />
                    Raw Input
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shrink-0">
                    {selectedScenario.inputBadge}
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border font-mono text-xs text-foreground/90 leading-relaxed">
                  <p className="italic">{selectedScenario.rawText}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-indigo-400 flex items-center gap-1 mb-0.5">
                    <Sparkles className="size-3" /> Auto-Context:
                  </span>
                  <p className="leading-relaxed">{selectedScenario.aiNote}</p>
                </div>
              </div>

              {/* Right Column: Structured Output */}
              <div className="p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Layers className="size-3.5 text-emerald-400" />
                    Structured Output
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-mono shrink-0">
                    99.4% Confidence
                  </Badge>
                </div>

                {/* Project Header */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/80">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-foreground">{selectedScenario.outputProject}</h4>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{selectedScenario.priority}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mt-1 flex items-center gap-1">
                    <Clock className="size-3 text-indigo-400" />
                    Due: {selectedScenario.deadline}
                  </p>
                </div>

                {/* Subtasks */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tasks Created</span>
                  {selectedScenario.subtasks.map((task, i) => (
                    <div key={i} className="flex items-start gap-2 p-1.5 rounded-md bg-background border border-border/60 text-xs text-foreground">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>

                {/* Connected Assets */}
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Linked Assets</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedScenario.connectedAssets.map((asset, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 border border-border text-[10px] font-mono text-foreground">
                        <FolderGit2 className="size-2.5 text-indigo-400" />
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
