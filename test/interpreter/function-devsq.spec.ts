import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function DEVSQ', () => {
  it('single number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEVSQ(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('two numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEVSQ(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
  })

  it('more numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEVSQ(3, 1, 2, 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(10)
  })

  it('works with ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0', '9', '0'],
      ['=DEVSQ(A1:C1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(54)
  })

  it('propagates error from regular argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=3/0', '=DEVSQ(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('propagates first error from range argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=3/0', '=FOO(', '=DEVSQ(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  //inconsistency with product #2
  it('returns 0 for empty ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEVSQ(A2:A3)'],
      [null],
      [null],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  /**
   * product #1 does not coerce the input
   */
  it('does coercions of nonnumeric explicit arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEVSQ(TRUE(),FALSE(),)']
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.666666666666667, 6)
  })

  it('ignores nonnumeric values in ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=DEVSQ(A2:D2)'],
      [0, 1, false, null, '\'0']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
  })
})
