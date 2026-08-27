"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Sparkles, Menu, ArrowRight, X, Cpu, Layers, HelpCircle, ChevronRight } from "lucide-react"
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
              <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0 px-1 font-mono h-4 bg-muted/50 border-border/80 text-emerald-500">
                v2.0
              </Badge>
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground -mt-0.5 hidden sm:block tracking-wide uppercase font-medium">
              Freelance &amp; Studio Cockpit
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground">
          <a
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            System Architecture
          </a>
          <a
            href="#demo"
            className="hover:text-foreground transition-colors"
          >
            Interactive Demo
          </a>
          <a
            href="#comparison"
            className="hover:text-foreground transition-colors"
          >
            Why Personal OS
          </a>
          <a
            href="#faq"
            className="hover:text-foreground transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
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
                        <SheetTitle className="text-base font-bold tracking-tight text-foreground">
                          Personal OS
                        </SheetTitle>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Freelance &amp; Studio Cockpit
                        </span>
                      </div>
                    </div>
                    <SheetClose render={<Button variant="ghost" size="icon" className="size-9 rounded-full" />}>
                      <X className="size-5" />
                    </SheetClose>
                  </div>
                </SheetHeader>

                {/* Mobile Full-Page Navigation Links */}
                <div className="flex flex-col gap-2 my-auto py-8">
                  <a
                    href="#features"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-lg font-semibold text-foreground group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Cpu className="size-4.5" />
                      </div>
                      <span>System Architecture</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href="#demo"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-lg font-semibold text-foreground group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Sparkles className="size-4.5" />
                      </div>
                      <span>Interactive Demo</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href="#comparison"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-lg font-semibold text-foreground group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <Layers className="size-4.5" />
                      </div>
                      <span>Why Personal OS</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href="#faq"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-lg font-semibold text-foreground group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <HelpCircle className="size-4.5" />
                      </div>
                      <span>FAQ</span>
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
                    Autonomous Multi-Agent Personal OS • v2.0
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
