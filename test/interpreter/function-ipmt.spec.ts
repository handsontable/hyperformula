import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function IPMT', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IPMT(1,1)', '=IPMT(1, 1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=IPMT(1%, 1, 360, 100000)', '=IPMT(1%, 1, 360, 100000, 30000)', '=IPMT(1%, 1, 360, 100000, 30000, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-1000)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-1000)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(0)
  })
})
