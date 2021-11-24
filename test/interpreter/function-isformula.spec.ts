import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function ISFORMULA', () => {
  it('should return true for cell with formula', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=A1', '=ISFORMULA(A1)']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(true)
  })

  it('should return false for cell without formula', async() => {
const engine = await HyperFormula.buildFromArray([
      ['foo', '=ISFORMULA(A1)', '=ISFORMULA(A2)']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
  })

  it('should work with start of a range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=A1', 2, '=ISFORMULA(A1:A2)', '=ISFORMULA(B1:B2)']
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(true)
    expect(engine.getCellValue(adr('D1'))).toEqual(false)
  })

  it('should propagate error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ISFORMULA(1/0)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return NA otherwise', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ISFORMULA()', '=ISFORMULA(A1, A2)', '=ISFORMULA("foo")', '=ISFORMULA(42)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
  })

  it('should work for itself', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ISFORMULA(A1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
  })

  it('should collect dependencies of inner function and return argument type error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SIN(1)'],
      ['=ISFORMULA(SUM(A1,A3))'],
      ['=SIN(1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
  })

  it('should propagate error of inner function', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=1/0'],
      ['=ISFORMULA(SUM(A1, A3))'],
      ['=1/0']
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return #CYCLE! when cyclic reference occurs not directly in COLUMN', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=ISFORMULA(SUM(A1))'],
      ['=ISFORMULA(A1+A2)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.CYCLE))
  })
})
