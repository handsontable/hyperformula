/* eslint-disable jest/expect-expect */
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


  it('dummy operation removeRows should also be undoable', () => {
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

  it('restores original state after adding single row', () => {
    const sheet = [
      ['1'], // add after that
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.addRows(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })


  it('dummy operation addRows should also be undoable', () => {
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

  it('restores original row order after move', () => {
    const sheet = [
      [0], [1], [2], [3], [4], [5], [6], [7],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveRows(0, 1, 3, 7)
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })


  it('restores original row order when moving rows backward', () => {
    const sheet = [
      [0], [1], [2], [3], [4], [5], [6], [7],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveRows(0, 4, 3, 2)
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores range formula after moving rows forward', () => {
    const engine = HyperFormula.buildFromArray([
      [1, null],
      [2, '=SUM(A1:A2)'],
    ])
    engine.moveRows(0, 1, 1, 3)
    engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toBe('=SUM(A1:A2)')
  })

  it('should restore range when moving other way', () => {
    const engine = HyperFormula.buildFromArray([
      [1, null],
      [2, '=SUM(A1:A2)'],
    ])

    engine.moveRows(0, 2, 1, 1)
    engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toBe('=SUM(A1:A2)')
  })
})

describe('Undo - moving columns', () => {

  it('restores original column order after move', () => {
    const sheet = [
      [0, 1, 2, 3, 4, 5, 6, 7],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveColumns(0, 1, 3, 7)
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })


  it('restores original column order when moving columns backward', () => {
    const sheet = [
      [0, 1, 2, 3, 4, 5, 6, 7],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveColumns(0, 4, 3, 2)
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores range formula after moving columns forward', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [null, '=SUM(A1:B1)'],
    ])
    engine.moveColumns(0, 1, 1, 3)
    engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toBe('=SUM(A1:B1)')
  })

  it('should restore range when moving to left', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [null, '=SUM(A1:B1)'],
    ])

    engine.moveColumns(0, 2, 1, 1)
    engine.undo()

    expect(engine.getCellFormula(adr('B2'))).toBe('=SUM(A1:B1)')
  })
})

describe('Undo - adding columns', () => {

  it('restores original state after adding single column', () => {
    const sheet = [
      ['1', /* */ '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.addColumns(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })


  it('dummy operation addColumns should also be undoable', () => {
    const sheet = [
      ['1']
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.addColumns(0, [1000, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })


  it('restores state after adding multiple column segments', () => {
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


  it('restores column with simple values', () => {
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


  it('restores dependent cell formulas after column removal', () => {
    const sheet = [
      ['=A2', '42', '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeColumns(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })


  it('builds formulas correctly with suspended evaluation during column removal', () => {
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

  it('dummy operation removeColumns should also be undoable', () => {
    const sheet = [
      ['1']
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeColumns(0, [1000, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores state after removing multiple column segments', () => {
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

  it('restores cross-sheet formula dependencies after sheet removal', () => {
    const sheets = {
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    }
    const engine = HyperFormula.buildFromSheets(sheets)
    engine.removeSheet(1)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(sheets))
  })

  it('builds formulas correctly with suspended evaluation during sheet removal', () => {
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

  it('restores sheet correctly after multiple undo/redo cycles', () => {
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

    engine.redo()

    expect(engine.getSheetNames()).toEqual(['Sheet1'])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(sheets))

    engine.redo()

    expect(engine.getSheetNames()).toEqual(['Sheet1'])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(sheets))
  })

  it('restores sheet and cross-sheet references after row removal', () => {
    const sheets = {
      Sheet1: [['1'], ['2'], ['=Sheet2!A1']],
      Sheet2: [['42']],
    }
    const engine = HyperFormula.buildFromSheets(sheets)
    engine.removeSheet(1)
    engine.undo()

    expect(engine.getSheetNames()).toEqual(['Sheet1', 'Sheet2'])
    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(2)
    expect(engine.getCellValue(adr('A3'))).toBe(42)
    expect(engine.getCellValue(adr('A1', 1))).toBe(42)
  })

  it('restores scoped named expressions', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=MyName']],
      Sheet2: [['1']],
    })
    engine.addNamedExpression('MyName', '=42', 0)
    engine.removeSheet(0)
    engine.undo()

    expect(engine.getCellValue(adr('A1'))).toBe(42)
  })
})

describe('Undo - renaming sheet', () => {
  it('undo previous operation if name not changes', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.setCellContents(adr('A1'), [[2]])
    engine.renameSheet(0, 'Sheet1')

    engine.undo()

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getSheetName(0)).toBe('Sheet1')
  })

  it('undo rename sheet', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Foo')

    engine.undo()

    expect(engine.getSheetName(0)).toBe('Sheet1')
  })

  it('undo rename with case change only', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'SHEET1')

    expect(engine.getSheetName(0)).toBe('SHEET1')

    engine.undo()

    expect(engine.getSheetName(0)).toBe('Sheet1')
  })

  it('undo rename preserves cell values', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[42], ['=A1*2']]})
    engine.renameSheet(0, 'NewName')
    engine.undo()

    expect(engine.getSheetName(0)).toBe('Sheet1')
    expect(engine.getCellValue(adr('A1'))).toBe(42)
    expect(engine.getCellValue(adr('A2'))).toBe(84)
  })

  it('undo rename with suspended evaluation', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.suspendEvaluation()
    engine.renameSheet(0, 'Foo')
    engine.undo()
    engine.resumeEvaluation()

    expect(engine.getSheetName(0)).toBe('Sheet1')
  })

  it('undo rename that merged with placeholder sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=OldName!A1', '=NewName!A1']],
      'OldName': [[42]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(42)

    engine.undo()

    expect(engine.getSheetName(oldNameId)).toBe('OldName')
    expect(engine.getCellFormula(adr('A1', sheet1Id))).toBe('=OldName!A1')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toBe('=NewName!A1')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })

  it('undo rename with range reference updates formula (merged with placeholder sheet)', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=SUM(OldName!A1:B2)', '=SUM(NewName!A1:B2)']],
      'OldName': [[10, 20], [30, 40]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getCellFormula(adr('A1', sheet1Id))).toBe('=SUM(NewName!A1:B2)')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toBe('=SUM(NewName!A1:B2)')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(100)

    engine.undo()

    expect(engine.getCellFormula(adr('A1', sheet1Id))).toBe('=SUM(OldName!A1:B2)')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toBe('=SUM(NewName!A1:B2)')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })

  it('restores the dependency graph structure on undo', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [
        ['=OldName!A1', '=NewName!A1', '=SUM(OldName!A1:B2)', '=SUM(NewName!A1:B2)'],
        ['=A1*2', '=B1+10', '=C1+A1', '=D1+B1'],
      ],
      'OldName': [[1, 2], [3, 4]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(10)
    expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(2)
    expect(engine.getCellValue(adr('B2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('C2', sheet1Id))).toBe(11)
    expect(engine.getCellValue(adr('D2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(1)
    expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(10)
    expect(engine.getCellValue(adr('D1', sheet1Id))).toBe(10)
    expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(2)
    expect(engine.getCellValue(adr('B2', sheet1Id))).toBe(11)
    expect(engine.getCellValue(adr('C2', sheet1Id))).toBe(11)
    expect(engine.getCellValue(adr('D2', sheet1Id))).toBe(11)

    engine.undo()

    expect(engine.getCellFormula(adr('A1', sheet1Id))).toBe('=OldName!A1')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toBe('=NewName!A1')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(10)
    expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(2)
    expect(engine.getCellValue(adr('B2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('C2', sheet1Id))).toBe(11)
    expect(engine.getCellValue(adr('D2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.setCellContents(adr('A1', oldNameId), 100)

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    expect(engine.getCellValue(adr('C1', sheet1Id))).toBe(109)
    expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(200)
    expect(engine.getCellValue(adr('C2', sheet1Id))).toBe(209)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('D1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('B2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getCellValue(adr('D2', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })

  it('multiple undo/redo cycles for rename', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Renamed')
    engine.undo()

    expect(engine.getSheetName(0)).toBe('Sheet1')

    engine.redo()

    expect(engine.getSheetName(0)).toBe('Renamed')

    engine.undo()

    expect(engine.getSheetName(0)).toBe('Sheet1')

    engine.redo()

    expect(engine.getSheetName(0)).toBe('Renamed')
  })

  it('undo multiple sequential renames', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Name1')
    engine.renameSheet(0, 'Name2')
    engine.renameSheet(0, 'Name3')

    engine.undo()

    expect(engine.getSheetName(0)).toBe('Name2')

    engine.undo()

    expect(engine.getSheetName(0)).toBe('Name1')

    engine.undo()

    expect(engine.getSheetName(0)).toBe('Sheet1')
  })

  it('undo rename combined with cell content changes', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.setCellContents(adr('A1'), 10)
    engine.renameSheet(0, 'NewName')
    engine.setCellContents(adr('A1'), 100)
    engine.undo()

    expect(engine.getCellValue(adr('A1'))).toBe(10)
    expect(engine.getSheetName(0)).toBe('NewName')

    engine.undo()

    expect(engine.getSheetName(0)).toBe('Sheet1')

    engine.undo()

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('undo rename in batch mode', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]], 'Sheet2': [[2]]})
    engine.batch(() => {
      engine.renameSheet(0, 'NewName1')
      engine.renameSheet(1, 'NewName2')
    })

    engine.undo()

    expect(engine.getSheetName(0)).toBe('Sheet1')
    expect(engine.getSheetName(1)).toBe('Sheet2')
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

    expect(engine.getCellValue(adr('A1', sheet2Id))).toBe(84)
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(86)

    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getCellFormula(adr('A1', sheet2Id))).toBe('=NewName!A1*2')

    engine.undo()

    expect(engine.getCellFormula(adr('A1', sheet2Id))).toBe('=OldName!A1*2')
    expect(engine.getCellValue(adr('A1', sheet2Id))).toBe(84)
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(86)
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

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(99)

    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getNamedExpressionFormula('MyValue')).toBe('=NewName!$A$1')

    engine.undo()

    expect(engine.getNamedExpressionFormula('MyValue')).toBe('=OldName!$A$1')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(99)
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

    expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(42)
    expect(engine.getCellFormula(adr('A2', sheet1Id))).toBe('=NewName!A1')

    engine.undo()

    expect(engine.getCellFormula(adr('A2', sheet1Id))).toBe('=OldName!A1')
    expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(42)

    engine.undo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(1)
    expect(engine.getCellValue(adr('A2', sheet1Id))).toBe(2)
    expect(engine.getCellValue(adr('A3', sheet1Id))).toBe(42)
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

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    expect(engine.getSheetName(oldNameId)).toBe('PlaceholderName')

    engine.undo()

    expect(engine.getSheetName(oldNameId)).toBe('OldName')
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

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)

    engine.undo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    expect(engine.getSheetName(oldNameId)).toBe('PlaceholderName')
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

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)

    engine.undo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getSheetName(realSheetId)).toBe('RealSheet')

    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    expect(engine.getSheetName(realSheetId)).toBe('GhostSheet')

    engine.undo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getSheetName(realSheetId)).toBe('RealSheet')

    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    expect(engine.getSheetName(realSheetId)).toBe('GhostSheet')

    engine.undo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
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

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(10)

    engine.undo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
    expect(engine.getSheetName(oldNameId)).toBe('OldName')

    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(10)
  })
})

describe('Undo - setting cell content', () => {
  it('restores simple numeric values', () => {
    const sheet = [
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.setCellContents(adr('A1'), '100')

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores empty cell state', () => {
    const sheet = [
      [null],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.setCellContents(adr('A1'), '100')

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores formula cell content', () => {
    const sheet = [
      ['=42'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.setCellContents(adr('A1'), '100')

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('undoes multiple cell contents as one operation', () => {
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
  it('removes named sheet on undo', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet('SomeSheet')

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([]))
  })

  it('removes auto-generated sheet on undo', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet()
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([]))
  })

  it('restores cross-sheet reference error after undo', () => {
    const engine = HyperFormula.buildFromArray([['=NewSheet!A1']])
    engine.addSheet('NewSheet')
    engine.setCellContents({sheet: 1, col: 0, row: 0}, '42')

    expect(engine.getCellValue(adr('A1'))).toBe(42)
    expect(engine.getCellValue(adr('A1', 1))).toBe(42)

    engine.undo()
    engine.undo()

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })

  it('builds formulas correctly with suspended evaluation during sheet addition', () => {
    const engine = HyperFormula.buildFromArray([['=NewSheet!A1']])
    engine.suspendEvaluation()
    engine.addSheet('NewSheet')
    engine.setCellContents({sheet: 1, col: 0, row: 0}, '42')

    engine.undo()
    engine.undo()
    engine.resumeEvaluation()

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })
})

describe('Undo - clearing sheet', () => {
  it('handles undo on already empty sheet', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.clearSheet(0)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([]))
  })

  it('restores simple values after clearing', () => {
    const sheet = [
      ['1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.clearSheet(0)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores formulas after clearing', () => {
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
  it('restores original sheet content', () => {
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
  it('restores cell to original position', () => {
    const sheet = [
      ['foo'],
      [null],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores overwritten data at target location', () => {
    const sheet = [
      ['foo'],
      ['42'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores dependent cell formulas after cell move', () => {
    const sheet = [
      ['=A2'],
      ['42'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('builds formulas correctly with suspended evaluation during cell move', () => {
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

  it('removes global named expression promoted during move', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [],
      'Sheet2': []
    })
    engine.addNamedExpression('foo', 'bar', 0)
    engine.setCellContents(adr('A1'), '=foo')
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A1', 1))

    engine.undo()

    expect(engine.getNamedExpressionValue('foo')).toBeUndefined()
  })

  it('remove global named expression even if it was added after formula', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=foo']],
      'Sheet2': []
    })
    engine.addNamedExpression('foo', 'bar', 0)
    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A1', 1))

    engine.undo()

    expect(engine.getNamedExpressionValue('foo', 0)).toBe('bar')
    expect(engine.getNamedExpressionValue('foo')).toBeUndefined()
  })
})

describe('Undo - cut-paste', () => {
  it('restores source and target cells after cut-paste', () => {
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

  it('does not roll back clipboard on undo', () => {
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

  it('removes global named expression promoted during cut-paste', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [],
      'Sheet2': []
    })
    engine.addNamedExpression('foo', 'bar', 0)
    engine.setCellContents(adr('A1'), '=foo')
    engine.cut(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A1', 1))

    engine.undo()

    expect(engine.getNamedExpressionValue('foo', 0)).toBe('bar')
    expect(engine.getNamedExpressionValue('foo')).toBeUndefined()
  })
})

describe('Undo - copy-paste', () => {
  it('restores original content after copy-paste', () => {
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

  it('removes global named expression promoted during copy-paste', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [],
      'Sheet2': []
    })
    engine.addNamedExpression('foo', 'bar', 0)
    engine.setCellContents(adr('A1'), '=foo')
    engine.copy(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))
    engine.paste(adr('A1', 1))

    engine.undo()

    expect(engine.getNamedExpressionValue('foo', 0)).toBe('bar')
    expect(engine.getNamedExpressionValue('foo')).toBeUndefined()
  })
})

describe('Undo - add named expression', () => {
  it('removes named expression and restores error', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')

    engine.undo()

    expect(engine.listNamedExpressions().length).toBe(0)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('foo')))
  })
})

describe('Undo - remove named expression', () => {
  it('restores removed named expression', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')
    engine.removeNamedExpression('foo')

    engine.undo()

    expect(engine.listNamedExpressions().length).toBe(1)
    expect(engine.getCellValue(adr('A1'))).toBe('foo')
  })
})

describe('Undo - change named expression', () => {
  it('restores original expression value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')
    engine.changeNamedExpression('foo', 'bar')

    engine.undo()

    expect(engine.listNamedExpressions().length).toBe(1)
    expect(engine.getCellValue(adr('A1'))).toBe('foo')
  })
})

describe('Undo', () => {
  it('throws error when undo stack is empty', () => {
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

    expect(engine.getCellValue(adr('B1'))).toBe(3)
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
    expect(engine.getCellFormula(adr('F1'))).toBe('=SUM(A1:C1)')
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
  it('returns false when undo stack is empty', () => {
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
  it('re-removes empty row after undo', () => {
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

  it('re-removes row with values and formulas after undo', () => {
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

  it('re-removes multiple row segments after undo', () => {
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

  it('dummy removeRows operation is redoable', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])
    engine.removeRows(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('removeRows clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.removeRows(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - adding rows', () => {
  it('re-adds row after undo', () => {
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

  it('dummy addRows operation is redoable', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ])
    engine.addRows(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('re-adds multiple row segments after undo', () => {
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

  it('addRows clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.addRows(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - moving rows', () => {
  it('re-applies row move after undo', () => {
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

  it('moveRows clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.moveRows(0, 0, 1, 2)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - moving columns', () => {
  it('re-applies column move after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3'],
    ])
    engine.moveColumns(0, 0, 1, 2)
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('moveColumns clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.moveColumns(0, 0, 1, 2)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - moving cells', () => {
  it('re-applies cell move after undo', () => {
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

  it('moveCells clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1), adr('A2'))

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - setting cell content', () => {
  it('re-applies simple value change after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['3'],
    ])
    engine.setCellContents(adr('A1'), '100')
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('re-applies cell clearing after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['3'],
    ])
    engine.setCellContents(adr('A1'), null)
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('re-applies formula value change after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['3'],
    ])
    engine.setCellContents(adr('A1'), '=42')
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('redoes multiple cell contents as one operation', () => {
    const engine = HyperFormula.buildFromArray([
      ['3', '4'],
    ])
    engine.setCellContents(adr('A1'), [['5', '6']])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('setCellContents clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.setCellContents(adr('A1'), 78)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - removing sheet', () => {
  it('re-removes sheet after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])
    engine.removeSheet(0)
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('removeSheet clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.removeSheet(0)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })

  it('redo with cross-sheet formula dependencies', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    })
    engine.removeSheet(1)
    engine.undo()

    expect(engine.getSheetNames()).toEqual(['Sheet1', 'Sheet2'])

    engine.redo()

    expect(engine.getSheetNames()).toEqual(['Sheet1'])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))
  })

  it('removes sheet correctly after multiple undo/redo cycles', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['1']],
      Sheet2: [['2']],
    })
    engine.removeSheet(1)

    engine.undo()
    engine.redo()
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

    expect(engine.listNamedExpressions().length).toBe(0)
  })
})

describe('Redo - adding sheet', () => {
  it('re-adds named sheet after undo', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet('SomeSheet')
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(1)).toBe('SomeSheet')
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('re-adds auto-named sheet after undo', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet()
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(1)).toBe('Sheet2')
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('addSheet clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.addSheet()

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })

  it('restores cross-sheet reference after redo', () => {
    const engine = HyperFormula.buildFromArray([['=NewSheet!A1']])
    engine.addSheet('NewSheet')
    engine.undo()
    engine.redo()

    expect(engine.getSheetName(1)).toBe('NewSheet')
  })

  it('builds formulas correctly with suspended evaluation during redo addSheet', () => {
    const engine = HyperFormula.buildFromArray([['=NewSheet!A1']])
    engine.addSheet('NewSheet')
    const snapshot = engine.getAllSheetsSerialized()

    engine.undo()
    engine.suspendEvaluation()
    engine.redo()
    engine.resumeEvaluation()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })
})

describe('Redo - renaming sheet', () => {
  it('re-applies sheet rename after undo', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Foo')
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(0)).toBe('Foo')
  })

  it('renameSheet clears redo stack', () => {
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

    expect(engine.getSheetName(0)).toBe('SHEET1')
  })

  it('redo rename preserves cell values', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[42], ['=A1*2']]})
    engine.renameSheet(0, 'NewName')
    engine.undo()
    engine.redo()

    expect(engine.getSheetName(0)).toBe('NewName')
    expect(engine.getCellValue(adr('A1'))).toBe(42)
    expect(engine.getCellValue(adr('A2'))).toBe(84)
  })

  it('redo rename with suspended evaluation', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.renameSheet(0, 'Foo')
    engine.undo()
    engine.suspendEvaluation()
    engine.redo()
    engine.resumeEvaluation()

    expect(engine.getSheetName(0)).toBe('Foo')
  })

  it('redo rename that merged with placeholder sheet', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=OldName!A1', '=NewName!A1']],
      'OldName': [[42]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(42)

    engine.undo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.redo()

    expect(engine.getSheetName(oldNameId)).toBe('NewName')
    expect(engine.getCellFormula(adr('A1', sheet1Id))).toBe('=NewName!A1')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toBe('=NewName!A1')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(42)
  })

  it('redo rename with range reference updates formula (merged with placeholder sheet)', () => {
    const engine = HyperFormula.buildFromSheets({
      'Sheet1': [['=SUM(OldName!A1:B2)', '=SUM(NewName!A1:B2)']],
      'OldName': [[10, 20], [30, 40]],
    })
    const sheet1Id = engine.getSheetId('Sheet1')!
    const oldNameId = engine.getSheetId('OldName')!

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.renameSheet(oldNameId, 'NewName')

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(100)

    engine.undo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SheetRef))

    engine.redo()

    expect(engine.getCellFormula(adr('A1', sheet1Id))).toBe('=SUM(NewName!A1:B2)')
    expect(engine.getCellFormula(adr('B1', sheet1Id))).toBe('=SUM(NewName!A1:B2)')
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
    expect(engine.getCellValue(adr('B1', sheet1Id))).toBe(100)
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

    expect(engine.getSheetName(0)).toBe('Name1')

    engine.redo()

    expect(engine.getSheetName(0)).toBe('Name2')

    engine.redo()

    expect(engine.getSheetName(0)).toBe('Name3')
  })

  it('redo rename combined with cell content changes', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]]})
    engine.setCellContents(adr('A1'), 10)
    engine.renameSheet(0, 'NewName')
    engine.setCellContents(adr('A1'), 100)
    engine.undo()
    engine.undo()
    engine.undo()
    engine.redo()

    expect(engine.getCellValue(adr('A1'))).toBe(10)

    engine.redo()

    expect(engine.getSheetName(0)).toBe('NewName')

    engine.redo()

    expect(engine.getCellValue(adr('A1'))).toBe(100)
  })

  it('redo rename in batch mode', () => {
    const engine = HyperFormula.buildFromSheets({'Sheet1': [[1]], 'Sheet2': [[2]]})
    engine.batch(() => {
      engine.renameSheet(0, 'NewName1')
      engine.renameSheet(1, 'NewName2')
    })
    engine.undo()
    engine.redo()

    expect(engine.getSheetName(0)).toBe('NewName1')
    expect(engine.getSheetName(1)).toBe('NewName2')
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

    expect(engine.getCellValue(adr('A1', sheet2Id))).toBe(84)
    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(86)
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

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(99)
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
    engine.undo()
    engine.undo()
    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(42)

    engine.redo()

    expect(engine.getCellValue(adr('A1', sheet1Id))).toBe(100)
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
  it('re-clears sheet after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])
    engine.clearSheet(0)
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()
    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clearSheet clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.clearSheet(0)

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - adding columns', () => {
  it('re-adds column after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '3'],
    ])
    engine.addColumns(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('dummy addColumns operation is redoable', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ])
    engine.addColumns(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('re-adds multiple column segments after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3'],
    ])
    engine.addColumns(0, [1, 1], [2, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('addColumns clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.addColumns(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - removing column', () => {
  it('re-removes empty column after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', null, '3'],
    ])
    engine.removeColumns(0, [1, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('re-removes column with values and formulas after undo', () => {
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

  it('re-removes multiple column segments after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3', '4'],
    ])
    engine.removeColumns(0, [1, 1], [3, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('dummy removeColumns operation is redoable', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])
    engine.removeColumns(0, [1000, 1])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('removeColumns clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.removeColumns(0, [1000, 1])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - cut-paste', () => {
  it('re-applies cut-paste after undo', () => {
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
  it('re-applies copy-paste after undo', () => {
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
  it('re-applies sheet content change after undo', () => {
    const engine = HyperFormula.buildFromArray([['13']])
    engine.setSheetContent(0, [['42']])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('clears extra cells when redoing setSheetContent', () => {
    const engine = HyperFormula.buildFromArray([['13', '14']])
    engine.setSheetContent(0, [['42']])
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('setSheetContent clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.setSheetContent(0, [['42']])

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - add named expression', () => {
  it('re-adds named expression after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')
    engine.undo()

    engine.redo()

    expect(engine.listNamedExpressions().length).toBe(1)
    expect(engine.getCellValue(adr('A1'))).toBe('foo')
  })

  it('addNamedExpression clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.addNamedExpression('foo', 'foo')

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - remove named expression', () => {
  it('re-removes named expression after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')
    engine.removeNamedExpression('foo')
    engine.undo()

    engine.redo()

    expect(engine.listNamedExpressions().length).toBe(0)
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NAME, ErrorMessage.NamedExpressionName('foo')))
  })

  it('removeNamedExpression clears redo stack', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addNamedExpression('foo', 'foo')
    engine.setCellContents(adr('A1'), 42)
    engine.undo()

    engine.removeNamedExpression('foo')

    expect(engine.isThereSomethingToRedo()).toBe(false)
  })
})

describe('Redo - change named expression', () => {
  it('re-applies expression change after undo', () => {
    const engine = HyperFormula.buildFromArray([
      ['=foo']
    ])

    engine.addNamedExpression('foo', 'foo')
    engine.changeNamedExpression('foo', 'bar')
    engine.undo()

    engine.redo()

    expect(engine.listNamedExpressions().length).toBe(1)
    expect(engine.getCellValue(adr('A1'))).toBe('bar')
  })

  it('changeNamedExpression clears redo stack', () => {
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
  it('throws error when redo stack is empty', () => {
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

    expect(engine.getCellValue(adr('B1'))).toBe(100)
    expect(changes.length).toBe(2)
  })
})
