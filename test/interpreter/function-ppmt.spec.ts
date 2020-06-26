import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function PPMT', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PPMT(1,1)', '=PPMT(1, 1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PPMT(1%, 1, 360, 10000)', '=PPMT(1%, 1, 360, 10000, 3000)', '=PPMT(1%, 1, 360, 10000, 3000, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-2.86125969255043)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-3.71963760031556)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(-102.692710495362)
  })
})
