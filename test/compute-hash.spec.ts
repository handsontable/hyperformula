import { tokenizeFormula } from '../src/parser/FormulaParser'
import { computeHash } from '../src/parser/ParserWithCaching'
import { absoluteCellAddress, simpleCellAddress, CellAddress, CellDependency } from '../src/Cell'


describe("computeHash", () => {
  const computeFunc = (code: string, address: CellAddress): { hash: string, dependencies: CellDependency[] } => computeHash(tokenizeFormula(code).tokens, address)

  it("simple case", () => {
    const code = "=42"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual({
      hash: "=42",
      dependencies: [],
    })
  })

  it("cell relative reference", () => {
    const code = "=A5"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual({
      hash: "=#3R-1",
      dependencies: [simpleCellAddress(0, 4)]
    })
  })

  it("cell absolute reference", () => {
    const code = "=$A$5"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual({
      hash: "=#4A0",
      dependencies: [simpleCellAddress(0, 4)],
    })
  })

  it("cell absolute col reference", () => {
    const code = "=$A5"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual({
      hash: "=#3AC0",
      dependencies: [simpleCellAddress(0, 4)],
    })
  })

  it("cell absolute row reference", () => {
    const code = "=A$5"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual({
      hash: "=#4AR-1",
      dependencies: [simpleCellAddress(0, 4)],
    })
  })

  it("more addresses", () => {
    const code = "=A5+A7"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual({
      hash: "=#3R-1+#5R-1",
      dependencies: [simpleCellAddress(0, 4), simpleCellAddress(0, 6)],
    })
  });

  it("cell ref in string", () => {
    const code = "='A5'"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual({
      hash: "='A5'",
      dependencies: [],
    })
  });

  it("cell ref between strings", () => {
    const code = "='A5'+A4+'A6'"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual({
      hash: "='A5'+#2R-1+'A6'",
      dependencies: [simpleCellAddress(0, 3)],
    })
  });

  it("cell ref in string with escape", () => {
    const code = "='fdsaf\\'A5'"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual({
      hash: "='fdsaf\\'A5'",
      dependencies: []
    })
  });

  it("cell range", () => {
    const code = "=A5:B16"

    expect(computeFunc(code, absoluteCellAddress(1, 1))).toEqual({
      hash: "=#3R-1:#14R0",
      dependencies: [[simpleCellAddress(0, 4), simpleCellAddress(1, 15)]]
    })
  });

  it("ignores whitespace", () => {
    const code = "= 42"

    expect(computeFunc(code, absoluteCellAddress(1, 1)).hash).toEqual("=42")
  })

  it("same hash for formulas with different namespace", () => {
    const code1 = "= 42 "
    const code2 = "   =42"

    const result1 = computeFunc(code1, absoluteCellAddress(1, 1)).hash
    const result2 = computeFunc(code2, absoluteCellAddress(1, 1)).hash
    expect(result1).toEqual(result2)
  })
})
