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
})
