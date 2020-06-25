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
      ['=PPMT(1%, 1, 360, 100000)', '=PPMT(1%, 1, 360, 100000, 30000)', '=PPMT(1%, 1, 360, 100000, 30000, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(-28.6125969255043)
    expect(engine.getCellValue(adr('B1'))).toBe(-37.1963760031556)
    expect(engine.getCellValue(adr('C1'))).toBe(-1026.92710495362)
  })
})
