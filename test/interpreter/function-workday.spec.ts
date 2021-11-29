import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function WORKDAY', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WORKDAY(1)', '=WORKDAY(1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works correctly for first two arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=WORKDAY(1000, 1)'],
      ['=WORKDAY(1000.9, 1.9)'],
      ['=WORKDAY(1000.9, -1)'],
      ['=WORKDAY(1000, -1.9)'],
      ['=WORKDAY(1000, 0)'],
      ['=WORKDAY(1000, 0.9)'],
      ['=WORKDAY(1000, -0.9)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(1003)
    expect(engine.getCellValue(adr('A2'))).toEqual(1003)
    expect(engine.getCellValue(adr('A3'))).toEqual(999)
    expect(engine.getCellValue(adr('A4'))).toEqual(999)
    expect(engine.getCellValue(adr('A5'))).toEqual(1000)
    expect(engine.getCellValue(adr('A6'))).toEqual(1000)
    expect(engine.getCellValue(adr('A7'))).toEqual(1000)
  })

  it('this year', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['29/09/2020', '=A1+0.1', '31/12/2019', '01/01/2021', '27/09/2020'],
      ['=WORKDAY("01/01/2020", 262)'],
      ['=WORKDAY("01/01/2020", 262, A1:A1)'],
      ['=WORKDAY("01/01/2020", 262, A1:B1)'],
      ['=WORKDAY("01/01/2020", 262, A1:D1)'],
      ['=WORKDAY("01/01/2020", 262, A1:E1)'],
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual(44197)
    expect(engine.getCellValue(adr('A3'))).toEqual(44200)
    expect(engine.getCellValue(adr('A4'))).toEqual(44200)
    expect(engine.getCellValue(adr('A5'))).toEqual(44201)
    expect(engine.getCellValue(adr('A6'))).toEqual(44201)
  })

  it('should output correct values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['01/01/2020', '=A1+5', '=A1+8', '=A1+9', '=A1+15', '=A1+18', '=A1+19', '=A1+32', '=A1+54', '=A1+55'],
      ['=WORKDAY(A1, 65, A1:J1)'],
      ['=WORKDAY(A1+7, 6, A1:J1)'],
      ['=WORKDAY(A1+7, 62, A1:J1)'],
      ['=WORKDAY(A1+13, 26, A1:J1)'],
      ['=WORKDAY(A1+50, 3, A1:J1)'],
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual(43931)
    expect(engine.getCellValue(adr('A3'))).toEqual(43852)
    expect(engine.getCellValue(adr('A4'))).toEqual(43934)
    expect(engine.getCellValue(adr('A5'))).toEqual(43882)
    expect(engine.getCellValue(adr('A6'))).toEqual(43888)
  })

  it('checks types in last argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      [true, '\'1', null, '=NA()'],
      ['=WORKDAY(1000, 1, A1:A1)'],
      ['=WORKDAY(1000, 1, B1:B1)'],
      ['=WORKDAY(1000, 1, C1:C1)'],
      ['=WORKDAY(1000, 1, A1:D1)'],
    ])
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    expect(engine.getCellValue(adr('A4'))).toEqual(1003)
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NA))
  })
})
