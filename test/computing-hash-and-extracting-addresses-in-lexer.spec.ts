import {computeHashAndExtractAddressesFromLexer} from '../src/parser/ParserWithCaching'

describe("computeHashAndExtractAddressesFromLexer", () => {
  it("simple case", () => {
    const code = "=42"

    expect(computeHashAndExtractAddressesFromLexer(code)).toEqual({
      hash: "=42",
      addresses: []
    })
  })

  it("cell reference", () => {
    const code = "=A5"

    expect(computeHashAndExtractAddressesFromLexer(code)).toEqual({
      hash: "=#",
      addresses: ["A5"]
    })
  })

  it("more addresses", () => {
    const code = "=A5+A7"

    expect(computeHashAndExtractAddressesFromLexer(code)).toEqual({
      hash: "=#+#",
      addresses: ["A5", "A7"]
    })
  });

  it("cell ref in string", () => {
    const code = "='A5'"

    expect(computeHashAndExtractAddressesFromLexer(code)).toEqual({
      hash: "='A5'",
      addresses: []
    })
  });

  it("cell ref between strings", () => {
    const code = "='A5'+A4+'A6'"

    expect(computeHashAndExtractAddressesFromLexer(code)).toEqual({
      hash: "='A5'+#+'A6'",
      addresses: ["A4"]
    })
  });

  it("error in parsing", () => {
    const code = "='fdsafdsa"

    expect(() => {
      computeHashAndExtractAddressesFromLexer(code)
    }).toThrowError(new Error('Unexpected parse error'))
  });

  it("cell ref in string with escape", () => {
    const code = "='fdsaf\\'A5'"

    expect(computeHashAndExtractAddressesFromLexer(code)).toEqual({
      hash: "='fdsaf\\'A5'",
      addresses: []
    })
  });
})
