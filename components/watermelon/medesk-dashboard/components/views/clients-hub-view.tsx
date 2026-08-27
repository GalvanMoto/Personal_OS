"use client"

import { useState } from "react";
import {
  Building2Icon,
  FolderIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  ExternalLinkIcon,
  SparklesIcon,
  LayersIcon,
  CheckCircle2Icon,
  ArrowUpRightIcon,
  FileTextIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Client = {
  id: string;
  name: string;
  industry: string;
  contactName: string;
  email: string;
  activeProjects: number;
  completedTasks: number;
  totalRevenue: string;
  driveFolder: string;
  logo: string;
  status: "Active" | "Retainer" | "Lead";
};

const clientsData: Client[] = [
  {
    id: "c-1",
    name: "GB Banquet",
    industry: "Luxury Hospitality & Events",
    contactName: "Vikram Malhotra",
    email: "contact@gb-banquet.example",
    activeProjects: 2,
    completedTasks: 42,
    totalRevenue: "₹1,45,000",
    driveFolder: "Drive / 2026 / GB Banquet",
    logo: `https://api.dicebear.com/9.x/identicon/svg?seed=GB_Banquet`,
    status: "Retainer",
  },
  {
    id: "c-2",
    name: "Tanniaqua Zone",
    industry: "E-Commerce & Aquascaping",
    contactName: "Sarah M.",
    email: "sarah@tanniaqua.example",
    activeProjects: 1,
    completedTasks: 28,
    totalRevenue: "₹85,000",
    driveFolder: "Drive / 2026 / Tanniaqua Zone",
    logo: `https://api.dicebear.com/9.x/identicon/svg?seed=Tanniaqua`,
    status: "Active",
  },
  {
    id: "c-3",
    name: "Happy Rewards",
    industry: "Fintech & Customer Loyalty",
    contactName: "Kunal Verma",
    email: "kunal@happyrewards.example",
    activeProjects: 1,
    completedTasks: 19,
    totalRevenue: "₹65,000",
    driveFolder: "Drive / 2026 / Happy Rewards",
    logo: `https://api.dicebear.com/9.x/identicon/svg?seed=HappyRewards`,
    status: "Active",
  },
  {
    id: "c-4",
    name: "Summer Store Shopify",
    industry: "Apparel & Retail",
    contactName: "Elena Rostova",
    email: "elena@summerstore.example",
    activeProjects: 1,
    completedTasks: 34,
    totalRevenue: "₹92,000",
    driveFolder: "Drive / 2026 / Store Banners",
    logo: `https://api.dicebear.com/9.x/identicon/svg?seed=SummerStore`,
    status: "Retainer",
  },
];

export function ClientsHubView() {
  const [clients] = useState<Client[]>(clientsData);

  return (
    <div className="flex flex-col gap-7 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            <Building2Icon className="size-4" />
            <span>360° Client Relationship Graph</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Clients &amp; Brands
          </h1>
          <p className="text-xs text-muted-foreground">
            Centralized hub uniting client brand assets, drive links, active contracts, and correspondence.
          </p>
        </div>

        <Button className="h-9 gap-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground shadow-sm">
          <PlusIcon className="size-4" />
          <span>Add Client</span>
        </Button>
      </div>

      {/* Clients Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {clients.map((c) => (
          <div
            key={c.id}
            className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-xs hover:border-border transition-all"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 rounded-xl ring-1 ring-border">
                    <AvatarImage src={c.logo} alt={c.name} />
                    <AvatarFallback>{c.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-foreground leading-snug">{c.name}</h3>
                    <span className="text-xs text-muted-foreground">{c.industry}</span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
                  {c.status}
                </span>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40 font-mono">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase">Active Projs</span>
                  <span className="text-sm font-bold text-foreground">{c.activeProjects}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase">Deliverables</span>
                  <span className="text-sm font-bold text-foreground">{c.completedTasks} Done</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase">Revenue</span>
                  <span className="text-sm font-bold text-emerald-500">{c.totalRevenue}</span>
                </div>
              </div>

              {/* Contact & Drive */}
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">{c.email} ({c.contactName})</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 font-mono text-[11px]">
                  <div className="flex items-center gap-2 text-muted-foreground truncate">
                    <FolderIcon className="size-3.5 text-primary shrink-0" />
                    <span className="truncate">{c.driveFolder}</span>
                  </div>
                  <ExternalLinkIcon className="size-3 text-muted-foreground shrink-0" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40 text-xs">
              <span className="text-muted-foreground text-[11px] font-mono">Zero missing assets</span>
              <button
                type="button"
                className="flex items-center gap-1 text-primary hover:underline font-semibold text-xs"
              >
                <span>Client Cockpit</span>
                <ArrowUpRightIcon className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
