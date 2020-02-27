import {Config, HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {adr, detailedError} from '../testUtils'

describe('Function PI', () => {
  it('wrong number of arguments', () => {
    const engine = HyperFormula.buildFromArray([['=PI(1)']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
  })
  it('should return PI with proper precision', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PI()'],
    ], new Config({ smartRounding : false}))

    expect(engine.getCellValue(adr('A1'))).toEqual(3.14159265358979)
  })
})
