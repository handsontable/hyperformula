import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function PROPER', () => {
  it('should return N/A when number of arguments is incorrect', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PROPER()'],
      ['=PROPER("foo", "bar")']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
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

  it('should coerce other types to string', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PROPER(1)'],
      ['=PROPER(5+5)'],
      ['=PROPER(TRUE())'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
    expect(engine.getCellValue(adr('A2'))).toEqual('10')
    expect(engine.getCellValue(adr('A3'))).toEqual('True')
  })
})