import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Error literals', () => {
  it('Errors should be parsed and propagated', () => {
    const engine = HyperFormula.buildFromArray([
      ['=A2', '=A1'],
      ['=ISERROR(A1)', '=ISERROR(B1)']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B2'))).toEqual(true)
  })
})
