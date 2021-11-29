import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function TBILLPRICE', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TBILLPRICE(1,1)', '=TBILLPRICE(1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TBILLPRICE(0, 100, 0.1)'],
      ['=TBILLPRICE(0, 360, 0.1)', '=TBILLPRICE(0, 183, 0.1)', ],
      ['=TBILLPRICE(0, 180, 1.9)', '=TBILLPRICE(0, 180, 2)', '=TBILLPRICE(0, 180, 2.1)', ],
      ['=TBILLPRICE("1/2/2000", "31/1/2001", 0.1)', '=TBILLPRICE(0, 365, 0.1)', ],
      ['=TBILLPRICE("28/2/2003", "29/2/2004", 0.1)'],
      ['=TBILLPRICE(2, 2.1, 0.1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(97.2222222222222, 6)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValue(adr('A2'))).toEqual(90)
    expect(engine.getCellValue(adr('B2'))).toBeCloseTo(94.9166666666667, 6)
    //inconsistency with product #1 (returns #NUM!)
    expect(engine.getCellValue(adr('A3'))).toEqual(5)
    //inconsistency with product #1 (returns #NUM!)
    expect(engine.getCellValue(adr('B3'))).toEqual(0)
    expect(engine.getCellValue(adr('C3'))).toEqualError(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A4'))).toBeCloseTo(89.8611111111111, 6)
    expect(engine.getCellValue(adr('B4'))).toBeCloseTo(89.8611111111111, 6)
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM))
  })
})
