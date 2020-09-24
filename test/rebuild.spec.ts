import {ErrorType, HyperFormula} from '../src'
import {ErrorMessage} from '../src/error-message'
import {adr, detailedError} from './testUtils'

describe('Rebuilding engine', () => {
  it('should preserve absolute named expression', () => {
    const engine = HyperFormula.buildFromArray([['=FALSE']])
    engine.addNamedExpression('FALSE', '=FALSE()')
    engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('A1'))).toEqual(false)
  })

  it('should preserve local named expression', () => {
    const engine = HyperFormula.buildFromSheets(
      {'Sheet1': [['=FALSE']],
        'Sheet2': [['=FALSE']]})
    engine.addNamedExpression('FALSE', '=FALSE()', 'Sheet1')
    engine.rebuildAndRecalculate()
    expect(engine.getCellValue(adr('A1', 0))).toEqual(false)
    expect(engine.getCellValue(adr('A1', 1))).toEqual(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('FALSE')))
  })
})
