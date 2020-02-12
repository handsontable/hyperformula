import {HyperFormula} from '../src'
import {simpleCellAddress} from '../src/Cell'
import './testConfig'
import {adr} from './testUtils'

describe("Named expressions", () => {
  it('basic usage', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    const [namedExpressionAddress, _changes] = engine.addNamedExpression('=Sheet1!A1+10')

    expect(engine.getCellValue(namedExpressionAddress)).toEqual(52)
  })

  it('is recomputed', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    const [namedExpressionAddress, _changes] = engine.addNamedExpression('=Sheet1!A1+10')

    engine.setCellContent(adr('A1'), '20')

    expect(engine.getCellValue(namedExpressionAddress)).toEqual(30)
  })

  it('works for more formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])

    const [namedExpressionAddress1, _changes1] = engine.addNamedExpression('=Sheet1!A1+10')
    const [namedExpressionAddress2, _changes2] = engine.addNamedExpression('=Sheet1!A1+11')

    expect(engine.getCellValue(namedExpressionAddress1)).toEqual(52)
    expect(engine.getCellValue(namedExpressionAddress2)).toEqual(53)
  })

  it('is possible to change named expression formula to other', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
    ])
    const [namedExpressionAddress, _changes] = engine.addNamedExpression('=Sheet1!A1+10')

    engine.setCellContent(namedExpressionAddress, '=Sheet1!A1+11')

    expect(engine.getCellValue(namedExpressionAddress)).toEqual(53)
  })
})
