'use client';

import React from 'react';
import Link from 'next/link';
import type { SVGProps } from 'react';
import {
  ArrowRight,
  Sparkles,
  Inbox,
  ShieldCheck,
  CheckCircle2,
  Search,
  FileCheck2,
  Layers,
  Cpu,
  BookOpen,
  Play,
  Terminal,
  Star,
  Mail,
  ChevronRight,
  HardDrive,
  Lock,
  Zap,
  Bot,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { QuickstartCard } from '@/components/landing/quickstart-card';
import { InteractiveDemo } from '@/components/landing/interactive-demo';
import { FeaturesBento } from '@/components/landing/features-bento';
import { DailyTimeline } from '@/components/landing/daily-timeline';
import { ComparisonSection } from '@/components/landing/comparison-section';

// Watermelon Components
import Integrations3 from '@/components/watermelon/integrations-3';
import Team1 from '@/components/watermelon/team-1';
import Faq1 from '@/components/watermelon/faq-1';
import Footer1 from '@/components/watermelon/footer-1';

const TwitterIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="size-5 fill-current" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GithubIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="size-5 fill-current" {...props}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function HomePage() {
  const softwareLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DLRS Personal OS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Docker, Node.js, PWA',
    description:
      'Open-source Autonomous Personal OS — universal assistant control plane, zero-knowledge vault, deterministic ledger, and pluggable local/cloud LLMs.',
    url: 'https://pos.techwithgalvan.in',
    publisher: { '@type': 'Organization', name: 'DLRS', url: 'https://pos.techwithgalvan.in' },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: 'https://opensource.org/licenses/MIT',
  };

  return (
    <div suppressHydrationWarning className="relative min-h-screen w-full bg-[#09090b] text-[#f4f4f5] selection:bg-[#6FFF00] selection:text-[#09090b] overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />

      {/* =========================================================================
          SECTION 1: HERO (Full viewport with CloudFront video background)
         ========================================================================= */}
      <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden rounded-b-[32px] bg-[#09090b] border-b border-zinc-800">
        {/* Background Looping Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-80"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4"
        />

        {/* Hero Container */}
        <div className="relative z-10 max-w-[1831px] w-full mx-auto px-6 sm:px-10 lg:px-16 py-6 sm:py-8 flex flex-col justify-between flex-1">
          {/* Header */}
          <header className="flex items-center justify-between w-full">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="font-grotesk text-[20px] uppercase tracking-wider text-[#f4f4f5]">
                DLRS.OS
              </span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#6FFF00]/15 text-[#6FFF00] border border-[#6FFF00]/30 font-semibold">
                Open Source
              </span>
            </Link>

            {/* Center Navigation (Desktop) */}
            <nav className="hidden lg:block liquid-glass rounded-[28px] px-[52px] py-[20px] shadow-2xl border border-zinc-700/60">
              <ul className="flex items-center gap-9">
                {[
                  { label: 'Architecture', href: '#architecture' },
                  { label: 'Self-Host', href: '#quickstart' },
                  { label: 'Capabilities', href: '#features' },
                  { label: 'Pipeline', href: '#demo' },
                  { label: 'Integrations', href: '#integrations' },
                  { label: 'Docs', href: '/docs' },
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="font-grotesk text-[13px] uppercase text-[#f4f4f5] transition-colors duration-200 hover:text-[#6FFF00]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Desktop Social & Action Icons (Top-Right) */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href="https://github.com/GalvanMoto/Personal_OS"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass size-14 rounded-[1rem] flex items-center justify-center text-[#f4f4f5] hover:bg-white/15 transition-all shadow-lg border border-zinc-700/60"
                aria-label="GitHub Repository"
              >
                <GithubIcon />
              </a>
              <Link
                href="/dashboard"
                className="liquid-glass h-14 px-7 rounded-[1rem] flex items-center gap-2 text-sm font-grotesk uppercase text-[#f4f4f5] hover:bg-white/15 transition-all shadow-xl border border-zinc-700/60"
              >
                <Play className="size-4 text-[#6FFF00]" />
                <span>Cockpit</span>
              </Link>
            </div>
          </header>

          {/* Hero Main Content */}
          <div className="my-auto py-8 sm:py-12 lg:py-0">
            <div className="relative max-w-[860px] lg:ml-20 xl:ml-28">
              <h1 className="font-grotesk text-[36px] sm:text-[56px] md:text-[75px] lg:text-[92px] uppercase leading-[1.03] text-[#f4f4f5] drop-shadow-md">
                Stop managing tasks.
                <br />
                Let your OS run them.
              </h1>

              {/* Overlaid cursive accent text */}
              <span className="font-condiment text-[24px] sm:text-[36px] md:text-[46px] lg:text-[54px] normal-case text-[#6FFF00] drop-shadow-[0_0_12px_rgba(111,255,0,0.6)] absolute -top-5 sm:top-1/2 right-0 sm:-right-8 md:-right-14 sm:-translate-y-1/2 -rotate-2 pointer-events-none select-none">
                Autonomous Personal OS
              </span>

              <p className="mt-6 max-w-xl text-sm sm:text-base text-zinc-300 leading-relaxed font-mono drop-shadow-sm">
                Drop raw WhatsApp voice notes, PDF bank statements, and client briefs. DLRS turns messy inputs into structured projects, syncs Google Drive, and powers your day with zero manual data entry.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
                <a
                  href="https://github.com/GalvanMoto/Personal_OS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-white px-7 text-sm font-semibold text-zinc-950 shadow-xl shadow-black/50 transition-all hover:bg-zinc-200 active:scale-[0.98] group"
                >
                  <GithubIcon className="size-4" />
                  <span>Star on GitHub</span>
                  <ArrowRight className="size-4 -rotate-45 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>

                <Link
                  href="/dashboard"
                  className="liquid-glass inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-7 text-sm font-semibold text-[#f4f4f5] hover:bg-white/15 transition-all shadow-xl border border-zinc-700/60 active:scale-[0.98]"
                >
                  <Play className="size-4 text-[#6FFF00]" />
                  <span>Launch Cockpit</span>
                </Link>

                <Link
                  href="/docs/quick-start"
                  className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  <BookOpen className="size-4" />
                  <span>Documentation</span>
                </Link>
              </div>
            </div>

            {/* Mobile Social Icons */}
            <div className="flex lg:hidden justify-center items-center gap-4 mt-12">
              <a
                href="https://github.com/GalvanMoto/Personal_OS"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass size-14 rounded-[1rem] flex items-center justify-center text-[#f4f4f5] hover:bg-white/15 transition-colors border border-zinc-700/60 shadow-md"
                aria-label="GitHub"
              >
                <GithubIcon />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass size-14 rounded-[1rem] flex items-center justify-center text-[#f4f4f5] hover:bg-white/15 transition-colors border border-zinc-700/60 shadow-md"
                aria-label="Twitter"
              >
                <TwitterIcon />
              </a>
              <a
                href="mailto:contact@techwithgalvan.in"
                className="liquid-glass size-14 rounded-[1rem] flex items-center justify-center text-[#f4f4f5] hover:bg-white/15 transition-colors border border-zinc-700/60 shadow-md"
                aria-label="Email"
              >
                <Mail className="size-5" />
              </a>
            </div>
          </div>

          {/* Bottom Badges */}
          <div className="pt-6 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
            <span className="inline-flex items-center gap-2 font-medium text-zinc-200">
              <span className="size-2 rounded-full bg-[#6FFF00] animate-pulse" />
              100% Data Sovereignty • Self-Hostable
            </span>
            <div className="flex items-center gap-4 text-zinc-400">
              <span>AES-256 Vault</span>
              <span>•</span>
              <span>Integer Ledger</span>
              <span>•</span>
              <span>Pluggable Local LLMs</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: MULTI-AGENT CREW & COCKPIT PREVIEW
         ========================================================================= */}
      <section className="py-20 sm:py-28 border-b border-zinc-800 bg-[#09090b] relative">
        <div className="mx-auto max-w-[1831px] px-6 sm:px-10 lg:px-16">
          {/* Header Row */}
          <div className="flex flex-row items-end justify-between gap-3 sm:gap-6 mb-8 sm:mb-14">
            {/* Left Heading */}
            <div className="font-grotesk text-[24px] sm:text-[38px] md:text-[48px] lg:text-[56px] uppercase leading-[1.08] text-[#f4f4f5]">
              <div>Collection of</div>
              <div className="flex items-baseline gap-1.5 sm:gap-2.5 pl-2 sm:pl-6 lg:pl-10">
                <span className="font-condiment text-[#6FFF00] normal-case text-[1.12em] leading-none whitespace-nowrap">
                  Autonomous
                </span>
                <span className="whitespace-nowrap">Agents</span>
              </div>
            </div>

            {/* Right Button with neon underline bar */}
            <Link
              href="/docs/architecture"
              className="group flex flex-col items-start shrink-0 transition-transform active:scale-95 pb-1"
            >
              <div className="flex items-center gap-1.5 sm:gap-2.5 font-grotesk uppercase">
                <span className="text-[20px] sm:text-[32px] md:text-[44px] lg:text-[52px] leading-none text-[#f4f4f5]">
                  SEE
                </span>
                <div className="flex flex-col text-[12px] sm:text-[18px] md:text-[24px] lg:text-[30px] leading-[0.88] text-[#f4f4f5] text-left">
                  <span>ALL</span>
                  <span>AGENTS</span>
                </div>
              </div>
              <div className="w-full bg-[#6FFF00] h-[3px] sm:h-[6px] lg:h-[8px] mt-1 sm:mt-1.5 rounded-full transition-transform duration-300 group-hover:scale-x-105 origin-left" />
            </Link>
          </div>

          {/* 3-Column Agent Character Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              {
                id: 'agent-1',
                name: 'Chief-of-Staff Orchestrator',
                badge: 'ORCHESTRATOR',
                status: 'PROACTIVE SYNTHESIS',
                description: 'Universal coordinator that resolves compound plans, schedules focus blocks, and briefs you each morning.',
                videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4',
                icon: Bot,
              },
              {
                id: 'agent-2',
                name: 'Triage & Multimodal Parser',
                badge: 'VOICE + OCR',
                status: 'ZERO DATA ENTRY',
                description: 'Transcribes raw voice notes with Whisper, parses messy brief screenshots, and auto-files Drive deliverables.',
                videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4',
                icon: Send,
              },
              {
                id: 'agent-3',
                name: 'Financial & Vault Sentinel',
                badge: 'AES-256 VAULT',
                status: 'EXACT INTEGER LEDGER',
                description: 'Decrypts multi-bank statement PDFs in-memory with zero credential leaks and maintains exact minor-unit ledgers.',
                videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4',
                icon: ShieldCheck,
              },
            ].map((agent) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.id}
                  className="liquid-glass-card rounded-[32px] p-[18px] hover:border-[#6FFF00]/50 transition-all duration-300 flex flex-col group border border-zinc-800 shadow-2xl"
                >
                  {/* Square Video Container */}
                  <div className="relative w-full pb-[100%] rounded-[24px] overflow-hidden bg-zinc-950">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
                      src={agent.videoUrl}
                    />

                    {/* Top Floating Badge */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                      <div className="size-10 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-700 flex items-center justify-center text-[#6FFF00]">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-700 text-[#6FFF00]">
                        {agent.badge}
                      </span>
                    </div>

                    {/* Bottom Text Overlay inside video */}
                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10">
                      <h3 className="font-grotesk uppercase text-lg text-[#f4f4f5] tracking-wide">
                        {agent.name}
                      </h3>
                      <p className="text-xs text-zinc-300 font-mono mt-1 line-clamp-2 leading-relaxed">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  {/* Overlay Bottom Bar */}
                  <div className="liquid-glass rounded-[20px] px-5 py-4 flex items-center justify-between mt-4 border border-zinc-800">
                    <div className="flex flex-col font-grotesk">
                      <span className="text-[11px] uppercase tracking-wider text-zinc-400">
                        AGENT STATUS:
                      </span>
                      <span className="text-[15px] font-bold text-[#6FFF00]">
                        {agent.status}
                      </span>
                    </div>

                    <Link
                      href="/dashboard"
                      className="size-12 rounded-full flex items-center justify-center bg-zinc-800 border border-zinc-700 text-[#6FFF00] shadow-lg hover:bg-zinc-700 hover:scale-110 transition-transform cursor-pointer"
                      aria-label="View Agent in Cockpit"
                    >
                      <ChevronRight className="size-5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          DEVELOPER QUICKSTART TERMINAL
         ========================================================================= */}
      <section id="quickstart" className="py-16 sm:py-24 border-b border-zinc-800 bg-[#09090b] relative">
        <div className="mx-auto max-w-[1831px] px-6 sm:px-10 lg:px-16">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
            <Badge variant="outline" className="font-mono text-xs gap-1.5 px-3 py-1 border-[#6FFF00]/30 text-[#6FFF00] bg-[#6FFF00]/10">
              <Terminal className="size-3.5" /> 1-Click Deployment
            </Badge>
            <h2 className="font-grotesk text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#f4f4f5]">
              Self-Host in Under 2 Minutes
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base font-mono">
              Run locally or deploy via Docker. Keep your data on your own infrastructure with zero third-party telemetry.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <QuickstartCard />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: THE UNIVERSAL ARCHITECTURE (Full viewport with CloudFront video)
         ========================================================================= */}
      <section id="architecture" className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#09090b] py-16 sm:py-20 lg:py-24 border-b border-zinc-800">
        {/* Background Looping Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-70"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4"
        />

        <div className="relative z-10 max-w-[1831px] w-full mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-between flex-1">
          {/* Top Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 pt-4 sm:pt-8">
            <div className="relative max-w-2xl">
              <h2 className="font-grotesk text-[30px] sm:text-[44px] md:text-[52px] lg:text-[60px] uppercase leading-[1.05] text-[#f4f4f5] drop-shadow-md">
                The Universal
                <br />
                Control Plane
              </h2>
              <div className="mt-1 sm:mt-2">
                <span className="font-condiment text-[28px] sm:text-[40px] md:text-[50px] lg:text-[60px] normal-case text-[#6FFF00] drop-shadow-[0_0_12px_rgba(111,255,0,0.6)] inline-block -rotate-2 select-none">
                  No Silos
                </span>
              </div>
            </div>

            <p className="font-mono text-[13px] sm:text-[16px] uppercase text-zinc-300 max-w-[340px] leading-relaxed drop-shadow-sm">
              The Assistant is not a feature of one module. The Assistant is the universal operating layer for every module.
            </p>
          </div>

          {/* Architecture comparison card (Neutral Charcoal Frosted Glass) */}
          <div className="my-auto py-10">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center max-w-5xl mx-auto">
              <div className="space-y-4">
                {[
                  {
                    n: '01',
                    title: 'Universal Intent & Entity Resolution',
                    desc: 'Classifies inputs (Contabo = Subscription/Merchant, GB Banquet = Project/Client) into compound plans without asking you to navigate between tabs.',
                    icon: Inbox,
                  },
                  {
                    n: '02',
                    title: 'Cross-Module Orchestration',
                    desc: 'One request automatically creates subscriptions, links billing URLs, writes scheduled reminders, and provisions ledger records.',
                    icon: Layers,
                  },
                  {
                    n: '03',
                    title: 'Deterministic Vault & Ledger Math',
                    desc: 'Paise/cents exact integer arithmetic. Bank statements decrypt in-memory with zero raw credential logging.',
                    icon: ShieldCheck,
                  },
                ].map((item) => (
                  <div key={item.n} className="liquid-glass-card rounded-2xl p-5 flex gap-4 items-start shadow-xl border border-zinc-800">
                    <div className="size-11 rounded-xl bg-zinc-800 border border-zinc-700 text-[#6FFF00] flex items-center justify-center shrink-0">
                      <item.icon className="size-5.5" />
                    </div>
                    <div>
                      <span className="font-mono text-[11px] text-[#6FFF00] font-bold">{item.n}</span>
                      <h4 className="font-grotesk uppercase text-base text-[#f4f4f5]">{item.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 font-mono leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Side execution demo (Frosted Charcoal Glass Card) */}
              <div className="liquid-glass-card rounded-[28px] p-6 sm:p-7 shadow-2xl border border-zinc-800">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                  <span className="font-grotesk text-sm uppercase tracking-wider text-[#6FFF00]">
                    Raw Input → Domain Actions
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] border-[#6FFF00]/30 text-[#6FFF00] bg-[#6FFF00]/10">
                    Auto-Resolved
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">You type or send voice:</span>
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm font-mono text-zinc-200 italic leading-relaxed">
                      “I pay Contabo €12 every month on the 8th. Track it with this billing link and remind me 3 days prior.”
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">System provisions:</span>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-mono text-zinc-200 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                      <CheckCircle2 className="size-4 text-[#6FFF00] shrink-0" />
                      <span><strong>Subscription:</strong> Contabo (€12 / mo)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-mono text-zinc-200 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                      <CheckCircle2 className="size-4 text-[#6FFF00] shrink-0" />
                      <span><strong>Reminder:</strong> Trigger on 5th monthly</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-mono text-zinc-200 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                      <CheckCircle2 className="size-4 text-[#6FFF00] shrink-0" />
                      <span><strong>Ledger:</strong> Categorized to Infrastructure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex justify-between items-end gap-12 mt-auto pt-8 border-t border-zinc-800">
            <div className="font-mono text-xs text-zinc-400 uppercase">
              Deterministic PostgreSQL schema • LLM extracts &amp; plans • Audit trail preserved
            </div>
            <Link href="/docs/architecture" className="font-grotesk text-xs uppercase text-[#6FFF00] hover:underline inline-flex items-center gap-1">
              Architecture Guide <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE PIPELINE DEMO
         ========================================================================= */}
      <InteractiveDemo />

      {/* =========================================================================
          SYSTEM CAPABILITIES BENTO
         ========================================================================= */}
      <FeaturesBento />

      {/* =========================================================================
          PLUGGABLE INTEGRATIONS
         ========================================================================= */}
      <Integrations3 />

      {/* =========================================================================
          DAILY TIMELINE
         ========================================================================= */}
      <DailyTimeline />

      {/* =========================================================================
          OPEN SOURCE VS CLOSED SAAS COMPARISON
         ========================================================================= */}
      <ComparisonSection />

      {/* =========================================================================
          COMMUNITY & CONTRIBUTORS
         ========================================================================= */}
      <Team1 />

      {/* =========================================================================
          INTERACTIVE FAQ
         ========================================================================= */}
      <Faq1 />

      {/* =========================================================================
          SECTION 4: FINAL CTA (Full-width native aspect CloudFront video)
         ========================================================================= */}
      <section className="relative w-full bg-[#09090b] overflow-hidden border-t border-zinc-800">
        {/* Background Video displayed at native aspect ratio */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto block pointer-events-none opacity-85"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4"
        />

        {/* Text Content overlay on video */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 lg:p-16 pointer-events-none">
          {/* Right-aligned Heading Block */}
          <div className="self-end lg:pr-[20%] lg:pl-[15%] text-right relative pointer-events-auto mt-2 sm:mt-8 md:mt-12 lg:mt-20 pr-1 sm:pr-0">
            {/* Small "Go beyond" cursive text */}
            <span className="font-condiment text-[#6FFF00] text-[16px] sm:text-[34px] md:text-[50px] lg:text-[70px] normal-case drop-shadow-[0_0_12px_rgba(111,255,0,0.7)] absolute -top-3 sm:-top-7 md:-top-10 lg:-top-14 -left-3 sm:left-0 sm:-translate-x-1/2 -rotate-2 select-none">
              Go beyond
            </span>

            {/* Heading in Anton */}
            <div className="font-grotesk uppercase text-[15px] sm:text-[32px] md:text-[48px] lg:text-[64px] leading-[1.08] sm:leading-[1.05] text-[#f4f4f5] drop-shadow-lg">
              <div className="mb-2 sm:mb-6 md:mb-8 lg:mb-12">JOIN US.</div>
              <div>REVEAL WHAT&apos;S HIDDEN.</div>
              <div>DEFINE WHAT&apos;S NEXT.</div>
              <div>FOLLOW THE SIGNAL.</div>
            </div>
          </div>

          {/* Social Icons (Bottom-left, absolute positioned) */}
          <div className="absolute left-[5%] sm:left-[8%] bottom-[8%] sm:bottom-[15%] md:bottom-[18%] lg:bottom-[20%] pointer-events-auto">
            <div className="liquid-glass-card rounded-[0.75rem] sm:rounded-[1rem] md:rounded-[1.25rem] lg:rounded-[1.5rem] flex flex-col overflow-hidden shadow-2xl border border-zinc-800">
              <a
                href="https://github.com/GalvanMoto/Personal_OS"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[16vw] sm:w-[14.375rem] md:w-[10.78125rem] lg:w-[16.77rem] h-[8vw] sm:h-[4.5rem] md:h-[4rem] lg:h-[5.5rem] min-w-[36px] min-h-[32px] flex items-center justify-center text-[#f4f4f5] hover:bg-white/15 transition-colors border-b border-zinc-800"
                aria-label="GitHub"
              >
                <GithubIcon className="size-3.5 sm:size-5 lg:size-6" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[16vw] sm:w-[14.375rem] md:w-[10.78125rem] lg:w-[16.77rem] h-[8vw] sm:h-[4.5rem] md:h-[4rem] lg:h-[5.5rem] min-w-[36px] min-h-[32px] flex items-center justify-center text-[#f4f4f5] hover:bg-white/15 transition-colors border-b border-zinc-800"
                aria-label="Twitter"
              >
                <TwitterIcon className="size-3.5 sm:size-5 lg:size-6" />
              </a>
              <a
                href="mailto:contact@techwithgalvan.in"
                className="w-[16vw] sm:w-[14.375rem] md:w-[10.78125rem] lg:w-[16.77rem] h-[8vw] sm:h-[4.5rem] md:h-[4rem] lg:h-[5.5rem] min-w-[36px] min-h-[32px] flex items-center justify-center text-[#f4f4f5] hover:bg-white/15 transition-colors"
                aria-label="Email"
              >
                <Mail className="size-3.5 sm:size-5 lg:size-6" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
         ========================================================================= */}
      <Footer1 />
    </div>
  );
}
