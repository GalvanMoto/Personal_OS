"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Zap,
  Bot,
  Layers,
  CheckCircle2,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Mic,
  FolderSearch,
  Calendar,
  Play,
  ShieldCheck,
  Cpu,
  BarChart3,
  CreditCard,
  ExternalLink,
  FolderGit2,
  Cloud,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function Hero() {
  const [activeTab, setActiveTab] = React.useState<"extract" | "assistant" | "gdrive">("assistant")

  return (
    <section className="relative pt-32 pb-20 md:pt-36 md:pb-24 overflow-hidden">
      {/* Dynamic Background Glows & Grid */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[450px] bg-gradient-to-tr from-indigo-500/20 via-violet-500/20 to-cyan-400/20 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-pink-500/10 blur-[110px] rounded-full" />
        <div className="absolute inset-0 market-grid" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Badge — market + dashboard taste */}
        <div className="flex flex-col items-center text-center space-y-5 max-w-4xl mx-auto">
          <div className="market-badge">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <img src="/logo.png" alt="DLRS logo" className="size-4 rounded-md object-contain" />
            <span className="font-semibold text-foreground">DLRS 2.0</span>
            <span className="text-muted-foreground">•</span>
            <span>Personal Operating System for Studios &amp; Freelance</span>
            <ArrowRight className="size-3.5 text-indigo-400" />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Stop managing tasks.{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Let your OS run them.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl font-normal leading-relaxed">
            Drop raw WhatsApp clips, voice notes, PDF statements, and client briefs.
            DLRS turns messy inputs into structured projects, syncs organized trees in Google Drive,
            and proactively powers your day — <strong className="text-foreground font-semibold">zero manual data entry</strong>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-11 px-7 font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 gap-2 group text-sm">
                <span>Launch Cockpit</span>
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <a href="#features" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 text-base font-medium border-border/80 bg-background/50 backdrop-blur-xs hover:bg-accent gap-2">
                <Play className="size-4 text-indigo-400 fill-indigo-400/20" />
                <span>Explore Capabilities</span>
              </Button>
            </a>
          </div>

          {/* Quick micro-proofs */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground pt-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>Universal Multimodal Inbox</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>Google Drive Hierarchical Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>Deterministic Bank Ledger</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>AI Chief-of-Staff with Azure OpenAI</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Cockpit Preview */}
        <div className="mt-12 relative max-w-5xl mx-auto">
          {/* Decorative frame gradient */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-cyan-500/30 rounded-2xl blur-lg opacity-70 -z-10" />

          <Card className="border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
            {/* Window Top Bar */}
            <div className="px-4 py-3 bg-muted/40 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-rose-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-muted-foreground hidden sm:flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-indigo-400" />
                  dlrs://personal-os/live-cockpit
                </span>
              </div>
              <div className="flex items-center gap-1 bg-background/60 p-1 rounded-lg border border-border/60">
                <button
                  onClick={() => setActiveTab("assistant")}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    activeTab === "assistant"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  AI Chief-of-Staff
                </button>
                <button
                  onClick={() => setActiveTab("extract")}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    activeTab === "extract"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Auto Triage
                </button>
                <button
                  onClick={() => setActiveTab("gdrive")}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    activeTab === "gdrive"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Drive Hierarchy
                </button>
              </div>
            </div>

            {/* Inner Dashboard View */}
            <div className="p-5 md:p-7">
              {/* TAB 1: AI ASSISTANT CHIEF-OF-STAFF */}
              {activeTab === "assistant" && (
                <div className="space-y-4">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground text-xs font-medium px-3.5 py-2 rounded-lg max-w-md shadow-xs">
                      &ldquo;What are my financial spending metrics and top priorities today?&rdquo;
                    </div>
                  </div>

                  {/* AI Response Card */}
                  <div className="bg-muted/40 border border-border/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Bot className="size-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">AI Chief-of-Staff</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/30 bg-emerald-500/5">
                        Azure OpenAI gpt-5.4-nano
                      </Badge>
                    </div>

                    <p className="text-xs text-foreground/90 leading-relaxed">
                      Here is your financial snapshot and today&apos;s high-priority action agenda:
                    </p>

                    {/* 3 Compact KPI Metric Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-border/60 bg-card/80 p-2.5">
                        <p className="text-[0.5625rem] uppercase font-semibold text-muted-foreground tracking-wider">Spent (30 Days)</p>
                        <p className="text-sm font-semibold tabular-nums mt-0.5 text-foreground">₹2,914.00</p>
                        <p className="text-[0.5625rem] text-primary font-medium mt-0.5">-3.5% vs prior</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card/80 p-2.5">
                        <p className="text-[0.5625rem] uppercase font-semibold text-muted-foreground tracking-wider">Earned (30 Days)</p>
                        <p className="text-sm font-semibold tabular-nums mt-0.5 text-foreground">₹45,000.00</p>
                        <p className="text-[0.5625rem] text-emerald-500 font-medium mt-0.5">verified inflow</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card/80 p-2.5">
                        <p className="text-[0.5625rem] uppercase font-semibold text-muted-foreground tracking-wider">Net Treasury</p>
                        <p className="text-sm font-semibold tabular-nums mt-0.5 text-foreground">+₹42,086.00</p>
                        <p className="text-[0.5625rem] text-emerald-500 font-medium mt-0.5">surplus</p>
                      </div>
                    </div>

                    {/* Interactive Checklist */}
                    <div className="rounded-lg border border-border/60 bg-card/80 p-3 space-y-1.5 text-xs">
                      <p className="font-semibold text-foreground text-xs flex items-center justify-between">
                        <span>Actionable Agenda</span>
                        <span className="text-[0.625rem] text-muted-foreground font-mono">1 overdue • 2 today</span>
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <input type="checkbox" defaultChecked className="size-3.5 rounded accent-primary text-primary" readOnly />
                          <span className="line-through text-muted-foreground">Export final 4K video reel for GB Banquet</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <input type="checkbox" className="size-3.5 rounded accent-primary text-primary" readOnly />
                          <span>Publish campaign landing page (due 6:00 PM)</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <input type="checkbox" className="size-3.5 rounded accent-primary text-primary" readOnly />
                          <span>Send reconciled invoice #INV-2026-08 via Gmail</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AUTO EXTRACTION */}
              {activeTab === "extract" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  {/* Left: Raw Input */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <MessageSquare className="size-3.5 text-indigo-400" />
                        Raw Client Input
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shrink-0">
                        WhatsApp
                      </Badge>
                    </div>
                    <div className="p-3.5 rounded-xl bg-muted/50 border border-border font-mono text-xs leading-relaxed text-foreground/90">
                      <p className="text-emerald-500 font-semibold text-[11px] mb-1.5">
                        From: Client (GB Banquet) • 10:14 AM
                      </p>
                      <p className="bg-background/80 p-2.5 rounded-lg border border-border/60">
                        &ldquo;Hey bro, make 3 reels for GB Banquet — event highlights, decor, food. Need all before Friday 6 PM. Logo and raw footage are in Drive.&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="size-3.5 text-amber-400" />
                      <span>Auto-parsed in 380ms. Zero manual entry.</span>
                    </div>
                  </div>

                  {/* Right: Extracted Structured Plan */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Layers className="size-3.5 text-violet-400" />
                        Structured Output
                      </span>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[10px] shrink-0">
                        Ready
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-background border border-border shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div>
                          <h4 className="font-bold text-xs text-foreground">GB Banquet Reels</h4>
                          <span className="text-[10px] text-muted-foreground">Friday 6 PM • High Priority</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">3 Tasks</Badge>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
                          <CheckCircle2 className="size-3 text-indigo-400 shrink-0" />
                          <span>Event Highlights Reel (60s)</span>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
                          <CheckCircle2 className="size-3 text-indigo-400 shrink-0" />
                          <span>Decor &amp; Ambiance Reel</span>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40">
                          <CheckCircle2 className="size-3 text-indigo-400 shrink-0" />
                          <span>Food &amp; Culinary Teaser</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <FolderSearch className="size-3 text-indigo-400" />
                          Auto-Linked: GB_Vector_Logo.svg
                        </span>
                        <span className="text-emerald-500 font-mono">99.8%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GOOGLE DRIVE HIERARCHY */}
              {activeTab === "gdrive" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <Cloud className="size-4 text-emerald-500" />
                        <span>Google Drive Hierarchical Folder Tree</span>
                      </h4>
                      <p className="text-[0.625rem] text-muted-foreground mt-0.5">
                        Uploaded assets, statement PDFs, and client reels are organized automatically.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/30">
                      Realtime Sync
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border font-mono text-xs space-y-2">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <FolderGit2 className="size-4 text-indigo-400" />
                      <span>📁 My Drive &gt; Personal_OS</span>
                    </div>

                    <div className="pl-6 space-y-1.5 border-l border-border/80 ml-2 text-muted-foreground">
                      <div className="flex items-center gap-2 text-foreground">
                        <span>└── 📁 Studio</span>
                      </div>
                      <div className="pl-6 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[11px] hover:text-foreground">
                          <span>├── 📁 📄 Briefs &amp; Contracts (GB_Banquet_Proposal.pdf)</span>
                          <span className="text-[10px] text-emerald-500">Indexed ↗</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] hover:text-foreground">
                          <span>├── 📁 💳 Finance &amp; Invoices (SBI_August_Statement.csv)</span>
                          <span className="text-[10px] text-emerald-500">Reconciled ↗</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] hover:text-foreground">
                          <span>├── 📁 🎨 Deliverables (Master_Reel_4K.mp4)</span>
                          <span className="text-[10px] text-emerald-500">Rendered ↗</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] hover:text-foreground">
                          <span>└── 📁 📥 Captures &amp; Assets (Voice_Memo_Brief.m4a)</span>
                          <span className="text-[10px] text-emerald-500">Transcribed ↗</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
