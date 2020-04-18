import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function ISLOGICAL', () => {
  it('should return true for boolean', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISLOGICAL(1<1)', '=ISLOGICAL(ISLOGICAL(A1))', '=ISLOGICAL(A2)'],
      [false],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
    expect(engine.getCellValue(adr('C1'))).toEqual(true)
  })

  it('should return false for non-boolean', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISLOGICAL(-0)', '=ISLOGICAL(A2)',  '=ISLOGICAL("foo")'],
      [null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
  })

  it('takes exactly one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISLOGICAL(1, 2)', '=ISLOGICAL()'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/1'],
      ['=4/0', '=ISLOGICAL(A1:A3)'],
      ['=4/2'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
