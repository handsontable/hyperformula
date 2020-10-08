import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function XNPV', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=XNPV(1,1)', '=XNPV(1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=XNPV(2%, 1, 1)'],
      ['=XNPV(1, B2:C2, D2:E2)', 1, 2, 3, 4],
      ['=XNPV(1, B3:C3, D3:E3)', 1, 2, 3.1, 4],
      ['=XNPV(1, B4:C4, D4:E4)', 1, 2, 4, 3],
      ['=XNPV(1, B5:C5, D5:E5)', 1, 2, 4, true],
      ['=XNPV(1, B6:C6, D6:E6)', 1, 2, -1, 4],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toBeCloseTo(2.99620553730319, 6)
    expect(engine.getCellValue(adr('A3'))).toBeCloseTo(2.99620553730319, 6)
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A5'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.NumberExpected))
    expect(engine.getCellValue(adr('A6'))).toEqual(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
  })
})
