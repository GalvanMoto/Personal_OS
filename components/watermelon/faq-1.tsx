'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Minus, HelpCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const defaultFaqs: FaqItem[] = [
  {
    id: '1',
    question: 'Is DLRS Personal OS truly 100% open source?',
    answer:
      'Yes. The entire codebase is licensed under the MIT license and hosted openly on GitHub. You have full freedom to inspect the source code, self-host on your own infrastructure, customize agent tools, or contribute upstream.',
  },
  {
    id: '2',
    question: 'Can I run DLRS completely offline with local LLMs (Ollama / vLLM)?',
    answer:
      'Yes! DLRS uses a pluggable model abstraction. You can point it to a local Ollama endpoint (e.g. Llama 3, Qwen 2.5, Mistral) for 100% offline and private task extraction, or plug in Azure OpenAI, Claude, or Gemini when you want cloud models.',
  },
  {
    id: '3',
    question: 'How does the Universal Control Plane work across different modules?',
    answer:
      'Unlike traditional chatbot add-ons, the Assistant in Personal OS is the universal operating layer. Saying "I pay Contabo €12 every month with this link" automatically classifies the merchant, creates the subscription entity, schedules a deterministic reminder, links the billing URL, and sets up upcoming expense ledger rows without touching manual forms.',
  },
  {
    id: '4',
    question: 'How does the AES-256 encrypted vault handle bank statement passwords?',
    answer:
      'Your secret patterns (PAN, DOB, phone suffix) are encrypted at rest using AES-256-GCM. When parsing bank statement PDFs, DLRS tries password combinations purely in-memory. Raw credentials are never printed in logs or sent over telemetry.',
  },
  {
    id: '5',
    question: 'How do I self-host DLRS with Docker Compose?',
    answer:
      'You can spin up the full stack (Next.js app + PostgreSQL database + background workers) using `docker compose up -d`. All environment variables and volume bindings are documented in the repository.',
  },
  {
    id: '6',
    question: 'How does DLRS compare to Notion, ClickUp, or Todoist?',
    answer:
      'Traditional tools require heavy manual data entry: creating tables, selecting properties, and tagging fields manually. DLRS is an autonomous OS: you drop raw unstructured inputs (voice, WhatsApp screenshots, PDF statements), and the agent pipeline takes care of organization and asset linking.',
  },
];

export default function Faq1() {
  return (
    <section
      id="faq"
      className="relative w-full bg-[#09090b] text-[#f4f4f5] py-20 sm:py-28 border-b border-zinc-800"
    >
      <div className="mx-auto max-w-4xl px-6 sm:px-8">
        {/* Header with Anton and Condiment */}
        <div className="mb-14 flex flex-col items-center text-center space-y-3">
          <Badge variant="outline" className="font-mono text-xs gap-1.5 px-3 py-1 border-[#6FFF00]/30 text-[#6FFF00] bg-[#6FFF00]/10">
            <HelpCircle className="size-3.5" /> FAQ &amp; Knowledge
          </Badge>

          <div className="relative mt-2">
            <h2 className="font-grotesk text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#f4f4f5]">
              Frequently Asked Questions
            </h2>
            <div className="mt-1">
              <span className="font-condiment text-[24px] sm:text-[34px] md:text-[40px] normal-case text-[#6FFF00] drop-shadow-[0_0_12px_rgba(111,255,0,0.6)] inline-block -rotate-2 select-none">
                Clear Answers
              </span>
            </div>
          </div>

          <p className="text-zinc-400 text-sm sm:text-base font-mono max-w-xl mt-4 leading-relaxed">
            Straightforward details on open source licensing, self-hosting, local LLMs, and zero-knowledge privacy.
          </p>
        </div>

        {/* Accordion List with Frosted Liquid Glass Cards */}
        <Accordion className="w-full space-y-3.5 border-none bg-transparent">
          {defaultFaqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="liquid-glass-card rounded-2xl border border-zinc-800 px-5 sm:px-6 py-2 transition-all hover:border-zinc-700 shadow-xl"
            >
              <AccordionTrigger className="w-full py-3.5 hover:no-underline group">
                <span className="font-grotesk uppercase text-left text-base sm:text-lg text-[#f4f4f5] group-hover:text-[#6FFF00] transition-colors">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 text-xs sm:text-sm font-mono text-zinc-300 leading-relaxed border-t border-zinc-800/80 mt-1">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Bottom Contact / Link */}
        <div className="mt-12 text-center text-xs font-mono text-zinc-400">
          Have more questions?{' '}
          <a
            href="https://github.com/GalvanMoto/Personal_OS/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6FFF00] hover:underline font-semibold"
          >
            Open a GitHub Discussion
          </a>{' '}
          or{' '}
          <Link href="/docs" className="text-zinc-200 hover:underline font-semibold">
            explore the docs
          </Link>
          .
        </div>
      </div>
    </section>
  );
}
