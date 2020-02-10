import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function MOD', () => {
  it('should not work for wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(101)'],
      ['=MOD(1, 2, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA))
  })

  it('should not work for arguemnts of wrong type', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(1, "foo")'],
      ['=MOD("bar", 4)'],
      ['=MOD("foo", "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('A3'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('should return error when dividing by 0', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(42, 0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MOD(5, 2)'],
      ['=MOD(36, 6)'],
      ['=MOD(10.5, 3)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
    expect(engine.getCellValue(adr('A3'))).toEqual(1.5)
  })
})
