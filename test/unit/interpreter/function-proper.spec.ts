import {ErrorType, HyperFormula} from '../../../src'
import {ErrorMessage} from '../../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function PROPER', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PROPER()'],
      ['=PROPER("foo", "bar")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PROPER("foo")'],
      ['=PROPER("foo bar")'],
      ['=PROPER(" foo    bar   ")'],
      ['=PROPER("fOo BAR")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('Foo')
    expect(engine.getCellValue(adr('A2'))).toBe('Foo Bar')
    expect(engine.getCellValue(adr('A3'))).toBe(' Foo    Bar   ')
    expect(engine.getCellValue(adr('A4'))).toBe('Foo Bar')
  })

  it('should work with punctuation marks and numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PROPER("123aa123bb.cc.dd")']
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('123Aa123Bb.Cc.Dd')
  })

  it('should work with accents', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PROPER("MAI ANH ĐỨC")'],
      ['=PROPER("MAI CHÍ THỌ")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('Mai Anh Đức')
    expect(engine.getCellValue(adr('A2'))).toBe('Mai Chí Thọ')
  })

  it('should coerce other types to string', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PROPER(1)'],
      ['=PROPER(5+5)'],
      ['=PROPER(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe('1')
    expect(engine.getCellValue(adr('A2'))).toBe('10')
    expect(engine.getCellValue(adr('A3'))).toBe('True')
  })
})
