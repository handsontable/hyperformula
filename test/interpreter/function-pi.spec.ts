import {Config, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function PI', () => {
  it('should return PI with proper precision', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PI()'],
    ], new Config({ smartRounding : false}))

    expect(engine.getCellValue(adr('A1'))).toEqual(3.14159265358979)
  })
})
