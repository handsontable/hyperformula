import {ErrorType, HyperFormula, NoOperationToRedoError, NoOperationToUndoError} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {ErrorMessage} from '../src/error-message'
import {adr, detailedError, expectEngineToBeTheSameAs} from './testUtils'

describe('Undo - removing rows', () => {
  it('works for empty row', async() => {
    const sheet = [
      ['1'],
      [null], // remove
      ['3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeRows(0, [1, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works for simple values', async() => {
    const sheet = [
      ['1'],
      ['2'], // remove
      ['3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeRows(0, [1, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works with formula in removed row', async() => {
    const sheet = [
      ['1'],
      ['=SUM(A1)'], // remove
      ['3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeRows(0, [1, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('restores dependent cell formulas', async() => {
    const sheet = [
      ['=A2'],
      ['42'], // remove
      ['3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeRows(0, [1, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('formulas are built correctly when there was a pause in computation', async() => {
    const sheet = [
      ['=A2'],
      ['42'], // remove
      ['3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    engine.suspendEvaluation()
    await engine.removeRows(0, [1, 1])

    await engine.undo()
    await engine.resumeEvaluation()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('restores ranges when removing rows', async() => {
    const sheet = [
      ['=SUM(A2:A3)'],
      ['2'], // remove
      ['3'], // remove
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeRows(0, [1, 2])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('dummy operation should also be undoable', async() => {
    const sheet = [
      ['1']
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeRows(0, [1000, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works for more removal segments', async() => {
    const sheet = [
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeRows(0, [1, 1], [3, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - adding rows', () => {
  it('works', async() => {
    const sheet = [
      ['1'], // add after that
      ['3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.addRows(0, [1, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('dummy operation should also be undoable', async() => {
    const sheet = [
      ['1']
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.addRows(0, [1000, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works for more addition segments', async() => {
    const sheet = [
      ['1'],
      ['2'],
      ['3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.addRows(0, [1, 1], [2, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - moving rows', () => {
  it('works', async() => {
    const sheet = [
      [0], [1], [2], [3], [4], [5], [6], [7],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.moveRows(0, 1, 3, 7)
    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works in both directions', async() => {
    const sheet = [
      [0], [1], [2], [3], [4], [5], [6], [7],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.moveRows(0, 4, 3, 2)
    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('should restore range', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, null],
      [2, '=SUM(A1:A2)'],
    ])
    await engine.moveRows(0, 1, 1, 3)
    await engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toEqual('=SUM(A1:A2)')
  })

  it('should restore range when moving other way', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, null],
      [2, '=SUM(A1:A2)'],
    ])

    await engine.moveRows(0, 2, 1, 1)
    await engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toEqual('=SUM(A1:A2)')
  })
})

describe('Undo - moving columns', () => {
  it('works', async() => {
    const sheet = [
      [0, 1, 2, 3, 4, 5, 6, 7],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.moveColumns(0, 1, 3, 7)
    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works in both directions', async() => {
    const sheet = [
      [0, 1, 2, 3, 4, 5, 6, 7],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.moveColumns(0, 4, 3, 2)
    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('should restore range', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, 2],
      [null, '=SUM(A1:B1)'],
    ])
    await engine.moveColumns(0, 1, 1, 3)
    await engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toEqual('=SUM(A1:B1)')
  })

  it('should restore range when moving to left', async() => {
const engine = await HyperFormula.buildFromArray([
      [1, 2],
      [null, '=SUM(A1:B1)'],
    ])

    await engine.moveColumns(0, 2, 1, 1)
    await engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toEqual('=SUM(A1:B1)')
  })
})

describe('Undo - adding columns', () => {
  it('works', async() => {
    const sheet = [
      ['1', /* */ '3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.addColumns(0, [1, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('dummy operation should also be undoable', async() => {
    const sheet = [
      ['1']
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.addColumns(0, [1000, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works for more addition segments', async() => {
    const sheet = [
      ['1', '2', '3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.addColumns(0, [1, 1], [2, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - removing columns', () => {
  it('works for empty column', async() => {
    const sheet = [
      ['1', null, '3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeColumns(0, [1, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works for simple values', async() => {
    const sheet = [
      ['1', '2', '3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeColumns(0, [1, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works with formula in removed columns', async() => {
    const sheet = [
      ['1', '=SUM(A1)', '3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeColumns(0, [1, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('restores dependent cell formulas', async() => {
    const sheet = [
      ['=A2', '42', '3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeColumns(0, [1, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('formulas are built correctly when there was a pause in computation', async() => {
    const sheet = [
      ['=A2', '42', '3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    engine.suspendEvaluation()
    await engine.removeColumns(0, [1, 1])

    await engine.undo()
    await engine.resumeEvaluation()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('restores ranges when removing columns', async() => {
    const sheet = [
      ['=SUM(B1:C1)', '2', '3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeColumns(0, [1, 2])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('dummy operation should also be undoable', async() => {
    const sheet = [
      ['1']
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeColumns(0, [1000, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works for more removal segments', async() => {
    const sheet = [
      ['1', '2', '3', '4'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeColumns(0, [1, 1], [3, 1])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - removing sheet', () => {
  it('works for empty sheet', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.removeSheet(0)

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([]))
  })

  it('works with restoring simple values', async() => {
    const sheet = [
      ['1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeSheet(0)

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works with restoring formulas', async() => {
    const sheet = [
      ['=42'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeSheet(0)

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('restores dependent cell formulas', async() => {
    const sheets = {
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    }
    const engine = await HyperFormula.buildFromSheets(sheets)
    await engine.removeSheet(1)

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(sheets))
  })

  it('formulas are built correctly when there was a pause in computation', async() => {
    const sheets = {
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    }
    const engine = await HyperFormula.buildFromSheets(sheets)
    engine.suspendEvaluation()
    await engine.removeSheet(1)

    await engine.undo()
    await engine.resumeEvaluation()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(sheets))
  })
})

describe('Undo - renaming sheet', () => {
  it('undo previous operation if name not changes', async() => {
const engine = await HyperFormula.buildFromSheets({ 'Sheet1': [[1]] })
    await engine.setCellContents(adr('A1'), [[2]])
    engine.renameSheet(0, 'Sheet1')

    await engine.undo()

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getSheetName(0)).toEqual('Sheet1')
  })

  it('undo rename sheet', async() => {
const engine = await HyperFormula.buildFromSheets({ 'Sheet1': [[1]] })
    engine.renameSheet(0, 'Foo')

    await engine.undo()

    expect(engine.getSheetName(0)).toEqual('Sheet1')
  })
})

describe('Undo - setting cell content', () => {
  it('works for simple values', async() => {
    const sheet = [
      ['3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.setCellContents(adr('A1'), '100')

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works for empty values', async() => {
    const sheet = [
      [null],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.setCellContents(adr('A1'), '100')

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works for formula values', async() => {
    const sheet = [
      ['=42'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.setCellContents(adr('A1'), '100')

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('setting multiple cell contents is one operation', async() => {
    const sheet = [
      ['3', '4'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.setCellContents(adr('A1'), [['5', '6']])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - adding sheet', () => {
  it('works for basic case', async() => {
const engine = await HyperFormula.buildFromArray([])
    engine.addSheet('SomeSheet')

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([]))
  })
})

describe('Undo - clearing sheet', () => {
  it('works for empty sheet', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.clearSheet(0)

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray([]))
  })

  it('works with restoring simple values', async() => {
    const sheet = [
      ['1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.clearSheet(0)

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('works with restoring formulas', async() => {
    const sheet = [
      ['=42'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.clearSheet(0)

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - setting sheet contents', () => {
  it('works for basic case', async() => {
    const sheet = [['13']]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.setSheetContent(0, [['42']])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('also clears sheet when undoing', async() => {
    const sheet = [
      ['1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.setSheetContent(0, [['42', '43']])

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - moving cells', () => {
  it('works for simple case', async() => {
    const sheet = [
      ['foo'],
      [null],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('restores data', async() => {
    const sheet = [
      ['foo'],
      ['42'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('restores dependent cell formulas', async() => {
    const sheet = [
      ['=A2'],
      ['42'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('formulas are built correctly when there was a pause in computation', async() => {
    const sheet = [
      ['=A2'],
      ['3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    engine.suspendEvaluation()
    await engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    await engine.undo()
    await engine.resumeEvaluation()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('removed added global named expression', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [],
      'Sheet2': []
    })
    await engine.addNamedExpression('foo', 'bar', 0)
    await engine.setCellContents(adr('A1'), '=foo')
    await engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A1', 1))

    await engine.undo()

    expect(engine.getNamedExpressionValue('foo')).toEqual(undefined)
  })

  it('remove global named expression even if it was added after formula', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [['=foo']],
      'Sheet2': []
    })
    await engine.addNamedExpression('foo', 'bar', 0)
    await engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A1', 1))

    await engine.undo()

    expect(engine.getNamedExpressionValue('foo', 0)).toEqual('bar')
    expect(engine.getNamedExpressionValue('foo')).toEqual(undefined)
  })
})

describe('Undo - cut-paste', () => {
  it('works for static content', async() => {
    const sheet = [
      ['foo'],
      ['bar'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    await engine.paste(adr('A2'))

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('undoing doesnt roll back clipboard', async() => {
    const sheet = [
      ['foo'],
      ['bar'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    await engine.paste(adr('A2'))
    await engine.undo()

    expect(engine.isClipboardEmpty()).toBe(true)
  })

  it('removed added global named expression', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [],
      'Sheet2': []
    })
    await engine.addNamedExpression('foo', 'bar', 0)
    await engine.setCellContents(adr('A1'), '=foo')
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    await engine.paste(adr('A1', 1))

    await engine.undo()

    expect(engine.getNamedExpressionValue('foo', 0)).toEqual('bar')
    expect(engine.getNamedExpressionValue('foo')).toEqual(undefined)
  })
})

describe('Undo - copy-paste', () => {
  it('works', async() => {
    const sheet = [
      ['foo'],
      ['bar'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    await engine.paste(adr('A2'))

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('removed added global named expression', async() => {
const engine = await HyperFormula.buildFromSheets({
      'Sheet1': [],
      'Sheet2': []
    })
    await engine.addNamedExpression('foo', 'bar', 0)
    await engine.setCellContents(adr('A1'), '=foo')
    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    await engine.paste(adr('A1', 1))

    await engine.undo()

    expect(engine.getNamedExpressionValue('foo', 0)).toEqual('bar')
    expect(engine.getNamedExpressionValue('foo')).toEqual(undefined)
  })
})

describe('Undo - add named expression', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=foo']
    ])

    await engine.addNamedExpression('foo', 'foo')

    await engine.undo()

    expect(engine.listNamedExpressions().length).toEqual(0)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('foo')))
  })
})

describe('Undo - remove named expression', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=foo']
    ])

    await engine.addNamedExpression('foo', 'foo')
    await engine.removeNamedExpression('foo')

    await engine.undo()

    expect(engine.listNamedExpressions().length).toEqual(1)
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
  })
})

describe('Undo - change named expression', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=foo']
    ])

    await engine.addNamedExpression('foo', 'foo')
    await engine.changeNamedExpression('foo', 'bar')

    await engine.undo()

    expect(engine.listNamedExpressions().length).toEqual(1)
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
  })
})

describe('Undo', () => {
  it('when there is no operation to undo', async() => {
const engine = await HyperFormula.buildEmpty()

    await expect(async() => {
      await engine.undo()
    }).rejects.toThrow(new NoOperationToUndoError())
  })

  it('undo recomputes and return changes', async() => {
const engine = await HyperFormula.buildFromArray([
      ['3', '=A1'],
    ])
    await engine.setCellContents(adr('A1'), '100')

    const changes = await engine.undo()

    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(changes.length).toBe(2)
  })

  it('operations in batch mode are one undo', async() => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.batch(async() => {
      await engine.setCellContents(adr('A1'), '10')
      await engine.setCellContents(adr('A2'), '20')
    })

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
    expect(engine.isThereSomethingToUndo()).toBe(false)
  })

  it('operations in batch mode are undone in correct order', async() => {
    const sheet = [
      ['1'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.batch(async() => {
      await engine.setCellContents(adr('A1'), '10')
      await engine.removeRows(0, [0, 1])
    })

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })

  it('keeps elements within limit', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
    ], { undoLimit: 3 })
    await engine.setCellContents(adr('A1'), '2')
    await engine.setCellContents(adr('A1'), '3')
    await engine.setCellContents(adr('A1'), '4')
    await engine.setCellContents(adr('A1'), '5')

    await engine.undo()
    await engine.undo()
    await engine.undo()

    expect(engine.isThereSomethingToUndo()).toBe(false)
  })

  it('undo limit works with infinity', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
    ], { undoLimit: Infinity })
    await engine.setCellContents(adr('A1'), '2')
    await engine.setCellContents(adr('A1'), '3')
    await engine.setCellContents(adr('A1'), '4')

    expect(engine.isThereSomethingToUndo()).toBe(true)
  })

  it('restore AST after irreversible operation', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('E1'), '=SUM(A1:C1)')
    await engine.addColumns(0, [3, 1])
    await engine.removeColumns(0, [0, 1])

    await expect(async() => await engine.undo()).resolves.not.toThrowError()
    expect(engine.getCellFormula(adr('F1'))).toEqual('=SUM(A1:C1)')
  })
})

describe('UndoRedo', () => {
  it('redo operation is pushed back on undo stack (undo-redo-undo)', async() => {
    const sheet = [
      ['1'],
      ['2', '=A1'], // remove
      ['3'],
    ]
    const engine = await HyperFormula.buildFromArray(sheet)
    await engine.removeRows(0, [1, 1])
    await engine.undo()
    await engine.redo()

    await engine.undo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromArray(sheet))
  })
})

describe('UndoRedo - #isThereSomethingToUndo', () => {
  it('when there is no operation to undo', async() => {
const engine = await HyperFormula.buildEmpty()

    expect(engine.isThereSomethingToUndo()).toBe(false)
  })

  it('when there is some operation to undo', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.removeRows(0, [1, 1])

    expect(engine.isThereSomethingToUndo()).toBe(true)
  })
})

describe('UndoRedo - #isThereSomethingToRedo', () => {
  it('when there is no operation to redo', async() => {
const engine = await HyperFormula.buildEmpty()

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })

  it('when there is some operation to redo', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.removeRows(0, [1, 1])
    await engine.undo()

    expect(engine.isThereSomethingToRedo()).toBe(true)
  })
})

describe('Redo - removing rows', () => {
  it('works for empty row', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      [null], // remove
      ['3'],
    ])
    await engine.removeRows(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('works for other values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2', '=A1'], // remove
      ['3'],
    ])
    await engine.removeRows(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('works for more removal segments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])
    await engine.removeRows(0, [1, 1], [3, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('dummy operation should also be redoable', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1']
    ])
    await engine.removeRows(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.removeRows(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - adding rows', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'], // add after that
      ['3'],
    ])
    await engine.addRows(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('dummy operation should also be redoable', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
    ])
    await engine.addRows(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('works for more addition segments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
    ])
    await engine.addRows(0, [1, 1], [2, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.addRows(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - moving rows', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'], // move first row before this one
    ])
    await engine.moveRows(0, 0, 1, 2)
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.moveRows(0, 0, 1, 2)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - moving columns', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
    ])
    await engine.moveColumns(0, 0, 1, 2)
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.moveColumns(0, 0, 1, 2)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - moving cells', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['42'],
      ['45'],
    ])
    await engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - setting cell content', () => {
  it('works for simple values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['3'],
    ])
    await engine.setCellContents(adr('A1'), '100')
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('works for empty values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['3'],
    ])
    await engine.setCellContents(adr('A1'), null)
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('works for formula values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['3'],
    ])
    await engine.setCellContents(adr('A1'), '=42')
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('setting multiple cell contents is one operation', async() => {
const engine = await HyperFormula.buildFromArray([
      ['3', '4'],
    ])
    await engine.setCellContents(adr('A1'), [['5', '6']])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.setCellContents(adr('A1'), 78)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - removing sheet', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1']
    ])
    await engine.removeSheet(0)
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.removeSheet(0)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - adding sheet', () => {
  it('works for basic case', async() => {
const engine = await HyperFormula.buildFromArray([])
    engine.addSheet('SomeSheet')
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expect(engine.getSheetName(1)).toEqual('SomeSheet')
    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('works for automatic naming', async() => {
const engine = await HyperFormula.buildFromArray([])
    engine.addSheet()
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expect(engine.getSheetName(1)).toEqual('Sheet2')
    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    engine.addSheet()

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - renaming sheet', () => {
  it('redo rename sheet', async() => {
const engine = await HyperFormula.buildFromSheets({ 'Sheet1': [[1]] })
    engine.renameSheet(0, 'Foo')
    await engine.undo()

    await engine.redo()

    expect(engine.getSheetName(0)).toEqual('Foo')
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    engine.renameSheet(0, 'Foo')

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - clearing sheet', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1']
    ])
    await engine.clearSheet(0)
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.clearSheet(0)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - adding columns', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '3'],
    ])
    await engine.addColumns(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('dummy operation should also be redoable', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
    ])
    await engine.addColumns(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('works for more addition segments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3'],
    ])
    await engine.addColumns(0, [1, 1], [2, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.addColumns(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - removing column', () => {
  it('works for empty column', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', null, '3'],
    ])
    await engine.removeColumns(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('works for other values', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['=B1']
    ])
    await engine.removeColumns(0, [0, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('works for more removal segments', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2', '3', '4'],
    ])
    await engine.removeColumns(0, [1, 1], [3, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('dummy operation should also be redoable', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1']
    ])
    await engine.removeColumns(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.removeColumns(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - cut-paste', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['foo'],
      ['bar'],
    ])
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    await engine.paste(adr('A2'))
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('cut does not clear redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))

    expect(engine.isThereSomethingToRedo()).toBe(true)
  })

  it('cut-paste clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    await engine.paste(adr('A2'))

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - copy-paste', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['foo', 'baz'],
      ['bar', 'faz'],
    ])
    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))
    await engine.paste(adr('C3'))
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('copy does not clear redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))

    expect(engine.isThereSomethingToRedo()).toBe(true)
  })

  it('copy-paste clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    await engine.paste(adr('A2'))

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - setting sheet contents', () => {
  it('works for basic case', async() => {
const engine = await HyperFormula.buildFromArray([['13']])
    await engine.setSheetContent(0, [['42']])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('also clears sheet when redoing', async() => {
const engine = await HyperFormula.buildFromArray([['13', '14']])
    await engine.setSheetContent(0, [['42']])
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.setSheetContent(0, [['42']])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - add named expression', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=foo']
    ])

    await engine.addNamedExpression('foo', 'foo')
    await engine.undo()

    await engine.redo()

    expect(engine.listNamedExpressions().length).toEqual(1)
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.addNamedExpression('foo', 'foo')

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - remove named expression', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=foo']
    ])

    await engine.addNamedExpression('foo', 'foo')
    await engine.removeNamedExpression('foo')
    await engine.undo()

    await engine.redo()

    expect(engine.listNamedExpressions().length).toEqual(0)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('foo')))
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('foo', 'foo')
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.removeNamedExpression('foo')

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - change named expression', () => {
  it('works', async() => {
const engine = await HyperFormula.buildFromArray([
      ['=foo']
    ])

    await engine.addNamedExpression('foo', 'foo')
    await engine.changeNamedExpression('foo', 'bar')
    await engine.undo()

    await engine.redo()

    expect(engine.listNamedExpressions().length).toEqual(1)
    expect(engine.getCellValue(adr('A1'))).toEqual('bar')
  })

  it('clears redo stack', async() => {
const engine = await HyperFormula.buildFromArray([])
    await engine.addNamedExpression('foo', 'foo')
    await engine.setCellContents(adr('A1'), 42)
    await engine.undo()

    await engine.changeNamedExpression('foo', 'foo')

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - batch mode', () => {
  it('multiple batched operations are one redo', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
    ])
    await engine.batch(async() => {
      await engine.setCellContents(adr('A1'), '10')
      await engine.setCellContents(adr('A2'), '20')
    })
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
    expect(engine.isThereSomethingToRedo()).toBe(false)
  })

  it('operations in batch mode are re-done in correct order', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
    ])
    await engine.batch(async() => {
      await engine.setCellContents(adr('A1'), '10')
      await engine.removeRows(0, [0, 1])
    })
    const snapshot = engine.getAllSheetsSerialized()
    await engine.undo()

    await engine.redo()

    expectEngineToBeTheSameAs(engine, await HyperFormula.buildFromSheets(snapshot))
  })
})

describe('Redo', () => {
  it('when there is no operation to redo', async() => {
const engine = await HyperFormula.buildEmpty()

    await expect(async() => {
      await engine.redo()
    }).rejects.toThrow(new NoOperationToRedoError())
  })

  it('redo recomputes and return changes', async() => {
const engine = await HyperFormula.buildFromArray([
      ['3', '=A1'],
    ])
    await engine.setCellContents(adr('A1'), '100')
    await engine.undo()

    const changes = await engine.redo()

    expect(engine.getCellValue(adr('B1'))).toEqual(100)
    expect(changes.length).toBe(2)
  })
})
