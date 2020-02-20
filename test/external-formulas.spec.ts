import {HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
import './testConfig'
import {detailedError} from './testUtils'

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

describe('External formulas - calculation', () => {
  it('basic usage', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    const result = engine.calculateFormula('=Sheet1!A1+10')

    expect(result).toEqual(52)
  })

  it('non-scalars doesnt work', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['1', '2'],
    ])

    const result = engine.calculateFormula('=TRANSPOSE(A1:B2)')

    expect(result).toEqual(detailedError(ErrorType.VALUE))
  })

  it('passing something which is not a formula doesnt work', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.calculateFormula('{=TRANSPOSE(A1:B2)}')
    }).toThrowError(/not a formula/)

    expect(() => {
      engine.calculateFormula('42')
    }).toThrowError(/not a formula/)
  })
})
