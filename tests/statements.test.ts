import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { parseBankStatement, detectBank, statementToTransactionInputs } from "../lib/domain/statements"

describe("Bank Statement Parsers", () => {
  it("detects bank name from header text", () => {
    assert.equal(detectBank("STATE BANK OF INDIA - Account Statement"), "SBI")
    assert.equal(detectBank("HDFC BANK LIMITED - e-Statement for Account"), "HDFC")
    assert.equal(detectBank("ICICI Bank Account Statement"), "ICICI")
    assert.equal(detectBank("JPMorgan Chase Bank Statement Summary"), "CHASE")
  })

  it("parses SBI statement lines with Indian date format and debits/credits", () => {
    const sbiSample = `
STATE BANK OF INDIA
Account Statement for 01/08/2026 to 31/08/2026
Txn Date | Narration | Debit | Credit | Balance
26/08/2026 UPI/SWIGGY/ORDER10293847 450.00 14500.00
27/08/2026 UPI/ZOMATO/FOOD99182 820.00 13680.00
28/08/2026 SALARY CREDIT CLIENT REZ 45000.00 CR 58680.00
    `

    const result = parseBankStatement(sbiSample, "SBI")
    assert.equal(result.bank, "SBI")
    assert.equal(result.currency, "INR")
    assert.equal(result.transactions.length, 3)

    // First row: Swiggy food debit
    assert.equal(result.transactions[0].description, "UPI/SWIGGY/ORDER10293847")
    assert.equal(result.transactions[0].amountMinor, BigInt(45000)) // 450.00 in paise
    assert.equal(result.transactions[0].direction, "DEBIT")
    assert.equal(result.transactions[0].category, "FOOD")

    // Third row: Salary credit
    assert.equal(result.transactions[2].direction, "CREDIT")
    assert.equal(result.transactions[2].category, "INCOME")
  })

  it("parses Chase statement lines in USD", () => {
    const chaseSample = `
JPMorgan Chase Bank, N.A.
08/15/2026 ADOBE CREATIVE CLOUD -54.99 1840.22
08/18/2026 AWS CLOUD HOSTING -24.50 1815.72
08/20/2026 CLIENT STRIPE PAYOUT 1200.00 CR 3015.72
    `

    const result = parseBankStatement(chaseSample, "CHASE")
    assert.equal(result.bank, "CHASE")
    assert.equal(result.currency, "USD")
    assert.equal(result.transactions.length, 3)
    assert.equal(result.transactions[0].amountMinor, BigInt(5499)) // $54.99 in cents
    assert.equal(result.transactions[0].category, "SOFTWARE")
  })

  it("converts parsed statement to domain transaction inputs", () => {
    const text = `26/08/2026 NETFLIX SUBSCRIPTION 799.00 12000.00`
    const result = parseBankStatement(text, "HDFC")
    const inputs = statementToTransactionInputs(result, "acc-123")

    assert.equal(inputs.length, 1)
    assert.equal(inputs[0].accountId, "acc-123")
    assert.equal(inputs[0].amountMinor, BigInt(79900))
    assert.equal(inputs[0].category, "ENTERTAINMENT")
  })
})
