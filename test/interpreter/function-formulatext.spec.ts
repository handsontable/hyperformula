import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function FORMULATEXT', () => {
  it('should return N/A when number of arguments is incorrect', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FORMULATEXT()'],
      ['=FORMULATEXT(B2, B3)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return N/A for wrong types of arguments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FORMULATEXT(1)'],
      ['=FORMULATEXT("foo")'],
      ['=FORMULATEXT(SUM(1))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.CellRefExpected))
  })

  it('should propagate expression error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FORMULATEXT(1/0)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return text of a formula evaluating to error', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=1/0', '=FORMULATEXT(A1)']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual('=1/0')
  })

  it('should work', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(1, 2)', '=FORMULATEXT(A1)']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual('=SUM(1, 2)')
  })

  it('should return formula of a left corner cell', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(1, 2)', '=FORMULATEXT(A1:A2)']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual('=SUM(1, 2)')
  })

  it('should return REF when ', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(1, 2)']
    ])
    engine.addSheet('Sheet2')
    await engine.setCellContents(adr('B1'), '=FORMULATEXT(Sheet1!A1:Sheet2!A2)')

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.CellRefExpected))
  })

  it('should work for unparsed formula', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(1,', '=FORMULATEXT(A1)']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual('=SUM(1,')
  })

  it('should return itself', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=FORMULATEXT(A1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('=FORMULATEXT(A1)')
  })

  it('should be dependent on sheet structure changes', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=SUM(A2)', '=FORMULATEXT(A1)'],
      [1]
    ])

    engine.addRows(0, [1, 1])

    expect(engine.getCellFormula(adr('A1'))).toEqual('=SUM(A3)')
    expect(engine.getCellValue(adr('B1'))).toEqual('=SUM(A3)')
  })
})
