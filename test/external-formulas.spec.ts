import {HyperFormula} from '../src'
import {simpleCellAddress} from '../src/Cell'
import './testConfig'
import {adr} from './testUtils'

describe("External formulas - calculation", () => {
  it('basic usage', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    const [externalFormulaAddress, _changes] = engine.calculateFormula('=Sheet1!A1+10')

    expect(engine.getCellValue(externalFormulaAddress)).toEqual(52)
  })

  it('is recomputed', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    const [externalFormulaAddress, _changes] = engine.calculateFormula('=Sheet1!A1+10')

    engine.setCellContent(adr('A1'), '20')

    expect(engine.getCellValue(externalFormulaAddress)).toEqual(30)
  })

  it('works for more formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    const [externalFormulaAddress1, _changes1] = engine.calculateFormula('=Sheet1!A1+10')
    const [externalFormulaAddress2, _changes2] = engine.calculateFormula('=Sheet1!A1+11')

    expect(engine.getCellValue(externalFormulaAddress1)).toEqual(52)
    expect(engine.getCellValue(externalFormulaAddress2)).toEqual(53)
  })

  it('is possible to change external formula to other', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    const [externalFormulaAddress, _changes] = engine.calculateFormula('=Sheet1!A1+10')

    engine.setCellContent(externalFormulaAddress, '=Sheet1!A1+11')

    expect(engine.getCellValue(externalFormulaAddress)).toEqual(53)
  })
})

describe("External formulas - normalization", () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([])

    const normalizedFormula = engine.normalizeFormula('=SHEET1!A1+10')

    expect(normalizedFormula).toEqual('=Sheet1!A1+10')
  })
})

describe("External formulas - validation", () => {
  it("ok for formulas", () => {
    const engine = HyperFormula.buildFromArray([])

    const formula = '=Sheet1!A1+10'

    expect(engine.validateFormula(formula)).toBe(true)
  })

  it("fail for simple values", () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.validateFormula("42")).toBe(false)
    expect(engine.validateFormula("some text")).toBe(false)
  })

  it("fail when not a formula", () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.validateFormula("=SOME SYNTAX ERROR")).toBe(false)
  })

  it("ok when literal error", () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.validateFormula("=#N/A")).toBe(true)
  })
})
