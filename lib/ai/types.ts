import { z } from "zod"

/**
 * The contract every extraction provider must satisfy.
 *
 * Validated with zod on the way out of a provider, so a model returning
 * malformed JSON fails at the boundary instead of corrupting the graph. The
 * heuristic provider is held to exactly the same schema.
 */

export const confidenceSchema = z.number().min(0).max(1)

export const extractedEntitySchema = z.object({
  name: z.string().min(1),
  confidence: confidenceSchema,
  /// Verbatim snippet that produced this, for the provenance record.
  evidence: z.string().optional(),
})

export const extractedTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  /// ISO string; the caller turns it into a Date after validation.
  dueAt: z.string().datetime().nullable().default(null),
  confidence: confidenceSchema,
  evidence: z.string().optional(),
})

export const extractedAssetSchema = z.object({
  label: z.string().min(1),
  kind: z.enum([
    "LOGO",
    "IMAGE",
    "VIDEO",
    "DOCUMENT",
    "FOLDER",
    "BRAND",
    "OTHER",
  ]),
  evidence: z.string().optional(),
})

export const extractionResultSchema = z.object({
  summary: z.string(),
  organization: extractedEntitySchema.nullable().default(null),
  project: extractedEntitySchema.nullable().default(null),
  tasks: z.array(extractedTaskSchema).default([]),
  people: z.array(extractedEntitySchema).default([]),
  /// Things the work needs before it can start (PRD §2 "asset search").
  assets: z.array(extractedAssetSchema).default([]),
  deadline: z
    .object({
      dueAt: z.string().datetime(),
      phrase: z.string(),
      confidence: confidenceSchema,
    })
    .nullable()
    .default(null),
  /// Only the questions that genuinely change the outcome (PRD §1).
  questions: z.array(z.string()).default([]),
})

export type ExtractionResult = z.infer<typeof extractionResultSchema>
export type ExtractedTask = z.infer<typeof extractedTaskSchema>
export type ExtractedAsset = z.infer<typeof extractedAssetSchema>

export type ExtractRequest = {
  text: string
  /// Names already in the graph, so the extractor prefers matching an existing
  /// client over inventing a near-duplicate.
  knownOrganizations?: string[]
  knownProjects?: string[]
  now?: Date
}
