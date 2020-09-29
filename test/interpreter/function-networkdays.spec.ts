import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function NETWORKDAYS', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NETWORKDAYS(1)', '=NETWORKDAYS(1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works correctly for first two arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NETWORKDAYS(0, 1)'],
      ['=NETWORKDAYS(0, 6)'],
      ['=NETWORKDAYS(0, 6.9)'],
      ['=NETWORKDAYS(6.9,0.1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })

  it('this year', () => {
    const engine = HyperFormula.buildFromArray([
      ['29/09/2020', '=A1+0.1', '31/12/2019', '01/01/2021', '27/09/2020'],
      ['=NETWORKDAYS("01/01/2020", "31/12/2020")'],
      ['=NETWORKDAYS("01/01/2020", "31/12/2020", A1:A1)'],
      ['=NETWORKDAYS("01/01/2020", "31/12/2020", A1:B1)'],
      ['=NETWORKDAYS("01/01/2020", "31/12/2020", A1:D1)'],
      ['=NETWORKDAYS("01/01/2020", "31/12/2020", A1:E1)'],
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual(262)
    expect(engine.getCellValue(adr('A3'))).toEqual(261)
    expect(engine.getCellValue(adr('A4'))).toEqual(261)
    expect(engine.getCellValue(adr('A5'))).toEqual(261)
    expect(engine.getCellValue(adr('A6'))).toEqual(261)
  })
})
