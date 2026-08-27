"use client"

import * as React from "react"
import Link from "next/link"
import { Sparkles, Menu, ArrowRight, Zap, Bot, Layers, CheckCircle2, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "./theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)

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
          ? "bg-background/80 backdrop-blur-md border-b border-border/60 shadow-xs py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="size-9 rounded-xl bg-linear-to-tr from-indigo-600 via-violet-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="size-4.5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
                Personal OS
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono h-4 bg-muted/50 border-border/80 text-emerald-500">
                v2.0
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block tracking-wide uppercase font-medium">
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
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <Link href="/dashboard" className="hidden sm:block">
            <Button size="sm" className="h-8.5 px-4 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20 gap-1.5 group">
              <span>Launch Cockpit</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>

          {/* Mobile Nav Sheet */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="size-9" />}>
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-10">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="size-4 text-indigo-400" />
                    Personal OS 2.0
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 text-sm font-medium">
                  <a href="#features" className="text-muted-foreground hover:text-foreground py-1">
                    System Architecture
                  </a>
                  <a href="#demo" className="text-muted-foreground hover:text-foreground py-1">
                    Interactive Demo
                  </a>
                  <a href="#comparison" className="text-muted-foreground hover:text-foreground py-1">
                    Why Personal OS
                  </a>
                  <a href="#faq" className="text-muted-foreground hover:text-foreground py-1">
                    FAQ
                  </a>
                  <div className="pt-4 border-t flex flex-col gap-2">
                    <Link href="/dashboard" className="w-full">
                      <Button className="w-full bg-primary text-primary-foreground font-semibold">
                        Launch Cockpit
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
