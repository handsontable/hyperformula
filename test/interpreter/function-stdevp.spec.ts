import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function STDEV.P', () => {
  it('should take at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEV.P()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate standard deviation (population)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEV.P(2, 3)'],
      ['=STDEV.P(B2:I2, 2, 3, 4, TRUE(), FALSE(), "1",)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.4142135623731, 6)
  })
})
