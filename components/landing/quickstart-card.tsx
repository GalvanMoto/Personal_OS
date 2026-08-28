"use client"

import * as React from "react"
import { Check, Copy, Terminal, GitBranch, Play, Shield, Cpu, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const tabs = [
  {
    id: "quickstart",
    label: "Quickstart",
    fullLabel: "Local Quickstart",
    icon: Terminal,
    command: "git clone https://github.com/GalvanMoto/Personal_OS.git\ncd Personal_OS\ncp .env.example .env\nnpm install\nnpm run dev",
    description: "Full local development stack with PostgreSQL & Next.js 15",
  },
  {
    id: "docker",
    label: "Docker",
    fullLabel: "Docker Compose",
    icon: Terminal,
    command: "curl -sSL https://raw.githubusercontent.com/GalvanMoto/Personal_OS/main/docker-compose.yml -o docker-compose.yml\ndocker compose up -d",
    description: "1-click self-contained deployment with background workers",
  },
  {
    id: "cli",
    label: "CLI Run",
    fullLabel: "One-Line Run",
    icon: Terminal,
    command: "npx @personal-os/cli@latest init",
    description: "Interactive setup wizard for local vault and database connection",
  },
]

export function QuickstartCard() {
  const [activeTab, setActiveTab] = React.useState(tabs[0].id)
  const [copied, setCopied] = React.useState(false)

  const current = tabs.find((t) => t.id === activeTab) || tabs[0]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current.command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="terminal-window overflow-hidden border border-zinc-800 bg-zinc-950/90 backdrop-blur-2xl rounded-2xl shadow-2xl">
      {/* Top Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/60 text-xs">
        {/* Left Traffic Lights & Label */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="size-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="size-2.5 rounded-full bg-green-500/80 inline-block" />
          </div>
          <span className="text-zinc-400 font-mono text-[11px] ml-2">
            bash — self-host
          </span>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 transition-colors ml-auto sm:ml-0"
          aria-label="Copy snippet"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-[#6FFF00]" />
              <span className="text-[#6FFF00] font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 text-zinc-400" />
              <span className="text-zinc-300">Copy</span>
            </>
          )}
        </button>

        {/* Tab switcher buttons: responsive full-width on mobile, inline on desktop */}
        <div className="w-full sm:w-auto order-last sm:order-none flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id)
                setCopied(false)
              }}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-mono transition-all text-center ${
                activeTab === t.id
                  ? "bg-zinc-800 text-[#6FFF00] border border-zinc-700 shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="sm:hidden">{t.label}</span>
              <span className="hidden sm:inline">{t.fullLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Code body */}
      <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm text-zinc-200 overflow-x-auto bg-black/40">
        <div className="text-[11px] text-zinc-500 mb-3 select-none">
          # {current.description}
        </div>
        <pre className="space-y-1 leading-relaxed text-zinc-300">
          {current.command.split("\n").map((line, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-[#6FFF00] select-none">$</span>
              <span className="break-all">{line}</span>
            </div>
          ))}
        </pre>
      </div>

      {/* Footer bar */}
      <div className="px-4 py-2.5 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span>Prerequisites: Node 20+, Docker</span>
        <span className="text-[#6FFF00] flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#6FFF00] animate-pulse" />
          Ready in &lt; 2m
        </span>
      </div>
    </div>
  )
}
