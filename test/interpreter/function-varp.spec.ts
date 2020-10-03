import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function VAR.P', () => {
  it('should take at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VAR.P()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate variance (population)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VAR.P(2, 3)'],
      ['=VAR.P(B2:D2, E2, F2)', 2, 3, 'foo', 'bar', 4],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.25)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(2/3, 6)
  })
})
