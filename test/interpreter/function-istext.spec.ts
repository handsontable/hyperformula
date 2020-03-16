import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Function ISTEXT', () => {
  it('should return true for text', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISTEXT("abcd")', '=ISTEXT(A2)'],
      ['abcd'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(true)
    expect(engine.getCellValue(adr('B1'))).toEqual(true)
  })

  it('should return false for nontext', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISTEXT(-0)', '=ISTEXT(A2)',  '=ISTEXT(1<1)'],
      [null],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
    expect(engine.getCellValue(adr('C1'))).toEqual(false)
  })

  it('takes exactly one argument', () => {
    const engine = HyperFormula.buildFromArray([
      ['=ISTEXT(1, 2)', '=ISTEXT()'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  // Inconsistency with Product 1
  it('range value results in VALUE error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=4/1'],
      ['=4/0', '=ISTEXT(A1:A3)'],
      ['=4/2'],
    ])

    expect(engine.getCellValue(adr('B2'))).toEqual(detailedError(ErrorType.VALUE))
  })
})
