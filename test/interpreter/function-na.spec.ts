import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function NA', () => {
  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=NA()', '=NA(1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.NA))
  })
})
