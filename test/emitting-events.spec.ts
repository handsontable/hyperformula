import {
  ExportedCellChange,
  ExportedNamedExpressionChange,
  HyperFormula,
  ErrorType,
  NamedExpressionDoesNotExistError,
} from '../src'
import {Events} from '../src/Emitter'
import {adr, detailedErrorWithOrigin} from './testUtils'
import {simpleCellRange} from '../src/AbsoluteCellRange'

describe('Events', () => {
  it('sheetAdded works', function() {
    const engine = HyperFormula.buildEmpty()
    const handler = jasmine.createSpy()

    engine.on(Events.SheetAdded, handler)
    engine.addSheet('FooBar')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('FooBar')
  })

  it('sheetRemoved works', function() {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    const handler = jasmine.createSpy()

    engine.on(Events.SheetRemoved, handler)
    engine.removeSheet(1)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('Sheet2', [new ExportedCellChange(adr('A1'), detailedErrorWithOrigin(ErrorType.REF, 'Sheet1!A1'))])
  })

  it('sheetRemoved name contains actual display name', function() {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    const handler = jasmine.createSpy()

    engine.on(Events.SheetRemoved, handler)
    engine.removeSheet(1)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('Sheet2', [new ExportedCellChange(adr('A1'), detailedErrorWithOrigin(ErrorType.REF, 'Sheet1!A1'))])
  })

  it('sheetRenamed works', () => {
    const engine = HyperFormula.buildFromArray([[]])
    const handler = jasmine.createSpy()

    engine.on(Events.SheetRenamed, handler)
    engine.renameSheet(0, 'SomeNewName')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('Sheet1', 'SomeNewName')
  })

  it('sheetRenamed is not triggered when sheet didnt change', () => {
    const engine = HyperFormula.buildFromArray([[]])
    const handler = jasmine.createSpy()

    engine.on(Events.SheetRenamed, handler)
    engine.renameSheet(0, 'Sheet1')

    expect(handler).not.toHaveBeenCalled()
  })

  it('namedExpressionAdded works', () => {
    const engine = HyperFormula.buildEmpty()
    const handler = jasmine.createSpy()

    engine.on(Events.NamedExpressionAdded, handler)
    engine.addNamedExpression('myName', 'foobarbaz')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('myName', [new ExportedNamedExpressionChange('myName', 'foobarbaz')])
  })

  it('namedExpressionRemoved works', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addNamedExpression('myName', 'foobarbaz')
    const handler = jasmine.createSpy()

    engine.on(Events.NamedExpressionRemoved, handler)
    engine.removeNamedExpression('myName')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('myName', [])
  })

  it('namedExpressionRemoved throws error when named expression not exists', () => {
    const engine = HyperFormula.buildEmpty()
    const handler = jasmine.createSpy()

    engine.on(Events.NamedExpressionRemoved, handler)
    expect(() => {
      engine.removeNamedExpression('myName')
    }).toThrow(new NamedExpressionDoesNotExistError('myName'))
  })

  it('namedExpressionRemoved contains an actual named-expression name', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addNamedExpression('myName', 'foobarbaz')
    const handler = jasmine.createSpy()

    engine.on(Events.NamedExpressionRemoved, handler)
    engine.removeNamedExpression('MYNAME')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('myName', [])
  })

  it('valuesUpdated works', () => {
    const engine = HyperFormula.buildFromArray([
      ['42']
    ])
    const handler = jasmine.createSpy()

    engine.on(Events.ValuesUpdated, handler)
    engine.setCellContents(adr('A1'), [['43']])

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 43)])
  })

  it('valuesUpdated works with named expressions', () => {
    const engine = HyperFormula.buildFromArray(
      [['42']],
      {},
      [{ name: 'NAMED_EXPR', expression: '=Sheet1!$A$1' }]
    )
    const handler = jasmine.createSpy()

    engine.on(Events.ValuesUpdated, handler)
    engine.setCellContents(adr('A1'), [['43']])

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([
      new ExportedCellChange(adr('A1'), 43),
      new ExportedNamedExpressionChange('NAMED_EXPR', 43),
    ])
  })

  it('valuesUpdated may sometimes be triggered even if nothing changed', () => {
    const engine = HyperFormula.buildFromArray([
      ['42']
    ])
    const handler = jasmine.createSpy()

    engine.on(Events.ValuesUpdated, handler)
    engine.setCellContents(adr('A1'), [['42']])

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 42)])
  })

  it('suspension and resuming of evaluation', () => {
    const engine = HyperFormula.buildFromArray([
      ['42']
    ])
    const handlerUpdated = jasmine.createSpy()
    const handlerSuspended = jasmine.createSpy()
    const handlerResumed = jasmine.createSpy()

    engine.on(Events.ValuesUpdated, handlerUpdated)
    engine.on(Events.EvaluationSuspended, handlerSuspended)
    engine.on(Events.EvaluationResumed, handlerResumed)

    engine.suspendEvaluation()
    expect(handlerUpdated).not.toHaveBeenCalled()
    expect(handlerSuspended).toHaveBeenCalledTimes(1)
    expect(handlerResumed).not.toHaveBeenCalled()

    engine.setCellContents(adr('A1'), [['13']])
    expect(handlerUpdated).not.toHaveBeenCalled()
    expect(handlerSuspended).toHaveBeenCalledTimes(1)
    expect(handlerResumed).not.toHaveBeenCalled()

    engine.resumeEvaluation()
    expect(handlerUpdated).toHaveBeenCalledTimes(1)
    expect(handlerSuspended).toHaveBeenCalledTimes(1)
    expect(handlerResumed).toHaveBeenCalledTimes(1)
    expect(handlerResumed).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 13)])
  })

  it('batching', () => {
    const engine = HyperFormula.buildFromArray([
      ['42']
    ])
    const handlerUpdated = jasmine.createSpy()
    const handlerSuspended = jasmine.createSpy()
    const handlerResumed = jasmine.createSpy()

    engine.on(Events.ValuesUpdated, handlerUpdated)
    engine.on(Events.EvaluationSuspended, handlerSuspended)
    engine.on(Events.EvaluationResumed, handlerResumed)

    engine.batch(() => engine.setCellContents(adr('A1'), [['13']]))
    expect(handlerUpdated).toHaveBeenCalledTimes(1)
    expect(handlerSuspended).toHaveBeenCalledTimes(1)
    expect(handlerResumed).toHaveBeenCalledTimes(1)
    expect(handlerResumed).toHaveBeenCalledWith([new ExportedCellChange(adr('A1'), 13)])
  })

  describe('_CellValueRead', () => {
    it('fires when user calls getCellValue', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.getCellValue(adr('A1'))
      expect(onCellValueRead).toHaveBeenCalled()
    })

    it('fires when user calls getSheetValues', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.getSheetValues(0)
      expect(onCellValueRead).toHaveBeenCalled()
    })

    it('fires when user calls getAllSheetsValues', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.getAllSheetsValues()
      expect(onCellValueRead).toHaveBeenCalled()
    })

    it('fires when user calls copy', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.copy(simpleCellRange(adr('A1'), adr('C1')))
      expect(onCellValueRead).toHaveBeenCalled()
    })

    it('fires when user calls cut', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.cut(simpleCellRange(adr('A1'), adr('C1')))
      expect(onCellValueRead).toHaveBeenCalled()
    })

    it('fires when user calls getRangeValues', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.getRangeValues(simpleCellRange(adr('A1'), adr('C1')))
      expect(onCellValueRead).toHaveBeenCalled()
    })

    it('fires when user calls getNamedExpressionValue', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.addNamedExpression('ABC', '=Sheet1!$A$1')
      engine.getNamedExpressionValue('ABC')
      expect(onCellValueRead).toHaveBeenCalled()
    })

    it('fires when user calls calculateFormula', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.calculateFormula('=A1', 0)
      expect(onCellValueRead).toHaveBeenCalled()
    })

    it('does not fire when user calls addNamedExpression', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.addNamedExpression('ABC', '=Sheet1!$A$1')
      expect(onCellValueRead).not.toHaveBeenCalled()
    })

    it('does not fire when user calls updateConfig', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]], { maxRows: 10 })

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.updateConfig({ maxRows: 100 })
      expect(onCellValueRead).not.toHaveBeenCalled()
    })

    it('does not fire when user sets cell/sheet contents', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.setCellContents(adr('A1'), 42)
      engine.setSheetContent(0, [[42]])
      expect(onCellValueRead).not.toHaveBeenCalled()
    })

    it('does not fire when user adds sheet/row/column', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.addSheet('test')
      engine.addRows(0, [0, 1])
      engine.addColumns(0, [0, 1])
      expect(onCellValueRead).not.toHaveBeenCalled()
    })

    it('does not fire when user calls helper methods', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]])

      const onCellValueRead = jasmine.createSpy()
      engine.on(Events._CellValueRead, onCellValueRead)

      engine.getSheetId('Sheet1')
      const adr = engine.simpleCellAddressFromString('A1', 0)
      engine.simpleCellAddressToString(adr!, 0)
      const range = engine.simpleCellRangeFromString('A1:B2', 0)
      engine.simpleCellRangeToString(range!, 0)
      expect(onCellValueRead).not.toHaveBeenCalled()
    })
  })
})

describe('Subscribing only once', () => {
  it('works', function() {
    const engine = HyperFormula.buildEmpty()
    const handler = jasmine.createSpy()

    engine.once(Events.SheetAdded, handler)
    engine.addSheet('FooBar1')
    engine.addSheet('FooBar2')

    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('Unsubscribing', () => {
  it('works', function() {
    const engine = HyperFormula.buildEmpty()
    const handler = jasmine.createSpy()
    engine.on(Events.SheetAdded, handler)
    engine.addSheet('FooBar1')

    engine.off(Events.SheetAdded, handler)
    engine.addSheet('FooBar2')

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
