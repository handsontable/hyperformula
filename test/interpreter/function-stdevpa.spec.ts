import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function STDEVPA', () => {
  it('should take at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVPA()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate standard deviation (population)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=STDEVPA(2, 3)'],
      ['=STDEVPA(2, 3, 4, TRUE(), FALSE(), "1",)'],
      ['=STDEVPA(B3:I3)', 2, 3, 4, true, false, 'a', '\'1', null],
      ['=STDEVPA(1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.39970842444753, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(1.49829835452879, 6)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })
})
