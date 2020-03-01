import {HyperFormula, ExportedCellChange, ExportedNamedExpressionChange} from '../src'
import {ErrorType} from '../src/Cell'
import './testConfig'
import { adr, detailedError } from './testUtils'

describe('Events', () => {
  it('sheetAdded works', function() {
    const engine = HyperFormula.buildEmpty()
    const handler = jest.fn()
    
    engine.onSheetAdded(handler)
    engine.addSheet("FooBar")

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith("FooBar")
  })

  it('sheetRemoved works', function() {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    const handler = jest.fn()

    engine.onSheetRemoved(handler)
    engine.removeSheet("Sheet2")

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), detailedError(ErrorType.REF))])
  })

  it('sheetRenamed works', () => {
    const engine = HyperFormula.buildFromArray([[]])
    const handler = jest.fn()

    engine.onSheetRenamed(handler)
    engine.renameSheet(0, 'SomeNewName')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith("Sheet1", "SomeNewName")
  })

  it('sheetRenamed is not triggered when sheet didnt change', () => {
    const engine = HyperFormula.buildFromArray([[]])
    const handler = jest.fn()

    engine.onSheetRenamed(handler)
    engine.renameSheet(0, 'Sheet1')

    expect(handler).not.toHaveBeenCalled()
  })

  it('namedExpressionAdded works', () => {
    const engine = HyperFormula.buildEmpty()
    const handler = jest.fn()

    engine.onNamedExpressionAdded(handler)
    engine.addNamedExpression('myName', 'foobarbaz')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith("myName", [new ExportedNamedExpressionChange('myName', 'foobarbaz')])
  })

  it('namedExpressionRemoved works', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addNamedExpression('myName', 'foobarbaz')
    const handler = jest.fn()

    engine.onNamedExpressionRemoved(handler)
    engine.removeNamedExpression('myName')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith("myName", [])
  })
})
