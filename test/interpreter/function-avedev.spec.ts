import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function AVEDEV', () => {
  it('single number', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVEDEV(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('two numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVEDEV(1, 2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
  })

  it('more numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVEDEV(3, 1, 2, 4, 5)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1.2)
  })

  it('works with ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0', '9', '0'],
      ['=AVEDEV(A1:C1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(4)
  })

  it('propagates error from regular argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=3/0', '=AVEDEV(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('propagates first error from range argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=3/0', '=FOO(', '=AVEDEV(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('returns error for empty ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVEDEV(A2:A3)'],
      [null],
      [null],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  /**
   * Product #1 returns 0
   */
  it('does coercions of nonnumeric explicit arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVEDEV(TRUE(),FALSE(),)']
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.444444444444444, 6)
  })

  /**
   * Product #2 returns 0.2:
   * average is computed from numbers, but sum of distances to avg is divided by the original range size.
   */
  it('ignores nonnumeric values in ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=AVEDEV(A2:E2)'],
      [0, 1, false, null, '\'0']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
  })
})
