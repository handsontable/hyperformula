import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function VARPA', () => {
  it('should take at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VARPA()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate variance (population)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VARPA(2, 3)'],
      ['=VARPA(B2:I2, 2, 3, 4, TRUE(), FALSE(), "1",)', 2, 3, 4, true, false, 'a', '\'1', null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.25)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(2.10714285714286, 6)
  })
})
