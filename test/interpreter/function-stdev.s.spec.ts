import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function STDEV.S', () => {
  it('should take at least two arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=STDEV.S()'],
      ['=STDEV.S(1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should calculate standard deviation (sample)', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=STDEV.S(2, 3)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.707106781186548, 6)
  })

  it('should coerce explicit argument to numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=STDEV.S(2, 3, 4, TRUE(), FALSE(), "1",)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(1.51185789203691, 6) //inconsistency with product #1
  })

  it('should ignore non-numeric values in ranges, including ignoring logical values and text representation of numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=STDEV.S(B1:I1)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('should propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=STDEV.S(B1:I1)', 2, 3, 4, '=NA()', false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
