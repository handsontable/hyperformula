import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('Column ranges', () => {
  it('should work', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A:B)']
    ])

    expect(engine.getCellValue(adr('C1'))).toEqual(3)
  })
})
