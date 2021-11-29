import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function T', () => {
  it('should take one argument', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T()'],
      ['=T("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return given text', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T("foo")'],
      ['=T(B2)', 'bar'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('A2'))).toEqual('bar')
  })

  it('should return empty string if given value is not a text', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T(B1)', '=TRUE()'],
      ['=T(B2)', 42],
      ['=T(B3)', null],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
    expect(engine.getCellValue(adr('A2'))).toEqual('')
    expect(engine.getCellValue(adr('A3'))).toEqual('')
  })

  it('should propagate errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=T(B1)', '=1/0'],
      ['=T(B2)', '=FOO()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.FunctionName('FOO')))
  })
})
