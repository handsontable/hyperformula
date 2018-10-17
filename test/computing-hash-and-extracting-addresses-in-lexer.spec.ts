import {computeHashAndExtractAddressesFromLexer, computeHashAndExtractAddresses} from '../src/parser/ParserWithCaching'
import { tokenizeFormula } from '../src/parser/FormulaParser'

const sharedExamples = (computeFunc: (code: string) => { hash: string, addresses: Array<string> }) => {
  it("simple case", () => {
    const code = "=42"

    expect(computeFunc(code)).toEqual({
      hash: "=42",
      addresses: []
    })
  })

  it("cell reference", () => {
    const code = "=A5"

    expect(computeFunc(code)).toEqual({
      hash: "=#",
      addresses: ["A5"]
    })
  })

  it("more addresses", () => {
    const code = "=A5+A7"

    expect(computeFunc(code)).toEqual({
      hash: "=#+#",
      addresses: ["A5", "A7"]
    })
  });

  it("cell ref in string", () => {
    const code = "='A5'"

    expect(computeFunc(code)).toEqual({
      hash: "='A5'",
      addresses: []
    })
  });

  it("cell ref between strings", () => {
    const code = "='A5'+A4+'A6'"

    expect(computeFunc(code)).toEqual({
      hash: "='A5'+#+'A6'",
      addresses: ["A4"]
    })
  });

  it("cell ref in string with escape", () => {
    const code = "='fdsaf\\'A5'"

    expect(computeFunc(code)).toEqual({
      hash: "='fdsaf\\'A5'",
      addresses: []
    })
  });

  it("cell range", () => {
    const code = "=A5:B16"

    expect(computeFunc(code)).toEqual({
      hash: "=#:#",
      addresses: ["A5:B16"]
    })
  });
}

describe("computeHashAndExtractAddressesFromLexer", () => {
  const computeFunc = computeHashAndExtractAddressesFromLexer

  sharedExamples(computeFunc)

  it("error in parsing", () => {
    const code = "='fdsafdsa"

    expect(() => {
      computeFunc(code)
    }).toThrowError(new Error('Unexpected parse error'))
  });
})

describe("computeHashAndExtractAddresses", () => {
  const computeFunc = (code: string): { hash: string, addresses: Array<string> } => {
    const tokens = tokenizeFormula(code).tokens
    return computeHashAndExtractAddresses(tokens)
  }

  sharedExamples(computeFunc)

  it("ignores whitespace", () => {
    const code = "= 42"

    expect(computeFunc(code)).toEqual({
      hash: "=42",
      addresses: []
    })
  })

  it("same hash for formulas with different namespace", () => {
    const code1 = "= 42 "
    const code2 = "   =42"

    const result1 = computeFunc(code1)
    const result2 = computeFunc(code2)
    expect(result1).toEqual(result2)
  })
})
