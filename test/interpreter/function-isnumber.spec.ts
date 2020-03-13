import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function ISNUMBER', () => {
  it('should return true for numbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISNUMBER(1)', '=ISNUMBER(-0)', '=ISNUMBER(1+1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
    expect(engine.getCellValue(adr('C1'))).toEqual(true)
  })

  it('should return false for nonnumbers', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISNUMBER(1<1)', '=ISNUMBER(A2)',  '=ISNUMBER("foo")'],
      [null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
  })

  it('takes exactly one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISNUMBER(1, 2)', '=ISNUMBER()'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/1'],
      ['=4/0', '=ISNUMBER(A1:A3)'],
      ['=4/2'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
