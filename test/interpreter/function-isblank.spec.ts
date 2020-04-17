import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function ISBLANK', () => {
  it('should return true for references to empty cells', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=ISBLANK(A1)', '=ISBLANK(A2)'],
      ['=A1'],
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
    expect(engine.getCellValue(adr('C1'))).toEqual(true)
  })

  it('should return false for empty string', () => {
    const engine = HyperFormula.buildFromArray([['', '=ISBLANK(A1)']])
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
  })

  it('should return false if it is not reference to empty cell', () => {
    const engine = HyperFormula.buildFromArray([
      [null, '=ISBLANK("")', '=ISBLANK(4)', '=ISBLANK(CONCATENATE(A1,A1))'],
    ])
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
    expect(engine.getCellValue(adr('D1'))).toEqual(false)
  })

  it('takes exactly one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISBLANK(A3, A2)', '=ISBLANK()'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('no error propagation', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISBLANK(4/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['0', '=ISBLANK(A1:A3)'],
      [null, '=ISBLANK(A1:A3)'],
      [null],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
