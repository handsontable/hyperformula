import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COLUMNS', () => {
  it('accepts exactly one argument', async() => {
const engine = await HyperFormula.buildFromArray([['=COLUMNS()', '=COLUMNS(A1:B1, A2:B2)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works for range', async() => {
const engine = await HyperFormula.buildFromArray([['=COLUMNS(A1:C2)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('works for column range', async() => {
const engine = await HyperFormula.buildFromArray([['=COLUMNS(A:C)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('works for row range', async() => {
const engine = await HyperFormula.buildFromArray([['=COLUMNS(1:2)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(engine.getConfig().maxColumns)
  })

  it('works for array', async() => {
const engine = await HyperFormula.buildFromArray([['=COLUMNS({1,2,3})']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('works with cell reference', async() => {
const engine = await HyperFormula.buildFromArray([['=COLUMNS(A1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('error when nested cycle', async() => {
const engine = await HyperFormula.buildFromArray([['=COLUMNS(A1+1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
  })

  it('propagates only direct errors', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=4/0'],
      ['=COLUMNS(4/0)'],
      ['=COLUMNS(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('works with formulas', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
      ['=COLUMNS(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })

  it('should work when adding column', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '1'],
      ['=COLUMNS(A1:B1)']
    ])

    engine.addColumns(0, [1, 1])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })
})
