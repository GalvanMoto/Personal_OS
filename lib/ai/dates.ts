/**
 * Natural-language deadline resolution.
 *
 * Deliberately not a model call (PRD §20): dates are arithmetic, and a model
 * that occasionally reads "Friday" as the wrong Friday produces a class of bug
 * the user cannot see until they miss a deadline. Everything here is pure and
 * testable, and every result carries the phrase it came from so the UI can ask
 * "I read 'by Friday' as 28 Aug — right?"
 */

export type ResolvedDate = {
  date: Date
  /// The exact substring that produced this date.
  phrase: string
  /// 1 for an explicit calendar date, lower for phrases needing interpretation.
  confidence: number
}

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const

const DAY_MS = 24 * 60 * 60 * 1000

/// Deadlines land at the end of the named day: "by Friday" means before Friday
/// is over, not at midnight when Friday begins.
function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    0
  )
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

function monthIndex(name: string): number {
  const lower = name.toLowerCase()
  return MONTHS.findIndex((month) => month.startsWith(lower.slice(0, 3)))
}

/**
 * Resolves a weekday name relative to `now`.
 *
 * "friday" said on a Friday means today — people say "by Friday" about the day
 * they are standing in. "next friday" always skips a week.
 */
function resolveWeekday(target: number, now: Date, explicitNext: boolean): Date {
  const today = now.getDay()
  let delta = (target - today + 7) % 7

  if (explicitNext) {
    delta = delta === 0 ? 7 : delta + 7
  }

  return endOfDay(addDays(now, delta))
}

type Rule = {
  pattern: RegExp
  confidence: number
  resolve: (match: RegExpMatchArray, now: Date) => Date | null
}

const RULES: Rule[] = [
  // ISO first: unambiguous, so it wins before any looser numeric form.
  {
    pattern: /\b(\d{4})-(\d{2})-(\d{2})\b/,
    confidence: 1,
    resolve: (m) =>
      endOfDay(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))),
  },
  // "28 Aug", "28 August 2026", "28th Aug"
  {
    pattern:
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:\s+(\d{4}))?\b/i,
    confidence: 0.95,
    resolve: (m, now) => {
      const month = monthIndex(m[2])
      if (month < 0) return null
      const year = m[3] ? Number(m[3]) : now.getFullYear()
      const candidate = endOfDay(new Date(year, month, Number(m[1])))
      // A bare "28 Aug" already past this year almost always means next year.
      return !m[3] && candidate < now
        ? endOfDay(new Date(year + 1, month, Number(m[1])))
        : candidate
    },
  },
  // "Aug 28", "August 28th, 2026"
  {
    pattern:
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/i,
    confidence: 0.95,
    resolve: (m, now) => {
      const month = monthIndex(m[1])
      if (month < 0) return null
      const year = m[3] ? Number(m[3]) : now.getFullYear()
      const candidate = endOfDay(new Date(year, month, Number(m[2])))
      return !m[3] && candidate < now
        ? endOfDay(new Date(year + 1, month, Number(m[2])))
        : candidate
    },
  },
  // "28/08" or "28-08-2026", read day-first (Indian and European convention).
  {
    pattern: /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/,
    confidence: 0.75,
    resolve: (m, now) => {
      const day = Number(m[1])
      const month = Number(m[2]) - 1
      if (day > 31 || month > 11) return null
      let year = m[3] ? Number(m[3]) : now.getFullYear()
      if (year < 100) year += 2000
      const candidate = endOfDay(new Date(year, month, day))
      return !m[3] && candidate < now
        ? endOfDay(new Date(year + 1, month, day))
        : candidate
    },
  },
  {
    pattern: /\bday after tomorrow\b/i,
    confidence: 0.95,
    resolve: (_m, now) => endOfDay(addDays(now, 2)),
  },
  {
    pattern: /\btomorrow\b/i,
    confidence: 0.95,
    resolve: (_m, now) => endOfDay(addDays(now, 1)),
  },
  {
    pattern: /\b(today|tonight|end of day|eod)\b/i,
    confidence: 0.95,
    resolve: (_m, now) => endOfDay(now),
  },
  {
    pattern: /\bin\s+(\d{1,3})\s+(day|days|week|weeks|month|months)\b/i,
    confidence: 0.9,
    resolve: (m, now) => {
      const n = Number(m[1])
      const unit = m[2].toLowerCase()
      if (unit.startsWith("day")) return endOfDay(addDays(now, n))
      if (unit.startsWith("week")) return endOfDay(addDays(now, n * 7))
      const shifted = new Date(now)
      shifted.setMonth(shifted.getMonth() + n)
      return endOfDay(shifted)
    },
  },
  // "by/before/on [next] friday"
  {
    pattern:
      /\b(?:by|before|on|due|until|till)?\s*(this|next|coming)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i,
    confidence: 0.8,
    resolve: (m, now) => {
      const target = WEEKDAYS.indexOf(
        m[2].toLowerCase() as (typeof WEEKDAYS)[number]
      )
      if (target < 0) return null
      return resolveWeekday(target, now, m[1]?.toLowerCase() === "next")
    },
  },
  {
    pattern: /\b(end of (?:the )?week|eow)\b/i,
    confidence: 0.7,
    // Friday, the working end of the week.
    resolve: (_m, now) => resolveWeekday(5, now, false),
  },
  {
    pattern: /\bnext week\b/i,
    confidence: 0.6,
    resolve: (_m, now) => endOfDay(addDays(now, 7)),
  },
  {
    pattern: /\b(end of (?:the )?month|eom)\b/i,
    confidence: 0.7,
    resolve: (_m, now) =>
      endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  },
]

/**
 * Finds the first resolvable date phrase in `text`.
 *
 * Rules are ordered most-explicit first and the earliest match in the text
 * wins among equally confident rules, so "ship by Friday, invoice on 28 Aug"
 * reads the deadline attached to the ask rather than the later date.
 */
export function findDate(text: string, now = new Date()): ResolvedDate | null {
  let best: (ResolvedDate & { index: number }) | null = null

  for (const rule of RULES) {
    const match = text.match(rule.pattern)
    if (!match || match.index === undefined) continue

    const date = rule.resolve(match, now)
    if (!date || Number.isNaN(date.getTime())) continue

    const candidate = {
      date,
      phrase: match[0].trim(),
      confidence: rule.confidence,
      index: match.index,
    }

    if (
      !best ||
      candidate.confidence > best.confidence ||
      (candidate.confidence === best.confidence && candidate.index < best.index)
    ) {
      best = candidate
    }
  }

  if (!best) return null

  return { date: best.date, phrase: best.phrase, confidence: best.confidence }
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
