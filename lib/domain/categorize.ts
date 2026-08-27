/**
 * Transaction categorisation.
 *
 * Rules, not a model (PRD §20). Bank narrations are short, repetitive and
 * merchant-keyed — exactly the shape rules handle well — and a category that
 * changes between runs would make month-on-month comparisons meaningless.
 * A model is the right tool for the handful that fall through to UNKNOWN, not
 * for the 95% that match "SWIGGY" or "NETFLIX".
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

// Order matters: the first match wins, so specific rules precede broad ones.
const RULES: Rule[] = [
  {
    category: "FEES",
    patterns:
      /\b(gst|service charge|processing fee|late fee|penalty|annual fee|convenience fee)\b/i,
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
      /\b(swiggy|zomato|dominos|mcdonald|kfc|burger king|starbucks|cafe|coffee|restaurant|dhaba|biryani|pizza|bakery|blinkit|zepto|instamart|bigbasket|dunzo|eatfit|faasos|behrouz)\b/i,
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
      /\b(invoice|consulting|retainer|freelance|contractor|vendor payment|client payment|professional fee)\b/i,
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

export function categorize(
  description: string,
  direction: "DEBIT" | "CREDIT" = "DEBIT"
): CategoryGuess {
  const text = description.trim()

  if (!text) return { category: "UNKNOWN", confidence: 0, matched: null }

  for (const rule of RULES) {
    const hit = text.match(rule.patterns)
    if (!hit) continue

    // Money arriving is income even when the narration says UPI or NEFT.
    if (direction === "CREDIT" && rule.category === "TRANSFER") {
      return { category: "INCOME", confidence: 0.5, matched: hit[0].trim() }
    }

    return {
      category: rule.category,
      confidence: rule.category === "TRANSFER" ? 0.4 : 0.9,
      matched: hit[0].trim(),
    }
  }

  return {
    category: direction === "CREDIT" ? "INCOME" : "UNKNOWN",
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
 */
export function merchantKey(description: string): string {
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
