import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function VARA', () => {
  it('should take at least two arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VARA()'],
      ['=VARA(1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should calculate variance (sample)', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VARA(2, 3)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.5, 6)
  })

  it('should coerce explicit argument to numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VARA(2, 3, 4, TRUE(), FALSE(), "1",)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2.28571428571429)
  })

  it('should evaluate TRUE to 1, FALSE to 0 and text to 0', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VARA(B1:I1)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2.61904761904762)
  })

  it('should propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VARA(B1:I1)', 2, 3, 4, '=NA()', false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
