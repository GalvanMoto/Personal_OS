"use client"

import { useState } from "react";
import {
  FolderIcon,
  HardDriveIcon,
  SearchIcon,
  ExternalLinkIcon,
  FileVideoIcon,
  FileTextIcon,
  FileImageIcon,
  SparklesIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
  UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CloudAsset = {
  id: string;
  name: string;
  type: "Video 4K" | "Vector SVG" | "PDF Spec" | "Audio Track";
  client: string;
  size: string;
  drivePath: string;
  syncedAt: string;
};

const assetsData: CloudAsset[] = [
  {
    id: "a-1",
    name: "GB_Banquet_Wedding_4K_60fps_Clip01.mov",
    type: "Video 4K",
    client: "GB Banquet",
    size: "1.4 GB",
    drivePath: "Drive / 2026 / GB Banquet / Raw Footage",
    syncedAt: "10 min ago",
  },
  {
    id: "a-2",
    name: "GB_Banquet_Vector_Gold_Transparent.svg",
    type: "Vector SVG",
    client: "GB Banquet",
    size: "420 KB",
    drivePath: "Drive / 2026 / GB Banquet / Logos",
    syncedAt: "1 hour ago",
  },
  {
    id: "a-3",
    name: "Tanniaqua_Q3_SEO_Audit_Report.pdf",
    type: "PDF Spec",
    client: "Tanniaqua Zone",
    size: "4.8 MB",
    drivePath: "Drive / 2026 / Tanniaqua Zone / Reports",
    syncedAt: "2 hours ago",
  },
  {
    id: "a-4",
    name: "Happy_Rewards_Crown_Badge_Motion.lottie",
    type: "Vector SVG",
    client: "Happy Rewards",
    size: "890 KB",
    drivePath: "Drive / 2026 / Happy Rewards / Lottie",
    syncedAt: "Yesterday",
  },
  {
    id: "a-5",
    name: "Upbeat_Restaurant_Ambience_128BPM.wav",
    type: "Audio Track",
    client: "GB Banquet",
    size: "48 MB",
    drivePath: "Drive / Audio Library / Ambient",
    syncedAt: "2 days ago",
  },
];

export function CloudAssetsView() {
  const [search, setSearch] = useState("");
  const [assets] = useState<CloudAsset[]>(assetsData);

  const filtered = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.client.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-7 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            <HardDriveIcon className="size-4" />
            <span>Connected Cloud Assets &amp; Drive Vault</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Cloud Assets Explorer
          </h1>
          <p className="text-xs text-muted-foreground">
            Instant search across indexed Google Drive folders, 4K footage, client vectors, and design briefs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl text-xs">
            <RefreshCwIcon className="size-3.5" />
            <span>Resync Drive (82% indexed)</span>
          </Button>
          <Button size="sm" className="h-9 gap-1.5 rounded-xl text-xs bg-primary text-primary-foreground">
            <UploadIcon className="size-3.5" />
            <span>Upload Asset</span>
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <SearchIcon className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search 4K clips, vector SVGs, documents, client assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 rounded-xl bg-muted/40 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Assets Table */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-160 table-fixed text-left text-xs">
            <thead>
              <tr className="h-10 uppercase tracking-wider text-muted-foreground border-b border-border/40 bg-muted/30 font-semibold font-mono text-[11px]">
                <th className="w-[40%] px-5">Asset Name</th>
                <th className="w-[18%] px-4">Client / Brand</th>
                <th className="w-[14%] px-4">Format</th>
                <th className="w-[14%] px-4">File Size</th>
                <th className="w-[14%] px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr
                  key={asset.id}
                  className="h-14 border-b border-border/30 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {asset.type.includes("Video") ? (
                          <FileVideoIcon className="size-4" />
                        ) : asset.type.includes("SVG") ? (
                          <FileImageIcon className="size-4" />
                        ) : (
                          <FileTextIcon className="size-4" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate">{asset.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">{asset.drivePath}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 font-semibold text-foreground/90">{asset.client}</td>
                  <td className="px-4">
                    <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground">
                      {asset.type}
                    </span>
                  </td>
                  <td className="px-4 font-mono text-muted-foreground">{asset.size}</td>
                  <td className="px-4">
                    <a
                      href="https://drive.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-[11px]"
                    >
                      <span>Open Drive</span>
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
