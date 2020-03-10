import {HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
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
})
