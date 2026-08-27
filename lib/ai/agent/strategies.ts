import { combineStrategies, maxIterations } from "@tanstack/ai"
import type { AgentLoopStrategy } from "@tanstack/ai"

/**
 * Stop strategies for the agent loop.
 *
 * A strategy is just `(state) => boolean` — "may the loop continue?" — so they
 * compose without a framework. The default below is deliberately conservative:
 * an assistant that quietly runs twenty model turns against a personal database
 * is a cost and blast-radius problem, not a feature.
 */

/// Caps cumulative tool calls across the whole run, not per turn. One turn can
/// emit several parallel calls, so `maxIterations` alone is not a spend budget.
export function maxToolCalls(limit: number): AgentLoopStrategy {
  return ({ toolCallCount }) => toolCallCount < limit
}

/// Stops once the conversation grows past a point where more context costs more
/// than it adds.
export function underMessageBudget(limit: number): AgentLoopStrategy {
  return ({ messages }) => messages.length < limit
}

/// Stops the loop as soon as the model produces an answer rather than another
/// tool call — useful for one-shot lookups where a follow-up turn is waste.
export function stopOnFirstAnswer(): AgentLoopStrategy {
  return ({ finishReason }) => finishReason !== "stop"
}

/**
 * What the assistant runs with by default.
 *
 * Every clause has to agree for the loop to continue, so whichever limit is hit
 * first ends the run.
 */
export const defaultAgentStrategy: AgentLoopStrategy = combineStrategies([
  maxIterations(8),
  maxToolCalls(24),
  underMessageBudget(120),
])

/// For read-only surfaces such as the daily briefing, where the agent should
/// look things up and answer without a long deliberation.
export const briefingStrategy: AgentLoopStrategy = combineStrategies([
  maxIterations(3),
  maxToolCalls(6),
])
