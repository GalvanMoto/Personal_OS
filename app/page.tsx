import * as React from "react"
import { getCurrentUser, getWorkspaces } from "@/lib/auth/dal"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { InteractiveDemo } from "@/components/landing/interactive-demo"
import { FeaturesBento } from "@/components/landing/features-bento"
import { DailyTimeline } from "@/components/landing/daily-timeline"
import { ComparisonSection } from "@/components/landing/comparison-section"
import { FAQSection } from "@/components/landing/faq-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import "@/components/landing/market.css"

export default async function LandingPage() {
  const user = await getCurrentUser()
  const workspaces = user ? await getWorkspaces() : []
  const activeWorkspace = workspaces[0] ?? null

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DLRS Personal OS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, PWA",
    description: "Autonomous Personal OS — capture via screenshot, email, or voice. AI extracts tasks, links Drive assets, and plans your day.",
    url: "https://pos.techwithgalvan.in",
    publisher: { "@type": "Organization", name: "DLRS", url: "https://pos.techwithgalvan.in" },
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: [
      { "@type": "Question", name: "How is DLRS different from Notion, Todoist, or ClickUp?", acceptedAnswer: { "@type": "Answer", text: "DLRS is a Personal OS, not a task manager — it captures raw inputs, extracts tasks, links assets, and plans your day." } },
      { "@type": "Question", name: "Can DLRS really read password-protected bank statements?", acceptedAnswer: { "@type": "Answer", text: "Yes, with your vault (PAN/DOB/phone) stored encrypted, it tries bank-specific passwords in-memory and categorizes transactions." } },
      { "@type": "Question", name: "Is my data private and secure?", acceptedAnswer: { "@type": "Answer", text: "Workspace-isolated, AES-256 vault, tenant-scoped DB, never shares with advertisers." } },
    ],
  }

  return (
    <div className="market-shell min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20 selection:text-indigo-400">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero />
        <InteractiveDemo />
        <FeaturesBento />
        <DailyTimeline />
        <ComparisonSection />
        <FAQSection />
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
