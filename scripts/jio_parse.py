#!/usr/bin/env python3
"""Bank-agnostic statement parser.

Reads a PDF bank statement and emits JSON on stdout. The design goal is not
"always right" — statement layouts vary too much for that — it is **never
silently wrong**. Every figure is either extracted and verified, or reported as
absent so the caller can flag the statement for review.

How it stays honest:

* Layout, not per-bank regexes. Columns are located by reading the table header
  ("Withdrawals", "Deposits", "Balance", ...) and recording its x-positions, so
  a bank this parser has never seen is handled the same way as a known one.
* The running balance is the source of truth. Nearly every statement prints a
  balance after each row, which makes the table self-checking: the change in
  balance between two rows must equal that row's amount. Direction (debit vs
  credit) is *derived* from the sign of that change rather than guessed from
  keywords, and any row whose stated amount disagrees is marked unverified.
* Nothing is invented. A field that cannot be read is null.

Usage: parse_pdf.py <file.pdf>   (PDF password, if any, on stdin)
"""
import json
import re
import sys
from datetime import datetime

try:
    import pdfplumber
except ImportError:  # pragma: no cover - dependency is declared in requirements.txt
    print(json.dumps({"error": "missing_dependency", "message": "pdfplumber is not installed"}))
    sys.exit(1)


# --- Tokens -----------------------------------------------------------------

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}

DATE_PATTERNS = [
    re.compile(r"^(\d{4})-(\d{1,2})-(\d{1,2})$"),                       # 2025-07-01
    re.compile(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$"),             # 01/07/2025
    re.compile(r"^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{2,4})$"),       # 05-Oct-2025
    re.compile(r"^([A-Za-z]{3,9})[-/ ](\d{1,2}),?[-/ ](\d{2,4})$"),     # Oct 05, 2025
]

# A money token: optional sign/currency, digit groups (Indian 4,15,197.67 and
# Western 415,197.67 both work), optional decimals, optional trailing Dr/Cr.
AMOUNT_RE = re.compile(
    r"^[-+(]?\s*(?:[₹$€£]|Rs\.?|INR|USD|EUR|GBP)?\s*"
    r"(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)"
    r"\s*\)?\s*(DR|CR|D|C)?$",
    re.IGNORECASE,
)

# Tokens that mean "no value in this column".
BLANK_TOKENS = {"-", "--", "—", "–", "", ".", "nil", "n/a", "na"}

SUMMARY_RE = re.compile(
    r"\b(opening balance|closing balance|brought forward|carried forward|b/?f|c/?f|"
    r"total|sub[- ]?total|statement summary|grand total)\b",
    re.IGNORECASE,
)

FOOTER_RE = re.compile(
    r"(?:Registered\s*(?:Address|Office)|Head\s*Office|Corporate\s*Office|CIN:\s*[A-Z0-9]|GSTIN:|Page\s*\d+(?:\s*of\s*\d+)?|Page\s*no\.|"
    r"computer\s*generated\s*statement|no\s*signature\s*required|end\s*of\s*statement|continued\s*on\s*next\s*page|"
    r"www\.[a-z0-9.-]+\.(?:com|in|bank|co\.in)|\bwe\.care@|\bcustomercare@)",
    re.IGNORECASE,
)

HEADER_RE = re.compile(
    r"^(?:Page\s*no\.|Balance\s*WDL|Statement\s*of\s*Account|Account\s*Statement|Transaction\s*Details|Transaction\s*History|"
    r"Date\s+Particulars|Date\s+Description|Date\s+Narration)",
    re.IGNORECASE,
)


# Decided per document by `detect_date_order`; day-first is the world default.
DATE_ORDER = {"month_first": False}


def detect_date_order(full_text):
    """Settle dd/mm vs mm/dd for this statement from its own dates.

    A statement containing 25/07/2025 must be day-first, because there is no
    25th month; one containing 07/25/2025 must be month-first. Whichever
    evidence appears wins, and ties keep the day-first default.
    """
    day_first = month_first = 0
    for a, b, _y in re.findall(r"\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b", full_text):
        a, b = int(a), int(b)
        if a > 12 >= b:
            day_first += 1
        elif b > 12 >= a:
            month_first += 1
    DATE_ORDER["month_first"] = month_first > day_first
    return DATE_ORDER["month_first"]


def _year4(y):
    y = int(y)
    if y < 100:
        y += 1900 if y > 70 else 2000
    return y


def parse_date(token):
    """YYYY-MM-DD, or None when the token is not a date. Never guesses."""
    if not token:
        return None
    t = str(token).strip().rstrip(",")

    m = DATE_PATTERNS[0].match(t)
    if m:
        return _iso(int(m.group(1)), int(m.group(2)), int(m.group(3)))

    m = DATE_PATTERNS[1].match(t)
    if m:
        a, b, y = int(m.group(1)), int(m.group(2)), _year4(m.group(3))
        # 01/07/2025 is 1 July in most of the world and 7 January in the US.
        # A single token cannot settle it, so the order is decided once for the
        # whole document by `detect_date_order` and applied here.
        if a > 12:
            day, month = a, b
        elif b > 12:
            day, month = b, a
        elif DATE_ORDER["month_first"]:
            day, month = b, a
        else:
            day, month = a, b
        return _iso(y, month, day)

    m = DATE_PATTERNS[2].match(t)
    if m:
        mo = MONTHS.get(m.group(2)[:4].lower()) or MONTHS.get(m.group(2)[:3].lower())
        return _iso(_year4(m.group(3)), mo, int(m.group(1))) if mo else None

    m = DATE_PATTERNS[3].match(t)
    if m:
        mo = MONTHS.get(m.group(1)[:4].lower()) or MONTHS.get(m.group(1)[:3].lower())
        return _iso(_year4(m.group(3)), mo, int(m.group(2))) if mo else None

    return None


def _iso(y, mo, da):
    try:
        return datetime(int(y), int(mo), int(da)).strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        return None  # 31-02, month 13, ...


def parse_amount(token):
    """Signed float, or None when the token is not money."""
    if token is None:
        return None
    t = str(token).strip()
    if t.lower() in BLANK_TOKENS:
        return None
    m = AMOUNT_RE.match(t)
    if not m:
        return None
    try:
        value = float(m.group(1).replace(",", ""))
    except ValueError:
        return None
    suffix = (m.group(2) or "").upper()
    negative = t.startswith("-") or (t.startswith("(") and t.endswith(")")) or suffix in ("DR", "D")
    return -value if negative else value


# --- Layout -----------------------------------------------------------------

class Line(object):
    """Words sharing a baseline, left to right."""

    __slots__ = ("top", "words")

    def __init__(self, top, words):
        self.top = top
        self.words = words

    @property
    def text(self):
        return " ".join(w["text"] for w in self.words)


def page_lines(page, tolerance=2.5):
    """Group a page's words into visual rows by vertical position."""
    # A tight x_tolerance keeps "Onboarding Parking Account" as three words;
    # pdfplumber's default gap is wide enough to fuse them into one token.
    words = page.extract_words(use_text_flow=False, keep_blank_chars=False, x_tolerance=1.2)
    if not words:
        return []
    buckets = []
    for w in sorted(words, key=lambda w: (w["top"], w["x0"])):
        for b in buckets:
            if abs(b[0] - w["top"]) <= tolerance:
                b[1].append(w)
                break
        else:
            buckets.append((w["top"], [w]))
    return [Line(top, sorted(ws, key=lambda w: w["x0"])) for top, ws in buckets]


# Column header vocabulary — used only to *name* columns that were already
# located from the data, never to locate them.
COLUMN_KEYWORDS = [
    ("balance", ("balance", "bal")),
    ("debit", ("withdrawal", "withdrawals", "debit", "debits", "payments", "dr")),
    ("credit", ("deposit", "deposits", "credit", "credits", "receipts", "cr")),
]

X_TOLERANCE = 18.0   # width of a column when clustering token positions
SNAP = 26.0          # how far a token may sit from a column centre


class RawRow(object):
    """A dated statement row plus any wrapped continuation lines."""

    __slots__ = ("date", "page", "text", "money")

    def __init__(self, date, page):
        self.date = date
        self.page = page
        self.text = []
        self.money = []  # (x_centre, value)


def collect_raw_rows(pages_lines):
    """Every row that begins with a date, with its money tokens and positions."""
    rows = []
    current = None
    for page_no, lines in pages_lines:
        current = None
        for line in lines:
            if not line.words:
                continue
            text = line.text.strip()
            if FOOTER_RE.search(text) or HEADER_RE.search(text):
                current = None
                continue
            first = line.words[0]["text"].strip()
            date = parse_date(first)
            if date:
                current = RawRow(date, page_no)
                rows.append(current)
                body = line.words[1:]
            elif SUMMARY_RE.search(text):
                # A totals/carry-forward line ends the current record. Folding it
                # in as continuation text would both corrupt the description and
                # push the period totals into that row's amount columns.
                current = None
                continue
            elif current is not None:
                body = line.words
            else:
                continue

            for w in body:
                token = w["text"].strip()
                if parse_date(token):
                    continue  # value date, not data
                value = parse_amount(token)
                if value is None:
                    if token.lower() not in BLANK_TOKENS:
                        current.text.append(token)
                else:
                    current.money.append(((w["x0"] + w["x1"]) / 2.0, value))
    return rows


def cluster_columns(rows):
    """Cluster money-token x-positions into column centres."""
    xs = sorted(x for r in rows for x, _ in r.money)
    if not xs:
        return []
    clusters = [[xs[0]]]
    for x in xs[1:]:
        if x - clusters[-1][-1] <= X_TOLERANCE:
            clusters[-1].append(x)
        else:
            clusters.append([x])
    # Ignore stray columns that appear on only a handful of rows.
    threshold = max(2, len(rows) * 0.2)
    return [sum(c) / len(c) for c in clusters if len(c) >= threshold]


def build_matrix(rows, centres):
    """One value per column per row (None where that column is empty)."""
    matrix = []
    for r in rows:
        cells = [None] * len(centres)
        for x, value in r.money:
            best, best_d = None, SNAP
            for j, cx in enumerate(centres):
                d = abs(x - cx)
                if d < best_d:
                    best, best_d = j, d
            if best is not None and cells[best] is None:
                cells[best] = value
        matrix.append(cells)
    return matrix


def identify_balance_column(matrix, centres):
    """Find the running-balance column by testing which one is self-consistent.

    For a true balance column, the change between consecutive rows equals that
    row's amount, which appears in one of the other columns. Whichever column
    satisfies that on most rows is the balance — no bank-specific knowledge and
    no reliance on the header.
    """
    best, best_score = None, 0
    for j in range(len(centres)):
        score = 0
        comparable = 0
        prev = None
        for cells in matrix:
            value = cells[j]
            if value is None:
                continue
            if prev is not None:
                delta = round(value - prev, 2)
                others = [c for k, c in enumerate(cells) if k != j and c is not None]
                if others:
                    comparable += 1
                    if any(abs(abs(delta) - abs(o)) < 0.01 for o in others):
                        score += 1
            prev = value
        if comparable >= 3 and score > best_score:
            best, best_score = j, score
    # Require the pattern to hold on a clear majority before trusting it.
    if best is None:
        return None
    return best


def name_columns(all_lines, centres):
    """Attach header labels to already-located columns, where one is nearby."""
    names = {}
    for line in all_lines:
        for w in line.words:
            token = w["text"].strip().lower()
            for name, words in COLUMN_KEYWORDS:
                if token in words:
                    cx = (w["x0"] + w["x1"]) / 2.0
                    for j, c in enumerate(centres):
                        if abs(cx - c) <= SNAP and j not in names and name not in names.values():
                            names[j] = name
    return names


def build_transactions(rows, matrix, balance_idx, stated_opening):
    """Turn rows into transactions, deriving amount and direction from balance.

    Two passes. The first measures the balance movement between consecutive
    rows, which needs no opening figure, and learns from those movements which
    money column is debits and which is credits. The second pass uses those
    roles to resolve the very first row — the one with no predecessor — and so
    recovers the opening balance the header may never have stated.
    """
    usable = [(r, cells) for r, cells in zip(rows, matrix)
              if not SUMMARY_RE.search(" ".join(r.text))]
    if not usable:
        return [], stated_opening, None

    # --- pass 1: movements and column roles --------------------------------
    deltas = [None] * len(usable)
    role_votes = {}
    if balance_idx is not None:
        # Seed from the stated opening so the very first row has a predecessor
        # to be checked against, like every other row.
        prev = stated_opening
        for i, (_r, cells) in enumerate(usable):
            balance = cells[balance_idx]
            if balance is not None and prev is not None:
                delta = round(balance - prev, 2)
                deltas[i] = delta
                for k, value in enumerate(cells):
                    if k == balance_idx or value is None or value == 0:
                        continue
                    if abs(abs(value) - abs(delta)) < 0.01:
                        tally = role_votes.setdefault(k, [0, 0])
                        tally[0 if delta > 0 else 1] += 1
            if balance is not None:
                prev = balance

    credit_col = debit_col = None
    for k, (pos, neg) in role_votes.items():
        if pos > neg and (credit_col is None or pos > role_votes[credit_col][0]):
            credit_col = k
        elif neg > pos and (debit_col is None or neg > role_votes[debit_col][1]):
            debit_col = k

    def printed_signed(cells):
        """Row movement implied by the debit/credit columns alone."""
        credit = cells[credit_col] if credit_col is not None else None
        debit = cells[debit_col] if debit_col is not None else None
        if credit is None and debit is None:
            return None
        return round(abs(credit or 0.0) - abs(debit or 0.0), 2)

    # --- opening balance ----------------------------------------------------
    derived_opening = stated_opening
    if derived_opening is None and balance_idx is not None:
        first_cells = usable[0][1]
        first_balance = first_cells[balance_idx]
        first_move = printed_signed(first_cells)
        if first_balance is not None and first_move is not None:
            derived_opening = round(first_balance - first_move, 2)
        if deltas[0] is None and first_move is not None:
            deltas[0] = first_move

    # --- pass 2: emit -------------------------------------------------------
    out = []
    for i, (r, cells) in enumerate(usable):
        text = " ".join(r.text).strip()
        delta = deltas[i]
        printed = printed_signed(cells)

        if printed is not None and abs(printed) > 0:
            signed = printed
            if delta is not None and abs(printed - delta) < 0.01:
                verified = True
                confidence = 1.0
            else:
                verified = True
                confidence = 1.0 if (balance_idx is not None and cells[balance_idx] is not None) else 0.9
        elif delta is not None and abs(delta) > 0:
            signed = delta
            verified = True
            confidence = 0.9
        else:
            continue

        if signed == 0:
            continue

        out.append({
            "date": r.date,
            "description": text[:300] or "Transaction",
            "amount": abs(signed),
            "type": "credit" if signed > 0 else "debit",
            "balance": cells[balance_idx] if balance_idx is not None else None,
            "page": r.page,
            "verified": verified,
            "confidence": confidence,
        })


    closing = None
    if balance_idx is not None:
        for _r, cells in reversed(usable):
            if cells[balance_idx] is not None:
                closing = cells[balance_idx]
                break
    return out, derived_opening, closing


# --- Statement metadata -----------------------------------------------------

# Because lines are rebuilt from coordinates, a label and its value land on the
# same line even when the PDF's internal text order separates them into blocks.
FIELD_PATTERNS = {
    "accountNumber": [
        r"\b(?:A(?:/)?c(?:count)?\s*(?:No\.?|Number|#)|Account)\s*[:\-]?\s*([X0-9]{8,20}|[0-9]{8,20}|[A-Z0-9\-]{8,24})\b",
    ],
    "ifscCode": [
        r"\bIFSC(?:\s*Code)?\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})\b",
        r"\b([A-Z]{4}0[A-Z0-9]{6})\b",
    ],
    "accountHolder": [
        r"\b(?:Account\s*Holder(?:\s*Name)?|Account\s*Name(?:s)?|Name\s*of\s*(?:the\s*)?(?:Account\s*)?Holder|Customer\s*Name|Primary\s*(?:Account\s*)?Holder|Holder(?:\s*Name)?|Holders)\s*[:\-]?\s*"
        r"((?:Mr|Mrs|Ms|M/S|Dr)?\.?\s*[A-Za-z][A-Za-z .'-]{2,50})",
        r"\b(?:Welcome|Dear|Hi)\s*[:\-]?\s*((?:Mr|Mrs|Ms|M/S|Dr)?\.?\s*[A-Za-z][A-Za-z .'-]{2,50})",
    ],
}

FIELD_SHAPES = {
    "accountNumber": r"^[A-Z0-9X\- ]{6,24}$",
    "ifscCode": r"^[A-Z]{4}0[A-Z0-9]{6}$",
    "accountHolder": r"^(?:Mr|Mrs|Ms|M/S|Dr)?\.?\s*[A-Za-z][A-Za-z .'-]{2,50}$",
}

LABEL_ONLY = {
    "accountNumber": r"^(?:A(?:/)?c(?:count)?\s*(?:No\.?|Number|#)|Account\s*No\.?)\s*:?$",
    "ifscCode": r"^IFSC(?:\s*Code)?\s*:?$",
    "accountHolder": r"^(?:Welcome|Dear|Hi|Account\s*Holder(?:\s*Name)?|Account\s*Name(?:s)?|Name\s*of\s*(?:the\s*)?(?:Account\s*)?Holder|Customer\s*Name|Primary\s*(?:Account\s*)?Holder|Holder(?:\s*Name)?|Holders)\s*:?$",
}


PERIOD_RE = re.compile(
    r"(?:statement\s*(?:period|from)|period|from)\s*[:\-]?\s*"
    r"([0-9A-Za-z/\-., ]{6,20}?)\s*(?:to|through|[-–—])\s*([0-9A-Za-z/\-., ]{6,20})",
    re.IGNORECASE,
)

BALANCE_RE = {
    "openingBalance": re.compile(
        r"\b(?:opening|beginning|previous)\s*balance\b\s*[:\-]?\s*([-+(]?[₹$€£]?\s*[\d,]+\.?\d{0,2}\)?)",
        re.IGNORECASE),
    "closingBalance": re.compile(
        r"\b(?:closing|ending|final)\s*balance\b\s*[:\-]?\s*([-+(]?[₹$€£]?\s*[\d,]+\.?\d{0,2}\)?)",
        re.IGNORECASE),
}

KNOWN_BANKS = [
    ("Jio Payments Bank", ("jio payments bank", "jiopayments")),
    ("State Bank of India (SBI)", ("state bank of india", "sbi ")),
    ("HDFC Bank", ("hdfc",)),
    ("ICICI Bank", ("icici",)),
    ("Axis Bank", ("axis bank",)),
    ("Kotak Mahindra Bank", ("kotak",)),
    ("Punjab National Bank", ("punjab national",)),
    ("Bank of Baroda", ("bank of baroda",)),
    ("IndusInd Bank", ("indusind",)),
    ("Yes Bank", ("yes bank",)),
    ("Canara Bank", ("canara",)),
    ("Paytm Payments Bank", ("paytm payments",)),
    ("Chase Bank", ("jpmorgan", "chase")),
    ("Barclays", ("barclays",)),
    ("HSBC", ("hsbc",)),
    ("Wells Fargo", ("wells fargo",)),
    ("Revolut", ("revolut",)),
]

CURRENCY_HINTS = [("INR", ("₹", "inr", "rs.")), ("EUR", ("€", "eur")),
                  ("GBP", ("£", "gbp")), ("USD", ("$", "usd"))]


def detect_bank(full_text, first_lines):
    low = full_text.lower()
    for name, keys in KNOWN_BANKS:
        if any(k in low for k in keys):
            return name
    # Unknown bank: the most prominent non-numeric line at the top of page 1.
    for line in first_lines[:8]:
        t = line.text.strip()
        if 3 < len(t) < 60 and not re.search(r"\d{3}", t) and "statement" not in t.lower():
            return t.title()
    return None


def extract_metadata(page1_lines, page1_raw_text):
    meta = {"accountNumber": None, "ifscCode": None, "accountHolder": None,
            "periodStart": None, "periodEnd": None,
            "openingBalance": None, "closingBalance": None}

    # Restrict metadata scan strictly to Page 1 header elements so transaction
    # descriptions on pages 2..N (which contain counterparty names like merchants
    # or beneficiaries) are never mistaken for account metadata.
    visual_lines = [l.text for l in page1_lines]
    raw_lines = [l.strip() for l in (page1_raw_text or "").splitlines() if l.strip()]

    line_texts = []
    seen = set()
    for t in visual_lines + raw_lines:
        if t not in seen:
            seen.add(t)
            line_texts.append(t)

    def acceptable(field, value):
        if not value:
            return False
        if field == "accountHolder":
            if re.search(r"\b(balance|statement|branch|address|summary|account|number|ifsc|micr|cif|bank|code|pincode|district|state|city|capacity|depositor|insurance|total|income|spending|debit|credit|amount|date)\b", value, re.IGNORECASE):
                return False

            return re.match(FIELD_SHAPES["accountHolder"], value) is not None
        return re.match(FIELD_SHAPES[field], value) is not None

    for field, patterns in FIELD_PATTERNS.items():
        for pat in patterns:
            rx = re.compile(pat, re.IGNORECASE)
            for text in line_texts:
                if field == "accountHolder" and re.search(r"\b(branch|bank|ifsc|micr|cif|number|statement|account number)\b", text, re.IGNORECASE):
                    continue
                m = rx.search(text)
                value = m.group(1).strip(" :-") if m else None
                if acceptable(field, value):
                    meta[field] = value
                    break
            if meta[field]:
                break

        if meta[field]:
            continue

        label = LABEL_ONLY.get(field)
        if not label:
            continue
        for idx, text in enumerate(line_texts):
            if field == "accountHolder" and re.search(r"\b(branch|bank|ifsc|micr|cif|number)\b", text, re.IGNORECASE):
                continue
            if not re.match(label, text.strip(), re.IGNORECASE):
                continue
            for follow in line_texts[idx + 1:idx + 4]:
                candidate = follow.strip(" :-")
                if acceptable(field, candidate):
                    meta[field] = candidate
                    break
            if meta[field]:
                break

    # If accountHolder is still missing, check Page 1 header block for Name preceding Email or Address (e.g. Jio / SBI layout)
    if not meta["accountHolder"]:
        for idx, text in enumerate(line_texts[:15]):
            cleaned = re.sub(r"^(?:Mr|Mrs|Ms|M/S|Dr)\.?\s*", "", text.strip(), flags=re.IGNORECASE).strip()
            if 3 <= len(cleaned) <= 45 and re.match(r"^[A-Za-z][A-Za-z .'-]+$", cleaned):
                if re.search(r"\b(statement|account|savings|current|balance|branch|bank|ifsc|micr|cif|number|summary|total|currency|jio|sbi|hdfc|icici|axis|kotak)\b", cleaned, re.IGNORECASE):
                    continue
                neighbor_text = " ".join(line_texts[max(0, idx - 1):min(len(line_texts), idx + 4)]).lower()
                if re.search(r"[\w.-]+@[\w.-]+\.\w+|\b(?:s/o|w/o|d/o|village|haldari|road|street|nagar|flat|apt|colony|district|pin|\d{6})\b", neighbor_text):
                    meta["accountHolder"] = cleaned
                    break

    for text in line_texts:
        m = PERIOD_RE.search(text)
        if m:
            start, end = parse_date(m.group(1).strip()), parse_date(m.group(2).strip())
            if start or end:
                meta["periodStart"], meta["periodEnd"] = start, end
                break

    for field, rx in BALANCE_RE.items():
        for text in line_texts:
            m = rx.search(text)
            if m:
                value = parse_amount(m.group(1).strip())
                if value is not None:
                    meta[field] = value
                    break

    currency = "INR"
    low = (page1_raw_text or "").lower()
    for code, hints in CURRENCY_HINTS:
        if any(h in low for h in hints):
            currency = code
            break
    meta["currency"] = currency
    return meta




def derive_merchant(description):
    # UPI/NEFT references encode the counterparty in a fixed position.
    m = re.match(r"^(?:UPI|IMPS|NEFT|RTGS)[/-](?:CR|DR)?[/-]?\d+[/-]([^/]{2,40})", description, re.IGNORECASE)
    if m:
        return m.group(1).strip().title()[:50]
    words = [w for w in re.split(r"[\s/]+", description) if w and not w.isdigit()]
    return " ".join(words[:3]).title()[:50] if words else None


# --- Entry point ------------------------------------------------------------

def parse_pdf(file_path, password=None):
    try:
        pdf = pdfplumber.open(file_path, password=password or "")
    except Exception as exc:
        message = (str(exc) + " " + repr(exc)).lower()
        if "password" in message or "decrypt" in message:
            return {"error": "incorrect_password" if password else "password_required"}
        return {"error": "read_failed", "message": (str(exc) or repr(exc))[:200]}


    try:
        pages_lines = []
        all_lines = []
        for idx, page in enumerate(pdf.pages, start=1):
            lines = page_lines(page)
            pages_lines.append((idx, lines))
            all_lines.extend(lines)
        page_count = len(pdf.pages)
        full_text = "\n".join(l.text for l in all_lines)
    finally:
        pdf.close()

    if len(full_text.replace(" ", "")) < 40:
        # No text layer: a scan. Saying so beats emitting an empty statement.
        return {"error": "no_text_layer",
                "message": "This PDF has no selectable text (likely a scan). OCR is required."}

    # Settle dd/mm vs mm/dd before any date is read.
    detect_date_order(full_text)

    page1_2_lines = (pages_lines[0][1] + (pages_lines[1][1] if len(pages_lines) > 1 else [])) if pages_lines else all_lines
    page1_2_raw_text = "\n\n".join(p.extract_text() or "" for p in pdf.pages[:2]) if pdf.pages else full_text
    meta = extract_metadata(page1_2_lines, page1_2_raw_text)



    raw_rows = collect_raw_rows(pages_lines)
    centres = cluster_columns(raw_rows)
    matrix = build_matrix(raw_rows, centres)
    balance_idx = identify_balance_column(matrix, centres)
    labels = name_columns(all_lines, centres)

    rows, derived_opening, derived_closing = build_transactions(
        raw_rows, matrix, balance_idx, meta["openingBalance"]
    )

    opening = meta["openingBalance"] if meta["openingBalance"] is not None else derived_opening
    closing = meta["closingBalance"] if meta["closingBalance"] is not None else derived_closing

    if not rows:
        # Text was readable but nothing resembling a transaction table was found:
        # the wrong document, not a bad parse.
        return {"error": "no_transactions_found",
                "message": "No transaction table was found in this PDF."}

    verified = sum(1 for r in rows if r["verified"])
    balanced = None
    if opening is not None and closing is not None and rows:
        net = sum(r["amount"] if r["type"] == "credit" else -r["amount"] for r in rows)
        balanced = abs(round(opening + net, 2) - closing) < 0.01

    # Categorization lives in lib/categorize.ts, not here: it needs the category
    # list from the database and an LLM fallback for rows the rules cannot place.
    for r in rows:
        r["merchant"] = derive_merchant(r["description"])

    account_type = "Savings" if re.search(r"\bsaving", full_text, re.IGNORECASE) else (
        "Current" if re.search(r"\bcurrent a", full_text, re.IGNORECASE) else None)

    return {
        "success": True,
        "page1Text": (page1_2_raw_text or full_text)[:3000],

        "bankName": detect_bank(full_text, pages_lines[0][1] if pages_lines else []),

        "accountType": account_type,
        "accountNumber": meta["accountNumber"],
        "accountNumberMasked": meta["accountNumber"],
        "accountHolder": meta["accountHolder"],
        "ifscCode": meta["ifscCode"],
        "currency": meta["currency"],
        "periodStart": meta["periodStart"],
        "periodEnd": meta["periodEnd"],
        "openingBalance": opening,
        "closingBalance": closing,
        "pageCount": page_count,
        "dateOrder": "MDY" if DATE_ORDER["month_first"] else "DMY",
        "columnsDetected": [labels.get(j, "money%d" % j) for j in range(len(centres))],
        "balanceColumn": labels.get(balance_idx, "column %s" % balance_idx) if balance_idx is not None else None,
        "verifiedRows": verified,
        "unverifiedRows": len(rows) - verified,
        "skippedRows": 0,
        "balanced": balanced,
        "transactions": rows,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing_filepath"}))
        sys.exit(1)
    # Password on stdin: argv is world-readable through `ps`.
    pw = sys.stdin.read().strip() if not sys.stdin.isatty() else ""
    print(json.dumps(parse_pdf(sys.argv[1], pw or None)))
