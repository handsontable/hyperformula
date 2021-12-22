import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('function CONCATENATE', () => {
  it('validate arguments', () => {
    const [engine] = HyperFormula.buildFromArray([['=CONCATENATE()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('works', () => {
    const [engine] = HyperFormula.buildFromArray([['John', 'Smith', '=CONCATENATE(A1, B1)']])

    expect(engine.getCellValue(adr('C1'))).toEqual('JohnSmith')
  })

  it('propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=4/0', '=FOOBAR()'],
      ['=CONCATENATE(4/0)'],
      ['=CONCATENATE(A1)'],
      ['=CONCATENATE(A1,B1)'],
      ['=CONCATENATE(A1:B1)'],
      ['=CONCATENATE(C1,B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOOBAR')))
  })

  it('empty value is empty string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['foo', '', 'bar', '=CONCATENATE(A1, B1, C1)'],
    ])

    expect(engine.getCellValue(adr('D1'))).toEqual('foobar')
  })

  it('supports range values', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['Topleft', 'Topright'],
      ['Bottomleft', 'Bottomright'],
      ['=CONCATENATE(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual('TopleftToprightBottomleftBottomright')
  })

  it('coerce to strings', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRUE()', '42', '=CONCATENATE(A1:B1)'],
      ['=TRUE()', '=42%', '=CONCATENATE(A2:B2)'],
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual('TRUE42')
    expect(engine.getCellValue(adr('C2'))).toEqual('TRUE0.42')
  })
})
