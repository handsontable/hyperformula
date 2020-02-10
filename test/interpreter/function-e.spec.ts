import {Config, HyperFormula} from '../../src'
import {adr, detailedError} from '../testUtils'

describe('Function E', () => {
  it('should return E with proper precision', () => {
    const engine = HyperFormula.buildFromArray([
      ['=E()'],
    ], new Config({ smartRounding : false}))

    expect(engine.getCellValue(adr('A1'))).toEqual(2.71828182845905)
  })
})

