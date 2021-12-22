import {ErrorType, HyperFormula} from '../../src'
import {CellValueDetailedType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function NPV', () => {
  it('should return #NA! error with the wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NPV(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should ignore logical and text values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NPV(1, B1:C1)', 1, 'abcd'],
      ['=NPV(1, B2:C2)', true, 1],
      ['=NPV(-1, 0)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5)
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
    expect(engine.getCellValue(adr('A2'))).toEqual(0.5)
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
  })

  it('should be compatible with product #2', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NPV(1, TRUE(), 1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.75) //product #1 returns 0.5
  })

  it('order of arguments matters', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NPV(1, A2:B3)'],
      [1, 2],
      [3, 4],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(1.625)
  })

  it('should return correct error value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NPV(1, NA())'],
      ['=NPV(1, 1, "abcd")'],
      ['=NPV(-1,1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  /**
   * Inconsistency with products #1 and #2.
   */
  it('cell reference', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NPV(1,B1)', true]
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(0.5) //Both products #1 and #2 return 0 here.
  })
})
