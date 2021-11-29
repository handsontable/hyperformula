import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function TRIM', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRIM()'],
      ['=TRIM("foo", "bar")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRIM("   foo")'],
      ['=TRIM("foo   ")'],
      ['=TRIM(" foo   ")'],
      ['=TRIM(" f    o  o   ")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
    expect(engine.getCellValue(adr('A2'))).toEqual('foo')
    expect(engine.getCellValue(adr('A3'))).toEqual('foo')
    expect(engine.getCellValue(adr('A4'))).toEqual('f o o')
  })

  it('should coerce other types to string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRIM(1)'],
      ['=TRIM(5+5)'],
      ['=TRIM(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('10')
    expect(engine.getCellValue(adr('A3'))).toEqual('TRUE')
  })
})
