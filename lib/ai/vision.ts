import "server-only"

import { chat, streamToText, type ContentPart } from "@tanstack/ai"

import { agentAdapter, isAgentConfigured } from "@/lib/ai/agent/runtime"

/**
 * Reading text out of an image.
 *
 * A vision model rather than OCR, deliberately. The images this system actually
 * receives are screenshots of client messages, and a model reads those far more
 * accurately than Tesseract while also preserving who said what — which is the
 * part that matters for extraction. It also avoids shipping a 50 MB OCR runtime
 * and its language data.
 *
 * Modality stays at the adapter boundary (PRD §30): this goes through the same
 * `agentAdapter()` as everything else, so it is not a second provider to keep
 * in sync, and it degrades honestly when no key is configured.
 */

export type VisionOutcome =
  | { supported: true; text: string }
  | { supported: false; reason: string }

const SUPPORTED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
])

// Beyond this the request is slow and expensive for no gain — a screenshot of a
// chat message is far smaller.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

const PROMPT = `Transcribe everything readable in this image as plain text.

Rules:
- Reproduce the text exactly. Do not summarise, translate or correct it.
- Keep the reading order, and keep line breaks where they carry meaning.
- For a chat or email screenshot, prefix each message with the sender's name and a colon.
- If a date, amount or link appears, reproduce it character for character.
- If there is no readable text, reply with exactly: NO_TEXT_FOUND`

export function canReadImage(mimeType: string): boolean {
  return SUPPORTED_MIME.has(mimeType.toLowerCase())
}

export async function readImage(
  bytes: Buffer,
  mimeType: string
): Promise<VisionOutcome> {
  if (!canReadImage(mimeType)) {
    return { supported: false, reason: `${mimeType} is not a readable image.` }
  }

  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return {
      supported: false,
      reason: `Images must be under ${MAX_IMAGE_BYTES / 1024 / 1024} MB to be read.`,
    }
  }

  if (!isAgentConfigured()) {
    return {
      supported: false,
      reason: "Image reading needs ANTHROPIC_API_KEY — the file is stored.",
    }
  }

  const content: Array<ContentPart> = [
    { type: "text", content: PROMPT },
    {
      type: "image",
      source: {
        type: "data",
        value: bytes.toString("base64"),
        mimeType: mimeType.toLowerCase(),
      },
    },
  ]

  try {
    const stream = chat({
      adapter: agentAdapter(),
      messages: [{ role: "user", content }],
      // No tools and a single turn: this is a transcription, not a conversation.
      agentLoopStrategy: () => false,
      modelOptions: { max_tokens: 4_000 },
    })

    const text = (await streamToText(stream)).trim()

    if (!text || text === "NO_TEXT_FOUND") {
      return { supported: false, reason: "No readable text in that image." }
    }

    return { supported: true, text }
  } catch (error) {
    // A provider outage must not lose the upload — the file is already stored.
    return {
      supported: false,
      reason: `Could not read the image: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    }
  }
}
