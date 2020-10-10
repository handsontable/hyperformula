import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function NPV', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NPV(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return correct value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NPV(1, B1:C1)', 1, 'abcd'],
      ['=NPV(1, B2:C2)', true, 1],
      ['=NPV(1, TRUE(), 1)'],
      ['=NPV(-1, 0)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A2'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A3'))).toEqual(0.75)
    expect(engine.getCellValue(adr('A4'))).toEqual(0)
  })

  it('order of arguments matters', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NPV(1, A2:B3)'],
      [1, 2],
      [3, 4],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(1.625)
  })

  it('should return correct error value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NPV(1, NA())'],
      ['=NPV(1, 1, "abcd")'],
      ['=NPV(-1,1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })


  /**
   * Discrepancy with products #1 and #2.
   */
  it('cell reference', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NPV(1,B1)', true]
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5) //Should be 0.
  })
})
