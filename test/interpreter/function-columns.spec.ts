import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function COLUMNS', () => {
  it('accepts exactly one argument', () => {
    const [engine] = HyperFormula.buildFromArray([['=COLUMNS()', '=COLUMNS(A1:B1, A2:B2)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works for range', () => {
    const [engine] = HyperFormula.buildFromArray([['=COLUMNS(A1:C2)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('works for column range', () => {
    const [engine] = HyperFormula.buildFromArray([['=COLUMNS(A:C)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('works for row range', () => {
    const [engine] = HyperFormula.buildFromArray([['=COLUMNS(1:2)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(engine.getConfig().maxColumns)
  })

  it('works for array', () => {
    const [engine] = HyperFormula.buildFromArray([['=COLUMNS({1,2,3})']])

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('works with cell reference', () => {
    const [engine] = HyperFormula.buildFromArray([['=COLUMNS(A1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('error when nested cycle', () => {
    const [engine] = HyperFormula.buildFromArray([['=COLUMNS(A1+1)']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
  })

  it('propagates only direct errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=4/0'],
      ['=COLUMNS(4/0)'],
      ['=COLUMNS(A1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('works with formulas', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
      ['=COLUMNS(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })

  it('should work when adding column', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '1'],
      ['=COLUMNS(A1:B1)']
    ])

    engine.addColumns(0, [1, 1])

    expect(engine.getCellValue(adr('A2'))).toEqual(3)
  })
})
