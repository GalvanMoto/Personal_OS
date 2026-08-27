import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { categorize, merchantKey } from "@/lib/domain/categorize"
import {
  formatMoney,
  minorToNumber,
  money,
  parseAmount,
  percentChange,
  sumMinor,
} from "@/lib/domain/money"

describe("money", () => {
  it("parses amounts into exact minor units", () => {
    assert.equal(parseAmount("1234.56"), 123456n)
    assert.equal(parseAmount("1,234.56"), 123456n)
    assert.equal(parseAmount("₹1,234"), 123400n)
    assert.equal(parseAmount("0.05"), 5n)
    assert.equal(parseAmount("0.5"), 50n)
    assert.equal(parseAmount("-99.99"), -9999n)
  })

  it("rejects anything it cannot parse exactly", () => {
    for (const bad of ["", "abc", "1.234", "1..2", "12,34,5.6.7"]) {
      assert.equal(parseAmount(bad), null, `accepted: ${bad}`)
    }
  })

  it("sums without the drift a float would accumulate", () => {
    // 0.1 + 0.2 !== 0.3 in floating point; in minor units it is exact.
    assert.equal(sumMinor([10n, 20n]), 30n)

    const hundredTenPaise = Array.from({ length: 100 }, () => 10n)
    assert.equal(sumMinor(hundredTenPaise), 1000n)
  })

  it("formats with Indian digit grouping", () => {
    assert.equal(formatMoney(money(123456n)), "₹1,234.56")
    assert.equal(formatMoney(money(10000000n)), "₹1,00,000.00")
    assert.equal(formatMoney(money(-50000n)), "-₹500.00")
    assert.equal(formatMoney(money(5n)), "₹0.05")
  })

  it("uses the currency code for anything but rupees", () => {
    assert.match(formatMoney(money(123456n, "USD")), /^USD /)
  })

  it("refuses to convert an amount it cannot represent precisely", () => {
    assert.equal(minorToNumber(900000000n), 900000000)
    assert.throws(
      () => minorToNumber(BigInt(Number.MAX_SAFE_INTEGER) + 10n),
      RangeError
    )
  })

  it("reports change against a previous period", () => {
    assert.equal(percentChange(10000n, 12800n), 28)
    assert.equal(percentChange(10000n, 5000n), -50)
    // No baseline means no meaningful percentage.
    assert.equal(percentChange(0n, 5000n), null)
  })
})

describe("categorisation", () => {
  it("recognises common merchants", () => {
    assert.equal(categorize("UPI/SWIGGY/123456").category, "FOOD")
    assert.equal(categorize("NETFLIX SUBSCRIPTION").category, "ENTERTAINMENT")
    assert.equal(categorize("ADOBE SYSTEMS SOFTWARE").category, "SOFTWARE")
    assert.equal(categorize("UBER INDIA TRIP").category, "TRAVEL")
    assert.equal(categorize("AMAZON RETAIL ORDER").category, "SHOPPING")
    assert.equal(categorize("AIRTEL BROADBAND BILL").category, "BILLS")
    assert.equal(categorize("ATM CASH WITHDRAWAL").category, "CASH")
  })

  it("prefers the merchant over the payment rail", () => {
    // A UPI payment to Swiggy is food, not a generic transfer.
    const result = categorize("UPI/SWIGGY LIMITED/9876543")
    assert.equal(result.category, "FOOD")
    assert.ok(result.confidence > 0.5)
  })

  it("treats money arriving as income even on a transfer rail", () => {
    assert.equal(categorize("NEFT FROM ACME LTD", "CREDIT").category, "INCOME")
    assert.equal(categorize("NEFT TO ACME LTD", "DEBIT").category, "TRANSFER")
  })

  it("says which token decided it", () => {
    const result = categorize("POS 4213 SPOTIFY INDIA")
    assert.equal(result.category, "ENTERTAINMENT")
    assert.match(result.matched ?? "", /spotify/i)
  })

  it("admits when it does not know", () => {
    const result = categorize("MISC DR 88213")
    assert.equal(result.category, "UNKNOWN")
    assert.equal(result.confidence, 0)
    assert.equal(result.matched, null)
  })

  it("gives a lower confidence to the catch-all rails", () => {
    const rail = categorize("IMPS TO 9988776655")
    const merchant = categorize("ZOMATO ORDER")
    assert.ok(rail.confidence < merchant.confidence)
  })
})

describe("merchant keys", () => {
  it("strips rails, references and dates so charges group together", () => {
    const january = merchantKey("UPI/NETFLIX ENTERTAINMENT/4402213/05-01-2026")
    const february = merchantKey("UPI/NETFLIX ENTERTAINMENT/9913447/05-02-2026")

    assert.equal(january, february)
    assert.match(january, /netflix/)
  })

  it("keeps different merchants apart", () => {
    assert.notEqual(merchantKey("SWIGGY ORDER 123"), merchantKey("ZOMATO ORDER 123"))
  })

  it("returns an empty key when there is nothing identifying", () => {
    assert.equal(merchantKey("UPI 99887766"), "")
  })
})
