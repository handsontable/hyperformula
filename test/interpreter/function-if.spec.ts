import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function IF', () => {
  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=IF(TRUE(), "no")', '=IF(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })
  it('when value is true', () => {
    const engine = HyperFormula.buildFromArray([['=IF(TRUE(), "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('when value is false', () => {
    const engine = HyperFormula.buildFromArray([['=IF(FALSE(), "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('no')
  })

  it('when condition is weird type', () => {
    const engine = HyperFormula.buildFromArray([['=IF("foo", "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
  })

  it('use coercion', () => {
    const engine = HyperFormula.buildFromArray([['=IF("TRUE", "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('returns error if condition is an error', () => {
    const engine = HyperFormula.buildFromArray([['=IF(4/0, "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('when condition is number', () => {
    const engine = HyperFormula.buildFromArray([['=IF(1, "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('when condition is logic function', () => {
    const engine = HyperFormula.buildFromArray([['=IF(OR(1, FALSE()), "yes", "no")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('works when only first part is given', () => {
    const engine = HyperFormula.buildFromArray([['=IF(TRUE(), "yes")']])

    expect(engine.getCellValue(adr('A1'))).toEqual('yes')
  })

  it('works when only first part is given and condition is falsey', () => {
    const engine = HyperFormula.buildFromArray([['=IF(FALSE(), "yes")']])

    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0', '=IF(A1:A3,"yes","no")'],
      ['1', '=IF(A1:A3,"yes","no")'],
      ['3'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
