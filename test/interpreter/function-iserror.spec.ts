import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function ISERROR', () => {
  it('should return true for common errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISERROR(1/0)', '=ISERROR(FOO())', '=ISERROR(TRUE(1))'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
    expect(engine.getCellValue(adr('C1'))).toEqual(true)
  })

  it('should return false for valid formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISERROR(1)', '=ISERROR(TRUE())',  '=ISERROR("foo")', '=ISERROR(ISERROR(1/0))', '=ISERROR(A1)'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(false)
    expect(engine.getCellValue(adr('E1'))).toEqual(false)
  })

  it('takes exactly one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISERROR(1, 2)', '=ISERROR()'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/1'],
      ['=4/0', '=ISERROR(A1:A3)'],
      ['=4/2'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
