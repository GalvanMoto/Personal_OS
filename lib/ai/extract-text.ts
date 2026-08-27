import { extractText as extractPdfText } from "unpdf"

import { canReadImage, readImage } from "@/lib/ai/vision"

/**
 * Turning an uploaded file into text the extraction pipeline can read.
 *
 * Three routes, chosen by what the format actually needs (PRD §20):
 *  - text formats are decoded directly
 *  - PDFs go through a parser, which is exact and costs nothing
 *  - images go to a vision model, because a screenshot of a client message is
 *    prose a parser cannot help with
 *
 * Anything else returns `supported: false` with a reason the user can read.
 * A silent empty result would be worse than an honest refusal: the user would
 * believe their file had been understood.
 */

export type ExtractionOutcome =
  | { supported: true; text: string; via: "text" | "pdf" | "vision" }
  | { supported: false; reason: string }

const TEXTUAL = [
  "text/",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/x-yaml",
]

const MAX_TEXT_BYTES = 2 * 1024 * 1024
const MAX_PDF_BYTES = 20 * 1024 * 1024

export function isTextual(mimeType: string): boolean {
  return TEXTUAL.some((prefix) => mimeType.startsWith(prefix))
}

/// Whether a format can be read at all. Vision still needs a configured key,
/// which `extractText` reports at the point of use.
export function canExtract(mimeType: string): boolean {
  return (
    isTextual(mimeType) ||
    mimeType === "application/pdf" ||
    canReadImage(mimeType)
  )
}

async function extractPdf(data: Buffer): Promise<ExtractionOutcome> {
  if (data.byteLength > MAX_PDF_BYTES) {
    return {
      supported: false,
      reason: `PDFs must be under ${MAX_PDF_BYTES / 1024 / 1024} MB to be read.`,
    }
  }

  try {
    const { text } = await extractPdfText(new Uint8Array(data), {
      mergePages: true,
    })

    const trimmed = text.trim()

    if (!trimmed) {
      // Almost always a scan: the pages are images with no text layer.
      return {
        supported: false,
        reason:
          "That PDF has no text layer — it is probably a scan. The file is stored.",
      }
    }

    return { supported: true, text: trimmed.slice(0, MAX_TEXT_BYTES), via: "pdf" }
  } catch (error) {
    return {
      supported: false,
      reason: `Could not read that PDF: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    }
  }
}

export async function extractText(
  data: Buffer,
  mimeType: string
): Promise<ExtractionOutcome> {
  if (isTextual(mimeType)) {
    // A huge log file adds nothing once the model has the gist.
    return {
      supported: true,
      text: data.subarray(0, MAX_TEXT_BYTES).toString("utf8"),
      via: "text",
    }
  }

  if (mimeType === "application/pdf") {
    return extractPdf(data)
  }

  if (canReadImage(mimeType)) {
    const outcome = await readImage(data, mimeType)
    return outcome.supported
      ? { supported: true, text: outcome.text, via: "vision" }
      : outcome
  }

  return {
    supported: false,
    reason: `No reader for ${mimeType} — the file is stored.`,
  }
}
