import {ErrorType, HyperFormula} from '../src'
import {ErrorMessage} from '../src/error-message'
import {adr, detailedError} from './testUtils'

describe('Rebuilding engine', () => {
  it('should preserve absolute named expression', async() => {
const engine = await HyperFormula.buildFromArray([['=FALSE']])
    await engine.addNamedExpression('FALSE', '=FALSE()')
    await engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('should preserve local named expression', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['=FALSE']],
      'Sheet2': [['=FALSE']]
    })
    await engine.addNamedExpression('FALSE', '=FALSE()', 0)
    await engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('A1', 0))).toEqual(false)
    expect(engine.getCellValue(adr('A1', 1))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('FALSE')))
  })

  it('named references should work after rebuild', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['42', '=FOO']],
    })
    await engine.addNamedExpression('FOO', '=Sheet1!$A$1')
    await engine.rebuildAndRecalculate()

    expect(engine.getCellValue(adr('B1', 0))).toEqual(42)
  })

  it('scopes are properly handled', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['42']],
      'Sheet2': [['42', '=FALSE']],
    }, {}, [{name: 'FALSE', expression: false, scope: 1}])

    await engine.removeSheet(0)
    await engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
  })
})
