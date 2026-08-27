"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-transparent via-indigo-500/5 to-violet-500/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-400">
          <Sparkles className="size-3.5" />
          <span>Claim your early command center</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
          Ready to experience a system that{" "}
          <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            actually thinks for you?
          </span>
        </h2>

        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          Stop wasting hours copying links, searching drives, and structuring tasks. Launch DLRS and take back control of your focus today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/25 gap-2 group">
              <span>Launch Your Cockpit</span>
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base font-medium border-border/80 bg-background/50 hover:bg-muted">
              Sign In to Existing Workspace
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-500" /> Free to start
          </span>
          <span>•</span>
          <span>No credit card required</span>
          <span>•</span>
          <span>PWA + Telegram instant sync</span>
        </div>
      </div>
    </section>
  )
}
