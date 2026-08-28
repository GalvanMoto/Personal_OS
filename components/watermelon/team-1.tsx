'use client';

import React from 'react';
import type { SVGProps } from 'react';
import { Globe, Mail, Heart, Sparkles, Star, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const GithubIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="size-4 fill-current" {...props}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const TwitterIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="size-4 fill-current" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Team1() {
  return (
    <section id="creator" className="relative w-full bg-[#09090b] text-[#f4f4f5] py-20 sm:py-28 border-b border-zinc-800">
      <div className="mx-auto max-w-[1831px] px-6 sm:px-10 lg:px-16">
        {/* Header with Anton and Condiment */}
        <div className="mb-14 flex flex-col items-center text-center space-y-3">
          <Badge variant="outline" className="font-mono text-xs gap-1.5 px-3 py-1 border-[#6FFF00]/30 text-[#6FFF00] bg-[#6FFF00]/10">
            <Heart className="size-3.5 fill-[#6FFF00]/20" /> Creator &amp; Architect
          </Badge>

          <div className="mt-2">
            <h2 className="font-grotesk text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#f4f4f5]">
              Built by Gautam Parmar
            </h2>
          </div>

          <p className="text-zinc-400 text-sm sm:text-base font-mono max-w-xl mt-4 leading-relaxed">
            Building the next generation of autonomous personal operating systems, deterministic context engines, and local-first software.
          </p>
        </div>

        {/* Single Featured Creator Card */}
        <div className="max-w-3xl mx-auto">
          <div className="liquid-glass-card rounded-[36px] p-6 sm:p-10 border border-zinc-800 shadow-2xl relative overflow-hidden group">
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 sm:gap-10">
              {/* Profile Image with subtle glowing ring */}
              <div className="relative shrink-0 mx-auto md:mx-0">
                <div className="size-36 sm:size-48 md:size-52 rounded-3xl overflow-hidden border-2 border-zinc-700 bg-zinc-800 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/gautam-parmar.jpg"
                    alt="Gautam Parmar"
                    className="w-full h-full object-cover contrast-105 group-hover:scale-105 transition-all duration-300"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 size-7 sm:size-8 rounded-full bg-[#6FFF00] flex items-center justify-center text-zinc-950 shadow-lg border-2 border-zinc-900">
                  <Sparkles className="size-3.5 sm:size-4 fill-current" />
                </div>
              </div>

              {/* Information */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-grotesk text-2xl sm:text-3xl uppercase tracking-wide text-[#f4f4f5]">
                    Gautam Parmar
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-[#6FFF00] font-semibold mt-0.5">
                    Creator &amp; Lead Architect — DLRS Personal OS
                  </p>
                </div>

                <p className="text-xs sm:text-sm font-mono text-zinc-300 leading-relaxed max-w-lg mx-auto md:mx-0">
                  Crafting DLRS Personal OS as a 100% open-source, self-hostable operating layer that unifies tasks, financial ledgers, Google Drive, and multi-agent AI execution into one proactive chief-of-staff.
                </p>

                {/* Social & Contact Links */}
                <div className="flex items-center justify-center md:justify-start gap-3 pt-3">
                  <a
                    href="https://github.com/GalvanMoto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-[#6FFF00] hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    aria-label="GitHub Profile"
                  >
                    <GithubIcon />
                  </a>
                  <a
                    href="https://twitter.com/techwithgalvan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-[#6FFF00] hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    aria-label="Twitter Profile"
                  >
                    <TwitterIcon />
                  </a>
                  <a
                    href="https://techwithgalvan.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-[#6FFF00] hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    aria-label="Personal Website"
                  >
                    <Globe className="size-4" />
                  </a>
                  <a
                    href="mailto:contact@techwithgalvan.in"
                    className="size-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-[#6FFF00] hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    aria-label="Email Gautam"
                  >
                    <Mail className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
