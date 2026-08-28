'use client';

import React from 'react';
import type { SVGProps } from 'react';
import { Mail, ChevronRight } from 'lucide-react';
import './orbis.css';

const Twitter = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="size-5 fill-current" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Github = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="size-5 fill-current" {...props}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

interface NftCardItem {
  id: string;
  videoUrl: string;
  score: string;
}

const nftCards: NftCardItem[] = [
  {
    id: '1',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4',
    score: '8.7/10',
  },
  {
    id: '2',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4',
    score: '9/10',
  },
  {
    id: '3',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4',
    score: '8.2/10',
  },
];

export default function OrbisNftPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#010828] text-[#EFF4FF] selection:bg-[#6FFF00] selection:text-[#010828] overflow-x-hidden">
      {/* =========================================================================
          SECTION 1: HERO (Full viewport)
         ========================================================================= */}
      <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden rounded-b-[32px] bg-[#010828]">
        {/* Background Looping Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4"
        />

        {/* Hero Container */}
        <div className="relative z-10 max-w-[1831px] w-full mx-auto px-6 sm:px-10 lg:px-16 py-6 sm:py-8 flex flex-col justify-between flex-1">
          {/* Header */}
          <header className="flex items-center justify-between w-full">
            {/* Logo */}
            <div className="font-grotesk text-[16px] uppercase tracking-wider text-[#EFF4FF]">
              Orbis.Nft
            </div>

            {/* Center Navigation (Desktop only) */}
            <nav className="hidden lg:block liquid-glass rounded-[28px] px-[52px] py-[24px] shadow-lg">
              <ul className="flex items-center gap-10">
                {['Homepage', 'Gallery', 'Buy NFT', 'FAQ', 'Contact'].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                      className="font-grotesk text-[13px] uppercase text-[#EFF4FF] transition-colors duration-200 hover:text-[#6FFF00]"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Desktop Social Icons (Top-Right) */}
            <div className="hidden lg:flex flex-col gap-3">
              <a
                href="mailto:contact@orbis.nft"
                className="liquid-glass size-14 rounded-[1rem] flex items-center justify-center text-[#EFF4FF] hover:bg-white/10 transition-colors"
                aria-label="Email"
              >
                <Mail className="size-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass size-14 rounded-[1rem] flex items-center justify-center text-[#EFF4FF] hover:bg-white/10 transition-colors"
                aria-label="Twitter"
              >
                <Twitter />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass size-14 rounded-[1rem] flex items-center justify-center text-[#EFF4FF] hover:bg-white/10 transition-colors"
                aria-label="GitHub"
              >
                <Github />
              </a>
            </div>
          </header>

          {/* Hero Content */}
          <div className="my-auto py-12 lg:py-0">
            <div className="relative max-w-[780px] lg:ml-32">
              <h1 className="font-grotesk text-[40px] sm:text-[60px] md:text-[75px] lg:text-[90px] uppercase leading-[1.05] md:leading-[1] text-[#EFF4FF]">
                Beyond earth
                <br />
                and ( its ) familiar boundaries
              </h1>

              {/* Overlaid cursive accent text */}
              <span className="font-condiment text-[24px] sm:text-[34px] md:text-[42px] lg:text-[48px] normal-case text-[#6FFF00] mix-blend-exclusion opacity-90 absolute right-0 sm:-right-8 md:-right-12 top-1/2 -translate-y-1/2 -rotate-1 pointer-events-none select-none">
                Nft collection
              </span>
            </div>

            {/* Mobile Social Icons */}
            <div className="flex lg:hidden justify-center items-center gap-4 mt-12">
              <a
                href="mailto:contact@orbis.nft"
                className="liquid-glass size-14 rounded-[1rem] flex items-center justify-center text-[#EFF4FF] hover:bg-white/10 transition-colors"
                aria-label="Email"
              >
                <Mail className="size-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass size-14 rounded-[1rem] flex items-center justify-center text-[#EFF4FF] hover:bg-white/10 transition-colors"
                aria-label="Twitter"
              >
                <Twitter />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass size-14 rounded-[1rem] flex items-center justify-center text-[#EFF4FF] hover:bg-white/10 transition-colors"
                aria-label="GitHub"
              >
                <Github />
              </a>
            </div>
          </div>

          {/* Bottom spacer */}
          <div className="hidden lg:block h-6" />
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: ABOUT / INTRO (Full viewport)
         ========================================================================= */}
      <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#010828] py-16 sm:py-20 lg:py-24">
        {/* Background Looping Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4"
        />

        {/* Intro Container */}
        <div className="relative z-10 max-w-[1831px] w-full mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-between flex-1">
          {/* Top Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 pt-4 sm:pt-8">
            {/* Left Heading */}
            <div className="relative inline-block">
              <h2 className="font-grotesk text-[32px] sm:text-[44px] md:text-[52px] lg:text-[60px] uppercase leading-tight text-[#EFF4FF]">
                Hello!
                <br />
                I&apos;m orbis
              </h2>

              {/* Overlaid Cursive Name */}
              <span className="font-condiment text-[36px] sm:text-[48px] md:text-[58px] lg:text-[68px] normal-case text-[#6FFF00] mix-blend-exclusion absolute -bottom-4 right-0 sm:-right-6 -rotate-2 pointer-events-none select-none">
                Orbis
              </span>
            </div>

            {/* Right Short Paragraph */}
            <p className="font-mono text-[14px] sm:text-[16px] uppercase text-[#EFF4FF] max-w-[266px] leading-relaxed">
              A digital object fixed beyond time and place. An exploration of distance, form, and silence in space
            </p>
          </div>

          {/* Bottom Row */}
          <div className="flex justify-between items-end gap-12 mt-auto pt-16">
            {/* Left Column (2 identical paragraphs, opacity-10 on desktop, dark on mobile) */}
            <div className="space-y-4 max-w-[340px] font-mono text-[14px] uppercase text-[#010828] lg:text-[#EFF4FF] lg:opacity-10 leading-relaxed">
              <p>A digital object fixed beyond time and place. An exploration of distance, form, and silence in space</p>
              <p>A digital object fixed beyond time and place. An exploration of distance, form, and silence in space</p>
            </div>

            {/* Right Column (Hidden on mobile, opacity-10 on desktop) */}
            <div className="hidden lg:block space-y-4 max-w-[340px] font-mono text-[14px] uppercase text-[#EFF4FF] opacity-10 leading-relaxed text-right">
              <p>A digital object fixed beyond time and place. An exploration of distance, form, and silence in space</p>
              <p>A digital object fixed beyond time and place. An exploration of distance, form, and silence in space</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: NFT COLLECTION GRID (Solid #010828 background)
         ========================================================================= */}
      <section id="gallery" className="relative w-full bg-[#010828] py-20 sm:py-28 lg:py-36">
        <div className="max-w-[1831px] w-full mx-auto px-6 sm:px-10 lg:px-16">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 mb-12 sm:mb-16 lg:mb-20">
            {/* Left Heading */}
            <div className="font-grotesk text-[32px] sm:text-[44px] md:text-[52px] lg:text-[60px] uppercase leading-[1.1] text-[#EFF4FF]">
              <div>Collection of</div>
              <div className="ml-12 sm:ml-24 lg:ml-32 flex items-baseline gap-3">
                <span className="font-condiment text-[#6FFF00] normal-case text-[1.15em] leading-none">
                  Space
                </span>
                <span>objects</span>
              </div>
            </div>

            {/* Right "SEE ALL CREATORS" Button with neon underline bar */}
            <button className="group flex flex-col items-start cursor-pointer transition-transform active:scale-95">
              <div className="flex items-center gap-3 font-grotesk uppercase">
                <span className="text-[32px] sm:text-[44px] md:text-[52px] lg:text-[60px] leading-none text-[#EFF4FF]">
                  SEE
                </span>
                <div className="flex flex-col text-[20px] sm:text-[24px] md:text-[30px] lg:text-[36px] leading-[0.88] text-[#EFF4FF] text-left">
                  <span>ALL</span>
                  <span>CREATORS</span>
                </div>
              </div>
              <div className="w-full bg-[#6FFF00] h-[6px] sm:h-[8px] lg:h-[10px] mt-2 rounded-full transition-transform duration-300 group-hover:scale-x-105 origin-left" />
            </button>
          </div>

          {/* NFT 3-Column Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nftCards.map((card) => (
              <div
                key={card.id}
                className="liquid-glass rounded-[32px] p-[18px] hover:bg-white/10 transition-all duration-300 flex flex-col group"
              >
                {/* Square video container (pb-[100%] aspect ratio trick) */}
                <div className="relative w-full pb-[100%] rounded-[24px] overflow-hidden bg-[#010828]/50">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={card.videoUrl}
                  />
                </div>

                {/* Overlay Bottom Bar */}
                <div className="liquid-glass rounded-[20px] px-5 py-4 flex items-center justify-between mt-4">
                  <div className="flex flex-col font-grotesk">
                    <span className="text-[11px] uppercase tracking-wider text-[#EFF4FF]/70">
                      RARITY SCORE:
                    </span>
                    <span className="text-[16px] font-bold text-[#EFF4FF]">
                      {card.score}
                    </span>
                  </div>

                  <button
                    className="size-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#b724ff] to-[#7c3aed] text-white shadow-lg shadow-purple-500/50 hover:scale-110 transition-transform cursor-pointer"
                    aria-label="View NFT Details"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: CTA / FINAL SECTION (Full-width native aspect video)
         ========================================================================= */}
      <section className="relative w-full bg-[#010828] overflow-hidden">
        {/* Background Video displayed at native aspect ratio */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto block pointer-events-none"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4"
        />

        {/* Text Content overlay on video */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 lg:p-16 pointer-events-none">
          {/* Right-aligned Heading Block */}
          <div className="self-end lg:pr-[20%] lg:pl-[15%] text-right relative pointer-events-auto mt-4 sm:mt-8 md:mt-12 lg:mt-20">
            {/* Small "Go beyond" cursive text */}
            <span className="font-condiment text-[#6FFF00] text-[17px] sm:text-[32px] md:text-[48px] lg:text-[68px] normal-case mix-blend-exclusion absolute -top-3 sm:-top-7 md:-top-10 lg:-top-14 left-0 -translate-x-1/2 -rotate-2 select-none">
              Go beyond
            </span>

            {/* Heading */}
            <div className="font-grotesk uppercase text-[16px] sm:text-[30px] md:text-[45px] lg:text-[60px] leading-[1.05] text-[#EFF4FF]">
              <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12">JOIN US.</div>
              <div>REVEAL WHAT&apos;S HIDDEN.</div>
              <div>DEFINE WHAT&apos;S NEXT.</div>
              <div>FOLLOW THE SIGNAL.</div>
            </div>
          </div>

          {/* Social Icons (Bottom-left, absolute positioned) */}
          <div className="absolute left-[8%] bottom-[12%] sm:bottom-[15%] md:bottom-[18%] lg:bottom-[20%] pointer-events-auto">
            <div className="liquid-glass rounded-[0.5rem] sm:rounded-[0.75rem] md:rounded-[1rem] lg:rounded-[1.25rem] flex flex-col overflow-hidden shadow-2xl">
              <a
                href="mailto:contact@orbis.nft"
                className="w-[14vw] sm:w-[14.375rem] md:w-[10.78125rem] lg:w-[16.77rem] h-[7vw] sm:h-[4.5rem] md:h-[4rem] lg:h-[5.5rem] flex items-center justify-center text-[#EFF4FF] hover:bg-white/10 transition-colors border-b border-white/10"
                aria-label="Email"
              >
                <Mail className="size-4 sm:size-5 lg:size-6" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[14vw] sm:w-[14.375rem] md:w-[10.78125rem] lg:w-[16.77rem] h-[7vw] sm:h-[4.5rem] md:h-[4rem] lg:h-[5.5rem] flex items-center justify-center text-[#EFF4FF] hover:bg-white/10 transition-colors border-b border-white/10"
                aria-label="Twitter"
              >
                <Twitter />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[14vw] sm:w-[14.375rem] md:w-[10.78125rem] lg:w-[16.77rem] h-[7vw] sm:h-[4.5rem] md:h-[4rem] lg:h-[5.5rem] flex items-center justify-center text-[#EFF4FF] hover:bg-white/10 transition-colors"
                aria-label="GitHub"
              >
                <Github />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
