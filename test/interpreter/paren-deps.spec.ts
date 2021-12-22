import {HyperFormula} from '../../src'
import {adr} from '../testUtils'

describe('dependencies with parenthesis', () => {
  it('should be collected when required', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(1)'],
      ['=(A1)+((A3))'],
      ['=SUM(1)'],
    ])
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
  })

  it('should not build ref for special function', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=COLUMN((((A1))))']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })
})
