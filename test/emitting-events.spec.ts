import sinon from 'sinon'
import {HyperFormula, ExportedCellChange, ExportedNamedExpressionChange} from '../src'
import {Events} from '../src/Emitter'
import {ErrorType} from '../src/Cell'
import './testConfig'
import { adr, detailedError } from './testUtils'

describe('Events', () => {
  it('sheetAdded works', function() {
    const engine = HyperFormula.buildEmpty()
    const handler = sinon.fake()
    
    engine.on(Events.SheetAdded, handler)
    engine.addSheet('FooBar')

    expect(handler.calledOnce).toBe(true)
    expect(handler.calledWithExactly('FooBar')).toBe(true)
  })

  it('sheetRemoved works', function() {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    const handler = sinon.fake()

    engine.on(Events.SheetRemoved, handler)
    engine.removeSheet('Sheet2')

    expect(handler.calledOnce).toBe(true)
    expect(handler.calledWithExactly('Sheet2', [new ExportedCellChange(adr('A1'), detailedError(ErrorType.REF))])).toBe(true)
  })

  it('sheetRemoved name contains actual display name', function() {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    const handler = sinon.fake()

    engine.on(Events.SheetRemoved, handler)
    engine.removeSheet('sheet2')

    expect(handler.calledOnce).toBe(true)
    expect(handler.calledWithExactly('Sheet2', [new ExportedCellChange(adr('A1'), detailedError(ErrorType.REF))])).toBe(true)
  })

  it('sheetRenamed works', () => {
    const engine = HyperFormula.buildFromArray([[]])
    const handler = sinon.fake()

    engine.on(Events.SheetRenamed, handler)
    engine.renameSheet(0, 'SomeNewName')

    expect(handler.calledOnce).toBe(true)
    expect(handler.calledWithExactly('Sheet1', 'SomeNewName')).toBe(true)
  })

  it('sheetRenamed is not triggered when sheet didnt change', () => {
    const engine = HyperFormula.buildFromArray([[]])
    const handler = sinon.fake()

    engine.on(Events.SheetRenamed, handler)
    engine.renameSheet(0, 'Sheet1')

    expect(handler.notCalled).toBe(true)
  })

  it('namedExpressionAdded works', () => {
    const engine = HyperFormula.buildEmpty()
    const handler = sinon.fake()

    engine.on(Events.NamedExpressionAdded, handler)
    engine.addNamedExpression('myName', 'foobarbaz')

    expect(handler.calledOnce).toBe(true)
    expect(handler.calledWithExactly('myName', [new ExportedNamedExpressionChange('myName', 'foobarbaz')])).toBe(true)
  })

  it('namedExpressionRemoved works', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addNamedExpression('myName', 'foobarbaz')
    const handler = sinon.fake()

    engine.on(Events.NamedExpressionRemoved, handler)
    engine.removeNamedExpression('myName')

    expect(handler.calledOnce).toBe(true)
    expect(handler.calledWithExactly('myName', [])).toBe(true)
  })

  it('namedExpressionRemoved is not triggered if there was nothing to remove', () => {
    const engine = HyperFormula.buildEmpty()
    const handler = sinon.fake()

    engine.on(Events.NamedExpressionRemoved, handler)
    engine.removeNamedExpression('myName')

    expect(handler.notCalled).toBe(true)
  })

  it('namedExpressionRemoved contains actual named expression name', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addNamedExpression('myName', 'foobarbaz')
    const handler = sinon.fake()

    engine.on(Events.NamedExpressionRemoved, handler)
    engine.removeNamedExpression('MYNAME')

    expect(handler.calledOnce).toBe(true)
    expect(handler.calledWithExactly('myName', [])).toBe(true)
  })

  it('valuesUpdated works', () => {
    const engine = HyperFormula.buildFromArray([
      ['42']
    ])
    const handler = sinon.fake()

    engine.on(Events.ValuesUpdated, handler)
    engine.setCellContents(adr('A1'), [['43']])

    expect(handler.calledOnce).toBe(true)
    expect(handler.calledWithExactly([new ExportedCellChange(adr('A1'), 43)])).toBe(true)
  })

  it('valuesUpdated may sometimes be triggered even if nothing changed', () => {
    const engine = HyperFormula.buildFromArray([
      ['42']
    ])
    const handler = sinon.fake()

    engine.on(Events.ValuesUpdated, handler)
    engine.setCellContents(adr('A1'), [['42']])

    expect(handler.calledOnce).toBe(true)
    expect(handler.calledWithExactly([new ExportedCellChange(adr('A1'), 42)])).toBe(true)
  })
})

describe('Subscribing only once', () => {
  it('works', function() {
    const engine = HyperFormula.buildEmpty()
    const handler = sinon.fake()

    engine.once(Events.SheetAdded, handler)
    engine.addSheet('FooBar1')
    engine.addSheet('FooBar2')

    expect(handler.calledOnce).toBe(true)
  })
})

describe('Unsubsribing', () => {
  it('works', function() {
    const engine = HyperFormula.buildEmpty()
    const handler = sinon.fake()
    engine.on(Events.SheetAdded, handler)
    engine.addSheet('FooBar1')

    engine.off(Events.SheetAdded, handler)
    engine.addSheet('FooBar2')

    expect(handler.calledOnce).toBe(true)
  })
})
