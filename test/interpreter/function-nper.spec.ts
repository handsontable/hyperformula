import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function NPER', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NPER(1,1)', '=NPER(1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NPER(1%, 1, 100, 1)', '=NPER(1%, 1, 100, 1, 1)', '=NPER(1%, 1, 100, 1, 2)'],
      ['=NPER(100%, -50, 100, 0, 1)', '=NPER(100%, -50, 100, -100, 1)', '=NPER(-100%, 1, 100, 1, 1)', '=NPER(-200%, 1, 100, 1, 1)'],
      ['=NPER(-20%, -50, 100, 300, 1)', ],
      ['=NPER(0%, -50, 100, 300, 1)', ],
      ['=NPER(0%, 0, 100, 100, 1)', '=NPER(0%, 0, 100, -100, 1)'],
      ['=NPER(1%, 0, 100, 100, 1)', '=NPER(1%, 0, 100, -50, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-70.67076731)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-70.16196068)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(-70.16196068)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expect(engine.getCellValue(adr('B2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expect(engine.getCellValue(adr('C2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expect(engine.getCellValue(adr('D2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expect(engine.getCellValue(adr('A4'))).toEqual(8)
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B5'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.NaN))
    expect(engine.getCellValue(adr('B6'))).toBeCloseTo(-69.66071689)
  })
})
