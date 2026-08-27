import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { AgentLoopState } from "@tanstack/ai"

import {
  briefingStrategy,
  defaultAgentStrategy,
  maxToolCalls,
  stopOnFirstAnswer,
  underMessageBudget,
} from "@/lib/ai/agent/strategies"

function state(overrides: Partial<AgentLoopState> = {}): AgentLoopState {
  return {
    iterationCount: 0,
    messages: [],
    finishReason: null,
    toolCallCount: 0,
    ...overrides,
  } as AgentLoopState
}

describe("agent loop strategies", () => {
  it("caps cumulative tool calls across the run", () => {
    const strategy = maxToolCalls(3)
    assert.equal(strategy(state({ toolCallCount: 2 })), true)
    assert.equal(strategy(state({ toolCallCount: 3 })), false)
  })

  it("stops once the conversation outgrows its budget", () => {
    const strategy = underMessageBudget(2)
    assert.equal(strategy(state({ messages: [] })), true)
    assert.equal(
      strategy(state({ messages: [{}, {}] as AgentLoopState["messages"] })),
      false
    )
  })

  it("stops as soon as the model answers instead of calling a tool", () => {
    const strategy = stopOnFirstAnswer()
    assert.equal(strategy(state({ finishReason: "tool_calls" })), true)
    assert.equal(strategy(state({ finishReason: "stop" })), false)
  })

  it("requires every clause of the default strategy to agree", () => {
    // Well inside every limit.
    assert.equal(defaultAgentStrategy(state({ iterationCount: 1 })), true)

    // Any single limit being hit ends the run.
    assert.equal(defaultAgentStrategy(state({ iterationCount: 8 })), false)
    assert.equal(defaultAgentStrategy(state({ toolCallCount: 24 })), false)
    assert.equal(
      defaultAgentStrategy(
        state({ messages: Array.from({ length: 120 }) as AgentLoopState["messages"] })
      ),
      false
    )
  })

  it("holds the briefing loop tighter than the general one", () => {
    const midRun = state({ iterationCount: 4, toolCallCount: 4 })
    assert.equal(briefingStrategy(midRun), false)
    assert.equal(defaultAgentStrategy(midRun), true)
  })
})
