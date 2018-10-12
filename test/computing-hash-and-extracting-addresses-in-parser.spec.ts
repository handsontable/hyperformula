import { tokenizeFormula } from '../src/parser/FormulaParser'
import {computeHashAndExtractAddresses} from '../src/parser/FullParser'

describe("computeHashAndExtractAddresses", () => {
  it("simple case", () => {
    const tokens = tokenizeFormula("=42").tokens

    expect(computeHashAndExtractAddresses(tokens)).toEqual({
      hash: "=42",
      addresses: []
    })
  })

  it("ignores whitespace", () => {
    const tokens = tokenizeFormula("= 42").tokens

    expect(computeHashAndExtractAddresses(tokens)).toEqual({
      hash: "=42",
      addresses: []
    })
  })

  it("same hash for formulas with different namespace", () => {
    const tokens1 = tokenizeFormula("= 42 ").tokens
    const tokens2 = tokenizeFormula("   =42").tokens

    const result1 = computeHashAndExtractAddresses(tokens1)
    const result2 = computeHashAndExtractAddresses(tokens2)
    expect(result1).toEqual(result2)
  })

  it("stores address of the cell and replace it with #", () => {
    const tokens = tokenizeFormula("=A5").tokens

    expect(computeHashAndExtractAddresses(tokens)).toEqual({
      hash: "=#",
      addresses: ["A5"]
    })
  })

  it("stores addresses of the cell and replace it with #", () => {
    const tokens = tokenizeFormula("=A5+A3").tokens

    expect(computeHashAndExtractAddresses(tokens)).toEqual({
      hash: "=#+#",
      addresses: ["A5", "A3"]
    })
  })
})
