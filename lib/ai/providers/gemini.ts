import type { AIProvider } from "@/lib/ai/provider"
import { extractionResultSchema, type ExtractionResult, type ExtractRequest } from "@/lib/ai/types"

const SYSTEM_INSTRUCTION = `You are the extraction engine of Personal OS.
Extract actionable entities, client, project, tasks with deadlines, dependencies, and provenance from the user's input.
Output valid JSON matching the schema.`

export class GeminiProvider implements AIProvider {
  readonly name = "gemini"
  private model: string

  constructor(model = process.env.GEMINI_MODEL || "gemini-1.5-flash") {
    this.model = model
  }

  async extract(request: ExtractRequest): Promise<ExtractionResult> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set.")
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            parts: [
              {
                text: `Known clients: ${JSON.stringify(request.knownOrganizations ?? [])}
Known projects: ${JSON.stringify(request.knownProjects ?? [])}
Current time: ${request.now ? request.now.toISOString() : new Date().toISOString()}

Input text to extract:
"""
${request.text}
"""`,
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Google Gemini API error (${res.status}): ${err}`)
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"
    const parsed = JSON.parse(text)

    return extractionResultSchema.parse(parsed)
  }
}

export const geminiProvider = new GeminiProvider()
