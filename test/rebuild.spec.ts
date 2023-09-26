import {ErrorType, HyperFormula} from '../src'
import {ErrorMessage} from '../src/error-message'
import {adr, detailedError, resetSpy} from './testUtils'
import {BuildEngineFactory} from '../src/BuildEngineFactory'

describe('Rebuilding engine', () => {
  it('should preserve absolute named expression', () => {
    const engine = HyperFormula.buildFromArray([['=FALSE']])
    engine.addNamedExpression('FALSE', '=FALSE()')
    engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('should preserve local named expression', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=FALSE']],
      'Sheet2': [['=FALSE']]
    })
    engine.addNamedExpression('FALSE', '=FALSE()', 0)
    engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('A1', 0))).toEqual(false)
    expect(engine.getCellValue(adr('A1', 1))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('FALSE')))
  })

  it('named references should work after rebuild', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['42', '=FOO']],
    })
    engine.addNamedExpression('FOO', '=Sheet1!$A$1')
    engine.rebuildAndRecalculate()

    expect(engine.getCellValue(adr('B1', 0))).toEqual(42)
  })

  it('scopes are properly handled', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['42']],
      'Sheet2': [['42', '=FALSE']],
    }, {}, [{name: 'FALSE', expression: false, scope: 1}])

    engine.removeSheet(0)
    engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('B1'))).toEqual(false)
  })

  it('rebuildAndRecalculate rebuilds the engine if the config is empty', () => {
    const engine = HyperFormula.buildFromArray([[]], {})

    const rebuildEngineSpy = spyOn(BuildEngineFactory, 'rebuildWithConfig')
    resetSpy(rebuildEngineSpy)

    engine.rebuildAndRecalculate()

    expect(rebuildEngineSpy).toHaveBeenCalled()
  })
})
