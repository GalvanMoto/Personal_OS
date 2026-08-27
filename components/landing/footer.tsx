"use client"

import * as React from "react"
import Link from "next/link"
import { Sparkles, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/20 py-12 text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-linear-to-tr from-indigo-600 via-violet-600 to-cyan-400 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="size-3.5" />
              </div>
              <span className="font-bold text-base text-foreground tracking-tight">DLRS</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The autonomous personal operating system that turns chaos into clear, actionable, asset-linked execution.
            </p>
          </div>

          {/* Column 1: System */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Capabilities</h4>
            <ul className="space-y-1.5">
              <li><a href="#inbox" className="hover:text-foreground transition-colors">Universal Ingestion</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Asset Discovery Engine</a></li>
              <li><a href="#assistant" className="hover:text-foreground transition-colors">Proactive Daily Copilot</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Bank &amp; Expense Radar</a></li>
            </ul>
          </div>

          {/* Column 2: Ecosystem */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Ecosystem</h4>
            <ul className="space-y-1.5">
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Progressive Web App (PWA)</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Telegram Bot Bridge</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Google Drive Integration</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Chrome &amp; Safari Share Extension</span></li>
            </ul>
          </div>

          {/* Column 3: Security & Legal */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Trust &amp; Privacy</h4>
            <ul className="space-y-1.5">
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Zero-Knowledge Storage</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-pointer">Local Decryption Engine</span></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} DLRS OS. Built for independent creators, builders, and operators.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">d</kbd> to toggle theme
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
