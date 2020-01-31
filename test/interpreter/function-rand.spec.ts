import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr, detailedError} from '../testUtils'

describe('Interpreter - function RAND', () => {
  it('works',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=RAND()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBeGreaterThanOrEqual(0.0)
    expect(engine.getCellValue(adr('A1'))).toBeLessThan(1.0)
  })

  it('validates number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=RAND(42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })
})
