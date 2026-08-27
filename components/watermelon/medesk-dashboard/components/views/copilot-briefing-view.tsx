"use client"

import { useState } from "react";
import {
  SparklesIcon,
  BotIcon,
  SendIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ZapIcon,
  TargetIcon,
  RefreshCwIcon,
  PlayIcon,
  LayersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopilotBriefingView() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Good morning Gautam! Here is your AI Chief-of-Staff briefing for Monday, Aug 26, 2026.",
      isBriefing: true,
    },
  ]);
  const [query, setQuery] = useState("");

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text, isBriefing: false }]);
    setQuery("");

    setTimeout(() => {
      let reply = "I have cross-checked your schedule, Google Drive, and active client briefs. Let me know if you need to generate a context pack!";
      if (text.toLowerCase().includes("what should i do") || text.toLowerCase().includes("priority")) {
        reply = "🎯 Next Best Action: Work on 'GB Banquet — Event Highlights Reel (9:16)'. Why? 1) Deadline in 4 hours, 2) All 14 4K Drive assets are indexed, 3) 45 min turnaround estimated, 4) No blocking dependencies.";
      } else if (text.toLowerCase().includes("gb") || text.toLowerCase().includes("reel")) {
        reply = "🎬 GB Banquet has 3 reels in pipeline: 1) Event Highlights (In Progress), 2) Decor & Venue (Ready), 3) Food Showcase (Ready). Raw footage is verified in Drive folder.";
      } else if (text.toLowerCase().includes("sub") || text.toLowerCase().includes("bill") || text.toLowerCase().includes("spend")) {
        reply = "💳 Financial Status: ₹18,420 spent this month (88% of budget). Adobe Creative Cloud ($54.99) renews in 3 days.";
      }
      setMessages((prev) => [...prev, { sender: "bot", text: reply, isBriefing: false }]);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-7 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            <BotIcon className="size-4" />
            <span>Autonomous Executive Copilot</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            AI Assistant &amp; Daily Briefing
          </h1>
          <p className="text-xs text-muted-foreground">
            Proactive daily intelligence, automated priority calculation, and natural language personal memory.
          </p>
        </div>

        <Button
          onClick={() => handleSend("What should I do now?")}
          className="h-9.5 gap-2 rounded-xl text-xs font-bold bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25"
        >
          <ZapIcon className="size-4 text-amber-300" />
          <span>Calculate Next Best Action</span>
        </Button>
      </div>

      {/* Daily Briefing Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Due Today */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-500 font-mono uppercase tracking-wider">🔴 Due Today</span>
            <span className="text-xs font-mono font-bold text-red-500">3 Deliverables</span>
          </div>
          <div className="flex flex-col gap-1 mt-3 text-xs">
            <p className="font-semibold text-foreground truncate">• GB Banquet Event Reel</p>
            <p className="font-semibold text-foreground truncate">• Tanniaqua SEO Deck</p>
            <p className="font-semibold text-foreground truncate">• Happy Rewards Motion</p>
          </div>
        </div>

        {/* Due Soon */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 font-mono uppercase tracking-wider">🟠 Due Soon</span>
            <span className="text-xs font-mono font-bold text-amber-500">2 Deliverables</span>
          </div>
          <div className="flex flex-col gap-1 mt-3 text-xs">
            <p className="font-semibold text-foreground truncate">• LinkedIn Carousel (Thu)</p>
            <p className="font-semibold text-foreground truncate">• Summer Store Banner (Fri)</p>
          </div>
        </div>

        {/* Waiting on Client */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-500 font-mono uppercase tracking-wider">🟡 Waiting on Client</span>
            <span className="text-xs font-mono font-bold text-blue-500">2 Blocked</span>
          </div>
          <div className="flex flex-col gap-1 mt-3 text-xs">
            <p className="font-semibold text-foreground truncate">• Sarah M. (SEO Deck Approval)</p>
            <p className="font-semibold text-foreground truncate">• GB Banquet (Catering Photos)</p>
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-500 font-mono uppercase tracking-wider">🟢 Completed</span>
            <span className="text-xs font-mono font-bold text-emerald-500">4 Closed</span>
          </div>
          <div className="flex flex-col gap-1 mt-3 text-xs">
            <p className="font-semibold text-foreground truncate">• Morning Briefing Triaged</p>
            <p className="font-semibold text-foreground truncate">• Food &amp; Catering Reel</p>
            <p className="font-semibold text-foreground truncate">• Statement Decrypt &amp; Audit</p>
          </div>
        </div>
      </div>

      {/* Conversational Assistant Area */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs flex flex-col h-110">
        <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-foreground">DLRS Executive Chief-of-Staff</span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">Model: Multi-Agent Orchestrator v2.0</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5 no-scrollbar">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-col gap-1 max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed",
                m.sender === "user"
                  ? "ml-auto bg-primary text-primary-foreground rounded-br-xs"
                  : "mr-auto bg-muted/50 text-foreground border border-border/50 rounded-bl-xs",
              )}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border/40 bg-muted/10 flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSend("What should I do now?")}
              className="px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              🎯 What should I do now?
            </button>
            <button
              type="button"
              onClick={() => handleSend("Show GB Banquet assets")}
              className="px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              📁 GB Banquet Drive Assets
            </button>
            <button
              type="button"
              onClick={() => handleSend("What am I waiting for?")}
              className="px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              🟡 What am I waiting for?
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your tasks, files, clients, or subscriptions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 h-10 rounded-xl bg-muted/40 px-4 text-xs text-foreground placeholder:text-muted-foreground border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary font-sans"
            />
            <Button type="submit" className="h-10 px-5 rounded-xl gap-1.5 text-xs font-bold shrink-0">
              <SendIcon className="size-3.5" />
              <span>Ask</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
