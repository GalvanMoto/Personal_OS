"use client"

import * as React from "react"
import {
  Bot,
  Layers,
  MessageSquare,
  FolderGit2,
  CheckCircle2,
  Cpu,
  Sparkles,
  Cloud,
  FolderSearch,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

type Tab = "assistant" | "extract" | "gdrive"

export function HomeHeroPreview() {
  const [activeTab, setActiveTab] = React.useState<Tab>("assistant")

  return (
    <Card className="border border-border/80 bg-card/95 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden max-w-5xl mx-auto w-full">
      {/* Window Top Bar */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/40 border-b border-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="size-2.5 sm:size-3 rounded-full bg-rose-500/80" />
          <div className="size-2.5 sm:size-3 rounded-full bg-amber-500/80" />
          <div className="size-2.5 sm:size-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[11px] font-mono text-muted-foreground hidden md:flex items-center gap-1.5">
            <Cpu className="size-3.5 text-indigo-500" />
            dlrs://personal-os/live-cockpit
          </span>
        </div>
        <div className="flex items-center gap-1 bg-background/60 p-0.5 sm:p-1 rounded-lg border border-border/60 shrink-0">
          <button
            onClick={() => setActiveTab("assistant")}
            className={`text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "assistant"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            AI Chief-of-Staff
          </button>
          <button
            onClick={() => setActiveTab("extract")}
            className={`text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "extract"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Auto Triage
          </button>
          <button
            onClick={() => setActiveTab("gdrive")}
            className={`text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "gdrive"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Drive Hierarchy
          </button>
        </div>
      </div>

      {/* Inner Content */}
      <div className="p-4 sm:p-6 md:p-7 min-h-[280px]">
        {activeTab === "assistant" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground text-xs font-medium px-3.5 py-2 rounded-xl rounded-br-sm max-w-md shadow-sm">
                “What are my financial spending metrics and top priorities today?”
              </div>
            </div>

            <div className="bg-muted/40 border border-border/60 rounded-xl p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Bot className="size-3.5" />
                  </div>
                  <span className="text-xs font-semibold">AI Chief-of-Staff</span>
                </div>
                <Badge variant="outline" className="text-[9px] sm:text-[10px] font-mono text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                  Azure OpenAI • streamed
                </Badge>
              </div>

              <p className="text-xs text-foreground/90 leading-relaxed">
                Here is your financial snapshot and today&apos;s action agenda:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded-lg border border-border/60 bg-card/80 p-2.5">
                  <p className="text-[0.5625rem] uppercase font-semibold text-muted-foreground tracking-wider">Spent (30 Days)</p>
                  <p className="text-sm font-semibold tabular-nums mt-0.5">₹2,914.00</p>
                  <p className="text-[0.5625rem] text-primary font-medium mt-0.5">-3.5% vs prior</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/80 p-2.5">
                  <p className="text-[0.5625rem] uppercase font-semibold text-muted-foreground tracking-wider">Earned (30 Days)</p>
                  <p className="text-sm font-semibold tabular-nums mt-0.5">₹45,000.00</p>
                  <p className="text-[0.5625rem] text-emerald-600 font-medium mt-0.5">verified inflow</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/80 p-2.5">
                  <p className="text-[0.5625rem] uppercase font-semibold text-muted-foreground tracking-wider">Net Treasury</p>
                  <p className="text-sm font-semibold tabular-nums mt-0.5">+₹42,086.00</p>
                  <p className="text-[0.5625rem] text-emerald-600 font-medium mt-0.5">surplus</p>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-card/80 p-3 space-y-1.5 text-xs">
                <p className="font-semibold text-foreground flex items-center justify-between">
                  <span>Actionable Agenda</span>
                  <span className="text-[0.625rem] text-muted-foreground font-mono">1 overdue • 2 today</span>
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="size-3.5 rounded accent-primary" readOnly />
                    <span className="line-through text-muted-foreground">Export final 4K video reel for GB Banquet</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <input type="checkbox" className="size-3.5 rounded accent-primary" readOnly />
                    <span>Publish campaign landing page (due 6:00 PM)</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <input type="checkbox" className="size-3.5 rounded accent-primary" readOnly />
                    <span>Send reconciled invoice #INV-2026-08 via Gmail</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "extract" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="size-3.5 text-indigo-500" />
                  Raw Client Input
                </span>
                <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
                  WhatsApp
                </Badge>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border font-mono text-xs leading-relaxed">
                <p className="text-emerald-600 font-semibold text-[11px] mb-1.5">From: Client (GB Banquet) • 10:14 AM</p>
                <p className="bg-background/80 p-2.5 rounded-lg border border-border/60 text-foreground/90">
                  “Hey bro, make 3 reels for GB Banquet — event highlights, decor, food. Need all before Friday 6 PM. Logo and raw footage are in Drive.”
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Auto-parsed in 380ms. Zero manual entry.</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-violet-500" />
                  Structured Output
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[10px]">Ready</Badge>
              </div>
              <div className="p-3.5 rounded-xl bg-background border border-border shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div>
                    <h4 className="font-bold text-xs">GB Banquet Reels</h4>
                    <span className="text-[10px] text-muted-foreground">Friday 6 PM • High Priority</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">3 Tasks</Badge>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
                    <CheckCircle2 className="size-3 text-indigo-500 shrink-0" />
                    <span>Event Highlights Reel (60s)</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
                    <CheckCircle2 className="size-3 text-indigo-500 shrink-0" />
                    <span>Decor & Ambiance Reel</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
                    <CheckCircle2 className="size-3 text-indigo-500 shrink-0" />
                    <span>Food & Culinary Teaser</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <FolderSearch className="size-3 text-indigo-500" />
                    Auto-Linked: GB_Vector_Logo.svg
                  </span>
                  <span className="text-emerald-600 font-mono">99.8%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "gdrive" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-semibold flex items-center gap-2">
                  <Cloud className="size-4 text-emerald-600" />
                  Google Drive Hierarchical Folder Tree
                </h4>
                <p className="text-[0.625rem] text-muted-foreground mt-0.5">
                  Uploaded assets, statement PDFs, and client reels are organized automatically.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 border-emerald-500/30">
                Realtime Sync
              </Badge>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border font-mono text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <FolderGit2 className="size-4 text-indigo-500" />
                <span>📁 My Drive &gt; Personal_OS</span>
              </div>
              <div className="pl-6 space-y-1.5 border-l border-border/80 ml-2 text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">└── 📁 Studio</div>
                <div className="pl-6 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between hover:text-foreground">
                    <span>├── 📁 📄 Briefs & Contracts (GB_Banquet_Proposal.pdf)</span>
                    <span className="text-[10px] text-emerald-600">Indexed ↗</span>
                  </div>
                  <div className="flex items-center justify-between hover:text-foreground">
                    <span>├── 📁 💳 Finance & Invoices (SBI_August_Statement.csv)</span>
                    <span className="text-[10px] text-emerald-600">Reconciled ↗</span>
                  </div>
                  <div className="flex items-center justify-between hover:text-foreground">
                    <span>├── 📁 🎨 Deliverables (Master_Reel_4K.mp4)</span>
                    <span className="text-[10px] text-emerald-600">Rendered ↗</span>
                  </div>
                  <div className="flex items-center justify-between hover:text-foreground">
                    <span>└── 📁 📥 Captures & Assets (Voice_Memo_Brief.m4a)</span>
                    <span className="text-[10px] text-emerald-600">Transcribed ↗</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
