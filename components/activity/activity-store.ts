"use client"

import { useEffect, useState } from "react"
import type { AgentRole, AgentRun, SystemStatus } from "@/lib/agents/activity-types"

type ActivityState = {
  runs: AgentRun[]
  systemStatus: SystemStatus
}

let globalState: ActivityState = {
  runs: [],
  systemStatus: "idle",
}

const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export const activityStore = {
  getState() {
    return globalState
  },

  setRun(run: AgentRun) {
    const existingIndex = globalState.runs.findIndex((r) => r.id === run.id)
    if (existingIndex >= 0) {
      globalState.runs[existingIndex] = { ...globalState.runs[existingIndex], ...run, updatedAt: new Date().toISOString() }
    } else {
      globalState.runs.unshift(run)
    }

    // Determine system status
    const activeRuns = globalState.runs.filter((r) => r.status === "running" || r.status === "queued")
    const waitingRuns = globalState.runs.filter((r) => r.status === "approval_required")

    if (waitingRuns.length > 0) {
      globalState.systemStatus = "waiting_approval"
    } else if (activeRuns.length > 0) {
      globalState.systemStatus = "executing"
    } else {
      globalState.systemStatus = "idle"
    }

    emitChange()
  },

  updateStep(runId: string, stepId: string, status: "pending" | "running" | "completed" | "failed", detail?: string) {
    const run = globalState.runs.find((r) => r.id === runId)
    if (!run) return

    if (run.steps) {
      const step = run.steps.find((s) => s.id === stepId)
      if (step) {
        step.status = status
        if (detail) step.detail = detail
        if (status === "completed") step.completedAt = new Date().toISOString()
      }
    }
    run.updatedAt = new Date().toISOString()
    emitChange()
  },

  clearCompleted() {
    globalState.runs = globalState.runs.filter((r) => r.status === "running" || r.status === "queued" || r.status === "approval_required")
    emitChange()
  },
}

export function useSystemActivity() {
  const [state, setState] = useState<ActivityState>(activityStore.getState())

  useEffect(() => {
    const listener = () => setState({ ...activityStore.getState() })
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const activeRuns = state.runs.filter((r) => r.status === "running" || r.status === "queued")
  const completedRuns = state.runs.filter((r) => r.status === "completed")
  const waitingApproval = state.runs.filter((r) => r.status === "approval_required")

  return {
    status: state.systemStatus,
    runs: state.runs,
    activeRuns,
    completedRuns,
    waitingApproval,
    activeCount: activeRuns.length,
  }
}
