"use client"

import * as React from "react"
import { Check, X, Sparkles, Zap, Shield, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function ComparisonSection() {
  const comparisonItems = [
    {
      feature: "Task Creation Workflow",
      traditional: "Manual clicking, typing descriptions, picking tags, setting dates in 10 fields",
      dlrs: "Drop raw screenshot, forward email, or send voice note. Extracted in seconds."
    },
    {
      feature: "Asset & File Discovery",
      traditional: "Search through 100 Google Drive links, emails, and WhatsApp chats yourself",
      dlrs: "Automatically links logos, drive folders, brand guidelines, and reference files."
    },
    {
      feature: "Daily Prioritization",
      traditional: "You must browse overdue lists and manually plan your morning",
      dlrs: "Proactive morning standup with prioritized tasks and focus suggestions."
    },
    {
      feature: "Execution Environment",
      traditional: "Just a checkbox. You have to open 6 different apps and browser tabs to work",
      dlrs: "1-Click Focus Cockpit bundling all instructions, assets, links, and sub-progress."
    },
    {
      feature: "Financial & Receipt Tracking",
      traditional: "Manual expense logging or disjointed spreadsheets",
      dlrs: "Auto-reads statements, decrypts PDFs, and tracks subscription renewal radar."
    },
    {
      feature: "Platform Friction",
      traditional: "Heavy desktop web app that is annoying to update on mobile",
      dlrs: "PWA + Telegram Bot integration for frictionless instant mobile dumps."
    }
  ]

  return (
    <section id="comparison" className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            The Paradigm Shift
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Why traditional productivity apps fail you
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Other apps turn you into a data-entry clerk for your own life. DLRS removes the chore of task management completely.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto overflow-hidden rounded-2xl border border-border bg-card/90 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-3 border-b border-border bg-muted/40 p-4 text-xs font-bold uppercase tracking-wider">
            <div className="text-muted-foreground">Workflow</div>
            <div className="text-rose-400 hidden md:block">Traditional Tools</div>
            <div className="text-emerald-400 items-center gap-1.5 hidden md:flex">
              <Sparkles className="size-3.5 text-emerald-400" />
              <span>Personal OS</span>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {comparisonItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 p-4 gap-3 items-start hover:bg-muted/30 transition-colors">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{item.feature}</h4>
                </div>

                {/* Traditional */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <div className="size-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="size-3" />
                  </div>
                  <span className="leading-relaxed">{item.traditional}</span>
                </div>

                {/* DLRS */}
                <div className="flex items-start gap-2 text-xs text-foreground font-medium bg-emerald-500/5 md:bg-transparent p-2.5 md:p-0 rounded-lg">
                  <div className="size-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="size-3" />
                  </div>
                  <span className="leading-relaxed text-emerald-600 dark:text-emerald-400">{item.dlrs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
