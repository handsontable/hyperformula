import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Cyclical dependencies and error literals', () => {
  it('Cyclical errors might not propagate', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=A2', '=A1'],
      ['=ISERROR(A1)', '=ISERROR(B1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B2'))).toEqual(true)
  })
  it('Errors should be parsed and propagated', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=B1', '=A1', '=ISERROR(B1)', '=C1+D1', '=ISERROR(D1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('C1'))).toEqual(true)
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('E1'))).toEqual(true)
  })
})
