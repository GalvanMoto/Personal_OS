import type { ExtractionResult, ExtractRequest } from "@/lib/ai/types"

/**
 * Provider abstraction (PRD §30).
 *
 * The application never imports a vendor SDK directly. Swapping the heuristic
 * extractor for a hosted model is a change to `resolveProvider()` and nothing
 * else.
 */
export interface AIProvider {
  readonly name: string
  extract(request: ExtractRequest): Promise<ExtractionResult>
}

let override: AIProvider | null = null

/// Lets tests and workers pin a provider without touching env vars.
export function setProvider(provider: AIProvider | null) {
  override = provider
}

export async function resolveProvider(): Promise<AIProvider> {
  if (override) return override

  const requested = process.env.AI_PROVIDER?.toLowerCase()

  if (requested === "openai" || (!requested && process.env.OPENAI_API_KEY)) {
    try {
      const { openAIProvider } = await import("@/lib/ai/providers/openai")
      return openAIProvider
    } catch (e) {
      console.warn("Failed to load OpenAI provider, falling back to heuristic", e)
    }
  }

  if (requested === "anthropic" || (!requested && process.env.ANTHROPIC_API_KEY)) {
    try {
      const { anthropicProvider } = await import("@/lib/ai/providers/anthropic")
      return anthropicProvider
    } catch (e) {
      console.warn("Failed to load Anthropic provider, falling back to heuristic", e)
    }
  }

  if (requested === "gemini" || (!requested && process.env.GEMINI_API_KEY)) {
    try {
      const { geminiProvider } = await import("@/lib/ai/providers/gemini")
      return geminiProvider
    } catch (e) {
      console.warn("Failed to load Gemini provider, falling back to heuristic", e)
    }
  }

  // The heuristic provider is the default on purpose: the capture → extract →
  // task loop must work with no API key configured, so the system is useful on
  // first run and a model upgrade is additive rather than load-bearing.
  const { heuristicProvider } = await import("@/lib/ai/providers/heuristic")
  return heuristicProvider
}
