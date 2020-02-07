import {HyperFormula} from '../src'
import {simpleCellAddress} from '../src/Cell'
import './testConfig'
import {adr} from './testUtils'

describe("External formulas", () => {
  it('basic usage', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    const [externalFormulaAddress, _changes] = engine.calculateFormula('=Sheet1!A1+10')

    expect(engine.getCellValue(externalFormulaAddress)).toEqual(52)
  })
})
