import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessages} from '../../src/error-messages'
import {adr, detailedError} from '../testUtils'

describe('Function NPER', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NPER(1,1)', '=NPER(1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessages.ErrorArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NPER(1%, 1, 100, 1)', '=NPER(1%, 1, 100, 1, 1)', '=NPER(1%, 1, 100, 1, 2)'],
      ['=NPER(100%, -50, 100, 0, 1)', '=NPER(100%, -50, 100, -100, 1)', '=NPER(-100%, 1, 100, 1, 1)', '=NPER(-200%, 1, 100, 1, 1)'],
      ['=NPER(-20%, -50, 100, 300, 1)', ],
      ['=NPER(0%, -50, 100, 300, 1)', ],
      ['=NPER(0%, 0, 100, 100, 1)', '=NPER(0%, 0, 100, -100, 1)' ],
      ['=NPER(1%, 0, 100, 100, 1)', '=NPER(1%, 0, 100, -50, 1)' ],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-70.67076731)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo( -70.16196068)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo( -70.16196068)
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NUM, ErrorMessages.Infty))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.NUM, ErrorMessages.Infty))
    expect(engine.getCellValue(adr('C2'))).toEqual(detailedError(ErrorType.NUM, ErrorMessages.Infty))
    expect(engine.getCellValue(adr('D2'))).toEqual(detailedError(ErrorType.NUM, ErrorMessages.Infty))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.NUM, ErrorMessages.Infty))
    expect(engine.getCellValue(adr('A4'))).toEqual(8)
    expect(engine.getCellValue(adr('A5'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('B5'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A6'))).toEqual(detailedError(ErrorType.NUM, ErrorMessages.Infty))
    expect(engine.getCellValue(adr('B6'))).toBeCloseTo(-69.66071689)
  })
})
