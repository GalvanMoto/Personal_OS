"use client"

import * as React from "react"
import {
  Inbox,
  Sparkles,
  Layers,
  FolderSearch,
  Bot,
  Receipt,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Clock,
  Compass,
  FileCheck2,
  Lock,
  Cpu,
  Cloud,
  Mail,
  Volume2,
  FolderGit2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function FeaturesBento() {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-violet-500/10 text-violet-400 border-violet-500/30">
            System Architecture
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            An Operating System for Freelancers &amp; Studios
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Traditional tools force you to manually type, tag, and organize databases. DLRS sits between you and raw work, doing the heavy cognitive orchestration.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {/* Card 1: Universal Ingest */}
          <Card className="border-border/80 bg-card/80 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="size-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-2">
                <Inbox className="size-5" />
              </div>
              <CardTitle className="text-lg font-bold">1. Universal Multimodal Ingest</CardTitle>
              <CardDescription className="text-xs">
                The single entry point for all messy inputs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Paste screenshots, drop client PDFs, record audio voice notes, forward emails, or paste links. DLRS parses the intent without manual form fields.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border">WhatsApp Clips</span>
                <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border">PDF Proposals</span>
                <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border">Voice Memos</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Google Drive Hierarchical Tree */}
          <Card className="border-border/80 bg-card/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="size-10 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
                <FolderGit2 className="size-5" />
              </div>
              <CardTitle className="text-lg font-bold">2. Google Drive Hierarchy</CardTitle>
              <CardDescription className="text-xs">
                Automated directory sorting in your Drive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Uploaded files land into an organized Google Drive tree (<code className="font-mono text-[10px] text-emerald-400">Personal_OS/Studio/Briefs, Finance, Media</code>) with 1-click web links.
              </p>
              <div className="p-2 rounded-lg bg-muted/50 border border-border text-[10px] font-mono text-emerald-500 flex items-center justify-between">
                <span>📁 Personal_OS/Studio/Invoices/</span>
                <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">Auto Sorted</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: AI Chief-of-Staff */}
          <Card className="border-border/80 bg-card/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="size-10 rounded-xl bg-cyan-600/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-2">
                <Bot className="size-5" />
              </div>
              <CardTitle className="text-lg font-bold">3. Proactive Chief-of-Staff</CardTitle>
              <CardDescription className="text-xs">
                Interactive streaming widgets &amp; safe tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Powered by Azure OpenAI. Renders rich KPI metric cards, time-series charts, and interactive checklists. Destructive changes pause for user confirmation.
              </p>
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                <ShieldCheck className="size-3.5" />
                <span>3-Tier safety policy boundary</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Financial Ledger Engine */}
          <Card className="border-border/80 bg-card/80 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/50 transition-all">
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="size-10 rounded-xl bg-violet-600/15 border border-violet-500/30 text-violet-400 flex items-center justify-center mb-2">
                <Receipt className="size-5" />
              </div>
              <CardTitle className="text-lg font-bold">4. Bank Ledger &amp; Spend Engine</CardTitle>
              <CardDescription className="text-xs">
                Zero float rounding errors, 100% exact math
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Instant CSV &amp; PDF statement ingestion (SBI, HDFC, Chase). Automatically detects recurring software subscriptions, category outflows, and inflow margins.
              </p>
              <div className="text-[10px] text-violet-400 font-medium flex items-center gap-1 font-mono">
                <Zap className="size-3" /> Exact integer minor-unit math (Paise/Cents)
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Email Intelligence */}
          <Card className="border-border/80 bg-card/80 backdrop-blur-md relative overflow-hidden group hover:border-pink-500/50 transition-all">
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="size-10 rounded-xl bg-pink-600/15 border border-pink-500/30 text-pink-400 flex items-center justify-center mb-2">
                <Mail className="size-5" />
              </div>
              <CardTitle className="text-lg font-bold">5. Multi-Mailbox Email Triage</CardTitle>
              <CardDescription className="text-xs">
                Connect multiple Gmail accounts seamlessly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Synchronizes client communication and automatically sorts invoices, client tasks, and noise. Drafts context-aware replies ready for one-click review.
              </p>
              <div className="text-[10px] text-pink-400 font-medium flex items-center gap-1">
                <Sparkles className="size-3" /> Multi-account unified thread stream
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Morning Audio Briefing */}
          <Card className="border-border/80 bg-card/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/50 transition-all">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
            <CardHeader className="pb-2">
              <div className="size-10 rounded-xl bg-amber-600/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-2">
                <Volume2 className="size-5" />
              </div>
              <CardTitle className="text-lg font-bold">6. Morning Audio Standup</CardTitle>
              <CardDescription className="text-xs">
                Audio preview &amp; daily agenda readout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Wake up to an automated summary of overdue items, client deliverables, and scheduled focus windows. Includes Web Audio harmonic synthesizer previews.
              </p>
              <div className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                <Clock className="size-3" /> 8:00 AM Standup • 6:00 PM Wrap-up
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
