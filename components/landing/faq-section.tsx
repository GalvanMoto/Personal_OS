"use client"

import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

const faqs = [
  {
    question: "Is DLRS Personal OS truly 100% open source?",
    answer:
      "Yes. The entire codebase is licensed under the MIT license and hosted openly on GitHub. You have full freedom to inspect the source code, self-host on your own infrastructure, customize agent tools, or contribute upstream.",
  },
  {
    question: "Can I run DLRS completely offline with local LLMs (Ollama / vLLM)?",
    answer:
      "Yes! DLRS uses a pluggable model abstraction. You can point it to a local Ollama endpoint (e.g. Llama 3, Qwen 2.5, Mistral) for 100% offline and private task extraction, or plug in Azure OpenAI, Claude, or Gemini when you want cloud models.",
  },
  {
    question: "How does the Universal Control Plane work across different modules?",
    answer:
      "Unlike traditional chatbot add-ons, the Assistant in Personal OS is the universal operating layer. Saying 'I pay Contabo €12 every month with this link' automatically classifies the merchant, creates the subscription entity, schedules a deterministic reminder, links the billing URL, and sets up upcoming expense ledger rows without touching manual forms.",
  },
  {
    question: "How does the AES-256 encrypted vault handle bank statement passwords?",
    answer:
      "Your secret patterns (PAN, DOB, phone suffix) are encrypted at rest using AES-256-GCM. When parsing bank statement PDFs, DLRS tries password combinations purely in-memory. Raw credentials are never printed in logs or sent over telemetry.",
  },
  {
    question: "How do I self-host DLRS with Docker?",
    answer:
      "You can spin up the full stack (Next.js app + PostgreSQL database + background workers) using `docker compose up -d`. All environment variables and volume bindings are documented in the repository.",
  },
  {
    question: "How does DLRS compare to Notion, ClickUp, or Todoist?",
    answer:
      "Traditional tools require heavy data entry: creating tables, selecting properties, dragging cards, and updating status fields manually. DLRS is an autonomous OS: you drop raw unstructured inputs (voice, WhatsApp screenshots, PDF statements), and the agent pipeline takes care of organization and asset linking.",
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-16 sm:py-24 border-b bg-muted/20 relative">
      <div className="mx-auto max-w-[--fd-layout-width] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="outline" className="font-mono text-xs gap-1.5 px-3 py-1">
            <HelpCircle className="size-3.5 text-indigo-500" /> Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Everything You Need to Know
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Straightforward details on open source licensing, self-hosting, local LLMs, and zero-knowledge privacy.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="px-5 sm:px-6 data-[state=open]:bg-muted/15 border-b border-border/60 last:border-0 transition-colors"
              >
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline py-4.5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-5 pr-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Have more questions?{" "}
            <a href="https://github.com/GalvanMoto/Personal_OS/issues" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground font-medium">
              Open a GitHub Issue
            </a>{" "}
            or{" "}
            <a href="/docs" className="underline underline-offset-4 hover:text-foreground font-medium">
              explore the docs
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
