"use client"

import Link from "next/link"
import { Star, Terminal, BookOpen, ShieldCheck, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/15">
      <div className="mx-auto max-w-[--fd-layout-width] px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Personal OS"
                width={32}
                height={32}
                className="size-8 rounded-xl border border-border/80 bg-card object-contain shadow-xs"
                suppressHydrationWarning
              />
              <span className="font-bold tracking-tight text-base">DLRS Personal OS</span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              The autonomous, open-source Personal OS for operators, creators, and freelancers. Universal AI control plane with zero vendor lock-in.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://github.com/GalvanMoto/Personal_OS"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-card text-xs font-medium hover:bg-muted transition-colors"
              >
                <Star className="size-3.5 text-amber-500" />
                <span>GitHub Repo</span>
              </a>
              <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted/60 border">
                MIT License
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Architecture</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <a href="#architecture" className="hover:text-foreground hover:underline underline-offset-4">
                  Universal Control Plane
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground hover:underline underline-offset-4">
                  Multi-Agent Core
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-foreground hover:underline underline-offset-4">
                  Live Extraction Pipeline
                </a>
              </li>
              <li>
                <a href="#comparison" className="hover:text-foreground hover:underline underline-offset-4">
                  Why Open Source
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Self-Hosting &amp; Docs</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <a href="#quickstart" className="hover:text-foreground hover:underline underline-offset-4">
                  Docker Deployment
                </a>
              </li>
              <li>
                <Link href="/docs/quick-start" className="hover:text-foreground hover:underline underline-offset-4">
                  Quickstart Guide
                </Link>
              </li>
              <li>
                <Link href="/docs/architecture" className="hover:text-foreground hover:underline underline-offset-4">
                  System Design
                </Link>
              </li>
              <li>
                <Link href="/docs/security" className="hover:text-foreground hover:underline underline-offset-4">
                  Vault &amp; Security
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Community &amp; Code</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/GalvanMoto/Personal_OS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground hover:underline underline-offset-4"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/GalvanMoto/Personal_OS/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground hover:underline underline-offset-4"
                >
                  Issue Tracker
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground hover:underline underline-offset-4">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground hover:underline underline-offset-4">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Personal OS. Open source software.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-emerald-500">100% Data Sovereignty</span>
            <span>•</span>
            <span className="font-mono">AES-256 Vault</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
