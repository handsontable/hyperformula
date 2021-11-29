import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FVSCHEDULE', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FVSCHEDULE(1)', '=FVSCHEDULE(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FVSCHEDULE(1, 1)'],
      ['=FVSCHEDULE(2, B2:D2)', 1, 1, null],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValue(adr('A2'))).toEqual(8)
  })

  it('should return proper error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=FVSCHEDULE(2, B1:C1)', '\'1', true],
      ['=FVSCHEDULE(1, B2:C2)', 'abcd', '=NA()'],
      ['=FVSCHEDULE(1, B3)', 'abcd']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberExpected))
  })
})
