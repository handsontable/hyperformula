import {HyperFormula, ExportedCellChange, ExportedNamedExpressionChange} from '../src'
import {ErrorType} from '../src/Cell'
import './testConfig'
import { adr, detailedError } from './testUtils'

describe('Events', () => {
  it('sheetAdded works', function() {
    const engine = HyperFormula.buildEmpty()
    const handler = jest.fn()
    
    engine.onSheetAdded(handler)
    engine.addSheet('FooBar')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('FooBar')
  })

  it('sheetRemoved works', function() {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    const handler = jest.fn()

    engine.onSheetRemoved(handler)
    engine.removeSheet('Sheet2')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('Sheet2', [new ExportedCellChange(adr('A1'), detailedError(ErrorType.REF))])
  })

  it('sheetRemoved name contains actual display name', function() {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    const handler = jest.fn()

    engine.onSheetRemoved(handler)
    engine.removeSheet('sheet2')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('Sheet2', [new ExportedCellChange(adr('A1'), detailedError(ErrorType.REF))])
  })

  it('sheetRenamed works', () => {
    const engine = HyperFormula.buildFromArray([[]])
    const handler = jest.fn()

    engine.onSheetRenamed(handler)
    engine.renameSheet(0, 'SomeNewName')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('Sheet1', 'SomeNewName')
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
    expect(handler).toHaveBeenCalledWith('myName', [new ExportedNamedExpressionChange('myName', 'foobarbaz')])
  })

  it('namedExpressionRemoved works', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addNamedExpression('myName', 'foobarbaz')
    const handler = jest.fn()

    engine.onNamedExpressionRemoved(handler)
    engine.removeNamedExpression('myName')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('myName', [])
  })

  it('namedExpressionRemoved is not triggered if there was nothing to remove', () => {
    const engine = HyperFormula.buildEmpty()
    const handler = jest.fn()

    engine.onNamedExpressionRemoved(handler)
    engine.removeNamedExpression('myName')

    expect(handler).toHaveBeenCalledTimes(0)
  })

  it('namedExpressionRemoved contains actual named expression name', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addNamedExpression('myName', 'foobarbaz')
    const handler = jest.fn()

    engine.onNamedExpressionRemoved(handler)
    engine.removeNamedExpression('MYNAME')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('myName', [])
  })

  it('valuesUpdated works', () => {
    const engine = HyperFormula.buildFromArray([
      ['42']
    ])
    const handler = jest.fn()

    engine.onValuesUpdated(handler)
    engine.setCellContents(adr('A1'), [['43']])

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 43)])
  })

  it('valuesUpdated may sometimes be triggered even if nothing changed', () => {
    const engine = HyperFormula.buildFromArray([
      ['42']
    ])
    const handler = jest.fn()

    engine.onValuesUpdated(handler)
    engine.setCellContents(adr('A1'), [['42']])

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 42)])
  })
})
