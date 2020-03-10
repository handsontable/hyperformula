import {Config, HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
import {plPL} from '../src/i18n'
import {adr, detailedError} from './testUtils'

describe('Rebuild config', () => {
  it('simple reload preserves values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1', '=SUM(A1:B1)'],
      ['#DIV/0!', '=B2', '=F(']
    ])
    const engine2 = engine.rebuildWithConfig({})

    expect(engine2.getCellValue(adr('A1'))).toBe(1)
    expect(engine2.getCellValue(adr('B1'))).toBe(1)
    expect(engine2.getCellValue(adr('C1'))).toBe(2)
    expect(engine2.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine2.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.CYCLE))
    expect(engine2.getCellValue(adr('C2'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
  })
  it('simple reload preserves formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=A1', '=SUM(A1:B1)'],
      ['#DIV/0!', '=B2', '=F(']
    ])
    const engine2 = engine.rebuildWithConfig({})

    expect(engine2.getCellFormula(adr('B1'))).toBe('=A1')
    expect(engine2.getCellFormula(adr('C1'))).toBe('=SUM(A1:B1)')
    expect(engine2.getCellFormula(adr('B2'))).toBe('=B2')
    expect(engine2.getCellFormula(adr('C2'))).toBe('=F(')
  })

  it('simple reload preserves values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1.00000000000001', '1', '=A1-B1'],
    ], new Config({smartRounding: false}))
    const engine2 = engine.rebuildWithConfig({smartRounding: true})

    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(0.00000000000001)
    expect(engine2.getCellValue(adr('C1'))).toEqual(0)
  })
  it('language reload', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FOO()', '=SUM()', '=SUMA()', 'SUM()', '=SUM('],
    ])
    const engine2 = engine.rebuildWithConfig({language: plPL})

    expect(engine2.getCellFormula(adr('A1'))).toBe('=FOO()')
    expect(engine2.getCellFormula(adr('B1'))).toBe('=SUMA()')
    expect(engine2.getCellFormula(adr('C1'))).toBe('=SUMA()')
    expect(engine2.getCellFormula(adr('D1'))).toBe(undefined)
    expect(engine2.getCellFormula(adr('E1'))).toBe('=SUM(')
  })
})
