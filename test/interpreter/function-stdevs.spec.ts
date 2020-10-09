import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function STDEV.S', () => {
  it('should take at least two arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEV.S()'],
      ['=STDEV.S(1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should calculate standard deviation (sample)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEV.S(2, 3)'],
      ['=STDEV.S(2, 3, 4, TRUE(), FALSE(), "1",)'],
      ['=STDEV.S(B3:I3)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.707106781186548, 6)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.51185789203691, 6) //inconsistency with product #1
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(1, 6)
  })
})
