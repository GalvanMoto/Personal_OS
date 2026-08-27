import * as React from "react"
import Link from "next/link"
import { Metadata } from "next"
import { Sparkles, ArrowLeft, ShieldCheck, Lock, Cpu, Eye, FileText, Database, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "Privacy Policy | DLRS Personal OS",
  description: "Learn how DLRS protects your private data, multimodal inputs, connected drives, and financial statements.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20 selection:text-indigo-400">
      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb / Back Link */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Page Header */}
          <div className="space-y-4 border-b border-border/60 pb-8 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              <ShieldCheck className="size-3.5" />
              <span>Trust &amp; Transparency</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <span>Effective Date: August 26, 2026</span>
              <span>•</span>
              <span>Version: 2.0 (Autonomous OS)</span>
            </div>
          </div>

          {/* Quick Summary Card */}
          <Card className="mb-12 border-indigo-500/30 bg-indigo-500/5 backdrop-blur-xs">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Lock className="size-4 text-indigo-400" />
                <span>Our Core Privacy Guarantee</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                DLRS is built as your personal command center. <strong className="text-foreground">We never sell your data, and we do not train public AI models on your raw messages, uploaded screenshots, voice memos, or financial statements.</strong> Your information is processed strictly to execute your requested tasks, extract context, and power your personal daily OS.
              </p>
            </CardContent>
          </Card>

          {/* Policy Content */}
          <div className="space-y-12 text-sm leading-relaxed text-muted-foreground">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">1.</span> Information We Collect &amp; Ingest
              </h2>
              <p>
                To provide autonomous task extraction and personal operating system capabilities, DLRS receives various forms of raw data that you intentionally provide:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong className="text-foreground">Multimodal Task Inputs:</strong> Text messages, screenshots, voice notes, images, PDFs, URLs, and forwarded emails you submit via the Universal Inbox or Telegram bot bridge.</li>
                <li><strong className="text-foreground">Connected Cloud Metadata:</strong> File identifiers, folder hierarchies, and download URLs from integrations you authorize (such as Google Drive or cloud storage).</li>
                <li><strong className="text-foreground">Financial Statement Metadata:</strong> Passcode-protected or raw statement documents you upload for expense breakdown, transaction categorization, and subscription radar.</li>
                <li><strong className="text-foreground">Account &amp; Workspace Data:</strong> Name, email address, password hash, workspace settings, and role memberships.</li>
                <li><strong className="text-foreground">System Telemetry:</strong> Anonymized diagnostic data, error logs, and session metrics to ensure high system availability.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">2.</span> How DLRS AI Processes Your Information
              </h2>
              <p>
                When you drop an unstructured file or message into DLRS, our extraction pipeline executes the following sequence:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Cpu className="size-3.5 text-indigo-400" />
                    <span>Semantic Task Extraction</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Extracts project titles, deadlines, subtasks, client constraints, and expected deliverables.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Key className="size-3.5 text-indigo-400" />
                    <span>Asset Graph Discovery</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Matches task requirements against your authorized connected storage to link logos, RAW files, and docs.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">3.</span> Financial &amp; Bank Statement Security
              </h2>
              <p>
                DLRS handles bank statements and expense invoices with strict safeguards:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong className="text-foreground">Client-Side / Local Decryption:</strong> Password-protected PDFs are processed locally using your configured password templates without transmitting raw banking passwords to unencrypted logs.</li>
                <li><strong className="text-foreground">No Direct Banking Credentials:</strong> DLRS does not request or store your online banking login credentials (net banking passwords or 2FA OTPs).</li>
                <li><strong className="text-foreground">Ephemerality:</strong> Once transactions and recurring subscription metadata are parsed into your workspace ledger, raw parsed memory caches are cleared.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">4.</span> Third-Party Integrations &amp; OAuth
              </h2>
              <p>
                DLRS connects to external services solely on your behalf:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong className="text-foreground">Telegram Bot Bridge:</strong> Messages sent to your connected DLRS Telegram bot are encrypted in transit and mapped directly to your workspace.</li>
                <li><strong className="text-foreground">Google Workspace &amp; Drive:</strong> We only access file paths, metadata, and asset previews that match the search queries of your active tasks.</li>
                <li><strong className="text-foreground">No Third-Party Sharing:</strong> We do not sell, rent, or trade your personal data or customer inputs to advertisers.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">5.</span> Data Isolation &amp; Retention
              </h2>
              <p>
                Every workspace in DLRS is securely isolated. Your workspace data cannot be accessed by other workspaces. You can permanently export or delete your workspace, task history, and stored assets at any time through your Workspace Settings.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">6.</span> Your Rights &amp; Data Portability
              </h2>
              <p>
                Under global privacy standards (including GDPR and CCPA regulations), you have the right to access, rectify, export, or request the deletion of all personal data held in DLRS.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3 border-t border-border/60 pt-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">7.</span> Contact &amp; Privacy Officer
              </h2>
              <p>
                If you have questions regarding this Privacy Policy or data security practices, please contact us at:
              </p>
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs font-mono">
                <p className="text-foreground font-bold">DLRS Security &amp; Privacy Team</p>
                <p>Email: privacy@dlrs.app</p>
                <p>Web: https://dlrs.app</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
