import "server-only"

import type { ToolRisk } from "@/lib/agents/tools"

/**
 * Agent Control Plane (PRD §12, §25, §41, §44).
 *
 * Formalizes the 10 specialized agent roles, their permission scopes,
 * allowable tools, and safety boundaries. "Agents decide. Your application controls."
 */

export type AgentScope =
  | "inbox.read"
  | "inbox.write"
  | "tasks.read"
  | "tasks.write"
  | "projects.read"
  | "projects.write"
  | "email.read"
  | "email.draft"
  | "email.send"
  | "drive.read"
  | "drive.search"
  | "calendar.read"
  | "calendar.write"
  | "finance.read"
  | "finance.write"
  | "finance.categories.write"
  | "reminders.read"
  | "reminders.write"
  | "notifications.write"
  | "context.read"

export type AgentDefinition = {
  id: string
  name: string
  role: string
  purpose: string
  scopes: AgentScope[]
  allowedTools: string[]
  canRequireApproval: boolean
  maxRiskLevel: ToolRisk
}

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  inbox: {
    id: "inbox",
    name: "Inbox Intelligence Agent",
    role: "Unstructured Data Normalizer",
    purpose: "Parses dropped text, screenshots, voice notes, PDFs, and URLs into entity graph nodes.",
    scopes: ["inbox.read", "inbox.write", "tasks.write", "projects.write", "context.read"],
    allowedTools: ["create_task", "create_project", "search_tasks"],
    canRequireApproval: false,
    maxRiskLevel: "SAFE",
  },
  task: {
    id: "task",
    name: "Task & Execution Agent",
    role: "Deliverable Prioritization & Lifecycle",
    purpose: "Manages task status transitions, dependency tracking, subtasks, and deadlines.",
    scopes: ["tasks.read", "tasks.write", "projects.read", "reminders.write"],
    allowedTools: ["search_tasks", "create_task", "update_task", "complete_task", "delete_task"],
    canRequireApproval: true,
    maxRiskLevel: "SENSITIVE",
  },
  project: {
    id: "project",
    name: "Project & Initiative Agent",
    role: "Milestone & Progress Coordinator",
    purpose: "Tracks client projects, deliverables velocity, reference files, and calendar milestones.",
    scopes: ["projects.read", "projects.write", "tasks.read", "context.read"],
    allowedTools: ["create_project", "search_tasks", "get_project_context"],
    canRequireApproval: false,
    maxRiskLevel: "SAFE",
  },
  email: {
    id: "email",
    name: "Email Intelligence Agent",
    role: "Communication Stream Triage",
    purpose: "Ingests Gmail threads, extracts client briefs, detects invoices, and flags follow-ups.",
    scopes: ["email.read", "email.draft", "tasks.write", "reminders.write"],
    allowedTools: ["search_emails", "create_task", "create_reminder"],
    canRequireApproval: true,
    maxRiskLevel: "CONFIRM",
  },
  drive: {
    id: "drive",
    name: "Drive & File Asset Agent",
    role: "Cloud Knowledge Indexer",
    purpose: "Indexes connected Google Drive folders, vector logos, briefs, and brand reference assets.",
    scopes: ["drive.read", "drive.search", "context.read"],
    allowedTools: ["search_drive", "get_drive_file", "search_document"],
    canRequireApproval: false,
    maxRiskLevel: "SAFE",
  },
  calendar: {
    id: "calendar",
    name: "Calendar & Schedule Agent",
    role: "Time Block & Meeting Coordinator",
    purpose: "Synchronizes two-way client meetings, blocks focused execution time, and spots conflicts.",
    scopes: ["calendar.read", "calendar.write", "tasks.read"],
    allowedTools: ["search_calendar", "create_calendar_event", "update_calendar_event"],
    canRequireApproval: true,
    maxRiskLevel: "CONFIRM",
  },
  finance: {
    id: "finance",
    name: "Financial Intelligence Agent",
    role: "Deterministic Statement & Ledger Engine",
    purpose: "Parses bank PDF tables (SBI, HDFC, ICICI, Chase), detects subscriptions, and audits cash flow. Fully manages subscriptions as universal control plane.",
    scopes: ["finance.read", "finance.categories.write", "reminders.write", "notifications.write"],
    allowedTools: [
      "spending_summary",
      "upcoming_payments",
      "create_subscription",
      "search_subscriptions",
      "get_subscription",
      "update_subscription",
      "cancel_subscription",
      "pause_subscription",
    ],
    canRequireApproval: false,
    maxRiskLevel: "SAFE",
  },
  reminder: {
    id: "reminder",
    name: "Proactive Reminder Agent",
    role: "Contextual Alert Dispatcher",
    purpose: "Synthesizes multi-channel notifications (PWA push, audio chimes) before deadlines hurt.",
    scopes: ["reminders.read", "reminders.write", "notifications.write", "tasks.read"],
    allowedTools: ["create_reminder", "create_notification"],
    canRequireApproval: false,
    maxRiskLevel: "SAFE",
  },
  planning: {
    id: "planning",
    name: "Chief-of-Staff Planning Agent",
    role: "Multi-factor Agenda Scorer",
    purpose: "Answers 'What should I do now?' by evaluating deadlines, client importance, and blockers.",
    scopes: ["tasks.read", "projects.read", "calendar.read", "context.read"],
    allowedTools: ["recommend_next_action", "get_agenda", "get_context_pack", "explain_claim"],
    canRequireApproval: false,
    maxRiskLevel: "SAFE",
  },
  notification: {
    id: "notification",
    name: "Notification & Alert Agent",
    role: "Multi-Channel Push Router",
    purpose: "Routes critical alerts to PWA service worker and produces Web Audio API chimes.",
    scopes: ["notifications.write", "reminders.read"],
    allowedTools: ["create_notification"],
    canRequireApproval: false,
    maxRiskLevel: "SAFE",
  },
}

/**
 * Policy Engine permission checker.
 * Evaluates whether an agent has authorization to execute a tool.
 */
export function checkAgentPolicy(
  agentId: string,
  toolName: string,
  _risk: ToolRisk
): { allowed: boolean; reason?: string } {
  const agent = AGENT_REGISTRY[agentId]
  if (!agent) {
    // Default orchestrator permissions
    return { allowed: true }
  }

  if (agent.allowedTools.length > 0 && !agent.allowedTools.includes(toolName)) {
    return {
      allowed: false,
      reason: `Agent "${agent.name}" is not authorized to invoke tool "${toolName}".`,
    }
  }

  return { allowed: true }
}
