"use client"

import { useState } from "react";
import {
  FolderIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircle2Icon,
  TrendingUpIcon,
  PlusIcon,
  ExternalLinkIcon,
  FileVideoIcon,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  ArrowUpRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  client: string;
  category: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  deadline: string;
  driveFolder: string;
  status: "In Progress" | "Review" | "Completed";
  color: string;
};

const initialProjects: Project[] = [
  {
    id: "proj-1",
    name: "Social Media Reels Campaign (3 Deliverables)",
    client: "GB Banquet",
    category: "Video Production",
    progress: 66,
    completedTasks: 2,
    totalTasks: 3,
    deadline: "Saturday, Aug 28",
    driveFolder: "Drive / 2026 / GB Banquet / Raw Footage",
    status: "In Progress",
    color: "bg-amber-500",
  },
  {
    id: "proj-2",
    name: "Q3 Organic Search Audit & LinkedIn Carousel",
    client: "Tanniaqua Zone",
    category: "SEO & Brand",
    progress: 80,
    completedTasks: 4,
    totalTasks: 5,
    deadline: "Thursday, Aug 27",
    driveFolder: "Drive / 2026 / Tanniaqua / SEO Exports",
    status: "Review",
    color: "bg-blue-500",
  },
  {
    id: "proj-3",
    name: "Customer Loyalty Motion Storyboard & Vector Badges",
    client: "Happy Rewards",
    category: "Motion Design",
    progress: 40,
    completedTasks: 2,
    totalTasks: 5,
    deadline: "Monday, Sep 01",
    driveFolder: "Drive / 2026 / Happy Rewards / Assets",
    status: "In Progress",
    color: "bg-violet-500",
  },
  {
    id: "proj-4",
    name: "Summer Promo Hero Banner & 40% Coupon Config",
    client: "Shopify Store",
    category: "E-Commerce",
    progress: 100,
    completedTasks: 4,
    totalTasks: 4,
    deadline: "Done Today",
    driveFolder: "Drive / 2026 / Store / Banners",
    status: "Completed",
    color: "bg-emerald-500",
  },
];

export function ProjectsBoardView() {
  const [projects] = useState<Project[]>(initialProjects);
  const [filter, setFilter] = useState<"All" | "In Progress" | "Review" | "Completed">("All");
  const [search, setSearch] = useState("");

  const filtered = projects.filter((p) => {
    const matchesFilter = filter === "All" || p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-7 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            <FolderIcon className="size-4" />
            <span>Workspace Project Matrix</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Active Projects &amp; Deliverables
          </h1>
          <p className="text-xs text-muted-foreground">
            Multi-client project hub linked to Google Drive asset vaults and execution context packs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button className="h-9 gap-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground shadow-sm">
            <PlusIcon className="size-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(["All", "In Progress", "Review", "Completed"] as const).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === tab
                  ? "bg-foreground text-background font-semibold"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8.5 rounded-xl bg-muted/40 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((proj) => (
          <div
            key={proj.id}
            className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-xs hover:border-border transition-all group"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-semibold text-primary uppercase tracking-wider">
                    {proj.client}
                  </span>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mt-0.5">
                    {proj.name}
                  </h3>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold shrink-0 border",
                    proj.status === "Completed"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : proj.status === "Review"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20",
                  )}
                >
                  {proj.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Deliverables Velocity</span>
                  <span className="font-bold text-foreground">{proj.completedTasks} / {proj.totalTasks} Done ({proj.progress}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", proj.color)}
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>

              {/* Drive Asset Link */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono">
                <div className="flex items-center gap-2 text-muted-foreground truncate">
                  <FolderIcon className="size-3.5 text-primary shrink-0" />
                  <span className="truncate text-[11px]">{proj.driveFolder}</span>
                </div>
                <ExternalLinkIcon className="size-3 text-muted-foreground shrink-0" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ClockIcon className="size-3.5 text-muted-foreground" />
                <span>Due: <strong className="text-foreground">{proj.deadline}</strong></span>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <span>Launch Cockpit</span>
                <ArrowUpRightIcon className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
