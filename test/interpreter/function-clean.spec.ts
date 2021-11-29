import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function CLEAN', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CLEAN()'],
      ['=CLEAN("foo", "bar")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CLEAN("foo\u0000")'],
      ['=CLEAN("foo\u0020")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('A2'))).toEqual('foo\u0020')
  })

  it('should clean all non-printable ASCII characters', () => {
    const str = Array.from(Array(32).keys()).map(code => String.fromCharCode(code)).join('')

    const [engine] = HyperFormula.buildFromArray([
      [str, '=LEN(A1)', '=CLEAN(A1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(32)
    expect(engine.getCellValue(adr('C1'))).toEqual('')
  })

  it('should coerce other types to string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=CLEAN(1)'],
      ['=CLEAN(5+5)'],
      ['=CLEAN(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('10')
    expect(engine.getCellValue(adr('A3'))).toEqual('TRUE')
  })
})
