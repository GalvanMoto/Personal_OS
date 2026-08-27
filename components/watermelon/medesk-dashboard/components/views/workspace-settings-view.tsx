"use client"

import { useState } from "react";
import {
  Settings as GearIcon,
  Plug as PlugsConnectedIcon,
  ShieldCheck as ShieldCheckIcon,
  HardDrive as HardDriveIcon,
  Mail as MailIcon,
  Sparkles as SparklesIcon,
  CheckCircle2 as CheckCircle2Icon,
  Key as KeyIcon,
  Lock as LockIcon,
  Save as SaveIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorkspaceSettingsView() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-7 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            <GearIcon className="size-4" />
            <span>Workspace Configuration</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Settings &amp; Integrations
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your Google Drive, Gmail synchronization, AI provider endpoints, and tenant security.
          </p>
        </div>

        <Button onClick={handleSave} className="h-9 gap-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm">
          <SaveIcon className="size-3.5" />
          <span>{saved ? "Saved Changes!" : "Save Settings"}</span>
        </Button>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Google Drive */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <HardDriveIcon className="size-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-foreground">Google Drive Connector</h3>
                <span className="text-xs text-muted-foreground">Auto-indexes 4K clips, vector logos, &amp; briefs</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Connected
            </span>
          </div>

          <div className="rounded-xl bg-muted/30 p-3 border border-border/40 font-mono text-xs text-muted-foreground flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="text-foreground font-semibold">demo@example.com</span>
            </div>
            <div className="flex justify-between">
              <span>Indexed Folders:</span>
              <span className="text-foreground font-semibold">14 Directories (4.2 GB)</span>
            </div>
            <div className="flex justify-between">
              <span>Sync Webhook:</span>
              <span className="text-emerald-500 font-semibold">Live (SSL Active)</span>
            </div>
          </div>
        </div>

        {/* Gmail & Mailbox */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <MailIcon className="size-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-foreground">Gmail Intelligence Feed</h3>
                <span className="text-xs text-muted-foreground">Extracts client briefs, invoices &amp; deadlines</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Connected
            </span>
          </div>

          <div className="rounded-xl bg-muted/30 p-3 border border-border/40 font-mono text-xs text-muted-foreground flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Sync Interval:</span>
              <span className="text-foreground font-semibold">Realtime Push Notification</span>
            </div>
            <div className="flex justify-between">
              <span>Filter Rules:</span>
              <span className="text-foreground font-semibold">Clients, Invoices, Approvals</span>
            </div>
            <div className="flex justify-between">
              <span>Sensitive Actions:</span>
              <span className="text-amber-500 font-semibold">Approval Required</span>
            </div>
          </div>
        </div>

        {/* Multi-Tenant Security */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheckIcon className="size-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-foreground">Tenant Isolation &amp; Privacy</h3>
                <span className="text-xs text-muted-foreground">Row-level security and local statement decrypt</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Enforced
            </span>
          </div>

          <div className="rounded-xl bg-muted/30 p-3 border border-border/40 font-mono text-xs text-muted-foreground flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Encryption:</span>
              <span className="text-foreground font-semibold">AES-256 at Rest</span>
            </div>
            <div className="flex justify-between">
              <span>Statement Decrypt:</span>
              <span className="text-emerald-500 font-semibold">Client Memory Only</span>
            </div>
            <div className="flex justify-between">
              <span>Audit Logging:</span>
              <span className="text-foreground font-semibold">Immutable Provenance Log</span>
            </div>
          </div>
        </div>

        {/* AI Model Endpoints */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <SparklesIcon className="size-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-foreground">AI Intelligence Gateway</h3>
                <span className="text-xs text-muted-foreground">Configurable multi-agent routing</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-violet-500/10 text-violet-500 border border-violet-500/20">
              Active
            </span>
          </div>

          <div className="rounded-xl bg-muted/30 p-3 border border-border/40 font-mono text-xs text-muted-foreground flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Primary Engine:</span>
              <span className="text-foreground font-semibold">Gemini 2.5 Pro / GPT-4o</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Token Budget:</span>
              <span className="text-foreground font-semibold">42.8k / 200k Used</span>
            </div>
            <div className="flex justify-between">
              <span>Vision OCR SLA:</span>
              <span className="text-emerald-500 font-semibold">420ms Average</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
