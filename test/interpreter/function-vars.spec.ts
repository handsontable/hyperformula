import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function VAR.S', () => {
  it('should take at least two arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VAR.S()'],
      ['=VAR.S(1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should calculate variance (sample)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VAR.S(2, 3)'],
      ['=VAR.S(B2:D2, E2, F2)', 2, 3, 'foo', 'bar', 4],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
  })
})
