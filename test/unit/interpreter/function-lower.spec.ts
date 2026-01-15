import {ErrorType, HyperFormula} from '../../../src'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function LOWER', () => {
  it('should take one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LOWER()'],
      ['=LOWER("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should convert text to lowercase', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LOWER("")'],
      ['=LOWER(B1)'],
      ['=LOWER("foo")'],
      ['=LOWER("FOO")'],
      ['=LOWER("BaR")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('')
    expect(engine.getCellValue(adr('A2'))).toBe('')
    expect(engine.getCellValue(adr('A3'))).toBe('foo')
    expect(engine.getCellValue(adr('A4'))).toBe('foo')
    expect(engine.getCellValue(adr('A5'))).toBe('bar')
  })

  it('should coerce', () => {
    const engine = HyperFormula.buildFromArray([
      ['=LOWER(TRUE())'],
      ['=LOWER(0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('true')
    expect(engine.getCellValue(adr('A2'))).toBe('0')
  })
})
