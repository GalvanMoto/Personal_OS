'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  HardDrive,
  Send,
  Mail,
  Bot,
  Database,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IntegrationCard {
  id: string;
  name: string;
  category: string;
  description: string;
  videoUrl: string;
  score: string;
  badge: string;
  icon: React.ElementType;
}

const integrationCards: IntegrationCard[] = [
  {
    id: '1',
    name: 'Google Drive & Cloud Files',
    category: 'Storage / Hierarchy',
    description: 'Auto-sorts incoming deliverables into deterministic client folders with 1-click links.',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4',
    score: 'LIVE SYNC',
    badge: 'STORAGE',
    icon: HardDrive,
  },
  {
    id: '2',
    name: 'Telegram & WhatsApp Ingest',
    category: 'Multimodal Stream',
    description: 'Forward voice notes, screenshots, and PDFs directly to your OS for automated multi-agent triage.',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4',
    score: 'INSTANT INGEST',
    badge: 'VOICE + OCR',
    icon: Send,
  },
  {
    id: '3',
    name: 'Bank Decryptor & Vault',
    category: 'Finance / AES-256',
    description: 'In-memory statement decryption with zero credential logging and paise-exact minor unit ledger.',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4',
    score: 'EXACT INTEGER',
    badge: 'AES-256 VAULT',
    icon: ShieldCheck,
  },
];

export default function Integrations3() {
  return (
    <section id="integrations" className="relative w-full bg-[#09090b] text-[#f4f4f5] py-20 sm:py-28 lg:py-36 border-b border-zinc-800">
      <div className="max-w-[1831px] w-full mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header Row */}
        <div className="flex flex-row items-end justify-between gap-3 sm:gap-6 mb-8 sm:mb-14">
          {/* Left Heading */}
          <div className="font-grotesk text-[24px] sm:text-[38px] md:text-[48px] lg:text-[56px] uppercase leading-[1.08] text-[#f4f4f5]">
            <div>Collection of</div>
            <div className="flex items-baseline gap-1.5 sm:gap-2.5 pl-2 sm:pl-6 lg:pl-10">
              <span className="font-condiment text-[#6FFF00] normal-case text-[1.12em] leading-none whitespace-nowrap">
                Connected
              </span>
              <span className="whitespace-nowrap">Modules</span>
            </div>
          </div>

          {/* Right "SEE ALL MODULES" Button with neon underline bar */}
          <Link
            href="/docs/integrations"
            className="group flex flex-col items-start shrink-0 transition-transform active:scale-95 pb-1"
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 font-grotesk uppercase">
              <span className="text-[20px] sm:text-[32px] md:text-[44px] lg:text-[52px] leading-none text-[#f4f4f5]">
                SEE
              </span>
              <div className="flex flex-col text-[12px] sm:text-[18px] md:text-[24px] lg:text-[30px] leading-[0.88] text-[#f4f4f5] text-left">
                <span>ALL</span>
                <span>MODULES</span>
              </div>
            </div>
            <div className="w-full bg-[#6FFF00] h-[3px] sm:h-[6px] lg:h-[8px] mt-1 sm:mt-1.5 rounded-full transition-transform duration-300 group-hover:scale-x-105 origin-left" />
          </Link>
        </div>

        {/* 3-Column Video Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrationCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.id}
                className="liquid-glass-card rounded-[32px] p-[18px] hover:border-[#6FFF00]/50 transition-all duration-300 flex flex-col group border border-zinc-800 shadow-2xl"
              >
                {/* Square Video Container (pb-[100%] aspect ratio trick) */}
                <div className="relative w-full pb-[100%] rounded-[24px] overflow-hidden bg-zinc-950">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
                    src={card.videoUrl}
                  />

                  {/* Top Floating Badge */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <div className="size-10 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-700 flex items-center justify-center text-[#6FFF00]">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-700 text-[#6FFF00]">
                      {card.badge}
                    </span>
                  </div>

                  {/* Bottom Text Overlay inside video */}
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10">
                    <h3 className="font-grotesk uppercase text-lg text-[#f4f4f5] tracking-wide">
                      {card.name}
                    </h3>
                    <p className="text-xs text-zinc-300 font-mono mt-1 line-clamp-2 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* Overlay Bottom Bar */}
                <div className="liquid-glass rounded-[20px] px-5 py-4 flex items-center justify-between mt-4 border border-zinc-800">
                  <div className="flex flex-col font-grotesk">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400">
                      INTEGRATION STATUS:
                    </span>
                    <span className="text-[15px] font-bold text-[#6FFF00]">
                      {card.score}
                    </span>
                  </div>

                  <Link
                    href="/docs/integrations"
                    className="size-12 rounded-full flex items-center justify-center bg-zinc-800 border border-zinc-700 text-[#6FFF00] shadow-lg hover:bg-zinc-700 hover:scale-110 transition-transform cursor-pointer"
                    aria-label="View Integration Details"
                  >
                    <ChevronRight className="size-5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Extensibility Footer */}
        <p className="text-center text-xs font-mono text-zinc-400 mt-12">
          Every integration is extensible via open TypeScript interfaces in <code className="text-[#6FFF00]">lib/domain/</code>
        </p>
      </div>
    </section>
  );
}
