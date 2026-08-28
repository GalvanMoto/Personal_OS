'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, ShieldCheck, Terminal, Star, CheckCircle2, Play, BookOpen } from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NavLink {
  label: string;
  href: string;
}

interface FeatureItem {
  title: string;
  description: string;
  icon: 'bot' | 'shield' | 'terminal';
}

interface Hero22Props {
  brandName?: string;
  navLinks?: NavLink[];
  headingLine1?: string;
  headingLine2Prefix?: string;
  headingHighlight?: string;
  description?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  features?: FeatureItem[];
  backgroundImage?: string;
}

const featuresDefault: FeatureItem[] = [
  { title: '100% Data Sovereignty', description: 'AES-256 Vault & Local DB', icon: 'shield' },
  { title: 'Universal Control Plane', description: 'Cross-Module Orchestration', icon: 'bot' },
  { title: 'Local & Cloud AI', description: 'Ollama, Claude & OpenAI', icon: 'terminal' },
];

const iconMap = {
  bot: Bot,
  shield: ShieldCheck,
  terminal: Terminal,
};

const sectionVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const copyVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 200, damping: 26, mass: 1 },
  },
};

const featureRowVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const featureVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 240, damping: 28, mass: 0.8 },
  },
};

export default function Hero22({
  brandName = 'DLRS Personal OS',
  headingLine1 = 'Stop Managing Tasks.',
  headingLine2Prefix = 'Let Your',
  headingHighlight = 'OS Run Them.',
  description = 'An autonomous, open-source Personal OS that turns messy WhatsApp voice notes, PDF bank statements, and client briefs into structured execution — zero manual forms.',
  primaryCtaLabel = 'Star on GitHub',
  primaryCtaHref = 'https://github.com/GalvanMoto/Personal_OS',
  secondaryCtaLabel = 'Launch Cockpit',
  secondaryCtaHref = '/dashboard',
  features = featuresDefault,
}: Hero22Props) {
  return (
    <section className="relative isolate min-h-[90vh] overflow-hidden bg-gradient-to-b from-card/60 via-background to-background text-foreground py-16 sm:py-24 border-b border-border/80">
      {/* Background Glows */}
      <div className="home-glow" aria-hidden />
      <div className="home-grid absolute inset-0 pointer-events-none opacity-30" aria-hidden />

      <motion.div
        className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 flex flex-col justify-between"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="max-w-4xl pt-4 sm:pt-8">
          {/* Open Source Pill Badge */}
          <motion.div variants={copyVariants} className="mb-6 inline-flex items-center gap-2">
            <div className="home-badge">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-semibold text-foreground">DLRS 2.0</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-emerald-500 font-medium">100% Open Source</span>
              <Badge variant="secondary" className="ml-1 text-[10px] font-mono h-4.5 px-1.5 bg-muted">
                MIT
              </Badge>
            </div>
          </motion.div>

          <motion.h1
            variants={copyVariants}
            className="text-[clamp(2.8rem,5.5vw,5.2rem)] leading-[1.08] font-extrabold tracking-tight text-foreground"
          >
            <span className="block">{headingLine1}</span>
            <span className="block">
              {headingLine2Prefix}{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 bg-clip-text text-transparent italic font-serif">
                {headingHighlight}
              </span>
            </span>
          </motion.h1>

          <motion.p
            variants={copyVariants}
            className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground"
          >
            {description}
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            variants={copyVariants}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href={primaryCtaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] group"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>{primaryCtaLabel}</span>
              <ArrowRight className="size-4 -rotate-45 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <Link
              href={secondaryCtaHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium border border-border bg-card/80 hover:bg-muted/80 backdrop-blur-md transition-all shadow-xs active:scale-[0.98]"
            >
              <Play className="size-4 text-indigo-500" />
              <span>{secondaryCtaLabel}</span>
            </Link>

            <Link
              href="/docs/quick-start"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium hover:text-foreground text-muted-foreground transition-colors"
            >
              <BookOpen className="size-4" />
              <span>Documentation</span>
            </Link>
          </motion.div>
        </div>

        {/* Bottom Feature Badges */}
        <motion.div
          variants={featureRowVariants}
          className="mt-16 sm:mt-20 pt-8 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = iconMap[feature.icon];

            return (
              <motion.div
                key={feature.title}
                variants={featureVariants}
                className="flex items-center gap-3.5 p-3 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
                  <Icon className="size-5.5" aria-hidden="true" />
                </div>
                <div className="leading-tight">
                  <span className="block text-sm font-semibold text-foreground">
                    {feature.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground font-mono">
                    {feature.description}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
