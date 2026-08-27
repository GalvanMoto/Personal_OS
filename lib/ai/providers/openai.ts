import type { AIProvider } from "@/lib/ai/provider"
import { extractionResultSchema, type ExtractionResult, type ExtractRequest } from "@/lib/ai/types"

const SYSTEM_PROMPT = `You are the extraction engine of Personal OS.
Extract actionable entities, client, project, tasks with deadlines, dependencies, and provenance from the user's input.
Return clean JSON conforming to the schema.`

export class OpenAIProvider implements AIProvider {
  readonly name = "openai"
  private model: string

  constructor(model = process.env.OPENAI_MODEL || "gpt-4o-mini") {
    this.model = model
  }

  async extract(request: ExtractRequest): Promise<ExtractionResult> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set.")
    }

    const payload = {
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
      response_format: { type: "json_object" },
      temperature: 0.1,
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI API error (${res.status}): ${err}`)
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>
    }
    const content = data.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(content)

    return extractionResultSchema.parse(parsed)
  }
}

export const openAIProvider = new OpenAIProvider()
