import { HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('Function E', () => {
  it('should return E with proper precision', () => {
    const engine = HyperFormula.buildFromArray([
      ['=E()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2.71828182845905)
  })
})

