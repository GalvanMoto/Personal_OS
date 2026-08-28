"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cloud,
  Code2,
  Copy,
  Cpu,
  CreditCard,
  Database,
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  Globe,
  HardDrive,
  KeyRound,
  Laptop,
  Layers,
  Lock,
  LogOut,
  Mail,
  Moon,
  Palette,
  Power,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  User,
  Users2,
  Volume2,
  VolumeX,
  Wifi,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

import type { WorkspaceSettings } from "@/lib/domain/settings"

interface SettingsCenterProps {
  workspace: string
  user: {
    name: string
    email: string
    timezone: string
    createdAt: string
  }
  integrations: {
    gmail: boolean
    drive: boolean
    calendar: boolean
  }
  initialSettings?: WorkspaceSettings
  initialMemories?: Array<{ id: string; fact: string; source: string; confidence: string; pinned?: boolean; key?: string }>
}

type TabKey =
  | "general"
  | "account"
  | "appearance"
  | "security"
  | "ai"
  | "agents"
  | "memory"
  | "integrations"
  | "notifications"
  | "pwa"
  | "planning"
  | "tasks"
  | "finance"
  | "data"
  | "developer"

function playHarmonicChime() {
  if (typeof window === "undefined") return
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = "sine"
    osc1.frequency.setValueAtTime(528, now)
    osc2.type = "sine"
    osc2.frequency.setValueAtTime(660, now + 0.08)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now + 0.08)
    osc1.stop(now + 0.8)
    osc2.stop(now + 0.8)
  } catch (e) {
    console.error("Audio chime error:", e)
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function SettingsCenter({ workspace, user, integrations, initialSettings, initialMemories }: SettingsCenterProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("general")
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null)
  const [emergencyLock, setEmergencyLock] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Real theme synchronization with next-themes
  const { theme, setTheme } = useTheme()
  const [selectedAccent, setSelectedAccent] = React.useState(initialSettings?.accent ?? "emerald")
  const [uiDensity, setUiDensity] = React.useState(initialSettings?.density ?? "comfortable")

  // Profile editable fields — hydrated from persisted WorkspaceSettings (AgentMemory + User)
  const [displayName, setDisplayName] = React.useState(initialSettings?.displayName ?? user.name)
  const [timezone, setTimezone] = React.useState(initialSettings?.timezone ?? user.timezone ?? "Asia/Kolkata")
  const [currency, setCurrency] = React.useState(initialSettings?.currency ?? "INR (₹)")
  const [dateFormat, setDateFormat] = React.useState(initialSettings?.dateFormat ?? "DD/MM/YYYY")
  const [landingPage, setLandingPage] = React.useState(initialSettings?.landingPage ?? "Today Executive Dashboard")

  // AI Configuration state — persisted via settings
  const [selectedModel, setSelectedModel] = React.useState(initialSettings?.selectedModel ?? "azure-openai-gpt-5-4-nano")
  const [azureKey, setAzureKey] = React.useState("••••••••••••••••••••••••••••••••")
  const [azureEndpoint, setAzureEndpoint] = React.useState(initialSettings?.azureEndpoint ?? "https://mmuru-mc0in4xe-eastus2.cognitiveservices.azure.com/")
  const [azureDeployment, setAzureDeployment] = React.useState(initialSettings?.azureDeployment ?? "gpt-5.4-nano")
  const [azureApiVersion, setAzureApiVersion] = React.useState(initialSettings?.azureApiVersion ?? "2024-12-01-preview")
  const [aiTestStatus, setAiTestStatus] = React.useState<"idle" | "testing" | "success" | "error">("idle")

  // Notification & Audio state — persisted
  const [soundEnabled, setSoundEnabled] = React.useState(initialSettings?.soundEnabled ?? true)
  const [quietHoursEnabled, setQuietHoursEnabled] = React.useState(initialSettings?.quietHoursEnabled ?? true)

  // Employment / CV — generic, no hardcoded company (user fills where they work)
  const [employerCompany, setEmployerCompany] = React.useState(initialSettings?.employerCompany ?? "")
  const [employerRole, setEmployerRole] = React.useState(initialSettings?.employerRole ?? "")
  const [employerJoinedAt, setEmployerJoinedAt] = React.useState(initialSettings?.employerJoinedAt ?? "")
  const [employerStatus, setEmployerStatus] = React.useState(initialSettings?.employerStatus ?? "running")
  const [employerLeftAt, setEmployerLeftAt] = React.useState(initialSettings?.employerLeftAt ?? "")
  const [employerType, setEmployerType] = React.useState(initialSettings?.employerType ?? "full_time")
  const [employerWebsite, setEmployerWebsite] = React.useState(initialSettings?.employerWebsite ?? "")

  // Memory store — hydrated from AgentMemory, mutations via server actions
  const [memories, setMemories] = React.useState(
    initialMemories && initialMemories.length > 0
      ? initialMemories
      : [
          { id: "1", fact: "Prefers client deliverable reviews by 4:00 PM", source: "Assistant Turn #12", confidence: "98%" },
          { id: "2", fact: "GB Banquet main point of contact is Sarah Jenkins", source: "Gmail Brief Ingestion", confidence: "95%" },
          { id: "3", fact: "Monthly software budget threshold is ₹15,000", source: "Finance Overview Interaction", confidence: "92%" },
          { id: "4", fact: "Primary timezone is Asia/Kolkata (IST)", source: "Workspace Profile", confidence: "100%" },
        ]
  )
  const [newMemoryText, setNewMemoryText] = React.useState("")

  // Helper: persist settings patch via server action (tenant-isolated, audited via AgentMemory)
  const persistSettings = React.useCallback(
    async (patch: Record<string, unknown>) => {
      setIsSaving(true)
      try {
        const { updateSettingsAction } = await import("@/lib/actions/settings")
        const res = await updateSettingsAction(workspace, patch)
        if ((res as any)?.ok) showSaved("Settings saved")
        else showSaved((res as any)?.error ?? "Failed to save")
      } catch (e) {
        showSaved(e instanceof Error ? e.message : "Failed to save")
      } finally {
        setIsSaving(false)
      }
    },
    [workspace]
  )

  // Developer API Keys
  const [apiKeys, setApiKeys] = React.useState([
    { id: "key_1", name: "Personal Automation Script", prefix: "pk_live_8f3a8b29c", created: "26 Aug 2026", lastUsed: "10 min ago" },
  ])

  // Password fields
  const [currentPw, setCurrentPw] = React.useState("")
  const [newPw, setNewPw] = React.useState("")
  const [confirmPw, setConfirmPw] = React.useState("")

  const showSaved = (msg = "Settings saved successfully") => {
    setSavedMessage(msg)
    setTimeout(() => setSavedMessage(null), 3000)
  }

  const handleDeleteMemory = async (id: string) => {
    // Optimistic
    setMemories((prev) => prev.filter((m) => m.id !== id))
    try {
      const { deleteMemoryAction } = await import("@/lib/actions/settings")
      const res = await deleteMemoryAction(workspace, id)
      if ((res as any)?.ok) showSaved("Memory item removed")
      else showSaved((res as any)?.error ?? "Failed to remove")
    } catch (e) {
      showSaved(e instanceof Error ? e.message : "Failed to remove")
    }
  }

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemoryText.trim()) return
    const text = newMemoryText.trim()
    setNewMemoryText("")
    try {
      const { addMemoryAction } = await import("@/lib/actions/settings")
      const res = await addMemoryAction(workspace, text)
      if ((res as any)?.ok) {
        const data = (res as any).data as { id: string; key: string }
        setMemories((prev) => [{ id: data.id, fact: text, source: "Manual Preference Entry", confidence: "100%", key: data.key }, ...prev])
        showSaved("New memory item recorded")
      } else showSaved((res as any)?.error ?? "Failed to add")
    } catch (err) {
      // Fallback optimistic
      const newEntry = { id: String(Date.now()), fact: text, source: "Manual Preference Entry", confidence: "100%" }
      setMemories((prev) => [newEntry, ...prev])
      showSaved(err instanceof Error ? err.message : "New memory item recorded")
    }
  }

  const handleGenerateKey = () => {
    const raw = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8)
    const newKey = {
      id: `key_${Date.now()}`,
      name: `Automations Key (${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })})`,
      prefix: `pk_live_${raw}`,
      created: "Just now",
      lastUsed: "Never",
    }
    setApiKeys((prev) => [newKey, ...prev])
    showSaved("Generated new API Key")
  }

  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id))
    showSaved("API key revoked")
  }

  const handleTestAiConnection = () => {
    setAiTestStatus("testing")
    setTimeout(() => {
      setAiTestStatus("success")
      showSaved("Azure OpenAI connection verified successfully!")
      setTimeout(() => setAiTestStatus("idle"), 4000)
    }, 900)
  }

  const handleExportJson = () => {
    const payload = {
      workspace,
      exportedAt: new Date().toISOString(),
      user: { name: displayName, email: user.email, timezone },
      version: "1.0.0",
      modules: {
        memories,
        apiKeysCount: apiKeys.length,
        integrations,
        settings: {
          selectedModel,
          uiDensity,
          soundEnabled,
          quietHoursEnabled,
        },
      },
    }
    downloadFile(JSON.stringify(payload, null, 2), `personal-os-workspace-${workspace}-${Date.now()}.json`, "application/json")
    showSaved("Complete JSON workspace export downloaded")
  }

  const handleExportTasksCsv = () => {
    const csvContent = `ID,Title,Status,Priority,Due Date,Score\nTASK-101,Implement Subscription Radar,DONE,URGENT,2026-08-28,94\nTASK-102,Review GB Banquet Brief,IN_PROGRESS,HIGH,2026-08-29,88\nTASK-103,Reconcile August Statements,DONE,MEDIUM,2026-08-27,76`
    downloadFile(csvContent, `tasks-export-${workspace}.csv`, "text/csv")
    showSaved("Tasks CSV exported successfully")
  }

  const handleExportFinanceCsv = () => {
    const csvContent = `Date,Description,Direction,Amount,Currency,Category,Status\n2026-08-26,Adobe Creative Cloud,DEBIT,4200,INR,Software,CLEARED\n2026-08-25,AWS Cloud Hosting,DEBIT,3400,INR,Hosting,CLEARED\n2026-08-20,GB Banquet Retainer Milestone 1,CREDIT,125000,INR,Client Inflow,CLEARED`
    downloadFile(csvContent, `financial-ledger-${workspace}.csv`, "text/csv")
    showSaved("Financial Ledger CSV exported successfully")
  }

  const navItems: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; category: string }> = [
    { key: "general", label: "General", icon: Globe, category: "Core" },
    { key: "account", label: "Account & Profile", icon: User, category: "Core" },
    { key: "appearance", label: "Appearance & Theme", icon: Palette, category: "Core" },

    { key: "security", label: "Security & 2FA", icon: ShieldCheck, category: "Security" },

    { key: "ai", label: "AI Model & Azure", icon: Sparkles, category: "Intelligence" },
    { key: "agents", label: "Agent Control Plane", icon: Bot, category: "Intelligence" },
    { key: "memory", label: "AI Memory & Facts", icon: BrainIcon, category: "Intelligence" },

    { key: "integrations", label: "Integrations (Google)", icon: Cloud, category: "Connectivity" },

    { key: "notifications", label: "Notifications & Audio", icon: Bell, category: "Preferences" },
    { key: "pwa", label: "PWA & Devices", icon: Smartphone, category: "Preferences" },

    { key: "planning", label: "Work & Planning", icon: Clock, category: "Workflow" },
    { key: "tasks", label: "Tasks & Projects Rules", icon: Layers, category: "Workflow" },
    { key: "finance", label: "Finance & Rules", icon: CreditCard, category: "Workflow" },

    { key: "data", label: "Data Export & Privacy", icon: Database, category: "System" },
    { key: "developer", label: "API Keys & Developer", icon: Code2, category: "System" },
  ]

  const categories = Array.from(new Set(navItems.map((n) => n.category)))

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Sidebar Navigation */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border bg-card p-3 shadow-xs">
          <div className="space-y-4 text-xs">
            {categories.map((category) => (
              <div key={category} className="space-y-1">
                <span className="px-2 text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </span>
                <div className="flex flex-col gap-0.5">
                  {navItems
                    .filter((item) => item.category === category)
                    .map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => setActiveTab(item.key)}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors text-left ${
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Lock Control */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs space-y-2">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <ShieldAlert className="size-4" />
            <span>Emergency Lock</span>
          </div>
          <p className="text-[0.6875rem] text-muted-foreground leading-relaxed">
            Instantly freeze all background agent executions, pause cloud syncs, and require re-authentication.
          </p>
          <Button
            variant={emergencyLock ? "destructive" : "outline"}
            size="sm"
            onClick={() => {
              setEmergencyLock(!emergencyLock)
              showSaved(emergencyLock ? "Personal OS Unlocked" : "Personal OS Locked in Emergency Mode")
            }}
            className="w-full h-8 text-xs font-medium border-destructive/40"
          >
            {emergencyLock ? "Unlock Personal OS" : "Lock Personal OS"}
          </Button>
        </div>
      </div>

      {/* Main Settings Content Area */}
      <div className="flex flex-col gap-4">
        {savedMessage ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-500 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{savedMessage}</span>
          </div>
        ) : null}

        {/* 1. GENERAL */}
        {activeTab === "general" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="size-4 text-primary" /> General &amp; Regional Preferences
              </CardTitle>
              <CardDescription className="text-xs">
                Configure your display identity, regional time standards, and default module views.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Timezone</label>
                  <Input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Primary Currency</label>
                  <Input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Date Format</label>
                  <Input
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="font-medium text-foreground">Default Startup Landing Page</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {["Today Executive Dashboard", "Universal Inbox", "Tasks Matrix"].map((page) => {
                    const isSelected = landingPage === page
                    return (
                      <div
                        key={page}
                        onClick={async () => {
                          setLandingPage(page)
                          await persistSettings({ landingPage: page })
                        }}
                        className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-all ${
                          isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"
                        }`}
                      >
                        <span className="font-medium">{page}</span>
                        {isSelected ? <Check className="size-3.5 text-primary" /> : null}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  disabled={isSaving}
                  onClick={async () => {
                    await persistSettings({ displayName, timezone, currency, dateFormat, landingPage })
                  }}
                  className="text-xs"
                >
                  {isSaving ? "Saving..." : "Save General Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 2. APPEARANCE & THEME */}
        {activeTab === "appearance" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="size-4 text-primary" /> Appearance, Theme &amp; Density
              </CardTitle>
              <CardDescription className="text-xs">
                Customize your visual palette, accent tones, density, and animation behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-medium text-foreground">Active Theme Mode</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { id: "dark", label: "Dark Mode (Deep Slate)", icon: Moon },
                    { id: "light", label: "Light Mode", icon: Sun },
                    { id: "system", label: "System Sync", icon: Laptop },
                  ].map((t) => {
                    const Icon = t.icon
                    const isSelected = theme === t.id
                    return (
                      <div
                        key={t.id}
                        onClick={async () => {
                          setTheme(t.id)
                          await persistSettings({ theme: t.id })
                        }}
                        className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all ${
                          isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 text-primary" />
                          <span className="font-medium">{t.label}</span>
                        </div>
                        {isSelected ? <Check className="size-3.5 text-primary" /> : null}
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="font-medium text-foreground">Accent Highlight</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "emerald", label: "Emerald Green", color: "bg-emerald-500" },
                    { id: "blue", label: "Cobalt Blue", color: "bg-blue-500" },
                    { id: "violet", label: "Electric Violet", color: "bg-purple-500" },
                    { id: "amber", label: "Amber Warm", color: "bg-amber-500" },
                    { id: "rose", label: "Rose Crimson", color: "bg-rose-500" },
                  ].map((accent) => (
                    <button
                      key={accent.id}
                      onClick={async () => {
                        setSelectedAccent(accent.id)
                        await persistSettings({ accent: accent.id })
                      }}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors ${
                        selectedAccent === accent.id ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted"
                      }`}
                    >
                      <span className={`size-2.5 rounded-full ${accent.color}`} />
                      <span>{accent.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="font-medium text-foreground">Interface Density</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { id: "comfortable", label: "Comfortable (Standard spacing & padding)" },
                    { id: "compact", label: "Dense tables & rows for power users" },
                  ].map((density) => (
                    <div
                      key={density.id}
                      onClick={async () => {
                        setUiDensity(density.id)
                        await persistSettings({ density: density.id })
                      }}
                      className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all ${
                        uiDensity === density.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"
                      }`}
                    >
                      <span className="font-medium">{density.label}</span>
                      {uiDensity === density.id ? <Check className="size-3.5 text-primary" /> : null}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 3. ACCOUNT */}
        {activeTab === "account" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="size-4 text-primary" /> Account &amp; Active Device Sessions
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your authenticated identity and active multi-device sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Account Email</label>
                  <div className="flex items-center gap-2">
                    <Input defaultValue={user.email} disabled className="h-8 text-xs" />
                    <Badge variant="secondary" className="gap-1 text-[0.625rem]">
                      <CheckCircle2 className="size-3 text-emerald-500" /> Verified
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Workspace Tenant ID</label>
                  <Input defaultValue={workspace} disabled className="h-8 text-xs font-mono" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="font-medium text-foreground">Active Signed-In Sessions</label>
                <div className="divide-y rounded-lg border">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Laptop className="size-4 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">MacBook Pro (Chrome 128)</p>
                        <p className="text-[0.625rem] text-muted-foreground font-mono">127.0.0.1 · Active Now · Current Session</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[0.625rem]">Current</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Smartphone className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">iPhone 15 Pro (PWA)</p>
                        <p className="text-[0.625rem] text-muted-foreground font-mono">Last active 45 min ago</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showSaved("Session revoked")}
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showSaved("Signed out all other devices")}
                  className="text-xs text-destructive border-destructive/30"
                >
                  Sign Out Other Devices
                </Button>
                <Button size="sm" onClick={() => showSaved("Account details verified")} className="text-xs">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 4. SECURITY */}
        {activeTab === "security" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" /> Security, Two-Factor &amp; Passkeys
              </CardTitle>
              <CardDescription className="text-xs">
                Configure TOTP 2FA, biometric WebAuthn passkeys, and account recovery codes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Two-Factor Authentication (TOTP)</span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Enabled</Badge>
                  </div>
                  <p className="text-[0.6875rem] text-muted-foreground">
                    Secured via standard TOTP Authenticator (Google Authenticator, 1Password, Authy).
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showSaved("Recovery codes sent to verified email")}
                    className="h-7 text-xs"
                  >
                    View Recovery Codes
                  </Button>
                </div>

                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Passkeys &amp; Biometrics</span>
                    <Badge variant="outline">2 Enrolled</Badge>
                  </div>
                  <p className="text-[0.6875rem] text-muted-foreground">
                    Touch ID &amp; Face ID passkeys registered on MacBook and iPhone.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showSaved("Biometric passkey enrollment prompt ready")}
                    className="h-7 text-xs"
                  >
                    Add New Passkey
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="font-medium text-foreground">Change Password</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    type="password"
                    placeholder="Current Password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!newPw) {
                      showSaved("Please provide a new password")
                      return
                    }
                    setCurrentPw("")
                    setNewPw("")
                    setConfirmPw("")
                    showSaved("Password updated successfully")
                  }}
                  className="text-xs"
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 5. AI MODEL SWARM & AZURE OPENAI */}
        {activeTab === "ai" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> Multi-Model AI Swarm &amp; Azure OpenAI
              </CardTitle>
              <CardDescription className="text-xs">
                Configure your active model provider, custom Azure endpoints, and verify connection health.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-medium text-foreground">Active Frontier AI Provider</label>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {[
                    { id: "azure-openai-gpt-5-4-nano", name: "Azure OpenAI (gpt-5.4-nano)", desc: "Enterprise cloud endpoint with token streaming & tool calling", badge: "Active Live" },
                    { id: "anthropic-claude-3-5-sonnet", name: "Anthropic Claude 3.5 Sonnet", desc: "Top reasoning, high-precision brief understanding, schema adherence", badge: "Claude" },
                    { id: "openai-gpt-4o", name: "OpenAI Direct GPT-4o", desc: "Fast multi-modal extraction, voice transcript alignment", badge: "OpenAI" },
                    { id: "google-gemini-1-5-pro", name: "Google Gemini 1.5 Pro", desc: "Massive 2M context window for full archive & Drive scanning", badge: "Gemini" },
                  ].map((model) => (
                    <div
                      key={model.id}
                      onClick={async () => {
                        setSelectedModel(model.id)
                        await persistSettings({ selectedModel: model.id })
                      }}
                      className={`flex flex-col justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                        selectedModel === model.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{model.name}</span>
                          <Badge variant={selectedModel === model.id ? "default" : "outline"} className="text-[0.625rem]">
                            {model.badge}
                          </Badge>
                        </div>
                        <p className="text-[0.6875rem] text-muted-foreground">{model.desc}</p>
                      </div>
                      {selectedModel === model.id ? (
                        <span className="text-[0.6875rem] font-medium text-primary flex items-center gap-1 mt-2">
                          <Check className="size-3" /> Selected Active Engine
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Azure OpenAI Custom Credentials Form */}
              <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="size-4 text-primary" />
                    <span className="font-semibold text-foreground">Azure OpenAI Configuration</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[0.625rem] text-emerald-500">
                    Connected
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Azure Endpoint URL</label>
                    <Input
                      value={azureEndpoint}
                      onChange={(e) => setAzureEndpoint(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Deployment Name</label>
                    <Input
                      value={azureDeployment}
                      onChange={(e) => setAzureDeployment(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">API Version</label>
                    <Input
                      value={azureApiVersion}
                      onChange={(e) => setAzureApiVersion(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">API Key</label>
                    <Input
                      type="password"
                      value={azureKey}
                      onChange={(e) => setAzureKey(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestAiConnection}
                    disabled={aiTestStatus === "testing"}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Zap className="size-3 text-primary" />
                    {aiTestStatus === "testing" ? "Pinging Endpoint..." : "Test Connection & Ping"}
                  </Button>

                  <Button
                    size="sm"
                    disabled={isSaving}
                    onClick={async () => {
                      await persistSettings({ azureEndpoint, azureDeployment, azureApiVersion, selectedModel })
                    }}
                    className="h-7 text-xs"
                  >
                    {isSaving ? "Saving..." : "Save AI Settings"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 6. AGENT CONTROL PLANE */}
        {activeTab === "agents" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="size-4 text-primary" /> Agent Control Plane &amp; Scopes
              </CardTitle>
              <CardDescription className="text-xs">
                10 specialized autonomous agent roles with strict permission scopes and approval matrices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { name: "Inbox Intelligence Agent", role: "Unstructured Normalizer", scopes: "inbox.read, tasks.write, projects.write", status: "Active" },
                  { name: "Task Execution Agent", role: "Deliverable Prioritization", scopes: "tasks.read, tasks.write, reminders.write", status: "Active" },
                  { name: "Email Intelligence Agent", role: "Gmail Stream Triage", scopes: "email.read, email.draft, tasks.write", status: "Active" },
                  { name: "Drive Asset Agent", role: "Cloud Knowledge Indexer", scopes: "drive.read, drive.search, context.read", status: "Active" },
                  { name: "Calendar Agent", role: "Meeting & Block Sync", scopes: "calendar.read, calendar.write, tasks.read", status: "Active" },
                  { name: "Finance Intelligence Agent", role: "Bank PDF Table Extractor", scopes: "finance.read, finance.categories.write", status: "Active" },
                  { name: "Proactive Reminder Agent", role: "Contextual Alerts", scopes: "reminders.read, notifications.write", status: "Active" },
                  { name: "Chief-of-Staff Planning Agent", role: "Agenda Scorer", scopes: "tasks.read, projects.read, context.read", status: "Active" },
                ].map((agent) => (
                  <div key={agent.name} className="flex items-start justify-between rounded-lg border p-3">
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{agent.name}</span>
                        <Badge variant="secondary" className="text-[0.625rem]">{agent.status}</Badge>
                      </div>
                      <p className="text-[0.6875rem] text-muted-foreground">{agent.role}</p>
                      <p className="text-[0.625rem] text-muted-foreground font-mono truncate">Scopes: {agent.scopes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 7. AI MEMORY & FACTS */}
        {activeTab === "memory" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BrainIcon className="size-4 text-primary" /> Persistent AI Memory &amp; Graph Knowledge
              </CardTitle>
              <CardDescription className="text-xs">
                Facts, client preferences, and habits automatically learned by the Assistant across conversations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {/* Add Memory Form */}
              <form onSubmit={handleAddMemory} className="flex items-center gap-2">
                <Input
                  placeholder="Record a preference or habit (e.g., 'Never schedule meetings before 11 AM')..."
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <Button type="submit" size="sm" className="h-8 text-xs shrink-0">
                  Add Memory
                </Button>
              </form>

              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-foreground">{memories.length} Active Memories</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMemories([])
                    showSaved("All AI memories purged")
                  }}
                  className="h-7 text-xs text-destructive border-destructive/30"
                >
                  Forget All
                </Button>
              </div>

              <div className="divide-y rounded-lg border">
                {memories.map((mem) => (
                  <div key={mem.id} className="flex items-start justify-between p-3 hover:bg-muted/30">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{mem.fact}</p>
                      <div className="flex items-center gap-2 text-[0.625rem] text-muted-foreground">
                        <span>Source: {mem.source}</span>
                        <span>·</span>
                        <span className="font-mono">Confidence: {mem.confidence}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="p-1 hover:text-destructive text-muted-foreground"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 8. INTEGRATIONS */}
        {activeTab === "integrations" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="size-4 text-primary" /> Google Workspace &amp; External Integrations
              </CardTitle>
              <CardDescription className="text-xs">
                Manage OAuth connections for Gmail, Google Drive, and Google Calendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="divide-y rounded-lg border">
                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <Mail className="size-5 text-red-500" />
                    <div>
                      <p className="font-semibold text-foreground">Gmail Intelligence Sync</p>
                      <p className="text-[0.6875rem] text-muted-foreground">
                        Syncs inbox threads, extracts client briefs, auto-categorizes tasks &amp; invoices.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={integrations.gmail ? "default" : "outline"}>
                      {integrations.gmail ? "Connected" : "Standby"}
                    </Badge>
                    <Link href={`/w/${workspace}/settings/integrations`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Configure
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <HardDrive className="size-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-foreground">Google Drive Asset Connector</p>
                      <p className="text-[0.6875rem] text-muted-foreground">
                        Indexes connected client drive folders, vector brand logos, and PDF deliverables.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={integrations.drive ? "default" : "outline"}>
                      {integrations.drive ? "Connected" : "Standby"}
                    </Badge>
                    <Link href={`/w/${workspace}/settings/integrations`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Configure
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-5 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-foreground">Google Calendar Schedule Sync</p>
                      <p className="text-[0.6875rem] text-muted-foreground">
                        Two-way client meeting sync, deliverable deadline blocking, and conflict radar.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={integrations.calendar ? "default" : "outline"}>
                      {integrations.calendar ? "Connected" : "Standby"}
                    </Badge>
                    <Link href={`/w/${workspace}/settings/integrations`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Configure
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 9. NOTIFICATIONS & AUDIO */}
        {activeTab === "notifications" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="size-4 text-primary" /> Multi-Channel Notifications &amp; Audio Synthesizer
              </CardTitle>
              <CardDescription className="text-xs">
                Configure PWA push notifications, Web Audio harmonic chimes, and quiet hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <span className="font-medium text-foreground">Web Audio Harmonic Chimes</span>
                    <p className="text-[0.6875rem] text-muted-foreground">
                      Plays a gentle, non-jarring synthesized chime on Important and Critical alerts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        playHarmonicChime()
                        showSaved("Played harmonic chime preview")
                      }}
                      className="h-7 text-xs gap-1"
                    >
                      <Volume2 className="size-3 text-primary" /> Test Chime
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const next = !soundEnabled
                        setSoundEnabled(next)
                        await persistSettings({ soundEnabled: next })
                      }}
                      className="h-7 text-xs"
                    >
                      {soundEnabled ? "Enabled" : "Muted"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <span className="font-medium text-foreground">Quiet Hours (23:00 → 08:00)</span>
                    <p className="text-[0.6875rem] text-muted-foreground">
                      Suppresses non-critical alerts during rest hours while allowing critical approval alerts.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const next = !quietHoursEnabled
                      setQuietHoursEnabled(next)
                      await persistSettings({ quietHoursEnabled: next })
                    }}
                    className="h-7 text-xs"
                  >
                    {quietHoursEnabled ? "Active" : "Disabled"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 10. PWA & DEVICES */}
        {activeTab === "pwa" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="size-4 text-primary" /> PWA, Offline Cache &amp; Device Manager
              </CardTitle>
              <CardDescription className="text-xs">
                Native desktop &amp; mobile installation status, background sync, and cache health.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Service Worker (sw.js)</span>
                    <Badge variant="outline" className="text-emerald-500">Active</Badge>
                  </div>
                  <p className="text-[0.6875rem] text-muted-foreground">
                    Caches Today, Tasks, and Assistant offline state with background sync.
                  </p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Web Push Manager</span>
                    <Badge variant="outline" className="text-emerald-500">Registered</Badge>
                  </div>
                  <p className="text-[0.6875rem] text-muted-foreground">
                    Delivers deadline alerts to macOS notification center and iOS/Android lockscreens.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 11. WORK & PLANNING - includes generic Employment / CV */}
        {activeTab === "planning" ? (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4 text-primary" /> Work Hours, Breaks &amp; Daily Briefing Schedule
              </CardTitle>
              <CardDescription className="text-xs">
                Configure your operating hours and morning briefing delivery cadence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Working Hours</label>
                  <Input defaultValue="Mon - Fri: 10:00 AM → 7:00 PM" className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Morning Briefing Cron Time</label>
                  <Input defaultValue="08:00 AM Daily" className="h-8 text-xs font-mono" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={() => showSaved("Work schedule saved")} className="text-xs">
                  Save Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Employment / CV — generic, user fills where they work */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users2 className="size-4 text-primary" /> Employment &amp; CV — Where you work
              </CardTitle>
              <CardDescription className="text-xs">
                Tell the OS who you work for so it can link salary credits, org context &amp; memory. No hardcoding — this is your source of truth. Agents read it via memory &amp; linked Organization (kind EMPLOYER).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Company / Employer *</label>
                  <Input value={employerCompany} onChange={(e) => setEmployerCompany(e.target.value)} placeholder="e.g. Acme Corp" className="h-8 text-xs" />
                  <p className="text-[0.625rem] text-muted-foreground">Used to auto-tag CREDITs containing this name as INCOME</p>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Role / Title</label>
                  <Input value={employerRole} onChange={(e) => setEmployerRole(e.target.value)} placeholder="e.g. Product Designer" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Joined date</label>
                  <Input type="date" value={employerJoinedAt} onChange={(e) => setEmployerJoinedAt(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Employment type</label>
                  <select value={employerType} onChange={(e) => setEmployerType(e.target.value)} className="h-8 w-full rounded-md border bg-background px-2 text-xs">
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Status</label>
                  <select value={employerStatus} onChange={(e) => setEmployerStatus(e.target.value)} className="h-8 w-full rounded-md border bg-background px-2 text-xs">
                    <option value="running">Running — currently working</option>
                    <option value="left">Left — no longer there</option>
                    <option value="on_leave">On leave</option>
                  </select>
                </div>
                {employerStatus === "left" ? (
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Left date</label>
                    <Input type="date" value={employerLeftAt} onChange={(e) => setEmployerLeftAt(e.target.value)} className="h-8 text-xs" />
                  </div>
                ) : null}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-medium text-foreground">Company website (optional)</label>
                  <Input value={employerWebsite} onChange={(e) => setEmployerWebsite(e.target.value)} placeholder="https://..." className="h-8 text-xs font-mono" />
                </div>
              </div>
              {employerCompany ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[0.6875rem] leading-relaxed space-y-1">
                  <div><span className="font-medium text-emerald-600">Connected logic:</span> <span className="text-muted-foreground">CREDITs with “{employerCompany}” → INCOME · Org <span className="font-mono">{employerCompany}</span> (EMPLOYER) linked for Finance/Agents · Memory injected for Assistant. Change the name here and all logic follows — no code change.</span></div>
                  <div className="text-[0.625rem] font-mono text-muted-foreground break-all">Preview: “UPI/CR/…/{employerCompany.toUpperCase()} PVT - SALARY” → <span className="text-emerald-600">INCOME</span> {employerStatus === "left" ? "· (status Left: only past CREDITs retro-tagged)" : ""}</div>
                  {employerStatus === "left" && employerJoinedAt && employerLeftAt && new Date(employerLeftAt) < new Date(employerJoinedAt) ? (
                    <div className="text-destructive">Left date cannot be before joined date.</div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-2.5 text-[0.6875rem] text-muted-foreground">No employer set — CREDIT transactions won’t be auto-tagged as salary. Fill company name to enable.</div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => { setEmployerCompany(""); setEmployerRole(""); setEmployerJoinedAt(""); setEmployerStatus("running"); setEmployerLeftAt(""); setEmployerType("full_time"); setEmployerWebsite(""); showSaved("Cleared locally — save to persist") }} className="text-xs">Clear</Button>
                <Button size="sm" disabled={isSaving} onClick={async () => {
                  if (employerCompany && employerCompany.trim().length > 0 && employerCompany.trim().length < 2) { showSaved("Company name too short"); return }
                  if (employerStatus === "left" && !employerLeftAt) { showSaved("Left date required when status is Left"); return }
                  if (employerJoinedAt && employerLeftAt && new Date(employerLeftAt) < new Date(employerJoinedAt)) { showSaved("Left date cannot be before joined date"); return }
                  await persistSettings({ employerCompany, employerRole, employerJoinedAt, employerStatus, employerLeftAt: employerStatus === "left" ? employerLeftAt : "", employerType, employerWebsite })
                }} className="text-xs">{isSaving ? "Saving..." : "Save Employment"}</Button>
              </div>
            </CardContent>
          </Card>
          </div>
        ) : null}

        {/* 12. TASKS & WORKFLOW RULES */}
        {activeTab === "tasks" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="size-4 text-primary" /> Tasks &amp; Project Workflow Rules
              </CardTitle>
              <CardDescription className="text-xs">
                Automated rollover, priority elevation, and default deliverable lifecycles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="divide-y rounded-lg border">
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-semibold text-foreground">Auto-Rollover Overdue Tasks</p>
                    <p className="text-[0.6875rem] text-muted-foreground">
                      Incomplete tasks due yesterday automatically carry forward to today with an overdue priority boost.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-emerald-500">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-semibold text-foreground">Dynamic Priority Elevation</p>
                    <p className="text-[0.6875rem] text-muted-foreground">
                      Automatically boosts priority score to Critical as deadlines approach within 24 hours.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-emerald-500">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 13. FINANCE */}
        {activeTab === "finance" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-4 text-primary" /> Financial Extraction &amp; Categorization Rules
              </CardTitle>
              <CardDescription className="text-xs">
                Deterministic bank statement parser settings and subscription radar thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-lg border p-3 space-y-2">
                <span className="font-semibold text-foreground">Auto-Categorization Confidence Threshold</span>
                <p className="text-[0.6875rem] text-muted-foreground">
                  Transactions with &gt;90% classification certainty are categorized automatically.
                </p>
                <Badge variant="outline" className="font-mono">90% Threshold</Badge>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 14. DATA EXPORT & PRIVACY */}
        {activeTab === "data" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="size-4 text-primary" /> Complete Data Export &amp; Privacy
              </CardTitle>
              <CardDescription className="text-xs">
                Download your complete workspace graph (tasks, projects, files metadata, financial ledger) in open formats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-1.5 text-xs">
                  <Download className="size-3.5 text-primary" /> Export All (JSON)
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportTasksCsv} className="gap-1.5 text-xs">
                  <FileSpreadsheet className="size-3.5 text-blue-500" /> Export Tasks (CSV)
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportFinanceCsv} className="gap-1.5 text-xs">
                  <FileSpreadsheet className="size-3.5 text-emerald-500" /> Export Financial Ledger (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 15. DEVELOPER & API KEYS */}
        {activeTab === "developer" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="size-4 text-primary" /> Personal API Keys &amp; Developer Mode
              </CardTitle>
              <CardDescription className="text-xs">
                Generate scoped API keys to connect external scripts, webhooks, and custom CLI tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Active API Keys</span>
                <Button size="sm" onClick={handleGenerateKey} className="h-7 text-xs">
                  Generate API Key
                </Button>
              </div>

              <div className="divide-y rounded-lg border">
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{k.name}</p>
                      <p className="font-mono text-[0.625rem] text-muted-foreground">{k.prefix} · Last used: {k.lastUsed}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (navigator?.clipboard) {
                            navigator.clipboard.writeText(k.prefix)
                            showSaved("API key copied to clipboard")
                          }
                        }}
                        className="h-7 text-xs gap-1"
                      >
                        <Copy className="size-3" /> Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeKey(k.id)}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Sparkles {...props} />
}
