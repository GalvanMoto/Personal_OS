"use client"

import * as React from "react"
import {
  Sun,
  Zap,
  Coffee,
  CheckCircle,
  Moon,
  MessageCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const timelineSteps = [
  {
    time: "08:30 AM",
    title: "Proactive Morning Briefing",
    icon: Sun,
    color: "from-amber-500 to-orange-500",
    badge: "Daily Standup",
    assistantSpeech: "Good morning Gautam! Here is what requires your attention today:\n• 2 Urgent: GB Banquet Reels (Due 6 PM) & Website Redesign\n• 1 Pending approval: Happy Rewards Contract\n• 3 Subscriptions verified: Adobe ($59.99), Claude Pro ($20)\n\nWhat are you starting with?",
    action: "You reply: 'GB Banquet Reels'"
  },
  {
    time: "10:30 AM",
    title: "1-Click Focus Workspace Launch",
    icon: Zap,
    color: "from-indigo-500 to-violet-500",
    badge: "Flow State",
    assistantSpeech: "Launched GB Banquet Cockpit. I have pulled the raw B-roll folder from Google Drive, loaded the brand SVG logo, and set up your 3 reel subtasks.\n\nTimer started. Context locked.",
    action: "All assets ready at your fingertips"
  },
  {
    time: "02:45 PM",
    title: "Context Guardian & Gentle Nudge",
    icon: Clock,
    color: "from-cyan-500 to-blue-500",
    badge: "Focus Guard",
    assistantSpeech: "You started the GB Banquet reel this morning and 2 of 3 cuts are completed. Are you finishing the food reel now or taking a break?",
    action: "Keeps you in momentum without annoying alarms"
  },
  {
    time: "07:00 PM",
    title: "End-of-Day Synthesis & Closure",
    icon: Moon,
    color: "from-violet-500 to-pink-500",
    badge: "Evening Recap",
    assistantSpeech: "Great day Gautam! You completed 4 deliverables today. 1 draft is queued for Sarah's review tomorrow morning. Zero tasks left unorganized.\n\nHave a great evening!",
    action: "Zero mental baggage carrying into the night"
  }
]

export function DailyTimeline() {
  const [activeStep, setActiveStep] = React.useState(0)

  return (
    <section id="assistant" className="py-20 md:py-32 bg-muted/10 border-t border-border/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            A Day with DLRS
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Feels like a real Chief of Staff, not software.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            From the moment you wake up to when you log off, DLRS anticipates what you need, maintains context, and ensures nothing slips through the cracks.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
          {/* Step Selector List */}
          <div className="space-y-3">
            {timelineSteps.map((step, idx) => {
              const Icon = step.icon
              const isActive = activeStep === idx
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                    isActive
                      ? "bg-card border-indigo-500/80 shadow-md shadow-indigo-500/10 scale-[1.02]"
                      : "bg-card/40 border-border/60 hover:bg-card/80 text-muted-foreground"
                  }`}
                >
                  <div className={`p-2 rounded-lg bg-linear-to-br ${step.color} text-white shrink-0 shadow-xs`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">{step.time}</span>
                      <Badge variant="outline" className="text-[10px] py-0 h-4">
                        {step.badge}
                      </Badge>
                    </div>
                    <h4 className={`text-sm font-bold mt-0.5 truncate ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </h4>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Assistant Simulation View */}
          <div>
            <Card className="border border-border/80 bg-card/95 shadow-xl rounded-2xl overflow-hidden backdrop-blur-md">
              <div className="px-5 py-3.5 bg-muted/40 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-foreground">
                    DLRS Autonomous Copilot
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {timelineSteps[activeStep].time}
                </span>
              </div>

              <CardContent className="p-6 space-y-5">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/70 text-xs sm:text-sm font-sans leading-relaxed text-foreground whitespace-pre-line">
                  {timelineSteps[activeStep].assistantSpeech}
                </div>

                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                  <span className="text-indigo-400 font-medium">Result:</span>
                  <span className="font-semibold text-foreground">{timelineSteps[activeStep].action}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
