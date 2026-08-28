'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Star, ShieldCheck, Heart } from "lucide-react";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface Footer1Props {
  brandName?: string;
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  linkGroups?: FooterLinkGroup[];
  copyright?: string;
}

const defaultLinkGroups: FooterLinkGroup[] = [
  {
    title: "Architecture",
    links: [
      { label: "Universal Control Plane", href: "#architecture" },
      { label: "Pluggable Model Core", href: "#features" },
      { label: "Integer Ledger Math", href: "#demo" },
      { label: "Zero-Knowledge Vault", href: "/docs/security" },
    ],
  },
  {
    title: "Self-Hosting",
    links: [
      { label: "Quickstart Guide", href: "#quickstart" },
      { label: "Docker Deployment", href: "/docs/quick-start" },
      { label: "System Architecture", href: "/docs/architecture" },
      { label: "API Reference", href: "/docs/api" },
    ],
  },
  {
    title: "Integrations",
    links: [
      { label: "Google Drive Sync", href: "#integrations" },
      { label: "Telegram Bot Bridge", href: "#integrations" },
      { label: "Gmail & FastMail", href: "#integrations" },
      { label: "Local Ollama / vLLM", href: "#integrations" },
    ],
  },
  {
    title: "Community & Code",
    links: [
      { label: "GitHub Repository", href: "https://github.com/GalvanMoto/Personal_OS" },
      { label: "Issue Tracker", href: "https://github.com/GalvanMoto/Personal_OS/issues" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer1({
  brandName = "DLRS Personal OS",
  newsletterTitle = "Subscribe to Open Source Release Updates",
  newsletterDescription = "Get notified when new agent tools, bank statement parsers, or local model adapters are published.",
  newsletterPlaceholder = "Enter your email",
  newsletterButtonText = "Subscribe",
  linkGroups = defaultLinkGroups,
  copyright = `© ${new Date().getFullYear()} DLRS Personal OS. Free and open-source software under the MIT License.`,
}: Partial<Footer1Props>) {
  return (
    <footer className="w-full px-4 py-12 sm:px-6 lg:px-8 border-t bg-muted/15">
      <div className="bg-card/90 mx-auto max-w-7xl rounded-3xl border border-border/80 p-8 shadow-sm sm:p-12">
        <div className="flex flex-col justify-between gap-12 xl:flex-row xl:gap-20">
          <div className="shrink-0 space-y-6 xl:w-[380px]">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-xl object-contain shadow-xs"
              />
              <span className="text-xl font-bold tracking-tight">{brandName}</span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              The autonomous, open-source Personal OS for operators, creators, and freelancers. Universal AI control plane with zero vendor lock-in.
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="text-foreground text-sm font-semibold">{newsletterTitle}</h3>
              <form
                className="relative flex max-w-sm items-center"
                onSubmit={(e) => e.preventDefault()}
              >
                <Input
                  type="email"
                  placeholder={newsletterPlaceholder}
                  className="bg-muted/80 w-full rounded-xl border-border/80 py-5 pr-28 pl-4 text-xs outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1.5 h-8 rounded-lg px-4 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                >
                  {newsletterButtonText}
                </Button>
              </form>
              <p className="text-muted-foreground max-w-sm text-[11px] leading-relaxed">
                {newsletterDescription}
              </p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4 xl:gap-8">
            {linkGroups.map((group, idx) => (
              <div key={idx} className="space-y-4">
                <h4 className="text-foreground text-xs font-semibold uppercase tracking-wider">
                  {group.title}
                </h4>
                <ul className="space-y-2.5">
                  {group.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-border/60 pt-6 gap-3 text-xs text-muted-foreground">
          <p className="text-center sm:text-left">
            {copyright}
          </p>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-emerald-500 font-semibold">100% Data Sovereignty</span>
            <span>•</span>
            <span>AES-256 Vault</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer1;
