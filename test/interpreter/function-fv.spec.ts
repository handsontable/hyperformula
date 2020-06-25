import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function FV', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FV(1,1)', '=FV(1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=FV(2%, 12, 100)', '=FV(2%, 12, 100, 400)', '=FV(2%, 12, 100, 400, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(-1341.20897281273)
    expect(engine.getCellValue(adr('B1'))).toBe(-1848.50569063775)
    expect(engine.getCellValue(adr('C1'))).toBe(-1875.329870094)
  })
})
