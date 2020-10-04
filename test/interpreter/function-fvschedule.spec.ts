import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FVSCHEDULE', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FVSCHEDULE(1)', '=FVSCHEDULE(1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should calculate the correct value with correct arguments and defaults', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FVSCHEDULE(1, 1)'],
      ['=FVSCHEDULE(2, B2:C2)', 1, 1],
      ['=FVSCHEDULE(2, B3:C3)', '\'1', true],
      ['=FVSCHEDULE(1, B4:C4)', 'abcd', '=NA()'],
      ['=FVSCHEDULE(1, B5)', 'abcd']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
    expect(engine.getCellValue(adr('A2'))).toEqual(8)
    expect(engine.getCellValue(adr('A3'))).toEqual(8)
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A5'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })
})
