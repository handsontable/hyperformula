import {HyperFormula, ErrorType} from '../../src'
import {adr, detailedError} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('ADDRESS', () => {
  it('with row and col', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1,1)'],
      ['=ADDRESS(77,300)'],
      ['=ADDRESS(ROW(),300)'],
      ['=ADDRESS(45,COLUMN())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('$A$1')
    expect(engine.getCellValue(adr('A2'))).toEqual('$KN$77')
    expect(engine.getCellValue(adr('A2'))).toEqual('$KN$77')
    expect(engine.getCellValue(adr('A2'))).toEqual('$KN$77')
  })

  it('with row, col, and abs', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1,1,1)'],
      ['=ADDRESS(1,1,2)'],
      ['=ADDRESS(1,1,3)'],
      ['=ADDRESS(1,1,4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('$A$1')
    expect(engine.getCellValue(adr('A2'))).toEqual('A$1')
    expect(engine.getCellValue(adr('A3'))).toEqual('$A1')
    expect(engine.getCellValue(adr('A4'))).toEqual('A1')
  })

  it('with row, col, abs, and sheetName', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS(1,1,1, TRUE(), "Sheet1")'],
      ['=ADDRESS(1,1,2, TRUE(), "Sheet2")'],
      ['=ADDRESS(1,1,3, TRUE(), "Sheet3")'],
      ['=ADDRESS(1,1,4, TRUE(), "Sheet4")'],
      ['=ADDRESS(1,1,4, TRUE(), "")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('Sheet1!$A$1')
    expect(engine.getCellValue(adr('A2'))).toEqual('Sheet2!A$1')
    expect(engine.getCellValue(adr('A3'))).toEqual('Sheet3!$A1')
    expect(engine.getCellValue(adr('A4'))).toEqual('Sheet4!A1')
    expect(engine.getCellValue(adr('A5'))).toEqual('!A1')
  })


  it('invalid arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ADDRESS()'],
      ['=ADDRESS(1)'],
      ['=ADDRESS(0,0)'],
      ['=ADDRESS("row1","row2")'],
      ['=ADDRESS(1,1,0)'],
      ['=ADDRESS(1,1,5)'],
      ['=ADDRESS(1,1,4,FALSE())'],
      ['=ADDRESS(1,1,1, true, "")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A7'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ArgumentMustEqual('useA1Style', 'TRUE')))
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('true')))
  })
})
