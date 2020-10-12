import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function STDEV.P', () => {
  it('should take at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEV.P()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate standard deviation (population)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEV.P(2, 3)'],
      ['=STDEV.P(2, 3, 4, TRUE(), FALSE(), "1",)'],
      ['=STDEV.P(B3:I3)', 2, 3, 4, true, false, 'a', '\'1', null],
      ['=STDEV.P(1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.39970842444753, 6) //inconsistency with product #1
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(0.816496580927726, 6)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })
})
