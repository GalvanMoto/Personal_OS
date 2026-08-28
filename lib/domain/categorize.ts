/**
 * Transaction categorisation.
 *
 * Rules, not a model (PRD §20). Bank narrations are short, repetitive and
 * merchant-keyed — exactly the shape rules handle well — and a category that
 * changes between runs would make month-on-month comparisons meaningless.
 * A model is the right tool for the handful that fall through to UNKNOWN, not
 * for the 95% that match "SWIGGY" or "NETFLIX".
 *
 * Enhanced with `cleanDescription` + `deriveMerchant` from chatwithbankstatement
 * (word-boundary, de-spaced, balance-verified) so Jio UPI strings like
 * `UPI/DR/.../SHIV FOOD ZONE/...` resolve to `Shiv Food Zone` (FOOD) instead of
 * raw `UPI/...` (TRANSFER).
 */

export type Category =
  | "FOOD"
  | "TRAVEL"
  | "SHOPPING"
  | "SOFTWARE"
  | "ENTERTAINMENT"
  | "BILLS"
  | "HEALTH"
  | "EDUCATION"
  | "BUSINESS"
  | "INCOME"
  | "TRANSFER"
  | "CASH"
  | "FEES"
  | "UNKNOWN"

type Rule = { category: Category; patterns: RegExp }

/** Strip PDF chrome, footers and repeated bank headers – keeps the merchant. */
export function cleanDescription(description: string): string {
  return String(description ?? "")
    .replace(/\s*(?:Registered (?:Address|Office)|Head Office|Corporate Office|Branch Code|IFSC Code|CIN:\s*[A-Z0-9]+|GSTIN:\s*[A-Z0-9]+|This is a computer generated|No signature required).*$/i, "")
    .replace(/\s*(?:Page\s*(?:no\.?|number)?\s*\d+(?:\s*of\s*\d+)?|AT [A-Z ]+ Page no\. Balance|Page no\. Balance).*$/i, "")
    .replace(/\s+(?:www\.[a-z0-9.-]+\.[a-z]{2,}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}).*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Human-friendly merchant from a raw UPI/NEFT narration. */
export function deriveMerchant(description: string): string | null {
  const text = cleanDescription(description)
  // UPI/IMPS: counterparty is the 3rd slash field
  const upi = text.match(/^(?:UPI|IMPS)[/-](?:CR|DR)?[/-]?\d+[/-]([^/]{3,60})/i)
  if (upi) return titleCase(upi[1].trim().slice(0, 50))
  // NEFT/RTGS: last slash field with letters
  if (/^(?:NEFT|RTGS)[*/]/i.test(text)) {
    const parts = text.split(/[*/]/).filter((p) => /[a-z]{3,}/i.test(p))
    const last = parts.pop()
    if (last) return titleCase(last.trim().slice(0, 50))
  }
  let s = text
    .replace(/\b(POS|ACH|NACH|VPS|MMT|UPI|NEFT|IMPS|RTGS|ECOM)\b/gi, " ")
    .replace(/[*#]+\s*\w*\d\w*/g, " ")
    .replace(/\b\d{3,}\b/g, " ")
    .replace(/[/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  s = s.split(/\s+[-—–]\s+/)[0].trim()
  if (!s) return null
  const words = s.split(" ").slice(0, 3).join(" ")
  return titleCase(words) || null
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\.(com|net|org)\b/gi, (m) => m.toLowerCase())
}

// Order matters: the first match wins, so specific rules precede broad ones.
const RULES: Rule[] = [
  {
    category: "FEES",
    patterns:
      /\b(gst|service charge|processing fee|late fee|penalty|annual fee|convenience fee|taxbuddy|amc charge|minimum balance|chq return|cheque return)\b/i,
  },
  {
    category: "SOFTWARE",
    patterns:
      /\b(adobe|github|gitlab|figma|notion|slack|atlassian|jetbrains|openai|anthropic|claude|aws|amazon web|google cloud|gcp|azure|vercel|netlify|cloudflare|digitalocean|heroku|linear|zoom|canva|dropbox|godaddy|namecheap|hostinger|bluehost|twilio|stripe|sentry|datadog)\b/i,
  },
  {
    category: "ENTERTAINMENT",
    patterns:
      /\b(netflix|spotify|prime video|hotstar|disney|youtube premium|jiocinema|sonyliv|zee5|apple music|audible|steam|playstation|xbox|bookmyshow|pvr|inox)\b/i,
  },
  {
    category: "FOOD",
    patterns:
      /\b(swiggy|zomato|dominos|mcdonald|kfc|burger king|starbucks|cafe|coffee|restaurant|dhaba|biryani|pizza|bakery|blinkit|zepto|instamart|bigbasket|dunzo|eatfit|faasos|behrouz|food zone|food court|shiv food|eating|dabha)\b/i,
  },
  {
    category: "TRAVEL",
    patterns:
      /\b(uber|ola|rapido|irctc|indigo|spicejet|vistara|air india|akasa|makemytrip|goibibo|cleartrip|yatra|redbus|abhibus|oyo|airbnb|booking\.com|petrol|diesel|fuel|hpcl|bpcl|iocl|indian oil|fastag|toll|parking|metro|namma yatri)\b/i,
  },
  {
    category: "SHOPPING",
    patterns:
      /\b(amazon|flipkart|myntra|ajio|meesho|nykaa|snapdeal|tatacliq|croma|reliance digital|decathlon|ikea|lenskart|firstcry|shoppers stop|westside|zara|h&m|uniqlo)\b/i,
  },
  {
    category: "BILLS",
    patterns:
      /\b(electricity|bescom|mseb|tneb|kseb|bses|adani electricity|torrent power|broadband|airtel|jio|vodafone|vi |bsnl|act fibernet|hathway|tata play|dish tv|gas bill|indane|hp gas|water bill|municipal|rent|maintenance|insurance|lic |premium)\b/i,
  },
  {
    category: "HEALTH",
    patterns:
      /\b(apollo|pharmeasy|1mg|netmeds|medplus|hospital|clinic|diagnostic|pathology|dental|pharmacy|chemist|practo|cult\.?fit|gym|fitness)\b/i,
  },
  {
    category: "EDUCATION",
    patterns:
      /\b(udemy|coursera|edx|byju|unacademy|vedantu|skillshare|pluralsight|masterclass|school fee|college fee|tuition|exam fee)\b/i,
  },
  {
    category: "INCOME",
    patterns:
      /\b(salary|payout|settlement|refund|cashback|interest credit|dividend|reimbursement|razorpay payout|stripe payout|upwork|fiverr)\b/i,
  },
  {
    category: "CASH",
    patterns: /\b(atm|cash withdrawal|cash wdl|cw |nfs\/)\b/i,
  },
  {
    category: "BUSINESS",
    patterns:
      /\b(invoice|consulting|retainer|freelance|contractor|vendor payment|client payment|professional fee|taxbuddy)\b/i,
  },
  {
    category: "TRANSFER",
    patterns:
      /\b(amazon pay later|pay later repayment|credit card payment|card bill payment|bnpl repayment|autopay debit|loan emi|emi repayment|self transfer|funds transfer)\b/i,
  },
  {
    // Broadest of the payment rails — checked last so a UPI payment *to Swiggy*
    // is categorised as food rather than swallowed as a generic transfer.
    category: "TRANSFER",
    patterns: /\b(upi|neft|imps|rtgs|transfer|trf|p2p|paytm|phonepe|gpay|google pay)\b/i,
  },
]

export type CategoryGuess = {
  category: Category
  /// 1 for a direct merchant hit; lower for the catch-all rails.
  confidence: number
  /// The token that decided it, so the UI can show its working.
  matched: string | null
}

/** De-spaced fallback for split words like "Petrole um" or "ENT ERPRI SES" */
const DESPACED_TOKENS: Array<[Category, string[]]> = [
  ["FOOD", ["petroleum", "petrolpump", "restaurant", "foodzone"]],
  ["SHOPPING", ["xpressbees", "ecomexpress"]],
  ["BILLS", ["jiorecharge", "rechargeprepaid"]],
]

export function categorize(
  description: string,
  direction: "DEBIT" | "CREDIT" = "DEBIT",
  employerNames: string[] = []
): CategoryGuess {
  const cleaned = cleanDescription(description)
  const merchant = deriveMerchant(description) ?? ""
  const text = cleaned.trim()
  const haystack = `${text} ${merchant}`.trim()

  if (!text) return { category: "UNKNOWN", confidence: 0, matched: null }

  // Generic employer → INCOME (no hardcoded company names). Aliases come from
  // profile.employer.company filled by user in Settings → Work & Planning.
  // Only CREDITs are salary; DEBITs containing employer name stay as-is.
  if (direction === "CREDIT" && employerNames.length > 0) {
    const hayCompact = haystack.toLowerCase().replace(/[^a-z0-9]/g, "")
    for (const raw of employerNames) {
      const name = raw.trim()
      if (!name || name.length < 3) continue
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      // word-boundary: prevents "Up" matching "UPI" or "Tech" matching "TechBuddy"
      const pattern = new RegExp(`\\b${escaped}\\b`, "i")
      if (pattern.test(haystack)) {
        return { category: "INCOME", confidence: 0.92, matched: raw.trim() }
      }
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, "")
      if (key.length >= 6 && hayCompact.includes(key) && name.split(/\s+/).every((w) => w.length >= 3)) {
        return { category: "INCOME", confidence: 0.88, matched: raw.trim() }
      }
    }
  }

  // Word-boundary rules first, but hold a bare "Transfers" rail match – it only
  // means the description named a payment rail, which nearly all do. A
  // de-spaced brand hit is more informative.
  let railFallback: CategoryGuess | null = null
  for (const rule of RULES) {
    const hit = haystack.match(rule.patterns)
    if (!hit) continue
    if (rule.category === "TRANSFER") {
      // For credits, a generic UPI/NEFT is not automatically income – only
      // explicit salary/refund/interest should be. Keep Transfer as fallback.
      railFallback = { category: "TRANSFER", confidence: 0.4, matched: hit[0].trim() }
      break
    }
    return {
      category: rule.category,
      confidence: 0.9,
      matched: hit[0].trim(),
    }
  }

  const despaced = haystack.toLowerCase().replace(/\s+/g, "")
  for (const [category, tokens] of DESPACED_TOKENS) {
    if (tokens.some((t) => despaced.includes(t))) {
      return { category, confidence: 0.8, matched: tokens.find((t) => despaced.includes(t)) ?? null }
    }
  }

  if (railFallback) {
    if (direction === "CREDIT") {
      return { category: "INCOME", confidence: 0.5, matched: railFallback.matched }
    }
    return railFallback
  }

  return {
    category: direction === "CREDIT" ? "TRANSFER" : "UNKNOWN",
    confidence: direction === "CREDIT" ? 0.3 : 0,
    matched: null,
  }
}

/**
 * Reduces a bank narration to the merchant.
 *
 * Statement lines carry rails, reference numbers and dates around the part that
 * identifies who was paid; stripping those is what lets recurring-payment
 * detection group January's Netflix charge with February's.
 * Now uses `deriveMerchant` for UPI-aware extraction.
 */
export function merchantKey(description: string): string {
  const m = deriveMerchant(description)
  if (m) return m.toLowerCase().replace(/[^a-z]/g, "").slice(0, 30)
  return description
    .toLowerCase()
    .replace(/\b(upi|neft|imps|rtgs|ach|nach|pos|atm|vps|mmt)\b/g, " ")
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 3)
    .join(" ")
    .trim()
}

/** Backwards-compatible alias for the other codebase's counterpartyKey */
export function counterpartyKey(description: string): string | null {
  const k = merchantKey(description)
  return k || null
}
