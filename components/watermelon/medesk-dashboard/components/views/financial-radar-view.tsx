"use client"

import { useState } from "react";
import {
  CreditCardIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  SparklesIcon,
  ArrowUpRightIcon,
  LockIcon,
  UnlockIcon,
  FileTextIcon,
  DollarSignIcon,
  CheckCircle2Icon,
  TrendingDownIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Subscription = {
  name: string;
  amount: string;
  cadence: string;
  nextRenewal: string;
  daysRemaining: number;
  status: "Normal" | "Upcoming Soon" | "Price Increased";
  logoSeed: string;
};

const subscriptions: Subscription[] = [
  {
    name: "Adobe Creative Cloud Pro",
    amount: "₹1,675",
    cadence: "Monthly",
    nextRenewal: "Sep 02, 2026",
    daysRemaining: 3,
    status: "Upcoming Soon",
    logoSeed: "Adobe",
  },
  {
    name: "Claude Pro & API Token Tier",
    amount: "₹1,850",
    cadence: "Monthly",
    nextRenewal: "Sep 05, 2026",
    daysRemaining: 6,
    status: "Normal",
    logoSeed: "Claude",
  },
  {
    name: "Vercel & Domain Names",
    amount: "₹1,299",
    cadence: "Annual",
    nextRenewal: "Sep 08, 2026",
    daysRemaining: 9,
    status: "Normal",
    logoSeed: "Vercel",
  },
  {
    name: "Cloudflare & AWS S3 Storage",
    amount: "₹799",
    cadence: "Monthly",
    nextRenewal: "Sep 12, 2026",
    daysRemaining: 13,
    status: "Normal",
    logoSeed: "AWS",
  },
];

export function FinancialRadarView() {
  const [statementPassword, setStatementPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedSuccess, setDecryptedSuccess] = useState(false);

  const handleDecryptStatement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementPassword) return;
    setIsDecrypting(true);
    setTimeout(() => {
      setIsDecrypting(false);
      setDecryptedSuccess(true);
    }, 700);
  };

  return (
    <div className="flex flex-col gap-7 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            <CreditCardIcon className="size-4" />
            <span>Deterministic Financial Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Financial Radar &amp; Subscriptions
          </h1>
          <p className="text-xs text-muted-foreground">
            Strict client-side bank statement decryption, automated subscription monitoring, and categorical spending velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <ShieldCheckIcon className="size-4" />
          <span>Local Decryption Vault Active</span>
        </div>
      </div>

      {/* 3 Top Financial KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">August Total Spending</span>
          <p className="text-2xl md:text-3xl font-bold font-mono text-foreground mt-2">₹18,420</p>
          <span className="text-xs font-mono text-emerald-500 mt-1 flex items-center gap-1">
            <TrendingDownIcon className="size-3.5" />
            <span>-8.4% vs July burn rate</span>
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Subscriptions</span>
          <p className="text-2xl md:text-3xl font-bold font-mono text-foreground mt-2">₹5,623 / mo</p>
          <span className="text-xs font-mono text-amber-500 mt-1 flex items-center gap-1">
            <AlertTriangleIcon className="size-3.5" />
            <span>1 renewal in next 72 hours</span>
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client Retainers Pending</span>
          <p className="text-2xl md:text-3xl font-bold font-mono text-foreground mt-2">₹2,30,000</p>
          <span className="text-xs font-mono text-emerald-500 mt-1 flex items-center gap-1">
            <CheckCircle2Icon className="size-3.5" />
            <span>100% matched to invoices</span>
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Subscription Radar */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Upcoming Subscription Renewals</h3>
                <p className="text-xs text-muted-foreground">Pre-warned alerts before auto-debits trigger</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">4 Tracked</span>
            </div>

            <div className="flex flex-col gap-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.name}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                    sub.daysRemaining <= 3
                      ? "bg-amber-500/5 border-amber-500/30"
                      : "bg-muted/20 border-border/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-muted border border-border/60 flex items-center justify-center font-bold text-xs">
                      {sub.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{sub.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{sub.cadence} • Next: {sub.nextRenewal}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono text-foreground">{sub.amount}</span>
                    {sub.daysRemaining <= 3 ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-mono font-bold">
                        {sub.daysRemaining}d Left
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Local Bank Statement Decryption Tool */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary border-b border-border/40 pb-3">
              <LockIcon className="size-4" />
              <h3 className="text-sm font-bold text-foreground">Local Statement Decrypt Vault</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Drop password-protected bank statement PDFs (SBI, HDFC, Chase). Decryption runs locally in-browser memory. Passwords are never sent to external servers.
            </p>

            <div className="p-3.5 rounded-xl bg-muted/30 border border-dashed border-border/60 flex items-center gap-3">
              <FileTextIcon className="size-8 text-primary shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate">SBI_Statement_Aug2026.pdf</span>
                <span className="text-[10px] font-mono text-muted-foreground">Encrypted • 14 Transactions Detected</span>
              </div>
            </div>

            <form onSubmit={handleDecryptStatement} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="Enter statement password (e.g., DOB / PAN)..."
                value={statementPassword}
                onChange={(e) => setStatementPassword(e.target.value)}
                className="w-full h-9 rounded-xl bg-muted/40 px-3 text-xs text-foreground placeholder:text-muted-foreground border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <Button
                type="submit"
                disabled={isDecrypting || !statementPassword}
                className="h-9 gap-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
              >
                {isDecrypting ? (
                  <>
                    <span className="size-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Decrypting Locally...</span>
                  </>
                ) : (
                  <>
                    <UnlockIcon className="size-3.5" />
                    <span>Decrypt &amp; Audit Categories</span>
                  </>
                )}
              </Button>
            </form>

            {decryptedSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1.5 text-xs text-emerald-500 font-mono">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2Icon className="size-4" />
                  <span>Decrypted 14 Entries (₹18,420 total)</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Food: ₹4,200 • Software: ₹2,400 • Subscriptions: ₹3,100 • Travel: ₹2,100 • Bills: ₹3,000
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
