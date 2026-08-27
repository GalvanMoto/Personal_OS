import * as React from "react"
import Link from "next/link"
import { Metadata } from "next"
import { Scale, ArrowLeft, CheckCircle2, AlertCircle, FileCheck, Shield, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "Terms and Conditions | DLRS Personal OS",
  description: "Terms of Service and legal agreements governing the use of the DLRS Personal Operating System.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20 selection:text-indigo-400">
      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Page Title */}
          <div className="space-y-4 border-b border-border/60 pb-8 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-400">
              <Scale className="size-3.5" />
              <span>Legal Agreements</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Terms &amp; Conditions
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <span>Last Revised: August 26, 2026</span>
              <span>•</span>
              <span>Effective Date: Immediate</span>
            </div>
          </div>

          {/* Key Summary */}
          <Card className="mb-12 border-border/80 bg-card/80 backdrop-blur-xs">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <FileCheck className="size-4 text-emerald-500" />
                <span>Summary in Plain English</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                By accessing or using the DLRS platform, you agree to these Terms. You retain complete ownership of all tasks, screenshots, voice briefs, files, and project assets you upload to DLRS. We provide the autonomous intelligence engine to organize your work, and you agree not to use the service for unlawful or malicious activities.
              </p>
            </CardContent>
          </Card>

          {/* Terms Content */}
          <div className="space-y-12 text-sm leading-relaxed text-muted-foreground">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">1.</span> Acceptance of Terms &amp; Eligibility
              </h2>
              <p>
                These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot; or &quot;you&quot;) and DLRS Inc. (&quot;DLRS&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By creating an account, accessing the progressive web app (PWA), connecting our Telegram bot, or using any DLRS features, you acknowledge that you have read, understood, and agree to be bound by these Terms.
              </p>
              <p className="text-xs">
                You must be at least 18 years of age or have legal parental consent in your jurisdiction to register for an account and use the service.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">2.</span> Service Description &amp; Autonomous Agents
              </h2>
              <p>
                DLRS provides an autonomous personal operating system and command center designed to process multimodal inputs (text, voice, screenshots, documents, forwarded messages), construct actionable workspaces, link cloud assets, and provide proactive daily assistance.
              </p>
              <p>
                We continuously improve our models and algorithms. While our autonomous intelligence engine strives for high accuracy in extracting deadlines, project trees, and expense line items, you acknowledge that AI-generated inferences should be reviewed for critical business deadlines.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">3.</span> Intellectual Property &amp; User Ownership
              </h2>
              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-foreground space-y-1">
                  <strong className="text-emerald-500 font-semibold block">You Own 100% of Your Data</strong>
                  <span>All intellectual property rights in your uploaded materials, screenshots, client audio briefs, logos, documents, and derived workspace projects remain solely with you.</span>
                </div>
                <p>
                  DLRS does not claim any copyright, trademark, or ownership interest in your content. You grant DLRS a limited, non-exclusive license solely to host, parse, cache, and transmit your materials as necessary to operate your workspaces.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">4.</span> Acceptable Use Policy
              </h2>
              <p>
                You agree not to use DLRS to:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li>Upload, transmit, or process unlawful, defamatory, infringing, or harmful content.</li>
                <li>Attempt to bypass workspace isolation, security controls, or authentication mechanisms.</li>
                <li>Deploy automated scraping bots, denial-of-service vectors, or overload system resources.</li>
                <li>Ingest or decrypt banking instruments or documents without proper legal authorization from the respective account holder.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">5.</span> Third-Party Integrations &amp; Cloud Bridges
              </h2>
              <p>
                DLRS connects to third-party platforms including Telegram, Google Workspace, Google Drive, and cloud storage providers. Your use of these services is subject to their respective terms and privacy policies. DLRS is not responsible for external service outages or changes in third-party service availability.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">6.</span> Subscriptions, Billing &amp; Cancellation
              </h2>
              <p>
                DLRS offers free starter tiers and paid pro subscriptions. Paid plans are billed on a recurring monthly or annual basis. You may cancel your subscription at any time through your Workspace Billing settings, and access will continue through the end of your prepaid period.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">7.</span> Disclaimers &amp; Limitation of Liability
              </h2>
              <p className="text-xs sm:text-sm">
                DLRS is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. To the maximum extent permitted by law, DLRS shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of or inability to use the platform.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-3 border-t border-border/60 pt-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-indigo-400">8.</span> Legal Contact &amp; Notices
              </h2>
              <p>
                For questions concerning these Terms, contact our legal counsel at:
              </p>
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs font-mono">
                <p className="text-foreground font-bold">DLRS Legal &amp; Compliance</p>
                <p>Email: legal@dlrs.app</p>
                <p>Website: https://dlrs.app/terms</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
