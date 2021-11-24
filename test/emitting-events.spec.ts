import {ExportedCellChange, ExportedNamedExpressionChange, HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
import {Events} from '../src/Emitter'
import {NamedExpressionDoesNotExistError} from '../src/errors'

import {adr, detailedErrorWithOrigin} from './testUtils'

describe('Events', () => {
  it('sheetAdded works', async() => {
    const engine = await HyperFormula.buildEmpty()
    const handler = jasmine.createSpy()
    
    engine.on(Events.SheetAdded, handler)
    engine.addSheet('FooBar')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('FooBar')
  })

  it('sheetRemoved works', async() => {
    const engine = await HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    const handler = jasmine.createSpy()

    engine.on(Events.SheetRemoved, handler)
    await engine.removeSheet(1)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('Sheet2', [new ExportedCellChange(adr('A1'), detailedErrorWithOrigin(ErrorType.REF, 'Sheet1!A1'))])
  })

  it('sheetRemoved name contains actual display name', async() => {
    const engine = await HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    const handler = jasmine.createSpy()

    engine.on(Events.SheetRemoved, handler)
    await engine.removeSheet(1)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('Sheet2', [new ExportedCellChange(adr('A1'), detailedErrorWithOrigin(ErrorType.REF, 'Sheet1!A1'))])
  })

  it('sheetRenamed works', async() => {
const engine = await HyperFormula.buildFromArray([[]])
    const handler = jasmine.createSpy()

    engine.on(Events.SheetRenamed, handler)
    engine.renameSheet(0, 'SomeNewName')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('Sheet1', 'SomeNewName')
  })

  it('sheetRenamed is not triggered when sheet didnt change', async() => {
const engine = await HyperFormula.buildFromArray([[]])
    const handler = jasmine.createSpy()

    engine.on(Events.SheetRenamed, handler)
    engine.renameSheet(0, 'Sheet1')

    expect(handler).not.toHaveBeenCalled()
  })

  it('namedExpressionAdded works', async() => {
    const engine = await HyperFormula.buildEmpty()
    const handler = jasmine.createSpy()

    engine.on(Events.NamedExpressionAdded, handler)
    await engine.addNamedExpression('myName', 'foobarbaz')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('myName', [new ExportedNamedExpressionChange('myName', 'foobarbaz')])
  })

  it('namedExpressionRemoved works', async() => {
    const engine = await HyperFormula.buildEmpty()
    await engine.addNamedExpression('myName', 'foobarbaz')
    const handler = jasmine.createSpy()

    engine.on(Events.NamedExpressionRemoved, handler)
    await engine.removeNamedExpression('myName')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('myName', [])
  })

  it('namedExpressionRemoved throws error when named expression not exists', async() => {
    const engine = await HyperFormula.buildEmpty()
    const handler = jasmine.createSpy()

    engine.on(Events.NamedExpressionRemoved, handler)
    expect(async() => {
      await engine.removeNamedExpression('myName')
    }).toThrow(new NamedExpressionDoesNotExistError('myName'))
  })

  it('namedExpressionRemoved contains actual named expression name', async() => {
    const engine = await HyperFormula.buildEmpty()
    await engine.addNamedExpression('myName', 'foobarbaz')
    const handler = jasmine.createSpy()

    engine.on(Events.NamedExpressionRemoved, handler)
    await engine.removeNamedExpression('MYNAME')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('myName', [])
  })

  it('valuesUpdated works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42']
    ])
    const handler = jasmine.createSpy()

    engine.on(Events.ValuesUpdated, handler)
    await engine.setCellContents(adr('A1'), [['43']])

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 43)])
  })

  it('valuesUpdated may sometimes be triggered even if nothing changed', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42']
    ])
    const handler = jasmine.createSpy()

    engine.on(Events.ValuesUpdated, handler)
    await engine.setCellContents(adr('A1'), [['42']])

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 42)])
  })

  it('suspension and resuming of evaluation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42']
    ])
    const handlerUpdated = jasmine.createSpy()
    const handlerSuspended = jasmine.createSpy()
    const handlerResumed = jasmine.createSpy()

    engine.on(Events.ValuesUpdated, handlerUpdated)
    engine.on(Events.EvaluationSuspended, handlerSuspended)
    engine.on(Events.EvaluationResumed, handlerResumed)

    engine.suspendEvaluation()
    expect(handlerUpdated).toHaveBeenCalledTimes(0)
    expect(handlerSuspended).toHaveBeenCalledTimes(1)
    expect(handlerResumed).toHaveBeenCalledTimes(0)

    await engine.setCellContents(adr('A1'), [['13']])
    expect(handlerUpdated).toHaveBeenCalledTimes(0)
    expect(handlerSuspended).toHaveBeenCalledTimes(1)
    expect(handlerResumed).toHaveBeenCalledTimes(0)

    await engine.resumeEvaluation()

    expect(handlerUpdated).toHaveBeenCalledTimes(1)
    expect(handlerSuspended).toHaveBeenCalledTimes(1)
    expect(handlerResumed).toHaveBeenCalledTimes(1)
    expect(handlerResumed).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 13)])
  })

  it('batching', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42']
    ])
    const handlerUpdated = jasmine.createSpy()
    const handlerSuspended = jasmine.createSpy()
    const handlerResumed = jasmine.createSpy()

    engine.on(Events.ValuesUpdated, handlerUpdated)
    engine.on(Events.EvaluationSuspended, handlerSuspended)
    engine.on(Events.EvaluationResumed, handlerResumed)

    await engine.batch(async() => {
      await engine.setCellContents(adr('A1'), [['13']])
    })
    expect(handlerUpdated).toHaveBeenCalledTimes(1)
    expect(handlerSuspended).toHaveBeenCalledTimes(1)
    expect(handlerResumed).toHaveBeenCalledTimes(1)
    expect(handlerResumed).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 13)])
  })
})

describe('Subscribing only once', () => {
  it('works', async() => {
    const engine = await HyperFormula.buildEmpty()
    const handler = jasmine.createSpy()

    engine.once(Events.SheetAdded, handler)
    engine.addSheet('FooBar1')
    engine.addSheet('FooBar2')

    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('Unsubscribing', () => {
  it('works', async() => {
    const engine = await HyperFormula.buildEmpty()
    const handler = jasmine.createSpy()
    engine.on(Events.SheetAdded, handler)
    engine.addSheet('FooBar1')

    engine.off(Events.SheetAdded, handler)
    engine.addSheet('FooBar2')

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
