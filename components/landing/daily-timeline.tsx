"use client"

import * as React from "react"
import { Sun, Zap, Clock, Moon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const timelineSteps = [
  {
    time: "08:30 AM",
    title: "Proactive Morning Briefing",
    icon: Sun,
    badge: "Daily Standup",
    description: "Your day, summarized before you ask.",
    assistantSpeech:
      "Good morning! Here’s what needs your attention today:\n• 2 Urgent: GB Banquet Reels (Due 6 PM) & Website Redesign\n• 1 Pending approval: Happy Rewards Contract\n• 3 Subscriptions verified: Adobe ($59.99), Claude Pro ($20)\n\nWhat are you starting with?",
    action: "You reply: “GB Banquet Reels”",
  },
  {
    time: "10:30 AM",
    title: "1-Click Focus Workspace",
    icon: Zap,
    badge: "Flow State",
    description: "All context in one cockpit.",
    assistantSpeech:
      "Launched GB Banquet Cockpit. I pulled the raw B-roll folder from Google Drive, loaded the brand SVG logo, and set up your 3 reel subtasks.\n\nTimer started. Context locked.",
    action: "All assets ready at your fingertips",
  },
  {
    time: "02:45 PM",
    title: "Context Guardian",
    icon: Clock,
    badge: "Focus Guard",
    description: "Gentle nudge, not nag.",
    assistantSpeech:
      "You started the GB Banquet reel this morning and 2 of 3 cuts are completed. Are you finishing the food reel now or taking a break?",
    action: "Keeps momentum without alarms",
  },
  {
    time: "07:00 PM",
    title: "End-of-Day Synthesis",
    icon: Moon,
    badge: "Evening Recap",
    description: "Zero baggage into the night.",
    assistantSpeech:
      "Great day! You completed 4 deliverables today. 1 draft is queued for review tomorrow. Zero tasks left unorganized.\n\nHave a great evening!",
    action: "Synthesis → clean slate",
  },
]

export function DailyTimeline() {
  const [activeStep, setActiveStep] = React.useState(0)

  return (
    <section id="assistant" className="py-16 sm:py-24 border-b border-zinc-800 bg-[#09090b] text-[#f4f4f5]">
      <div className="mx-auto max-w-[1831px] px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="outline" className="font-mono text-xs gap-1.5 px-3 py-1 border-[#6FFF00]/30 text-[#6FFF00] bg-[#6FFF00]/10">
            <Clock className="size-3.5" /> A Day with DLRS
          </Badge>
          <h2 className="font-grotesk text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#f4f4f5]">
            Proactive Copilot from Morning to Night
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base font-mono leading-relaxed">
            Click through the timeline to see how DLRS anticipates your work instead of waiting for commands.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {timelineSteps.map((s, i) => {
              const Icon = s.icon
              const isActive = activeStep === i
              return (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-800 text-white border-zinc-600 shadow-xl shadow-black/50"
                      : "liquid-glass-card border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="size-4 text-[#6FFF00]" />
                    <span className="text-[10px] font-mono opacity-80">{s.time}</span>
                  </div>
                  <div className="font-grotesk uppercase text-xs truncate">{s.title}</div>
                </button>
              )
            })}
          </div>

          {/* Active Step Showcase Card */}
          <div className="liquid-glass-card rounded-[32px] p-6 sm:p-8 border border-zinc-800 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#6FFF00]/15 text-[#6FFF00] border border-[#6FFF00]/30 font-semibold">
                  {timelineSteps[activeStep].time}
                </span>
                <h3 className="font-grotesk uppercase text-lg sm:text-xl text-[#f4f4f5]">
                  {timelineSteps[activeStep].title}
                </h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs border-zinc-800 text-zinc-300">
                {timelineSteps[activeStep].badge}
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-sm font-mono text-[#6FFF00] font-semibold">
                {timelineSteps[activeStep].description}
              </p>

              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 font-mono text-xs sm:text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
                {timelineSteps[activeStep].assistantSpeech}
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs text-zinc-300 flex items-center gap-2">
                <span className="text-[#6FFF00] font-bold">Proactive Outcome:</span>
                <span>{timelineSteps[activeStep].action}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
