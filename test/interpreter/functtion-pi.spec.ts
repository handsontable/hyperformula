import { HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('Function PI', () => {
  it('should return PI with proper precision', () => {
    const engine = HyperFormula.buildFromArray([
      ['=PI()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(3.14159265358979)
  })
})
