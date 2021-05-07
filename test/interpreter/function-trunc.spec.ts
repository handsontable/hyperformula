import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function TRUNC', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRUNC()', '=TRUNC(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works for positive numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRUNC(1.3)', '=TRUNC(1.7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBe(1)
  })

  it('works for negative numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRUNC(-1.3)', '=TRUNC(-1.7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(-1)
    expect(engine.getCellValue(adr('B1'))).toBe(-1)
  })

  it('works with positive rounding argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRUNC(1.43, 1)', '=TRUNC(1.47, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1.4)
    expect(engine.getCellValue(adr('B1'))).toBe(1.4)
  })

  it('works with negative rounding argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRUNC(43, -1)', '=TRUNC(47, -1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(40)
    expect(engine.getCellValue(adr('B1'))).toBe(40)
  })

  it('use coercion', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRUNC("42.3")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(42)
  })

  it('propagates error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/0'],
      ['=TRUNC(A1)', '=TRUNC(42, A1)', '=TRUNC(A1, FOO())'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('C2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })
})
