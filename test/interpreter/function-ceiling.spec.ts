import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CEILING', () => {
  /*Inconsistent with ODFF standard.*/
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING(1)'],
      ['=CEILING(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING(1, "bar")'],
      ['=CEILING("bar", 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING(4.43, 0.3)'],
      ['=CEILING(4.43, 0.6)'],
      ['=CEILING(4.43, 2)'],
      ['=CEILING(-3.14, -1.8)'],
      ['=CEILING(-3.14, 0)'],
      ['=CEILING(3.14, 0)'],
      ['=CEILING(0, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(4.5)
    expect(engine.getCellValue(adr('A2'))).toEqual(4.8)
    expect(engine.getCellValue(adr('A3'))).toEqual(6)
    expect(engine.getCellValue(adr('A4'))).toEqual(-3.6)
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A7'))).toEqual(0)
  })

  /*Inconsistent with ODFF standard.*/
  it('negative values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CEILING(11, 2)'],
      ['=CEILING(-11, 2)'],
      ['=CEILING(11, -2)'],
      ['=CEILING(-11, -2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(12)
    expect(engine.getCellValue(adr('A2'))).toEqual(-10)
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.DistinctSigns))
    expect(engine.getCellValue(adr('A4'))).toEqual(-12)
  })
})
