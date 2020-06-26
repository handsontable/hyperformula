import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function FORMULATEXT', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FORMULATEXT()'],
      ['=FORMULATEXT(B2, B3)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should return N/A for wrong types of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FORMULATEXT(1)'],
      ['=FORMULATEXT("foo")'],
      ['=FORMULATEXT(A1:A2)'],
      ['=FORMULATEXT(SUM(1))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should propagate expression error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FORMULATEXT(1/0)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return text of a formula evaluating to error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=1/0', '=FORMULATEXT(A1)']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual('=1/0')
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(1, 2)', '=FORMULATEXT(A1)']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual('=SUM(1, 2)')
  })

  it('should work for matrix formula', () => {
    const engine = HyperFormula.buildFromArray([
      ['{=TRANSPOSE(A2)}', '=FORMULATEXT(A1)']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual('{=TRANSPOSE(A2)}')
  })

  it('should work for unparsed formula', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(1,', '=FORMULATEXT(A1)']
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual('=SUM(1,')
  })

  it('should return itself', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FORMULATEXT(A1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('=FORMULATEXT(A1)')
  })

  it('should be dependent on sheet structure changes', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(A2)', '=FORMULATEXT(A1)'],
      [1]
    ])

    engine.addRows(0, [1, 1])

    expect(engine.getCellFormula(adr('A1'))).toEqual('=SUM(A3)')
    expect(engine.getCellValue(adr('B1'))).toEqual('=SUM(A3)')
  })
})