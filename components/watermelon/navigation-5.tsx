'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Cpu,
  Layers,
  GitBranch,
  Terminal,
  Command,
  User,
  Menu,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  HardDrive,
  Star,
  Play,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { ThemeToggle } from '@/components/landing/theme-toggle';

export function Navigation5() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="sticky top-0 z-50 w-full py-3 sm:py-4 transition-all duration-300 backdrop-blur-md bg-background/80 border-b border-border/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="Personal OS"
            width={34}
            height={34}
            className="size-8 sm:size-9 rounded-xl object-contain shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform"
            priority
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                Personal OS
              </span>
              <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                OSS
              </Badge>
            </div>
            <span className="text-[9px] text-muted-foreground -mt-0.5 hidden sm:block tracking-wide uppercase font-medium">
              Autonomous Control Plane
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <NavigationMenu className="static">
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-auto rounded-full bg-transparent px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground">
                  Architecture
                </NavigationMenuTrigger>
                <NavigationMenuContent className="p-0">
                  <div className="grid w-4xl grid-cols-3 gap-6 p-6">
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                      <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <Cpu className="size-4.5" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">Universal Control Plane</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The Assistant is the universal operating layer for every module. Zero isolated silos.
                      </p>
                      <Link href="/docs/architecture" className="text-xs text-indigo-500 font-medium hover:underline inline-flex items-center gap-1 mt-1">
                        Read architecture docs <ArrowUpRight className="size-3" />
                      </Link>
                    </div>

                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                      <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Receipt className="size-4.5" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">Integer Ledger Engine</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Deterministic paise/cents minor-unit math with automated multi-bank statement parsers.
                      </p>
                      <Link href="/docs/security" className="text-xs text-emerald-500 font-medium hover:underline inline-flex items-center gap-1 mt-1">
                        View financial math <ArrowUpRight className="size-3" />
                      </Link>
                    </div>

                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                      <div className="size-9 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                        <ShieldCheck className="size-4.5" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">Zero-Knowledge Vault</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        AES-256-GCM in-memory statement decryption. Raw passwords are never exported.
                      </p>
                      <Link href="/docs/security" className="text-xs text-cyan-500 font-medium hover:underline inline-flex items-center gap-1 mt-1">
                        Security specifications <ArrowUpRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <a
                  href="#quickstart"
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Terminal className="size-3.5 text-emerald-500" />
                  Self-Host
                </a>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <a
                  href="#features"
                  className="rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Capabilities
                </a>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <a
                  href="#demo"
                  className="rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pipeline
                </a>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <a
                  href="#integrations"
                  className="rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Integrations
                </a>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <BookOpen className="size-3.5" />
                  Docs
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Action Icons Section */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <a
            href="https://github.com/GalvanMoto/Personal_OS"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-all shadow-xs"
          >
            <Star className="size-3.5 text-amber-500" />
            <span>Star</span>
            <span className="text-[10px] font-mono text-muted-foreground">GitHub</span>
          </a>

          <Link href="/dashboard" className="hidden sm:block">
            <Button size="sm" className="h-8.5 px-4 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20 gap-1.5 group">
              <span>Cockpit</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>

          {/* Mobile Menu Trigger */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="size-9 rounded-full" aria-label="Open menu" />}>
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="right" className="flex w-[320px] flex-col justify-between p-6 bg-background">
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5 pb-4 border-b">
                    <Image src="/logo.png" alt="" width={28} height={28} className="size-7 rounded-lg" />
                    <span className="text-base font-bold">Personal OS</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-500">OSS</Badge>
                  </div>

                  <div className="flex flex-col gap-3 text-sm font-medium">
                    <a href="#quickstart" onClick={() => setMobileOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                      Quickstart &amp; Docker
                    </a>
                    <a href="#features" onClick={() => setMobileOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                      Architecture &amp; Features
                    </a>
                    <a href="#demo" onClick={() => setMobileOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                      Interactive Pipeline
                    </a>
                    <a href="#integrations" onClick={() => setMobileOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                      Integrations
                    </a>
                    <Link href="/docs" onClick={() => setMobileOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                      Documentation
                    </Link>
                    <a
                      href="https://github.com/GalvanMoto/Personal_OS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-muted rounded-lg inline-flex items-center gap-2 text-amber-500"
                    >
                      <Star className="size-4" /> GitHub Repo
                    </a>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold">
                      Launch Cockpit
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}