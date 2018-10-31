import { tokenizeFormula } from '../src/parser/FormulaParser'
import { computeHash } from '../src/parser/ParserWithCaching'
import { absoluteCellAddress, CellAddress } from '../src/Cell'


describe("computeHash", () => {
  const computeFunc = (code: string, address: CellAddress): string => computeHash(tokenizeFormula(code).tokens, address)

  it("simple case", () => {
    const code = "=42"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual("=42")
  })

  it("cell relative reference", () => {
    const code = "=A5"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual("=#3R-1")
  })

  it("cell absolute reference", () => {
    const code = "=$A$5"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual("=#4A0")
  })

  it("cell absolute col reference", () => {
    const code = "=$A5"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual("=#3AC0")
  })

  it("cell absolute row reference", () => {
    const code = "=A$5"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual("=#4AR-1")
  })
})
