import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ROWS', () => {
  it('accepts exactly one argument', async() => {
const engine = await HyperFormula.buildFromArray([['=ROWS()', '=ROWS(A2:A3, B2:B4)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works for range', async() => {
const engine = await HyperFormula.buildFromArray([['=ROWS(A1:C2)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  it('works for row range', async() => {
const engine = await HyperFormula.buildFromArray([['=ROWS(1:3)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('works for column range', async() => {
const engine = await HyperFormula.buildFromArray([['=ROWS(A:C)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(engine.getConfig().maxRows)
  })

  it('works for array', async() => {
const engine = await HyperFormula.buildFromArray([['=ROWS({1;2;3})']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('works with cell reference', async() => {
const engine = await HyperFormula.buildFromArray([['=ROWS(A1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('propagates only direct errors', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=4/0'],
      ['=ROWS(4/0)'],
      ['=ROWS(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  // Inconsistency with Product 1
  it('works with formulas', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
      ['=ROWS(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })

  it('should work when adding column', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '=ROWS(A1:A2)'],
      ['1'],
    ])

    engine.addRows(0, [1, 1])

    expect(engine.getCellValue(adr('B1'))).toEqual(3)
  })
})
