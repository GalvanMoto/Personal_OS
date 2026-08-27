"use client"

import { useState } from "react";
import {
  SparklesIcon,
  UploadCloudIcon,
  FileTextIcon,
  MicIcon,
  ImageIcon,
  Link2Icon,
  CheckCircle2Icon,
  ArrowRightIcon,
  ClockIcon,
  FolderIcon,
  ShieldCheckIcon,
  CopyIcon,
  CheckIcon,
  LayersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExtractedPayload = {
  client: string;
  project: string;
  tasks: Array<{ title: string; deadline: string; priority: "High" | "Medium" | "Urgent" }>;
  assetsRequired: string[];
  confidence: number;
  provenance: string;
};

export function UniversalInboxView() {
  const [activeTab, setActiveTab] = useState<"text" | "screenshot" | "voice" | "pdf">("text");
  const [inputText, setInputText] = useState(
    "Client says: Bro please make 3 reels for GB Banquet. First one should be event highlights, second should show decoration and third should focus on food. Need them before Saturday. Photos and raw footage are in Drive.",
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedPayload | null>({
    client: "GB Banquet",
    project: "Social Media Reels Campaign",
    tasks: [
      { title: "Event Highlights Reel (9:16)", deadline: "Saturday, 28 Aug", priority: "High" },
      { title: "Decor & Venue Ambiance Reel (9:16)", deadline: "Saturday, 28 Aug", priority: "Medium" },
      { title: "Catering & Food Showcase Reel (9:16)", deadline: "Saturday, 28 Aug", priority: "High" },
    ],
    assetsRequired: ["Drive / GB Banquet / Raw Footage (4K 60fps)", "GB_Banquet_Vector_Gold.svg", "Event_Rundown.pdf"],
    confidence: 96,
    provenance: "WhatsApp Screenshot OCR + Heuristic Parser v2",
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const samplePresets = [
    {
      label: "GB Banquet 3 Reels",
      text: "Bro please make 3 reels for GB Banquet. First one should be event highlights, second should show decoration and third should focus on food. Need them before Saturday. Photos and raw footage are in Drive.",
      data: {
        client: "GB Banquet",
        project: "Social Media Reels Campaign",
        tasks: [
          { title: "Event Highlights Reel (9:16)", deadline: "Saturday, 28 Aug", priority: "High" as const },
          { title: "Decor & Venue Ambiance Reel (9:16)", deadline: "Saturday, 28 Aug", priority: "Medium" as const },
          { title: "Catering & Food Showcase Reel (9:16)", deadline: "Saturday, 28 Aug", priority: "High" as const },
        ],
        assetsRequired: ["Drive / GB Banquet / Raw Footage (4K 60fps)", "GB_Banquet_Vector_Gold.svg"],
        confidence: 96,
        provenance: "Client WhatsApp Message",
      },
    },
    {
      label: "Tanniaqua SEO & Deck",
      text: "Sarah from Tanniaqua Zone wants the Q3 organic search audit deck and LinkedIn carousel by Thursday 4 PM. Brand guidelines in shared folder.",
      data: {
        client: "Tanniaqua Zone",
        project: "Q3 Organic Growth & SEO",
        tasks: [
          { title: "Q3 SEO Benchmark Slide Deck", deadline: "Thursday, 4:00 PM", priority: "High" as const },
          { title: "8-Slide LinkedIn Carousel Design", deadline: "Thursday, 4:00 PM", priority: "Medium" as const },
        ],
        assetsRequired: ["Drive / Tanniaqua Zone / SEO Data", "Tanniaqua_Badge_Transparent.png"],
        confidence: 94,
        provenance: "Client Email Forward",
      },
    },
    {
      label: "SBI Bank Statement PDF",
      text: "SBI Account Statement for Aug 2026. Total debits ₹18,420 across 14 transactions. Software: ₹2,400, Food: ₹4,200, Subscriptions: ₹3,100.",
      data: {
        client: "Personal Finance",
        project: "Expense Radar & Audit",
        tasks: [
          { title: "Categorize 14 Statement Transactions", deadline: "End of Day", priority: "Medium" as const },
          { title: "Flag Adobe & Hosting Subscriptions", deadline: "End of Day", priority: "Medium" as const },
        ],
        assetsRequired: ["SBI_Statement_Aug2026_Encrypted.pdf"],
        confidence: 98,
        provenance: "Local Password-Protected PDF Decrypt",
      },
    },
  ];

  const handleExtract = () => {
    setIsExtracting(true);
    setSavedSuccess(false);
    setTimeout(() => {
      setIsExtracting(false);
      setExtractedData({
        client: inputText.includes("Tanniaqua") ? "Tanniaqua Zone" : inputText.includes("SBI") ? "Personal Finance" : "GB Banquet",
        project: "Dynamic AI Extraction",
        tasks: [
          { title: inputText.length > 40 ? `${inputText.slice(0, 40)}...` : inputText, deadline: "Friday", priority: "High" },
        ],
        assetsRequired: ["Google Drive Linked Assets", "Extracted Vector Logo"],
        confidence: 92,
        provenance: "DLRS Neural Entity Resolver",
      });
    }, 600);
  };

  const handleSaveToPipeline = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
          <SparklesIcon className="size-4" />
          <span>Universal Multimodal Ingestion Engine</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Universal Inbox
        </h1>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          The heart of DLRS Personal OS. Drop raw client briefs, screenshots, voice notes, or PDFs. The system extracts structured deliverables, discovers Drive assets, and tracks provenance.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Ingestion Capture Zone */}
        <div className="flex flex-col gap-5 lg:col-span-6">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col gap-4">
            {/* Input Type Selector */}
            <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1 border border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                  activeTab === "text"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FileTextIcon className="size-3.5" />
                <span>Text / Brief</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("screenshot")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                  activeTab === "screenshot"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ImageIcon className="size-3.5" />
                <span>Screenshot</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("voice")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                  activeTab === "voice"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MicIcon className="size-3.5" />
                <span>Voice Audio</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pdf")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                  activeTab === "pdf"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <UploadCloudIcon className="size-3.5" />
                <span>PDF Doc</span>
              </button>
            </div>

            {/* Quick Demo Presets */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Load Sample Real-World Briefs
              </span>
              <div className="flex flex-wrap gap-2">
                {samplePresets.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => {
                      setInputText(preset.text);
                      setExtractedData(preset.data);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/40 transition-colors"
                  >
                    ⚡ {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingestion Input Area */}
            <div className="flex flex-col gap-2">
              <textarea
                rows={6}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste any client message, transcription, or forwarded email..."
                className="w-full rounded-xl bg-muted/30 p-3.5 text-xs text-foreground placeholder:text-muted-foreground border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed font-sans"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <ShieldCheckIcon className="size-3.5 text-emerald-500" />
                <span>Zero Data Leaks • Encrypted</span>
              </div>
              <Button
                onClick={handleExtract}
                disabled={isExtracting || !inputText.trim()}
                className="h-9 px-5 gap-2 rounded-xl text-xs font-semibold bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white shadow-md shadow-indigo-500/25"
              >
                {isExtracting ? (
                  <>
                    <span className="size-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Extracting Entities...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="size-3.5" />
                    <span>Run AI Extraction</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Realtime AI Extraction Result & Context Pack Generator */}
        <div className="flex flex-col gap-5 lg:col-span-6">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-foreground">Extracted Intelligence &amp; Context</h3>
              </div>
              {extractedData ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-mono font-semibold">
                  <CheckCircle2Icon className="size-3.5" />
                  <span>{extractedData.confidence}% Confidence</span>
                </div>
              ) : null}
            </div>

            {extractedData ? (
              <div className="flex flex-col gap-4">
                {/* Client & Project Badges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 rounded-xl bg-muted/40 p-3 border border-border/40">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Detected Client</span>
                    <span className="text-xs font-bold text-foreground">{extractedData.client}</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-xl bg-muted/40 p-3 border border-border/40">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Project Scope</span>
                    <span className="text-xs font-bold text-primary truncate">{extractedData.project}</span>
                  </div>
                </div>

                {/* Extracted Tasks */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-1.5">
                    <LayersIcon className="size-3 text-primary" />
                    <span>Actionable Deliverables ({extractedData.tasks.length})</span>
                  </span>
                  <div className="flex flex-col gap-2">
                    {extractedData.tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="size-5 rounded-md bg-primary/10 text-primary flex items-center justify-center font-mono text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-medium text-foreground">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                            {task.deadline}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auto-Discovered Asset Dependencies */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-1.5">
                    <FolderIcon className="size-3 text-primary" />
                    <span>Auto-Discovered Assets &amp; Drive Links</span>
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {extractedData.assetsRequired.map((asset, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs"
                      >
                        <span className="font-mono text-[11px] text-foreground/90">{asset}</span>
                        <span className="text-[10px] font-mono text-emerald-500 font-semibold">Indexed</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Provenance Receipt */}
                <div className="rounded-xl bg-muted/20 p-3 border border-dashed border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px]">Provenance Source:</span>
                  <span className="font-mono font-medium text-foreground text-[11px]">{extractedData.provenance}</span>
                </div>

                {/* Schedule Button */}
                <Button
                  onClick={handleSaveToPipeline}
                  className="h-10 w-full gap-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-md transition-all"
                >
                  {savedSuccess ? (
                    <>
                      <CheckIcon className="size-4 text-emerald-400" />
                      <span>Scheduled to Today&apos;s Active Pipeline!</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightIcon className="size-4" />
                      <span>Approve &amp; Assemble Context Pack</span>
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
