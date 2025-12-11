import {ErrorType, HyperFormula, NoOperationToRedoError, NoOperationToUndoError} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, expectEngineToBeTheSameAs} from './testUtils'
import {UndoRedo, AddSheetUndoEntry} from '../../src/UndoRedo'
import {Config} from '../../src/Config'
import {DependencyGraph} from '../../src/DependencyGraph'
import {Statistics} from '../../src/statistics'
import {FunctionRegistry} from '../../src/interpreter/FunctionRegistry'
import {LazilyTransformingAstService} from '../../src/LazilyTransformingAstService'
import {NamedExpressions} from '../../src/NamedExpressions'
import {Operations} from '../../src/Operations'
import {buildColumnSearchStrategy} from '../../src/Lookup/SearchStrategy'
import {CellContentParser} from '../../src/CellContentParser'
import {DateTimeHelper} from '../../src/DateTimeHelper'
import {NumberLiteralHelper} from '../../src/NumberLiteralHelper'
import {ParserWithCaching} from '../../src/parser'
import {ArraySizePredictor} from '../../src/ArraySize'

describe('Undo - removing rows', () => {
  it('works for empty row', () => {
    const sheet = [
      ['1'],
      [null], // remove
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works for simple values', () => {
    const sheet = [
      ['1'],
      ['2'], // remove
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works with formula in removed row', () => {
    const sheet = [
      ['1'],
      ['=SUM(A1)'], // remove
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores dependent cell formulas', () => {
    const sheet = [
      ['=A2'],
      ['42'], // remove
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('formulas are built correctly when there was a pause in computation', () => {
    const sheet = [
      ['=A2'],
      ['42'], // remove
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.suspendEvaluation()
    engine.removeRows(0, [1, 1])

    engine.undo()
    engine.resumeEvaluation()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores ranges when removing rows', () => {
    const sheet = [
      ['=SUM(A2:A3)'],
      ['2'], // remove
      ['3'], // remove
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1, 2])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('dummy operation should also be undoable', () => {
    const sheet = [
      ['1']
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1000, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works for more removal segments', () => {
    const sheet = [
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1, 1], [3, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - adding rows', () => {
  it('works', () => {
    const sheet = [
      ['1'], // add after that
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.addRows(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('dummy operation should also be undoable', () => {
    const sheet = [
      ['1']
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.addRows(0, [1000, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works for more addition segments', () => {
    const sheet = [
      ['1'],
      ['2'],
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.addRows(0, [1, 1], [2, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - moving rows', () => {
  it('works', () => {
    const sheet = [
      [0], [1], [2], [3], [4], [5], [6], [7],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveRows(0, 1, 3, 7)
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works in both directions', () => {
    const sheet = [
      [0], [1], [2], [3], [4], [5], [6], [7],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveRows(0, 4, 3, 2)
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('should restore range', () => {
    const engine = HyperFormula.buildFromArray([
      [1, null],
      [2, '=SUM(A1:A2)'],
    ])
    engine.moveRows(0, 1, 1, 3)
    engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toEqual('=SUM(A1:A2)')
  })

  it('should restore range when moving other way', () => {
    const engine = HyperFormula.buildFromArray([
      [1, null],
      [2, '=SUM(A1:A2)'],
    ])

    engine.moveRows(0, 2, 1, 1)
    engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toEqual('=SUM(A1:A2)')
  })
})

describe('Undo - moving columns', () => {
  it('works', () => {
    const sheet = [
      [0, 1, 2, 3, 4, 5, 6, 7],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveColumns(0, 1, 3, 7)
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works in both directions', () => {
    const sheet = [
      [0, 1, 2, 3, 4, 5, 6, 7],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveColumns(0, 4, 3, 2)
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('should restore range', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [null, '=SUM(A1:B1)'],
    ])
    engine.moveColumns(0, 1, 1, 3)
    engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toEqual('=SUM(A1:B1)')
  })

  it('should restore range when moving to left', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [null, '=SUM(A1:B1)'],
    ])

    engine.moveColumns(0, 2, 1, 1)
    engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toEqual('=SUM(A1:B1)')
  })
})

describe('Undo - adding columns', () => {
  it('works', () => {
    const sheet = [
      ['1', /* */ '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.addColumns(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('dummy operation should also be undoable', () => {
    const sheet = [
      ['1']
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.addColumns(0, [1000, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works for more addition segments', () => {
    const sheet = [
      ['1', '2', '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.addColumns(0, [1, 1], [2, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - removing columns', () => {
  it('works for empty column', () => {
    const sheet = [
      ['1', null, '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeColumns(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works for simple values', () => {
    const sheet = [
      ['1', '2', '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeColumns(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works with formula in removed columns', () => {
    const sheet = [
      ['1', '=SUM(A1)', '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeColumns(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores dependent cell formulas', () => {
    const sheet = [
      ['=A2', '42', '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeColumns(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('formulas are built correctly when there was a pause in computation', () => {
    const sheet = [
      ['=A2', '42', '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.suspendEvaluation()
    engine.removeColumns(0, [1, 1])

    engine.undo()
    engine.resumeEvaluation()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores ranges when removing columns', () => {
    const sheet = [
      ['=SUM(B1:C1)', '2', '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeColumns(0, [1, 2])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('dummy operation should also be undoable', () => {
    const sheet = [
      ['1']
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeColumns(0, [1000, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works for more removal segments', () => {
    const sheet = [
      ['1', '2', '3', '4'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeColumns(0, [1, 1], [3, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - removing sheet', () => {
  it('works for empty sheet', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.removeSheet(0)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([]))
  })

  it('works with restoring simple values', () => {
    const sheet = [
      ['1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeSheet(0)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works with restoring formulas', () => {
    const sheet = [
      ['=42'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeSheet(0)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores dependent cell formulas', () => {
    const sheets = {
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    }
    const engine = HyperFormula.buildFromSheets(sheets)
    engine.removeSheet(1)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(sheets))
  })

  it('formulas are built correctly when there was a pause in computation', () => {
    const sheets = {
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    }
    const engine = HyperFormula.buildFromSheets(sheets)
    engine.suspendEvaluation()
    engine.removeSheet(1)

    engine.undo()
    engine.resumeEvaluation()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(sheets))
  })

  it('works with multiple undo/redo cycles', () => {
    const sheets = {
      Sheet1: [['1', '2']],
      Sheet2: [['3', '4']],
    }
    const engine = HyperFormula.buildFromSheets(sheets)
    engine.removeSheet(1)

    engine.undo()
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(sheets))

    engine.redo()
    expect(engine.getSheetNames()).toEqual(['Sheet1'])

    engine.undo()
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(sheets))
  })

  it('works after row removal operation', () => {
    const sheets = {
      Sheet1: [['1'], ['2'], ['=Sheet2!A1']],
      Sheet2: [['42']],
    }
    const engine = HyperFormula.buildFromSheets(sheets)
    engine.removeRows(0, [0, 1])
    engine.removeSheet(1)

    engine.undo()
    expect(engine.getSheetNames()).toEqual(['Sheet1', 'Sheet2'])
    expect(engine.getCellValue(adr('A2'))).toEqual(42)

    engine.undo()
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('A2'))).toEqual(2)
    expect(engine.getCellValue(adr('A3'))).toEqual(42)
  })

  it('works after column removal operation', () => {
    const sheets = {
      Sheet1: [['1', '2', '=Sheet2!A1']],
      Sheet2: [['42']],
    }
    const engine = HyperFormula.buildFromSheets(sheets)
    engine.removeColumns(0, [0, 1])
    engine.removeSheet(1)

    engine.undo()
    expect(engine.getSheetNames()).toEqual(['Sheet1', 'Sheet2'])
    expect(engine.getCellValue(adr('B1'))).toEqual(42)

    engine.undo()
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
    expect(engine.getCellValue(adr('C1'))).toEqual(42)
  })

  it('restores scoped named expressions', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=MyName']],
      Sheet2: [['1']],
    })
    engine.addNamedExpression('MyName', '=42', 0)
    expect(engine.getCellValue(adr('A1'))).toEqual(42)
    expect(engine.listNamedExpressions(0)).toContain('MyName')

    engine.removeSheet(0)
    expect(engine.getSheetNames()).toEqual(['Sheet2'])

    engine.undo()

    expect(engine.getSheetNames()).toContain('Sheet1')
    expect(engine.getSheetNames()).toContain('Sheet2')
    expect(engine.listNamedExpressions(0)).toContain('MyName')
    expect(engine.getCellValue(adr('A1'))).toEqual(42)
  })
})

describe('Undo - renaming sheet', () => {
  it('undo previous operation if name not changes', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.setCellContents(adr('A1'), [[2]])
    engine.renameSheet(0, 'Sheet1')

    engine.undo()

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getSheetName(0)).toEqual('Sheet1')
  })

  it('undo rename sheet', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Foo')

    engine.undo()

    expect(engine.getSheetName(0)).toEqual('Sheet1')
  })

  it('undo rename with case change only', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'SHEET1')

    engine.undo()

    expect(engine.getSheetName(0)).toEqual('Sheet1')
  })

  it('undo rename preserves cell values', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[42], ['=A1*2']]})
    engine.renameSheet(0, 'NewName')

    engine.undo()

    expect(engine.getSheetName(0)).toEqual('Sheet1')
    expect(engine.getCellValue(adr('A1'))).toEqual(42)
    expect(engine.getCellValue(adr('A2'))).toEqual(84)
  })

  it('undo rename with suspended evaluation', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.suspendEvaluation()
    engine.renameSheet(0, 'Foo')

    engine.undo()
    engine.resumeEvaluation()

    expect(engine.getSheetName(0)).toEqual('Sheet1')
  })

  it('undo rename that merged with placeholder sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=OldName!A1', '=NewName!A1']],
      'OldName': [[42]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqual(42)

    engine.undo()

    expect(engine.getSheetName(oldNameId)).toEqual('OldName')
    expect(engine.getCellFormula(adr('A1', sheet1Id))).toEqual('=OldName!A1')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toEqual('=NewName!A1')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })

  it('undo rename with range reference updates formula (merged with placeholder sheet)', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=SUM(OldName!A1:B2)', '=SUM(NewName!A1:B2)']],
      'OldName': [[10, 20], [30, 40]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getCellFormula(adr('A1', sheet1Id))).toEqual('=SUM(NewName!A1:B2)')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toEqual('=SUM(NewName!A1:B2)')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqual(100)

    engine.undo()

    expect(engine.getCellFormula(adr('A1', sheet1Id))).toEqual('=SUM(OldName!A1:B2)')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toEqual('=SUM(NewName!A1:B2)')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })

  it('restores the dependency graph structure on undo', () => {
    // Complex dependency structure:
    // Sheet1!A1 -> OldName!A1 (direct reference to real sheet)
    // Sheet1!B1 -> NewName!A1 (direct reference to placeholder - should be REF)
    // Sheet1!C1 -> SUM(OldName!A1:B2) (range reference to real sheet)
    // Sheet1!D1 -> SUM(NewName!A1:B2) (range reference to placeholder - should be REF)
    // Sheet1!A2 -> Sheet1!A1 * 2 (indirect dependency on OldName via A1)
    // Sheet1!B2 -> Sheet1!B1 + 10 (indirect dependency on placeholder via B1 - should be REF)
    // Sheet1!C2 -> Sheet1!C1 + Sheet1!A1 (depends on both range and direct ref to real sheet)
    // Sheet1!D2 -> Sheet1!D1 + Sheet1!B1 (depends on both range and direct ref to placeholder - should be REF)
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [
        ['=OldName!A1', '=NewName!A1', '=SUM(OldName!A1:B2)', '=SUM(NewName!A1:B2)'],
        ['=A1*2', '=B1+10', '=C1+A1', '=D1+B1'],
      ],
      'OldName': [[1, 2], [3, 4]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    // Before rename: OldName refs work, NewName refs are REF errors
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(1)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('C1', sheet1Id))).toEqual(10) // 1+2+3+4
    expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('A2', sheet1Id))).toEqual(2) // 1*2
    expect(engine.getCellValue(adr('B2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('C2', sheet1Id))).toEqual(11) // 10+1
    expect(engine.getCellValue(adr('D2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    // Rename OldName -> NewName (merges with placeholder)
    engine.renameSheet(oldNameId, 'NewName')

    // After rename: all refs now work (NewName is the real sheet)
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(1)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqual(1)
    expect(engine.getCellValue(adr('C1', sheet1Id))).toEqual(10)
    expect(engine.getCellValue(adr('D1', sheet1Id))).toEqual(10)
    expect(engine.getCellValue(adr('A2', sheet1Id))).toEqual(2)
    expect(engine.getCellValue(adr('B2', sheet1Id))).toEqual(11)
    expect(engine.getCellValue(adr('C2', sheet1Id))).toEqual(11)
    expect(engine.getCellValue(adr('D2', sheet1Id))).toEqual(11)

    // Undo the rename
    engine.undo()

    // After undo: OldName refs work, NewName refs are REF errors again
    expect(engine.getCellFormula(adr('A1', sheet1Id))).toEqual('=OldName!A1')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toEqual('=NewName!A1')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(1)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('C1', sheet1Id))).toEqual(10)
    expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('A2', sheet1Id))).toEqual(2)
    expect(engine.getCellValue(adr('B2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('C2', sheet1Id))).toEqual(11)
    expect(engine.getCellValue(adr('D2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    // Modify data in OldName - should propagate through direct and indirect dependencies
    engine.setCellContents(adr('A1', oldNameId), 100)

    // Cells referencing OldName (directly or indirectly) should update
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100) // direct ref updated
    expect(engine.getCellValue(adr('C1', sheet1Id))).toEqual(109) // range ref updated: 100+2+3+4
    expect(engine.getCellValue(adr('A2', sheet1Id))).toEqual(200) // indirect via A1: 100*2
    expect(engine.getCellValue(adr('C2', sheet1Id))).toEqual(209) // indirect via C1+A1: 109+100

    // Cells referencing NewName (placeholder) should still be REF errors
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('B2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('D2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })

  it('multiple undo/redo cycles for rename', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Renamed')

    engine.undo()
    expect(engine.getSheetName(0)).toEqual('Sheet1')

    engine.redo()
    expect(engine.getSheetName(0)).toEqual('Renamed')

    engine.undo()
    expect(engine.getSheetName(0)).toEqual('Sheet1')

    engine.redo()
    expect(engine.getSheetName(0)).toEqual('Renamed')
  })

  it('undo multiple sequential renames', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Name1')
    engine.renameSheet(0, 'Name2')
    engine.renameSheet(0, 'Name3')

    engine.undo()
    expect(engine.getSheetName(0)).toEqual('Name2')

    engine.undo()
    expect(engine.getSheetName(0)).toEqual('Name1')

    engine.undo()
    expect(engine.getSheetName(0)).toEqual('Sheet1')
  })

  it('undo rename combined with cell content changes', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.setCellContents(adr('A1'), 10)
    engine.renameSheet(0, 'NewName')
    engine.setCellContents(adr('A1'), 100)

    engine.undo() // undo setCellContents
    expect(engine.getCellValue(adr('A1'))).toEqual(10)
    expect(engine.getSheetName(0)).toEqual('NewName')

    engine.undo() // undo renameSheet
    expect(engine.getSheetName(0)).toEqual('Sheet1')

    engine.undo() // undo first setCellContents
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('undo rename in batch mode', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]], 'Sheet2': [[2]]})
    engine.batch(() => {
      engine.renameSheet(0, 'NewName1')
      engine.renameSheet(1, 'NewName2')
    })

    engine.undo()

    expect(engine.getSheetName(0)).toEqual('Sheet1')
    expect(engine.getSheetName(1)).toEqual('Sheet2')
  })

  it('undo rename with chained dependencies across sheets', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=Sheet2!A1+2']],
      'Sheet2': [['=OldName!A1*2']],
      'OldName': [[42]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const sheet2Id = engine.getSheetId('Sheet2')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet2Id))).toEqual(84)
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(86)

    engine.renameSheet(oldNameId, 'NewName')
    expect(engine.getCellFormula(adr('A1', sheet2Id))).toEqual('=NewName!A1*2')

    engine.undo()

    expect(engine.getCellFormula(adr('A1', sheet2Id))).toEqual('=OldName!A1*2')
    expect(engine.getCellValue(adr('A1', sheet2Id))).toEqual(84)
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(86)
  })

  it('undo rename with named expressions', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=MyValue']],
      'OldName': [[99]],
    }, {}, [
      { name: 'MyValue', expression: '=OldName!$A$1' }
    ])
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(99)

    engine.renameSheet(oldNameId, 'NewName')
    expect(engine.getNamedExpressionFormula('MyValue')).toEqual('=NewName!$A$1')

    engine.undo()

    expect(engine.getNamedExpressionFormula('MyValue')).toEqual('=OldName!$A$1')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(99)
  })

  it('undo rename after row removal', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [[1], [2], ['=OldName!A1']],
      'OldName': [[42]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    engine.removeRows(sheet1Id, [0, 1])
    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getCellValue(adr('A2', sheet1Id))).toEqual(42)
    expect(engine.getCellFormula(adr('A2', sheet1Id))).toEqual('=NewName!A1')

    engine.undo() // undo rename
    expect(engine.getCellFormula(adr('A2', sheet1Id))).toEqual('=OldName!A1')
    expect(engine.getCellValue(adr('A2', sheet1Id))).toEqual(42)

    engine.undo() // undo removeRows
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(1)
    expect(engine.getCellValue(adr('A2', sheet1Id))).toEqual(2)
    expect(engine.getCellValue(adr('A3', sheet1Id))).toEqual(42)
  })

  it('undo rename sheet that merged with placeholder restores placeholder', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=PlaceholderName!A1']],
      'OldName': [[42]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'PlaceholderName')

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)
    expect(engine.getSheetName(oldNameId)).toEqual('PlaceholderName')

    engine.undo()

    expect(engine.getSheetName(oldNameId)).toEqual('OldName')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })

  it('redo rename sheet that merged with placeholder works correctly', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=PlaceholderName!A1']],
      'OldName': [[42]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'PlaceholderName')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)

    engine.undo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.redo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)
    expect(engine.getSheetName(oldNameId)).toEqual('PlaceholderName')
  })

  it('multiple undo/redo cycles with placeholder sheet merge', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=GhostSheet!A1']],
      'RealSheet': [[100]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const realSheetId = engine.getSheetId('RealSheet')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(realSheetId, 'GhostSheet')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)

    // First undo/redo cycle
    engine.undo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getSheetName(realSheetId)).toEqual('RealSheet')

    engine.redo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
    expect(engine.getSheetName(realSheetId)).toEqual('GhostSheet')

    // Second undo/redo cycle
    engine.undo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getSheetName(realSheetId)).toEqual('RealSheet')

    engine.redo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
    expect(engine.getSheetName(realSheetId)).toEqual('GhostSheet')

    // Third undo/redo cycle
    engine.undo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.redo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
  })

  it('undo rename with range reference to placeholder sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=SUM(PlaceholderName!A1:B2)']],
      'OldName': [[1, 2], [3, 4]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'PlaceholderName')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(10)

    engine.undo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getSheetName(oldNameId)).toEqual('OldName')

    engine.redo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(10)
  })
})

describe('Undo - setting cell content', () => {
  it('works for simple values', () => {
    const sheet = [
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.setCellContents(adr('A1'), '100')

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works for empty values', () => {
    const sheet = [
      [null],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.setCellContents(adr('A1'), '100')

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works for formula values', () => {
    const sheet = [
      ['=42'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.setCellContents(adr('A1'), '100')

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('setting multiple cell contents is one operation', () => {
    const sheet = [
      ['3', '4'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.setCellContents(adr('A1'), [['5', '6']])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - adding sheet', () => {
  it('works for basic case', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet('SomeSheet')

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([]))
  })

  it('works with auto-generated name', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet()

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([]))
  })

  it('restores cross-sheet reference error after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NewSheet!A1']
    ])
    engine.addSheet('NewSheet')
    engine.setCellContents({sheet: 1, col: 0, row: 0}, '42')

    expect(engine.getCellValue(adr('A1'))).toEqual(42)

    engine.undo() // undo setCellContents
    engine.undo() // undo addSheet

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })

  it('formulas are built correctly when there was a pause in computation', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NewSheet!A1']
    ])
    engine.suspendEvaluation()
    engine.addSheet('NewSheet')
    engine.setCellContents({sheet: 1, col: 0, row: 0}, '42')

    engine.undo() // undo setCellContents
    engine.undo() // undo addSheet
    engine.resumeEvaluation()

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })
})

describe('Undo - clearing sheet', () => {
  it('works for empty sheet', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.clearSheet(0)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([]))
  })

  it('works with restoring simple values', () => {
    const sheet = [
      ['1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.clearSheet(0)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works with restoring formulas', () => {
    const sheet = [
      ['=42'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.clearSheet(0)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - setting sheet contents', () => {
  it('works for basic case', () => {
    const sheet = [['13']]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.setSheetContent(0, [['42']])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('also clears sheet when undoing', () => {
    const sheet = [
      ['1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.setSheetContent(0, [['42', '43']])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - moving cells', () => {
  it('works for simple case', () => {
    const sheet = [
      ['foo'],
      [null],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores data', () => {
    const sheet = [
      ['foo'],
      ['42'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores dependent cell formulas', () => {
    const sheet = [
      ['=A2'],
      ['42'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('formulas are built correctly when there was a pause in computation', () => {
    const sheet = [
      ['=A2'],
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.suspendEvaluation()
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    engine.undo()
    engine.resumeEvaluation()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('removed added global named expression', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [],
      'Sheet2': []
    })
    engine.addNamedExpression('foo', 'bar', 0)
    engine.setCellContents(adr('A1'), '=foo')
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A1', 1))

    engine.undo()

    expect(engine.getNamedExpressionValue('foo')).toEqual(undefined)
  })

  it('remove global named expression even if it was added after formula', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=foo']],
      'Sheet2': []
    })
    engine.addNamedExpression('foo', 'bar', 0)
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A1', 1))

    engine.undo()

    expect(engine.getNamedExpressionValue('foo', 0)).toEqual('bar')
    expect(engine.getNamedExpressionValue('foo')).toEqual(undefined)
  })
})

describe('Undo - cut-paste', () => {
  it('works for static content', () => {
    const sheet = [
      ['foo'],
      ['bar'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A2'))

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('undoing doesnt roll back clipboard', () => {
    const sheet = [
      ['foo'],
      ['bar'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A2'))
    engine.undo()

    expect(engine.isClipboardEmpty()).toBe(true)
  })

  it('removed added global named expression', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [],
      'Sheet2': []
    })
    engine.addNamedExpression('foo', 'bar', 0)
    engine.setCellContents(adr('A1'), '=foo')
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A1', 1))

    engine.undo()

    expect(engine.getNamedExpressionValue('foo', 0)).toEqual('bar')
    expect(engine.getNamedExpressionValue('foo')).toEqual(undefined)
  })
})

describe('Undo - copy-paste', () => {
  it('works', () => {
    const sheet = [
      ['foo'],
      ['bar'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A2'))

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('removed added global named expression', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [],
      'Sheet2': []
    })
    engine.addNamedExpression('foo', 'bar', 0)
    engine.setCellContents(adr('A1'), '=foo')
    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A1', 1))

    engine.undo()

    expect(engine.getNamedExpressionValue('foo', 0)).toEqual('bar')
    expect(engine.getNamedExpressionValue('foo')).toEqual(undefined)
  })
})

describe('Undo - add named expression', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')

    engine.undo()

    expect(engine.listNamedExpressions().length).toEqual(0)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('foo')))
  })
})

describe('Undo - remove named expression', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')
    engine.removeNamedExpression('foo')

    engine.undo()

    expect(engine.listNamedExpressions().length).toEqual(1)
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
  })
})

describe('Undo - change named expression', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')
    engine.changeNamedExpression('foo', 'bar')

    engine.undo()

    expect(engine.listNamedExpressions().length).toEqual(1)
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
  })
})

describe('Undo', () => {
  it('when there is no operation to undo', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.undo()
    }).toThrow(new NoOperationToUndoError())
  })

  it('undo recomputes and return changes', () => {
    const engine = HyperFormula.buildFromArray([
      ['3', '=A1'],
    ])
    engine.setCellContents(adr('A1'), '100')

    const changes = engine.undo()

    expect(engine.getCellValue(adr('B1'))).toEqual(3)
    expect(changes.length).toBe(2)
  })

  it('operations in batch mode are one undo', () => {
    const sheet = [
      ['1', '2'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.batch(() => {
      engine.setCellContents(adr('A1'), '10')
      engine.setCellContents(adr('A2'), '20')
    })

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
    expect(engine.isThereSomethingToUndo()).toBe(false)
  })

  it('operations in batch mode are undone in correct order', () => {
    const sheet = [
      ['1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.batch(() => {
      engine.setCellContents(adr('A1'), '10')
      engine.removeRows(0, [0, 1])
    })

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('keeps elements within limit', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ], {undoLimit: 3})
    engine.setCellContents(adr('A1'), '2')
    engine.setCellContents(adr('A1'), '3')
    engine.setCellContents(adr('A1'), '4')
    engine.setCellContents(adr('A1'), '5')

    engine.undo()
    engine.undo()
    engine.undo()

    expect(engine.isThereSomethingToUndo()).toBe(false)
  })

  it('undo limit works with infinity', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ], {undoLimit: Infinity})
    engine.setCellContents(adr('A1'), '2')
    engine.setCellContents(adr('A1'), '3')
    engine.setCellContents(adr('A1'), '4')

    expect(engine.isThereSomethingToUndo()).toBe(true)
  })

  it('restore AST after irreversible operation', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('E1'), '=SUM(A1:C1)')
    engine.addColumns(0, [3, 1])
    engine.removeColumns(0, [0, 1])

    expect(() => engine.undo()).not.toThrowError()
    expect(engine.getCellFormula(adr('F1'))).toEqual('=SUM(A1:C1)')
  })
})

describe('UndoRedo', () => {
  it('redo operation is pushed back on undo stack (undo-redo-undo)', () => {
    const sheet = [
      ['1'],
      ['2', '=A1'], // remove
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1, 1])
    engine.undo()
    engine.redo()

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})

describe('UndoRedo - #isThereSomethingToUndo', () => {
  it('when there is no operation to undo', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.isThereSomethingToUndo()).toBe(false)
  })

  it('when there is some operation to undo', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.removeRows(0, [1, 1])

    expect(engine.isThereSomethingToUndo()).toBe(true)
  })

  it('when the undo stack has been cleared', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.removeRows(0, [1, 1])
    expect(engine.isThereSomethingToUndo()).toBe(true)
    engine.clearUndoStack()
    expect(engine.isThereSomethingToUndo()).toBe(false)
  })
})

describe('UndoRedo - #isThereSomethingToRedo', () => {
  it('when there is no operation to redo', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })

  it('when there is some operation to redo', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.removeRows(0, [1, 1])
    engine.undo()

    expect(engine.isThereSomethingToRedo()).toBe(true)
  })

  it('when the redo stack has been cleared', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.removeRows(0, [1, 1])
    engine.undo()
    expect(engine.isThereSomethingToRedo()).toBe(true)
    engine.clearRedoStack()
    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('UndoRedo - at the Operations layer', () => {
  let undoRedo: UndoRedo

  beforeEach(() => {
    const config = new Config()
    const stats = new Statistics()
    const namedExpressions = new NamedExpressions()
    const functionRegistry = new FunctionRegistry(config)
    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, functionRegistry, namedExpressions, stats)
    const columnSearch = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const dateTimeHelper = new DateTimeHelper(config)
    const numberLiteralHelper = new NumberLiteralHelper(config)
    const cellContentParser = new CellContentParser(config, dateTimeHelper, numberLiteralHelper)
    const parser = new ParserWithCaching(
      config,
      functionRegistry,
      dependencyGraph.sheetReferenceRegistrar.ensureSheetRegistered.bind(dependencyGraph.sheetReferenceRegistrar)
    )
    const arraySizePredictor = new ArraySizePredictor(config, functionRegistry)
    const operations = new Operations(config, dependencyGraph, columnSearch, cellContentParser, parser, stats, lazilyTransformingAstService, namedExpressions, arraySizePredictor)
    undoRedo = new UndoRedo(config, operations)
 })

  it('commitBatchMode should throw when a batch is not in progress', () => {
    expect(() => {
      undoRedo.commitBatchMode()
    }).toThrowError("Batch mode wasn't started")
  })

  it('clearUndoStack should clear out all undo entries', () => {
    expect(undoRedo.isUndoStackEmpty()).toBe(true)
    undoRedo.saveOperation(new AddSheetUndoEntry('Sheet 1', 1))
    undoRedo.saveOperation(new AddSheetUndoEntry('Sheet 2', 2))

    expect(undoRedo.isUndoStackEmpty()).toBe(false)

    undoRedo.clearUndoStack()

    expect(undoRedo.isUndoStackEmpty()).toBe(true)
  })

  it('undo should throw when there is nothing on the undo stack', () => {
    expect(() => {
      undoRedo.undo()
    }).toThrowError('Attempted to undo without operation on stack')
  })

  it('redo should throw when there is nothing on the redo stack', () => {
    expect(() => {
      undoRedo.redo()
    }).toThrowError('Attempted to redo without operation on stack')
  })
})

describe('Redo - removing rows', () => {
  it('works for empty row', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      [null], // remove
      ['3'],
    ])
    engine.removeRows(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('works for other values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2', '=A1'], // remove
      ['3'],
    ])
    engine.removeRows(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('works for more removal segments', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      ['4'],
    ])
    engine.removeRows(0, [1, 1], [3, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('dummy operation should also be redoable', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])
    engine.removeRows(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.removeRows(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - adding rows', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'], // add after that
      ['3'],
    ])
    engine.addRows(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('dummy operation should also be redoable', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ])
    engine.addRows(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('works for more addition segments', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
    ])
    engine.addRows(0, [1, 1], [2, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.addRows(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - moving rows', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'], // move first row before this one
    ])
    engine.moveRows(0, 0, 1, 2)
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.moveRows(0, 0, 1, 2)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - moving columns', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3'],
    ])
    engine.moveColumns(0, 0, 1, 2)
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.moveColumns(0, 0, 1, 2)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - moving cells', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['42'],
      ['45'],
    ])
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - setting cell content', () => {
  it('works for simple values', () => {
    const engine = HyperFormula.buildFromArray([
      ['3'],
    ])
    engine.setCellContents(adr('A1'), '100')
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('works for empty values', () => {
    const engine = HyperFormula.buildFromArray([
      ['3'],
    ])
    engine.setCellContents(adr('A1'), null)
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('works for formula values', () => {
    const engine = HyperFormula.buildFromArray([
      ['3'],
    ])
    engine.setCellContents(adr('A1'), '=42')
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('setting multiple cell contents is one operation', () => {
    const engine = HyperFormula.buildFromArray([
      ['3', '4'],
    ])
    engine.setCellContents(adr('A1'), [['5', '6']])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.setCellContents(adr('A1'), 78)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - removing sheet', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])
    engine.removeSheet(0)
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.removeSheet(0)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })

  it('redo with cross-sheet formula dependencies', () => {
    const sheets = {
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    }
    const engine = HyperFormula.buildFromSheets(sheets)
    engine.removeSheet(1)
    engine.undo()

    engine.redo()

    expect(engine.getSheetNames()).toEqual(['Sheet1'])
    expect(engine.getCellValue(adr('A1'))).toBeInstanceOf(Object) // #REF! error
  })

  it('works with multiple undo/redo cycles', () => {
    const sheets = {
      Sheet1: [['1']],
      Sheet2: [['2']],
    }
    const engine = HyperFormula.buildFromSheets(sheets)
    engine.removeSheet(1)

    engine.undo()
    engine.redo()
    engine.undo()
    engine.redo()

    expect(engine.getSheetNames()).toEqual(['Sheet1'])
  })

  it('redo removes scoped named expressions', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=MyName']],
    })
    engine.addNamedExpression('MyName', '=42', 0)
    engine.removeSheet(0)
    engine.undo()

    engine.redo()

    expect(engine.listNamedExpressions().length).toEqual(0)
  })
})

describe('Redo - adding sheet', () => {
  it('works for basic case', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet('SomeSheet')
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(1)).toEqual('SomeSheet')
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('works for automatic naming', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet()
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(1)).toEqual('Sheet2')
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.addSheet()

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })

  it('restores cross-sheet reference after redo', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NewSheet!A1']
    ])
    engine.addSheet('NewSheet')
    engine.setCellContents({sheet: 1, col: 0, row: 0}, '42')
    engine.undo() // undo setCellContents
    engine.undo() // undo addSheet

    engine.redo() // redo addSheet

    expect(engine.getSheetName(1)).toEqual('NewSheet')
  })

  it('formulas are built correctly when there was a pause in computation', () => {
    const engine = HyperFormula.buildFromArray([
      ['=NewSheet!A1']
    ])
    engine.addSheet('NewSheet')
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()
    engine.suspendEvaluation()

    engine.redo()
    engine.resumeEvaluation()

    expect(engine.getSheetName(1)).toEqual('NewSheet')
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })
})

describe('Redo - renaming sheet', () => {
  it('redo rename sheet', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Foo')
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(0)).toEqual('Foo')
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.renameSheet(0, 'Foo')

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })

  it('redo rename with case change only', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'SHEET1')
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(0)).toEqual('SHEET1')
  })

  it('redo rename preserves cell values', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[42], ['=A1*2']]})
    engine.renameSheet(0, 'NewName')
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(0)).toEqual('NewName')
    expect(engine.getCellValue(adr('A1'))).toEqual(42)
    expect(engine.getCellValue(adr('A2'))).toEqual(84)
  })

  it('redo rename with suspended evaluation', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Foo')
    engine.undo()
    engine.suspendEvaluation()

    engine.redo()
    engine.resumeEvaluation()

    expect(engine.getSheetName(0)).toEqual('Foo')
  })

  it('redo rename that merged with placeholder sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=OldName!A1', '=NewName!A1']],
      'OldName': [[42]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqual(42)

    engine.undo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.redo()

    expect(engine.getSheetName(oldNameId)).toEqual('NewName')
    expect(engine.getCellFormula(adr('A1', sheet1Id))).toEqual('=NewName!A1')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toEqual('=NewName!A1')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqual(42)
  })

  it('redo rename with range reference updates formula (merged with placeholder sheet)', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=SUM(OldName!A1:B2)', '=SUM(NewName!A1:B2)']],
      'OldName': [[10, 20], [30, 40]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'NewName')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqual(100)

    engine.undo()
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.redo()

    expect(engine.getCellFormula(adr('A1', sheet1Id))).toEqual('=SUM(NewName!A1:B2)')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toEqual('=SUM(NewName!A1:B2)')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqual(100)
  })

  it('redo multiple sequential renames', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Name1')
    engine.renameSheet(0, 'Name2')
    engine.renameSheet(0, 'Name3')
    engine.undo()
    engine.undo()
    engine.undo()

    engine.redo()
    expect(engine.getSheetName(0)).toEqual('Name1')

    engine.redo()
    expect(engine.getSheetName(0)).toEqual('Name2')

    engine.redo()
    expect(engine.getSheetName(0)).toEqual('Name3')
  })

  it('redo rename combined with cell content changes', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.setCellContents(adr('A1'), 10)
    engine.renameSheet(0, 'NewName')
    engine.setCellContents(adr('A1'), 100)
    engine.undo()
    engine.undo()
    engine.undo()

    engine.redo() // redo first setCellContents
    expect(engine.getCellValue(adr('A1'))).toEqual(10)

    engine.redo() // redo renameSheet
    expect(engine.getSheetName(0)).toEqual('NewName')

    engine.redo() // redo second setCellContents
    expect(engine.getCellValue(adr('A1'))).toEqual(100)
  })

  it('redo rename in batch mode', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]], 'Sheet2': [[2]]})
    engine.batch(() => {
      engine.renameSheet(0, 'NewName1')
      engine.renameSheet(1, 'NewName2')
    })
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(0)).toEqual('NewName1')
    expect(engine.getSheetName(1)).toEqual('NewName2')
  })

  it('redo rename with chained dependencies across sheets', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=Sheet2!A1+2']],
      'Sheet2': [['=NewName!A1*2']],
      'OldName': [[42]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const sheet2Id = engine.getSheetId('Sheet2')!
    const oldNameId = engine.getSheetId('OldName')!

    engine.renameSheet(oldNameId, 'NewName')
    engine.undo()

    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet2Id))).toEqual(84)
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(86)
  })

  it('redo rename with named expressions referencing placeholder', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=MyValue']],
      'OldName': [[99]],
    }, {}, [
      { name: 'MyValue', expression: '=NewName!$A$1' }
    ])
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    engine.renameSheet(oldNameId, 'NewName')
    engine.undo()

    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(99)
  })

  it('redo rename after undo of combined operations', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=NewName!A1']],
      'OldName': [[42]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    engine.renameSheet(oldNameId, 'NewName')
    engine.setCellContents(adr('A1', oldNameId), 100)
    engine.undo() // undo setCellContents
    engine.undo() // undo rename

    engine.redo() // redo rename
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(42)

    engine.redo() // redo setCellContents
    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqual(100)
  })

  it('redo rename with multiple cells referencing placeholder', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=NewName!A1', '=NewName!B1']],
      'Sheet2': [['=NewName!A1+10', '=NewName!B1+20']],
      'OldName': [[5, 7]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const sheet2Id = engine.getSheetId('Sheet2')!
    const oldNameId = engine.getSheetId('OldName')!

    engine.renameSheet(oldNameId, 'NewName')
    engine.undo()

    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(5)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(7)
    expect(engine.getCellValue(adr('A1', sheet2Id))).toBe(15)
    expect(engine.getCellValue(adr('B1', sheet2Id))).toBe(27)
  })

  it('redo rename with column and row ranges', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [
        ['=SUM(NewName!A:A)'],
        ['=SUM(NewName!1:2)'],
      ],
      'OldName': [
        [1, 2],
        [3, 4],
      ],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    engine.renameSheet(oldNameId, 'NewName')
    engine.undo()

    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(4)
    expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(10)
  })
})

describe('Redo - clearing sheet', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])
    engine.clearSheet(0)
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.clearSheet(0)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - adding columns', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '3'],
    ])
    engine.addColumns(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('dummy operation should also be redoable', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ])
    engine.addColumns(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('works for more addition segments', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3'],
    ])
    engine.addColumns(0, [1, 1], [2, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.addColumns(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - removing column', () => {
  it('works for empty column', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', null, '3'],
    ])
    engine.removeColumns(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('works for other values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['=B1']
    ])
    engine.removeColumns(0, [0, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('works for more removal segments', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3', '4'],
    ])
    engine.removeColumns(0, [1, 1], [3, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('dummy operation should also be redoable', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])
    engine.removeColumns(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.removeColumns(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - cut-paste', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['foo'],
      ['bar'],
    ])
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A2'))
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('cut does not clear redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))

    expect(engine.isThereSomethingToRedo()).toBe(true)
  })

  it('cut-paste clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A2'))

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - copy-paste', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['foo', 'baz'],
      ['bar', 'faz'],
    ])
    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 2, 2))
    engine.paste(adr('C3'))
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('copy does not clear redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))

    expect(engine.isThereSomethingToRedo()).toBe(true)
  })

  it('copy-paste clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A2'))

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - setting sheet contents', () => {
  it('works for basic case', () => {
    const engine = HyperFormula.buildFromArray([['13']])
    engine.setSheetContent(0, [['42']])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('also clears sheet when redoing', () => {
    const engine = HyperFormula.buildFromArray([['13', '14']])
    engine.setSheetContent(0, [['42']])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.setSheetContent(0, [['42']])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - add named expression', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')
    engine.undo()

    engine.redo()

    expect(engine.listNamedExpressions().length).toEqual(1)
    expect(engine.getCellValue(adr('A1'))).toEqual('foo')
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.addNamedExpression('foo', 'foo')

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - remove named expression', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')
    engine.removeNamedExpression('foo')
    engine.undo()

    engine.redo()

    expect(engine.listNamedExpressions().length).toEqual(0)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('foo')))
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('foo', 'foo')
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.removeNamedExpression('foo')

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - change named expression', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')
    engine.changeNamedExpression('foo', 'bar')
    engine.undo()

    engine.redo()

    expect(engine.listNamedExpressions().length).toEqual(1)
    expect(engine.getCellValue(adr('A1'))).toEqual('bar')
  })

  it('clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('foo', 'foo')
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.changeNamedExpression('foo', 'foo')

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - batch mode', () => {
  it('multiple batched operations are one redo', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
    ])
    engine.batch(() => {
      engine.setCellContents(adr('A1'), '10')
      engine.setCellContents(adr('A2'), '20')
    })
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
    expect(engine.isThereSomethingToRedo()).toBe(false)
  })

  it('operations in batch mode are re-done in correct order', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ])
    engine.batch(() => {
      engine.setCellContents(adr('A1'), '10')
      engine.removeRows(0, [0, 1])
    })
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })
})

describe('Redo', () => {
  it('when there is no operation to redo', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.redo()
    }).toThrow(new NoOperationToRedoError())
  })

  it('redo recomputes and return changes', () => {
    const engine = HyperFormula.buildFromArray([
      ['3', '=A1'],
    ])
    engine.setCellContents(adr('A1'), '100')
    engine.undo()

    const changes = engine.redo()

    expect(engine.getCellValue(adr('B1'))).toEqual(100)
    expect(changes.length).toBe(2)
  })
})
