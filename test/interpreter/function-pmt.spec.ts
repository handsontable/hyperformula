import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function PMT', () => {
  it('number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PMT(1,1)', '=PMT(1, 1, 1, 1, 1, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.NA))
  })

  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PMT(1%, 360, 10000)', '=PMT(1%, 360, 10000, 1000)', '=PMT(1%, 360, 10000, 1000, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-102.86125969255)
    expect(engine.getCellValue(adr('B1'))).toBeCloseTo(-103.147385661805)
    expect(engine.getCellValue(adr('C1'))).toBeCloseTo(-102.126124417629)
  })
})
