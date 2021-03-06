import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ROWS', () => {
  it('accepts exactly one argument', () => {
    const engine = HyperFormula.buildFromArray([['=ROWS()', '=ROWS(A2:A3, B2:B4)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works for range', () => {
    const engine = HyperFormula.buildFromArray([['=ROWS(A1:C2)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  // Inconsistency with Product 1
  it('doesnt work with scalars', () => {
    const engine = HyperFormula.buildFromArray([['=ROWS(A1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.CellRangeExpected))
  })

  // Inconsistency with Product 1
  it('propagate only direct errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/0'],
      ['=ROWS(4/0)'],
      ['=ROWS(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.CellRangeExpected))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.CellRangeExpected))
  })

  // Inconsistency with Product 1
  it('doesnt work with formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
      ['=ROWS(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.CellRangeExpected))
  })

  it('should work when adding column', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=ROWS(A1:A2)'],
      ['1'],
    ])

    engine.addRows(0, [1, 1])

    expect(engine.getCellValue(adr('B1'))).toEqual(3)
  })
})
