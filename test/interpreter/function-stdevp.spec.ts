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
      ['=STDEV.P(B2:D2, E2, F2)', 2, 3, 'foo', 'bar', 4],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(0.816496580927726, 6)
  })
})
