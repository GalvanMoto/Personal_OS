"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "How is DLRS different from Notion, Todoist, or ClickUp?",
    answer:
      "Traditional tools are databases where YOU do all the work—typing descriptions, picking dates, tagging, organizing folders, and searching for files. DLRS is an autonomous Personal Operating System: you simply dump unstructured information (screenshots, voice notes, WhatsApp briefs, PDFs), and DLRS extracts the action items, finds the related assets in your cloud drives, and organizes your day for you."
  },
  {
    question: "How does the Telegram bot and mobile PWA integration work?",
    answer:
      "DLRS provides a progressive web app (PWA) that installs on your phone and desktop, along with a dedicated Telegram bot. You can forward audio messages, paste client screenshots, or share links directly into your Telegram chat with DLRS. The system processes them instantaneously and syncs everything with your desktop workspace."
  },
  {
    question: "Can DLRS really read password-protected bank statements?",
    answer:
      "Yes. You can store your standard statement password pattern securely in your encrypted personal settings. When you drop your monthly PDF statement, DLRS decrypts it locally, categorizes recurring subscriptions, tracks outgoing expenses, and alerts you to upcoming renewals without storing your raw banking credentials."
  },
  {
    question: "How does DLRS find and link brand assets automatically?",
    answer:
      "DLRS builds an intelligent context graph of your clients, projects, and connected storage (Google Drive, Dropbox, local folders). When a client sends a brief like 'Use the summer banner and logo from Drive', DLRS identifies the client entity, searches their asset folder, and embeds direct links inside your task workspace."
  },
  {
    question: "What is the 'Work on this Task' focus mode?",
    answer:
      "Instead of cluttering your screen with a giant to-do list, clicking 'Start Task' opens an isolated cockpit containing all client briefs, subtasks, asset downloads, reference videos, and timers specifically relevant to that deliverable."
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Yes. Your data, connected documents, and financial extracts belong exclusively to you. DLRS uses end-to-end encryption in transit and at rest, and does not train public AI models on your private data."
  }
]

export function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-32 bg-muted/20 border-t border-border/40 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 space-y-4">
          <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Everything you need to know about DLRS
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Got questions about how the autonomous ingestion, security, or focus workflows operate? We&apos;ve got answers.
          </p>
        </div>

        <Accordion className="rounded-2xl border border-border bg-card/90 shadow-md backdrop-blur-xs p-2">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="px-4 py-2 border-b border-border/60 last:border-none">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-3">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
