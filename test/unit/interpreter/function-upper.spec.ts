import {ErrorType, HyperFormula} from '../../../src'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function UPPER', () => {
  it('should take one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UPPER()'],
      ['=UPPER("foo", "bar")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should convert text to uppercase', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UPPER("")'],
      ['=UPPER(B1)'],
      ['=UPPER("FOO")'],
      ['=UPPER("foo")'],
      ['=UPPER("bAr")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('')
    expect(engine.getCellValue(adr('A2'))).toBe('')
    expect(engine.getCellValue(adr('A3'))).toBe('FOO')
    expect(engine.getCellValue(adr('A4'))).toBe('FOO')
    expect(engine.getCellValue(adr('A5'))).toBe('BAR')
  })

  it('should coerce', () => {
    const engine = HyperFormula.buildFromArray([
      ['=UPPER(TRUE())'],
      ['=UPPER(0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('TRUE')
    expect(engine.getCellValue(adr('A2'))).toBe('0')
  })
})
