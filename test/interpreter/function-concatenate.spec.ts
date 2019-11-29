import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import {adr} from '../testUtils'
import '../testConfig'

describe('function CONCATENATE', () => {
  it('validate arguments', () => {
    const engine = HyperFormula.buildFromArray([['=CONCATENATE()']])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.NA))
  })

  it('works', () => {
    const engine = HyperFormula.buildFromArray([['John', 'Smith', '=CONCATENATE(A1, B1)']])

    expect(engine.getCellValue(adr('C1'))).toEqual('JohnSmith')
  })

  it('propagate errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/0', '=FOOBAR()'],
      ['=CONCATENATE(4/0)'],
      ['=CONCATENATE(A1)'],
      ['=CONCATENATE(A1,B1)'],
      ['=CONCATENATE(A1:B1)'],
      ['=CONCATENATE(C1,B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A4'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A5'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A6'))).toEqual(new CellError(ErrorType.NAME))
  })

  it('empty value is empty string', () => {
    const engine = HyperFormula.buildFromArray([
      ['foo', '', 'bar', '=CONCATENATE(A1, B1, C1)']
    ])

    expect(engine.getCellValue(adr('D1'))).toEqual('foobar')
  })

  it('supports range values', () => {
    const engine = HyperFormula.buildFromArray([
      ['Topleft', 'Topright'],
      ['Bottomleft', 'Bottomright'],
      ['=CONCATENATE(A1:B2)']
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual('TopleftToprightBottomleftBottomright')
  })

  it('coerce to strings', () => {
    const engine = HyperFormula.buildFromArray([
      ['=TRUE()', '42', '=CONCATENATE(A1:B1)'],
      ['=TRUE()', '=42%', '=CONCATENATE(A2:B2)']
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual('TRUE42')
    expect(engine.getCellValue(adr('C2'))).toEqual('TRUE0.42')
  })
})
