import {HyperFormula} from '../src'
import {simpleCellAddress} from '../src/Cell'
import './testConfig'
import {adr} from './testUtils'

describe('External formulas - normalization', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([])

    const normalizedFormula = engine.normalizeFormula('=SHEET1!A1+10')

    expect(normalizedFormula).toEqual('=Sheet1!A1+10')
  })
})

describe('External formulas - validation', () => {
  it('ok for formulas', () => {
    const engine = HyperFormula.buildFromArray([])

    const formula = '=Sheet1!A1+10'

    expect(engine.validateFormula(formula)).toBe(true)
  })

  it('fail for simple values', () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.validateFormula('42')).toBe(false)
    expect(engine.validateFormula('some text')).toBe(false)
  })

  it('fail when not a formula', () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.validateFormula('=SOME SYNTAX ERROR')).toBe(false)
  })

  it('ok when literal error', () => {
    const engine = HyperFormula.buildFromArray([])

    expect(engine.validateFormula('=#N/A')).toBe(true)
  })
})
