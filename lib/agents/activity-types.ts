/**
 * System Activity & Agent Execution Types (docs/modules/spinner.txt)
 *
 * Defines the formal activity states, agent identities, and event payloads
 * for transparent, real-time background execution in Personal OS.
 */

export type SystemStatus =
  | "idle"
  | "listening"
  | "processing"
  | "thinking"
  | "searching"
  | "syncing"
  | "executing"
  | "waiting_approval"
  | "completed"
  | "failed"

export type AgentRole =
  | "inbox"
  | "email"
  | "finance"
  | "drive"
  | "calendar"
  | "planning"
  | "system"

export interface AgentIdentity {
  id: AgentRole
  name: string
  title: string
  description: string
  iconName: "Inbox" | "Mail" | "Wallet" | "Folder" | "Calendar" | "Compass" | "Cpu"
  color: string
}

export const AGENT_REGISTRY: Record<AgentRole, AgentIdentity> = {
  inbox: {
    id: "inbox",
    name: "Inbox Agent",
    title: "Capture & Triage",
    description: "Extracts briefs, notes, screenshots, and audio into structured graph items.",
    iconName: "Inbox",
    color: "#6366f1", // indigo
  },
  email: {
    id: "email",
    name: "Email Agent",
    title: "Communication Intelligence",
    description: "Monitors client threads, categorizes invoices, and manages subscriptions.",
    iconName: "Mail",
    color: "#06b6d4", // cyan
  },
  finance: {
    id: "finance",
    name: "Finance Agent",
    title: "Financial Ledger & Statements",
    description: "Parses bank statements, reconciles GST invoices, and projects cash flow.",
    iconName: "Wallet",
    color: "#10b981", // emerald
  },
  drive: {
    id: "drive",
    name: "Drive Agent",
    title: "Asset & File Discovery",
    description: "Indexes brand assets, PDFs, and video links for automated context packs.",
    iconName: "Folder",
    color: "#f59e0b", // amber
  },
  calendar: {
    id: "calendar",
    name: "Calendar Agent",
    title: "Time & Deadlines",
    description: "Blocks conflict-free execution focus time and syncs meeting agendas.",
    iconName: "Calendar",
    color: "#ec4899", // pink
  },
  planning: {
    id: "planning",
    name: "Planning Agent",
    title: "Chief of Staff & Agenda",
    description: "Calculates Next Best Action and ranks priority queues by deadline urgency.",
    iconName: "Compass",
    color: "#8b5cf6", // purple
  },
  system: {
    id: "system",
    name: "Personal OS Core",
    title: "Operating System Engine",
    description: "Background worker queues, event bus, and database migrations.",
    iconName: "Cpu",
    color: "#64748b", // slate
  },
}

export type AgentRunStatus =
  | "queued"
  | "running"
  | "waiting"
  | "approval_required"
  | "completed"
  | "failed"
  | "cancelled"

export interface AgentStep {
  id: string
  label: string
  status: "pending" | "running" | "completed" | "failed"
  detail?: string
  startedAt?: string
  completedAt?: string
}

export interface AgentRun {
  id: string
  agentId: AgentRole
  title: string
  status: AgentRunStatus
  currentStep?: string
  steps?: AgentStep[]
  progress?: {
    current: number
    total: number
    unit?: string
  }
  startedAt: string
  updatedAt: string
  completedAt?: string
  error?: string
  approvalPrompt?: {
    action: string
    details: Record<string, unknown>
  }
}

export interface AgentActivityEvent {
  type:
    | "agent.run.started"
    | "agent.step.started"
    | "agent.tool.started"
    | "agent.tool.completed"
    | "agent.run.completed"
    | "agent.run.failed"
  payload: {
    runId: string
    agentId: AgentRole
    status?: AgentRunStatus
    step?: string
    tool?: string
    progress?: { current: number; total: number; unit?: string }
    error?: string
    summary?: string
  }
  timestamp: string
}
