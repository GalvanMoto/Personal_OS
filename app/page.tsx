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

export default async function LandingPage() {
  const user = await getCurrentUser()
  const workspaces = user ? await getWorkspaces() : []
  const activeWorkspace = workspaces[0] ?? null

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20 selection:text-indigo-400">
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
