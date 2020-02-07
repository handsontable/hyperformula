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

  it('is recomputed', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    const [externalFormulaAddress, _changes] = engine.calculateFormula('=Sheet1!A1+10')

    engine.setCellContent(adr('A1'), '20')

    expect(engine.getCellValue(externalFormulaAddress)).toEqual(30)
  })
})
