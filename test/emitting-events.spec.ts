import {
  ExportedCellChange,
  ExportedNamedExpressionChange,
  HyperFormula,
  ErrorType,
  NamedExpressionDoesNotExistError,
} from '../src'
import {Events} from '../src/Emitter'
import {adr, detailedErrorWithOrigin, resetSpy} from './testUtils'
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
    it('fires on read operations', () => {
      const readOperations = [
        (engine: HyperFormula) => engine.getCellValue(adr('A1')),
        (engine: HyperFormula) => engine.getSheetValues(0),
        (engine: HyperFormula) => engine.getAllSheetsValues(),
        (engine: HyperFormula) => engine.copy(simpleCellRange(adr('A1'), adr('C1'))),
        (engine: HyperFormula) => engine.cut(simpleCellRange(adr('A1'), adr('C1'))),
        (engine: HyperFormula) => engine.getRangeValues(simpleCellRange(adr('A1'), adr('C1'))),
        (engine: HyperFormula) => engine.calculateFormula('=A1', 0),
        (engine: HyperFormula) => {
          engine.addNamedExpression('ABC', '=Sheet1!$A$1')
          engine.getNamedExpressionValue('ABC')
        },
      ]

      readOperations.forEach(operation => {
        const engine = HyperFormula.buildFromArray([[1, 2, '=SUM(A1:B1)']])
        const onCellValueRead = jasmine.createSpy()
        engine.on(Events._CellValueRead, onCellValueRead)

        operation(engine)

        expect(onCellValueRead).toHaveBeenCalled()
        resetSpy(onCellValueRead)
      })
    })

    it('does not fire on other operations', () => {
      const otherOperations = [
        (engine: HyperFormula) => engine.addNamedExpression('ABC', '=Sheet1!$A$1'),
        (engine: HyperFormula) => engine.isItPossibleToAddNamedExpression('ABC', '=Sheet1!$A$1'),
        (engine: HyperFormula) => engine.updateConfig({ maxRows: 100 }),
        (engine: HyperFormula) => engine.setCellContents(adr('A1'), 42),
        (engine: HyperFormula) => engine.setSheetContent(0, [[42]]),
        (engine: HyperFormula) => engine.addSheet('test'),
        (engine: HyperFormula) => engine.isItPossibleToAddSheet('test'),
        (engine: HyperFormula) => engine.addRows(0, [0, 1]),
        (engine: HyperFormula) => engine.addColumns(0, [0, 1]),
        (engine: HyperFormula) => engine.getSheetId('Sheet1'),
        (engine: HyperFormula) => engine.doesSheetExist('Sheet1'),
        (engine: HyperFormula) => engine.getSheetName(0),
        () => HyperFormula.defaultConfig,
        () => HyperFormula.getRegisteredLanguagesCodes(),
        () => HyperFormula.getLanguage('enGB'),
        () => HyperFormula.unregisterFunction('SUM'),
        () => HyperFormula.getFunctionPlugin('SUM'),
        (engine: HyperFormula) => engine.getFunctionPlugin('SUM'),
        () => HyperFormula.unregisterAllFunctions(),
        () => HyperFormula.getAllFunctionPlugins(),
        (engine: HyperFormula) => engine.getAllFunctionPlugins(),
        (engine: HyperFormula) => engine.getCellFormula(adr('A1')),
        (engine: HyperFormula) => engine.getCellSerialized(adr('C1')),
        (engine: HyperFormula) => engine.getSheetFormulas(0),
        (engine: HyperFormula) => engine.getSheetSerialized(0),
        (engine: HyperFormula) => engine.getAllSheetsDimensions(),
        (engine: HyperFormula) => engine.getSheetDimensions(0),
        (engine: HyperFormula) => engine.getAllSheetsFormulas(),
        (engine: HyperFormula) => engine.getAllSheetsSerialized(),
        (engine: HyperFormula) => engine.getConfig(),
        (engine: HyperFormula) => engine.getStats(),
        (engine: HyperFormula) => engine.isThereSomethingToUndo(),
        (engine: HyperFormula) => engine.isThereSomethingToRedo(),
        (engine: HyperFormula) => engine.isItPossibleToSetCellContents(adr('A1')),
        (engine: HyperFormula) => engine.setRowOrder(0, [0]),
        (engine: HyperFormula) => engine.isItPossibleToSetRowOrder(0, [0]),
        (engine: HyperFormula) => engine.swapRowIndexes(0, [[0, 0]]),
        (engine: HyperFormula) => engine.isItPossibleToSwapRowIndexes(0, [[0, 0]]),
        (engine: HyperFormula) => engine.swapColumnIndexes(0, [[0, 1], [1, 0]]),
        (engine: HyperFormula) => engine.isItPossibleToSwapColumnIndexes(0, [[0, 1], [1, 0]]),
        (engine: HyperFormula) => engine.setColumnOrder(0, [0, 2, 1]),
        (engine: HyperFormula) => engine.isItPossibleToSetColumnOrder(0, [0, 2, 1]),
        (engine: HyperFormula) => engine.isItPossibleToAddRows(0, [1, 1]),
        (engine: HyperFormula) => engine.addRows(0, [1, 1]),
        (engine: HyperFormula) => engine.isItPossibleToRemoveRows(0, [0, 1]),
        (engine: HyperFormula) => engine.removeRows(0, [0, 1]),
        (engine: HyperFormula) => engine.addColumns(0, [1, 1]),
        (engine: HyperFormula) => engine.isItPossibleToAddColumns(0, [1, 1]),
        (engine: HyperFormula) => engine.isItPossibleToRemoveColumns(0, [0, 1]),
        (engine: HyperFormula) => engine.removeColumns(0, [0, 1]),
        (engine: HyperFormula) => engine.moveCells({ start: adr('A1'), end: adr('A1') }, adr('C42')),
        (engine: HyperFormula) => engine.isItPossibleToMoveCells({ start: adr('A1'), end: adr('A1') }, adr('C42')),
        (engine: HyperFormula) => engine.isItPossibleToMoveRows(0, 0, 1, 2),
        (engine: HyperFormula) => engine.moveRows(0, 0, 1, 2),
        (engine: HyperFormula) => engine.isItPossibleToMoveColumns(0, 0, 1, 2),
        (engine: HyperFormula) => engine.moveColumns(0, 0, 1, 2),
        (engine: HyperFormula) => engine.isClipboardEmpty(),
        (engine: HyperFormula) => engine.clearClipboard(),
        (engine: HyperFormula) => engine.clearRedoStack(),
        (engine: HyperFormula) => engine.clearUndoStack(),
        (engine: HyperFormula) => engine.getRangeFormulas(simpleCellRange(adr('A1'), adr('C1'))),
        (engine: HyperFormula) => engine.getRangeSerialized(simpleCellRange(adr('A1'), adr('C1'))),
        (engine: HyperFormula) => engine.getFillRangeData( {start: {sheet: 0, row: 0, col: 0}, end: {sheet: 0, row: 1, col: 1}}, {start: {sheet: 0, row: 1, col: 1}, end: {sheet: 0, row: 3, col: 3}}),
        (engine: HyperFormula) => engine.isItPossibleToRemoveSheet(0),
        (engine: HyperFormula) => engine.removeSheet(0),
        (engine: HyperFormula) => engine.isItPossibleToClearSheet(0),
        (engine: HyperFormula) => engine.clearSheet(0),
        (engine: HyperFormula) => engine.isItPossibleToReplaceSheetContent(0, [['50'], ['60']]),
        (engine: HyperFormula) => engine.getCellDependents(adr('A1')),
        (engine: HyperFormula) => engine.getCellPrecedents(adr('A1')),
        (engine: HyperFormula) => engine.getSheetNames(),
        (engine: HyperFormula) => engine.getCellType({ sheet: 0, col: 1, row: 0 }),
        (engine: HyperFormula) => engine.getCellValueType({ sheet: 0, col: 1, row: 0 }),
        (engine: HyperFormula) => engine.getCellValueDetailedType({ sheet: 0, col: 1, row: 0 }),
        (engine: HyperFormula) => engine.getCellValueFormat({ sheet: 0, col: 1, row: 0 }),
        (engine: HyperFormula) => engine.doesCellHaveFormula({ sheet: 0, col: 1, row: 0 }),
        (engine: HyperFormula) => engine.doesCellHaveSimpleValue({ sheet: 0, col: 1, row: 0 }),
        (engine: HyperFormula) => engine.isCellEmpty({ sheet: 0, col: 1, row: 0 }),
        (engine: HyperFormula) => engine.isCellPartOfArray({ sheet: 0, col: 1, row: 0 }),
        (engine: HyperFormula) => engine.countSheets(),
        (engine: HyperFormula) => engine.isItPossibleToRenameSheet(0, 'MySheet0'),
        (engine: HyperFormula) => engine.renameSheet(0, 'MySheet0'),
        (engine: HyperFormula) => engine.suspendEvaluation(),
        (engine: HyperFormula) => engine.resumeEvaluation(),
        (engine: HyperFormula) => engine.isEvaluationSuspended(),
        (engine: HyperFormula) => engine.listNamedExpressions(),
        (engine: HyperFormula) => engine.normalizeFormula('=SUM(1,2,3)'),
        (engine: HyperFormula) => engine.validateFormula('=SUM(1,2,3)'),
        (engine: HyperFormula) => engine.getRegisteredFunctionNames(),
        (engine: HyperFormula) => engine.numberToDateTime(43845.1),
        (engine: HyperFormula) => engine.numberToDate(43845),
        (engine: HyperFormula) => engine.numberToTime(1.1),
        (engine: HyperFormula) => {
          const adr = engine.simpleCellAddressFromString('A1', 0)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          engine.simpleCellAddressToString(adr!, 0)
        },
        (engine: HyperFormula) => {
          const range = engine.simpleCellRangeFromString('A1:B2', 0)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          engine.simpleCellRangeToString(range!, 0)
        },
        (engine: HyperFormula) => {
          engine.addNamedExpression('ABC', '=Sheet1!$A$1')
          engine.getNamedExpression('ABC')
        },
        (engine: HyperFormula) => {
          engine.addNamedExpression('ABC', '=Sheet1!$A$1')
          engine.getNamedExpressionFormula('ABC')
        },
        (engine: HyperFormula) => {
          engine.addNamedExpression('ABC', '=Sheet1!$A$1')
          engine.getAllNamedExpressionsSerialized()
        },
        (engine: HyperFormula) => {
          engine.addNamedExpression('ABC', '=Sheet1!$A$1')
          engine.isItPossibleToChangeNamedExpression('ABC', '=Sheet1!$A$1+100')
        },
        (engine: HyperFormula) => {
          engine.addNamedExpression('ABC', '=Sheet1!$A$1')
          engine.changeNamedExpression('ABC', '=Sheet1!$A$1+100')
        },
        (engine: HyperFormula) => {
          engine.addNamedExpression('ABC', '=Sheet1!$A$1')
          engine.removeNamedExpression('ABC')
        },
        (engine: HyperFormula) => {
          engine.addNamedExpression('ABC', '=Sheet1!$A$1')
          engine.isItPossibleToRemoveNamedExpression('ABC')
        },
      ]

      otherOperations.forEach(operation => {
        const engine = HyperFormula.buildFromArray([[
          1, 2, '=A1+B1'
        ]])
        const onCellValueRead = jasmine.createSpy()
        engine.on(Events._CellValueRead, onCellValueRead)

        operation(engine)

        expect(onCellValueRead).not.toHaveBeenCalled()
      })

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
