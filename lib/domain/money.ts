/**
 * Money handling.
 *
 * Amounts are integers in minor units (paise, cents) everywhere — the database
 * column is a BigInt and nothing converts to a float in between. Floating point
 * cannot represent 0.1, so a running total of rupee amounts drifts; for a system
 * whose whole job is telling the user what they spent, that is disqualifying.
 */

export type Money = {
  minor: bigint
  currency: string
}

export function money(minor: bigint | number, currency = "INR"): Money {
  const safeMinor =
    typeof minor === "bigint" ? minor : BigInt(Math.round(Number(minor) || 0))
  return { minor: safeMinor, currency }
}

/// Parses "1,234.56" or "1234" into minor units without ever touching a float.
export function parseAmount(input: string): bigint | null {
  const cleaned = input.replace(/[\s,₹$€£]/g, "").trim()
  const match = cleaned.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/)

  if (!match) return null

  const [, sign, whole, fraction = ""] = match
  const minor = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"))

  return sign === "-" ? -minor : minor
}

export function formatMoney(value: Money): string {
  const negative = value.minor < BigInt(0)
  const abs = negative ? -value.minor : value.minor
  const whole = abs / BigInt(100)
  const fraction = abs % BigInt(100)

  const grouped = whole
    .toString()
    // Indian digit grouping: last three, then pairs (1,23,456).
    .replace(/(\d)(?=(\d\d)+\d$)/g, "$1,")

  const symbol = value.currency === "INR" ? "₹" : `${value.currency} `

  return `${negative ? "-" : ""}${symbol}${grouped}.${fraction
    .toString()
    .padStart(2, "0")}`
}

export function sumMinor(amounts: Array<bigint>): bigint {
  return amounts.reduce((total, amount) => total + amount, BigInt(0))
}

/**
 * Converts to a JS number for display and JSON.
 *
 * Safe for any realistic personal balance — Number.MAX_SAFE_INTEGER in paise is
 * about ₹90 trillion — but it throws rather than silently rounding if that is
 * ever exceeded, because a wrong total shown confidently is the failure mode
 * this module exists to prevent.
 */
export function minorToNumber(minor: bigint): number {
  if (minor > BigInt(Number.MAX_SAFE_INTEGER) || minor < -BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("Amount is too large to convert precisely")
  }
  return Number(minor)
}

/// Percentage change between two periods, rounded to one decimal. Null when the
/// previous period was zero, since "up ∞%" is not useful.
export function percentChange(previous: bigint, current: bigint): number | null {
  if (previous === BigInt(0)) return null
  const delta = Number(current - previous)
  return Math.round((delta / Number(previous)) * 1000) / 10
}
