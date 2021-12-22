import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function PROPER', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=PROPER()'],
      ['=PROPER("foo", "bar")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=PROPER("foo")'],
      ['=PROPER("foo bar")'],
      ['=PROPER(" foo    bar   ")'],
      ['=PROPER("fOo BAR")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('Foo')
    expect(engine.getCellValue(adr('A2'))).toEqual('Foo Bar')
    expect(engine.getCellValue(adr('A3'))).toEqual(' Foo    Bar   ')
    expect(engine.getCellValue(adr('A4'))).toEqual('Foo Bar')
  })

  it('should work with punctuation marks and numbers', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=PROPER("123aa123bb.cc.dd")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('123Aa123Bb.Cc.Dd')
  })

  it('should work with accents', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=PROPER("MAI ANH ĐỨC")'],
      ['=PROPER("MAI CHÍ THỌ")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('Mai Anh Đức')
    expect(engine.getCellValue(adr('A2'))).toEqual('Mai Chí Thọ')
  })

  it('should coerce other types to string', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=PROPER(1)'],
      ['=PROPER(5+5)'],
      ['=PROPER(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('10')
    expect(engine.getCellValue(adr('A3'))).toEqual('True')
  })
})
