import { findDate } from "@/lib/ai/dates"
import type { AIProvider } from "@/lib/ai/provider"
import {
  extractionResultSchema,
  type ExtractedAsset,
  type ExtractedTask,
  type ExtractionResult,
  type ExtractRequest,
} from "@/lib/ai/types"

/**
 * Rule-based extraction.
 *
 * This is the default provider so the whole capture → understand → organise
 * loop works with no API key and no per-message cost. It is genuinely useful on
 * the shapes real client messages take — numbered briefs, "first/second/third"
 * dictation, "N reels for X by Friday" — and every field it emits carries a
 * confidence and the snippet it came from, so a hosted model can later replace
 * it without changing a single consumer.
 */

const ORDINALS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
]

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
}

const ACTION_VERBS = [
  "make",
  "create",
  "edit",
  "design",
  "write",
  "update",
  "fix",
  "prepare",
  "review",
  "send",
  "upload",
  "post",
  "schedule",
  "record",
  "shoot",
  "deliver",
  "build",
  "draft",
  "publish",
  "export",
  "revise",
  "add",
  "remove",
  "change",
  // Inflections listed explicitly rather than stemmed: English is irregular
  // enough that a suffix regex produces more false matches than it saves.
  "updated",
  "updating",
  "edited",
  "editing",
  "made",
  "making",
  "created",
  "creating",
  "designed",
  "designing",
  "written",
  "writing",
  "sent",
  "sending",
  "shooting",
  "recording",
  "reviewing",
  "preparing",
  "delivering",
  "posting",
  "scheduling",
  "exporting",
  "revising",
  "publishing",
  "drafting",
  "building",
  "fixing",
  "adding",
]

/// Words that start a sentence and therefore say nothing about proper nouns.
const STOPWORDS = new Set([
  "the", "a", "an", "please", "hi", "hey", "hello", "bro", "sir", "we", "i",
  "you", "they", "it", "this", "that", "need", "needs", "want", "wants", "can",
  "could", "would", "should", "will", "must", "let", "lets", "also", "and",
  "but", "so", "then", "now", "next", "first", "second", "third", "final",
  "new", "old", "for", "with", "from", "have", "has", "make", "create", "send",
  "there", "here", "just", "kindly", "thanks", "regards", "before", "after",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "today", "tomorrow", "drive", "google",
])

const ASSET_PATTERNS: Array<{ re: RegExp; kind: ExtractedAsset["kind"]; label: string }> = [
  { re: /\blogos?\b/i, kind: "LOGO", label: "Logo" },
  { re: /\bbrand(?:ing)?(?:\s+(?:kit|assets|guidelines))?\b/i, kind: "BRAND", label: "Brand assets" },
  { re: /\bphotos?\b|\bpictures?\b|\bimages?\b|\bpics?\b/i, kind: "IMAGE", label: "Photos" },
  { re: /\bfootage\b|\bclips?\b|\braw video\b/i, kind: "VIDEO", label: "Footage" },
  { re: /\b(?:menu|brief|spec|specs|requirements?)\s+(?:doc|document|pdf|sheet)?\b/i, kind: "DOCUMENT", label: "Document" },
  { re: /\bdocument\b|\bdoc\b|\bpdf\b|\bsheet\b|\bdeck\b/i, kind: "DOCUMENT", label: "Document" },
  { re: /\b(?:google\s+)?drive\b|\bfolder\b|\bdropbox\b/i, kind: "FOLDER", label: "Drive folder" },
]

type Candidate = { title: string; evidence: string; confidence: number }

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => capitalize(word.toLowerCase()))
    .join(" ")
}

/// "3 reels", "three videos" → the deliverable noun and how many are wanted.
function findDeliverable(text: string): { count: number; noun: string } | null {
  const match = text.match(
    /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+([a-z]{3,})s\b/i
  )
  if (!match) return null

  const raw = match[1].toLowerCase()
  const count = NUMBER_WORDS[raw] ?? Number(raw)
  if (!count || count > 20) return null

  return { count, noun: match[2].toLowerCase() }
}

/**
 * Removes the parts of a sentence that are packaging rather than the ask:
 * greetings, "client says:", and the deadline phrase, which is stored as a
 * structured date and would otherwise be duplicated inside the title.
 */
function cleanTitle(value: string, deadlinePhrase?: string): string {
  let title = value
    .replace(/^(?:hi|hey|hello|bro|sir|ma'?am)[,!\s]+/i, "")
    .replace(/^\s*\w[\w\s]{0,20}\s+says\s*:\s*/i, "")
    .replace(
      /^(?:please|kindly|can you|could you|would you|i need you to|i want you to|we need to|we need|i need|need to|need)\s+/i,
      ""
    )
    .replace(/^(?:the|a|an)\s+/i, "")

  if (deadlinePhrase) {
    const escaped = deadlinePhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    title = title.replace(
      new RegExp(`\\s*(?:by|before|on|due|until|till)?\\s*${escaped}\\s*`, "i"),
      " "
    )
  }

  return capitalize(title.replace(/\s+/g, " ").replace(/[.,!?\s]+$/, "").trim())
}

function findVerb(text: string): string {
  const match = text
    .toLowerCase()
    .match(new RegExp(`\\b(${ACTION_VERBS.join("|")})\\b`))
  return match ? match[1] : "create"
}

/// Explicit lists: "1. …", "- …", "• …". The strongest signal available, so
/// these are trusted well above prose parsing.
function fromListMarkers(text: string): Candidate[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^(?:[-*•]|\d{1,2}[.)])\s+/.test(line))
    .map((line) => ({
      title: capitalize(line.replace(/^(?:[-*•]|\d{1,2}[.)])\s+/, "").trim()),
      evidence: line,
      confidence: 0.9,
    }))
    .filter((item) => item.title.length > 2)
}

/// Dictated briefs: "first one should be X, second should show Y, third …".
function fromOrdinals(text: string, noun: string | null): Candidate[] {
  const pattern = new RegExp(`\\b(${ORDINALS.join("|")})\\b`, "gi")
  const marks = [...text.matchAll(pattern)]

  // A single "first" is usually prose ("the first thing"); two or more is a list.
  if (marks.length < 2) return []

  const items: Candidate[] = []

  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index ?? 0
    const end = i + 1 < marks.length ? (marks[i + 1].index ?? text.length) : text.length

    // The last ordinal would otherwise swallow every sentence after it, so cut
    // the clause at its own sentence boundary.
    const raw = text.slice(start, end)
    const stop = raw.search(/[.!?](?:\s|$)/)
    const clause = (stop === -1 ? raw : raw.slice(0, stop))
      .replace(/\s*(?:,|\.|and)\s*$/i, "")
      .trim()

    const subject = clause
      .replace(new RegExp(`^(?:${ORDINALS.join("|")})\\b`, "i"), "")
      .replace(/^\s*(?:one|video|reel|post|item)\b/i, "")
      .replace(/^\s*(?:should|shall|will|must|has to|needs? to|is|are|can)\b/i, "")
      .replace(/^\s*(?:be|being)\b/i, "")
      .replace(/^\s*(?:show|showcase|focus on|highlight|cover|feature|include|be about)\b/i, "")
      .replace(/^\s*(?:the|a|an)\b/i, "")
      .replace(/[.,]+$/, "")
      .trim()

    if (!subject) continue

    const title = noun
      ? `${capitalize(findVerb(text))} ${subject.toLowerCase()} ${noun}`
      : capitalize(subject)

    items.push({ title, evidence: clause, confidence: 0.8 })
  }

  return items
}

/// Prose fallback: sentences that ask for something to be done.
function fromImperatives(text: string, deadlinePhrase?: string): Candidate[] {
  const verbs = ACTION_VERBS.join("|")
  const pattern = new RegExp(`\\b(?:${verbs})\\b`, "i")

  return sentences(text)
    .filter((sentence) => pattern.test(sentence))
    .map((sentence) => ({
      title: cleanTitle(sentence, deadlinePhrase),
      evidence: sentence,
      confidence: 0.6,
    }))
    .filter((item) => item.title.length > 4 && item.title.length < 200)
}

function findOrganization(
  text: string,
  known: string[]
): { name: string; confidence: number; evidence: string } | null {
  // A name already in the graph is the safest match by a wide margin.
  for (const name of known) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const match = text.match(new RegExp(`\\b${escaped}\\b`, "i"))
    if (match) {
      return { name, confidence: 0.95, evidence: match[0] }
    }
  }

  // "for GB Banquet", "client XYZ Media"
  const forMatch = text.match(
    /\b(?:for|client|customer)\s+((?:[A-Z][\w&'-]*)(?:\s+[A-Z][\w&'-]*){0,3})/
  )
  if (forMatch && !STOPWORDS.has(forMatch[1].split(/\s+/)[0].toLowerCase())) {
    return { name: forMatch[1].trim(), confidence: 0.7, evidence: forMatch[0] }
  }

  // Any capitalised phrase that is not sentence-initial boilerplate.
  const proper = [...text.matchAll(/\b([A-Z][\w&'-]{2,}(?:\s+[A-Z][\w&'-]{2,}){0,3})\b/g)]
    .map((match) => match[1])
    .filter((name) => !STOPWORDS.has(name.split(/\s+/)[0].toLowerCase()))
    // Multi-word names are far more likely to be a real client than one word.
    .sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length)

  if (proper.length && proper[0].includes(" ")) {
    return { name: proper[0], confidence: 0.5, evidence: proper[0] }
  }

  return null
}

function findAssets(text: string): ExtractedAsset[] {
  const found = new Map<string, ExtractedAsset>()

  for (const { re, kind, label } of ASSET_PATTERNS) {
    const match = text.match(re)
    if (match && !found.has(label)) {
      found.set(label, { label, kind, evidence: match[0] })
    }
  }

  return [...found.values()]
}

function findPriority(text: string): ExtractedTask["priority"] {
  if (/\b(urgent|asap|immediately|right away|top priority)\b/i.test(text)) {
    return "URGENT"
  }
  if (/\b(important|high priority|priority|critical)\b/i.test(text)) {
    return "HIGH"
  }
  if (/\b(whenever|no rush|low priority|when you can)\b/i.test(text)) {
    return "LOW"
  }
  return "MEDIUM"
}

function findPeople(text: string): Array<{ name: string; confidence: number; evidence: string }> {
  return [...text.matchAll(/\b(?:to|with|cc|from)\s+([A-Z][a-z]{2,})\b/g)]
    .filter((match) => !STOPWORDS.has(match[1].toLowerCase()))
    .map((match) => ({ name: match[1], confidence: 0.5, evidence: match[0] }))
    .slice(0, 5)
}

async function extract(request: ExtractRequest): Promise<ExtractionResult> {
  const text = request.text.trim()
  const now = request.now ?? new Date()

  const deadline = findDate(text, now)
  const deliverable = findDeliverable(text)
  const priority = findPriority(text)
  const organization = findOrganization(text, request.knownOrganizations ?? [])
  const assets = findAssets(text)

  // Strongest signal wins: explicit lists, then dictated ordinals, then prose.
  let candidates = fromListMarkers(text)
  if (candidates.length === 0) {
    candidates = fromOrdinals(text, deliverable?.noun ?? null)
  }
  if (candidates.length === 0) {
    candidates = fromImperatives(text, deadline?.phrase)
  }

  // "3 reels" with only one described item still means three pieces of work.
  if (deliverable && candidates.length > 0 && candidates.length < deliverable.count) {
    const verb = capitalize(findVerb(text))
    for (let i = candidates.length; i < deliverable.count; i++) {
      candidates.push({
        title: `${verb} ${deliverable.noun} ${i + 1}`,
        evidence: `${deliverable.count} ${deliverable.noun}s`,
        confidence: 0.4,
      })
    }
  }

  if (candidates.length === 0 && text.length > 0) {
    candidates = [
      {
        title: capitalize(text.split(/\n/)[0].slice(0, 120)),
        evidence: text.slice(0, 160),
        confidence: 0.3,
      },
    ]
  }

  const tasks: ExtractedTask[] = candidates.slice(0, 20).map((candidate) => ({
    title: candidate.title,
    description: undefined,
    priority,
    // The deadline in the message applies to everything it asks for.
    dueAt: deadline ? deadline.date.toISOString() : null,
    confidence: candidate.confidence,
    evidence: candidate.evidence,
  }))

  const questions: string[] = []

  // Only ask when the answer would actually change what gets stored (PRD §1).
  if (deadline && deadline.confidence < 0.9) {
    questions.push(
      `I read "${deadline.phrase}" as ${deadline.date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      })}. Is that right?`
    )
  }
  if (!organization) {
    questions.push("Which client is this for?")
  }
  if (assets.length > 0 && !/https?:\/\//i.test(text)) {
    questions.push(
      `Where can I find the ${assets.map((asset) => asset.label.toLowerCase()).join(", ")}?`
    )
  }

  const projectName = organization && deliverable
    ? `${organization.name} — ${titleCase(deliverable.noun)}s`
    : null

  return extractionResultSchema.parse({
    summary:
      tasks.length === 1
        ? tasks[0].title
        : `${tasks.length} tasks${organization ? ` for ${organization.name}` : ""}`,
    organization: organization
      ? {
          name: organization.name,
          confidence: organization.confidence,
          evidence: organization.evidence,
        }
      : null,
    project: projectName
      ? { name: projectName, confidence: 0.5, evidence: deliverable?.noun }
      : null,
    tasks,
    people: findPeople(text),
    assets,
    deadline: deadline
      ? {
          dueAt: deadline.date.toISOString(),
          phrase: deadline.phrase,
          confidence: deadline.confidence,
        }
      : null,
    questions,
  })
}

export const heuristicProvider: AIProvider = {
  name: "heuristic",
  extract,
}
