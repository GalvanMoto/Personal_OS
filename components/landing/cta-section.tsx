"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, ShieldCheck, Terminal, Star, BookOpen, GitFork } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-16 sm:py-24 border-b bg-background relative overflow-hidden">
      <div className="home-glow opacity-60" aria-hidden />
      <div className="mx-auto max-w-[--fd-layout-width] px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center space-y-7 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-8 sm:p-14 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium">
            <Sparkles className="size-3.5 text-indigo-500" />
            <span>Built in the Open • Free Forever</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">
            Deploy Your Autonomous Personal OS in Minutes
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Stop losing hours to manual admin and fragmented SaaS tools. Self-host DLRS Personal OS on your own machine or private VPS today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <a
              href="https://github.com/GalvanMoto/Personal_OS"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button size="lg" className="w-full sm:w-auto h-12 px-7 font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 gap-2 group">
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Star on GitHub</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </a>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-7 bg-background/80 backdrop-blur-sm gap-2">
                <Terminal className="size-4 text-indigo-500" />
                <span>Launch Cockpit Preview</span>
              </Button>
            </Link>
            <Link href="/docs" className="w-full sm:w-auto">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto h-12 px-6 gap-2">
                <BookOpen className="size-4" />
                <span>Documentation</span>
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground pt-3 border-t border-border/50">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" /> MIT Open Source License
            </span>
            <span>•</span>
            <span>Self-Hostable (Docker &amp; Node)</span>
            <span>•</span>
            <span>100% Data Sovereignty</span>
          </div>
        </div>
      </div>
    </section>
  )
}
