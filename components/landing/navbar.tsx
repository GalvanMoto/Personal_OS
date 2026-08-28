"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Sparkles, Menu, ArrowRight, X, Cpu, Layers, HelpCircle, ChevronRight, BookOpen, Star, GitFork, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "./theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border/60 shadow-xs py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="Personal OS Logo"
            width={36}
            height={36}
            className="size-8 sm:size-9 rounded-xl object-contain shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform"
            priority
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
                Personal OS
              </span>
              <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0 px-1.5 font-mono h-4.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-semibold">
                Open Source
              </Badge>
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground -mt-0.5 hidden sm:block tracking-wide uppercase font-medium">
              Autonomous Chief-of-Staff
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground">
          <a href="#architecture" className="hover:text-foreground transition-colors">
            Architecture
          </a>
          <a href="#quickstart" className="hover:text-foreground transition-colors">
            Self-Host
          </a>
          <a href="#features" className="hover:text-foreground transition-colors">
            Capabilities
          </a>
          <a href="#demo" className="hover:text-foreground transition-colors">
            Live Pipeline
          </a>
          <a href="#comparison" className="hover:text-foreground transition-colors">
            Why Open Source
          </a>
          <Link href="/docs" className="hover:text-foreground transition-colors inline-flex items-center gap-1.5">
            <BookOpen className="size-3.5" />
            Docs
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* GitHub Star Button */}
          <a
            href="https://github.com/GalvanMoto/Personal_OS"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/80 hover:bg-muted/80 text-xs font-medium transition-all shadow-xs"
          >
            <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>Star</span>
            <span className="ml-1 text-[10px] font-mono py-0.5 px-1.5 rounded-full bg-muted text-muted-foreground border border-border">
              GitHub
            </span>
          </a>

          <ThemeToggle />

          <Link href="/dashboard" className="hidden sm:block">
            <Button size="sm" className="h-8.5 px-4 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20 gap-1.5 group">
              <span>Launch Cockpit</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>

          {/* Full Page Mobile Nav Sheet */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="size-9" aria-label="Open full page menu" />}>
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="top"
                showCloseButton={false}
                className="w-full h-[100dvh] max-w-none inset-0 p-6 flex flex-col justify-between bg-background/98 backdrop-blur-2xl border-none z-50 overflow-y-auto"
              >
                <SheetHeader className="p-0 text-left">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2.5">
                      <Image
                        src="/logo.png"
                        alt="Personal OS Logo"
                        width={32}
                        height={32}
                        className="size-8 rounded-xl object-contain shadow-md shadow-indigo-500/20"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <SheetTitle className="text-base font-bold tracking-tight text-foreground">
                            Personal OS
                          </SheetTitle>
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono text-emerald-500 border-emerald-500/30">
                            OSS
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Autonomous Multi-Agent System
                        </span>
                      </div>
                    </div>
                    <SheetClose render={<Button variant="ghost" size="icon" className="size-9 rounded-full" />}>
                      <X className="size-5" />
                    </SheetClose>
                  </div>
                </SheetHeader>

                {/* Mobile Navigation Links */}
                <div className="flex flex-col gap-2 my-auto py-6">
                  <a
                    href="#architecture"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-base font-semibold text-foreground group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Cpu className="size-4.5" />
                      </div>
                      <span>Universal Architecture</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href="#quickstart"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-base font-semibold text-foreground group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Terminal className="size-4.5" />
                      </div>
                      <span>Self-Hosting Guide</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href="#features"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-base font-semibold text-foreground group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <Layers className="size-4.5" />
                      </div>
                      <span>System Capabilities</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href="#demo"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-base font-semibold text-foreground group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                        <Sparkles className="size-4.5" />
                      </div>
                      <span>Interactive Pipeline</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href="https://github.com/GalvanMoto/Personal_OS"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border hover:bg-muted/60 transition-colors text-base font-semibold text-foreground group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-muted flex items-center justify-center">
                        <Star className="size-4.5 text-amber-500" />
                      </div>
                      <span>GitHub Repository</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>

                {/* Bottom Launch Button in Mobile Menu */}
                <div className="pt-4 border-t space-y-3">
                  <Link href="/dashboard" className="w-full block" onClick={() => setMobileOpen(false)}>
                    <Button size="lg" className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 gap-2">
                      <span>Launch Cockpit</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                  <p className="text-center text-[11px] text-muted-foreground font-mono">
                    100% Open Source • MIT License • Zero Lock-in
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
