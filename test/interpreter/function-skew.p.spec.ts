import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SKEW.P', () => {
  it('simple case', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SKEW.P(1, 2, 4, 8)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.6568077345, 6)
  })

  it('works with ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['0', '9', '0', '10'],
      ['=SKEW.P(A1:D1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.0164833284967738, 6)
  })

  it('propagates error from regular argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NA()', '=SKEW.P(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA))
  })

  it('propagates first error from range argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NA()', '=FOO(', '=SKEW.P(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA))
  })

  /**
   * product #1 does not coerce the input
   */
  it('does coercions of nonnumeric explicit arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SKEW.P(TRUE(),FALSE(),)']
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.707106781186548, 6)
  })

  it('ignores nonnumeric values in ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SKEW.P(A2:F2)'],
      [1, 0, 0, false, null, '\'0']
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.707106781186548, 6)
  })

  it('validates range size', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SKEW.P(0,0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO, ErrorMessage.ThreeValues))
  })
})
