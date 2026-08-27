import type { AIProvider } from "@/lib/ai/provider"
import { extractionResultSchema, type ExtractionResult, type ExtractRequest } from "@/lib/ai/types"

const SYSTEM_PROMPT = `You are the extraction engine of Personal OS.
Extract actionable entities, client, project, tasks with deadlines, dependencies, and provenance from the user's input.
Output ONLY raw valid JSON conforming to the requested schema. No markdown formatting, no code fences.`

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic"
  private model: string

  constructor(model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022") {
    this.model = model
  }

  async extract(request: ExtractRequest): Promise<ExtractionResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set.")
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Known clients: ${JSON.stringify(request.knownOrganizations ?? [])}
Known projects: ${JSON.stringify(request.knownProjects ?? [])}
Current time: ${request.now ? request.now.toISOString() : new Date().toISOString()}

Input text to extract:
"""
${request.text}
"""`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic API error (${res.status}): ${err}`)
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text: string }>
    }
    const textBlock = data.content.find((c) => c.type === "text")?.text ?? "{}"
    const cleanJson = textBlock.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
    const parsed = JSON.parse(cleanJson)

    return extractionResultSchema.parse(parsed)
  }
}

export const anthropicProvider = new AnthropicProvider()
