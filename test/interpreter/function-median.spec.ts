import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function MEDIAN', () => {
  it('single number', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('two numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1.5)
  })

  it('more numbers (odd)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(3, 1, 2, 5, 7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('more numbers (even)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(3, 4, 1, 2, 5, 7)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3.5)
  })

  it('works with ranges', () => {
    const engine = HyperFormula.buildFromArray([
      ['3', '5', '1'],
      ['=MEDIAN(A1:C1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })

  it('propagates error from regular argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=3/0', '=MEDIAN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('propagates first error from range argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=3/0', '=FOO', '=MEDIAN(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('return error when no arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('doesnt do coercions of nonnumeric arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['="12"', '="11"', '="13"', '=MEDIAN(A1:C1)'],
      ['=MEDIAN(TRUE())'],
    ])

    expect(engine.getCellValue(adr('D1'))).toEqual(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM))
  })

  it('ignores nonnumeric values as long as theres at least one numeric value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN(TRUE(), "foobar", 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(42)
  })

  // Inconsistency with Product 1
  it('doesnt do coercions of given string arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MEDIAN("12", "11", "13")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NUM))
  })
})
