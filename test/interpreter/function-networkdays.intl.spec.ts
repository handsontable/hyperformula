import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function NETWORKDAYS.INTL', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NETWORKDAYS.INTL(1)', '=NETWORKDAYS.INTL(1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should check for types or value of third argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NETWORKDAYS.INTL(0, 1, TRUE())'],
      ['=NETWORKDAYS.INTL(0, 1, "1")'],
      ['=NETWORKDAYS.INTL(0, 1, "1010102")'],
      ['=NETWORKDAYS.INTL(0, 1, -1)'],
      ['=NETWORKDAYS.INTL(0, 1, "1111111")'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.WeekendString))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.WeekendString))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.BadMode))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.WeekendString))
  })

  it('works correctly for first two arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NETWORKDAYS.INTL(0, 1)'],
      ['=NETWORKDAYS.INTL(0, 6)'],
      ['=NETWORKDAYS.INTL(0, 6.9)'],
      ['=NETWORKDAYS.INTL(6.9,0.1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
    expect(engine.getCellValue(adr('A4'))).toEqual(-5)
  })

  it('today', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NETWORKDAYS.INTL("29/09/2020", "29/09/2020")'],
      ['=NETWORKDAYS.INTL("29/09/2020", "29/09/2020", 3)'],
      ['=NETWORKDAYS.INTL("29/09/2020", "29/09/2020", 4)'],
      ['=NETWORKDAYS.INTL("29/09/2020", "29/09/2020", 13)'],
      ['=NETWORKDAYS.INTL("29/09/2020", "29/09/2020", "1011111")'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
    expect(engine.getCellValue(adr('A5'))).toEqual(1)
  })

  it('this year', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['29/09/2020', '=A1+0.1', '31/12/2019', '01/01/2021', '27/09/2020'],
      ['=NETWORKDAYS.INTL("01/01/2020", "31/12/2020", 1)'],
      ['=NETWORKDAYS.INTL("01/01/2020", "31/12/2020", 1, A1:A1)'],
      ['=NETWORKDAYS.INTL("01/01/2020", "31/12/2020", 1, A1:B1)'],
      ['=NETWORKDAYS.INTL("01/01/2020", "31/12/2020", 1, A1:D1)'],
      ['=NETWORKDAYS.INTL("01/01/2020", "31/12/2020", 1, A1:E1)'],
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual(262)
    expect(engine.getCellValue(adr('A3'))).toEqual(261)
    expect(engine.getCellValue(adr('A4'))).toEqual(261)
    expect(engine.getCellValue(adr('A5'))).toEqual(261)
    expect(engine.getCellValue(adr('A6'))).toEqual(261)
  })

  it('should output correct values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['01/01/2020', '=A1+5', '=A1+8', '=A1+9', '=A1+15', '=A1+18', '=A1+19', '=A1+32', '=A1+54', '=A1+55'],
      ['=NETWORKDAYS.INTL(A1, A1+100, "0000000", A1:J1)'],
      ['=NETWORKDAYS.INTL(A1+7, A1+20, "0000000", A1:J1)'],
      ['=NETWORKDAYS.INTL(A1+7, A1+100, "0000000", A1:J1)'],
      ['=NETWORKDAYS.INTL(A1+13, A1+50, "0000000", A1:J1)'],
      ['=NETWORKDAYS.INTL(A1+50, A1+56, "0000000", A1:J1)'],
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual(91)
    expect(engine.getCellValue(adr('A3'))).toEqual(9)
    expect(engine.getCellValue(adr('A4'))).toEqual(86)
    expect(engine.getCellValue(adr('A5'))).toEqual(34)
    expect(engine.getCellValue(adr('A6'))).toEqual(5)
  })

  it('checks types in last argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      [true, '\'1', null, '=NA()'],
      ['=NETWORKDAYS.INTL(1000, 1, 1, A1:A1)'],
      ['=NETWORKDAYS.INTL(1000, 1, 1, B1:B1)'],
      ['=NETWORKDAYS.INTL(1000, 1, 1, C1:C1)'],
      ['=NETWORKDAYS.INTL(1000, 1, 1, A1:D1)'],
    ])
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A4'))).toEqual(-715)
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NA))
  })
})
