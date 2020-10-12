import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Function VARPA', () => {
  it('should take at least one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VARPA()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate variance (population)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VARPA(2, 3)'],
      ['=VARPA(2, 3, 4, TRUE(), FALSE(), "1",)'],
      ['=VARPA(B3:I3)', 2, 3, 4, true, false, 'a', '\'1', null],
      ['=VARPA(1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.25)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(1.95918367346939, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(2.24489795918367, 6)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })
})
