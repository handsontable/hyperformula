import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function SYD', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SYD(1,1,1)', '=SYD(1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SYD(100, 1, 2.1, 2)', '=SYD(100, 1, 2.1, 2.1)', '=SYD(100, 1, 2, 2.1)', '=SYD(100, 1, 2, 2)', ],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(33.4562211981567)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(30.4147465437788)
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NUM))
    expect(engine.getCellValue(adr('D1'))).toBeCloseTo(33)
  })
})
