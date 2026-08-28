'use client';

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Sparkles } from "lucide-react";

export interface CTAProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  buttonText: string;
  buttonLink?: string;
  buttonIcon?: React.ReactNode;
  onButtonClick?: () => void;
}

export function Cta1({
  title = "Deploy Your Autonomous Personal OS Today",
  description = "Free forever under the MIT license. Connect your local database and run your own private AI control plane.",
  buttonText = "Star on GitHub",
  buttonLink = "https://github.com/GalvanMoto/Personal_OS",
  buttonIcon,
  onButtonClick,
}: Partial<CTAProps>) {
  return (
    <section className="w-full max-w-6xl mx-auto py-16 sm:py-24 px-4 sm:px-6">
      <div className="text-card-foreground bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-cyan-500/10 border border-border/80 relative isolate flex flex-col items-center justify-between gap-8 overflow-hidden rounded-3xl p-8 sm:p-12 shadow-xl md:flex-row md:gap-12 md:py-16">
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-[max(-7rem,calc(50%-52rem))] -z-10 -translate-y-1/2 transform-gpu blur-3xl"
        >
          <div
            style={{
              clipPath:
                "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
            }}
            className="from-indigo-500 to-violet-600 aspect-[577/310] w-[36rem] bg-gradient-to-r opacity-30"
          />
        </div>

        <div className="flex max-w-xl flex-col items-center gap-4 text-center md:items-start md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium">
            <Sparkles className="size-3.5 text-indigo-500" />
            <span>100% Open Source • Zero Lock-In</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="mt-2 flex flex-col sm:flex-row w-full shrink-0 justify-center gap-3 md:mt-0 md:w-auto">
          {buttonLink ? (
            <a
              href={buttonLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="h-12 w-full px-8 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 gap-2 group"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>{buttonText}</span>
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </a>
          ) : (
            <Button
              size="lg"
              onClick={onButtonClick}
              className="h-12 w-full px-8 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 md:w-auto"
            >
              {buttonText}
            </Button>
          )}

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="h-12 w-full px-6 bg-background/80 backdrop-blur-md">
              Launch Cockpit
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
export default Cta1;
