import {HyperFormula, NoOperationToUndo, NoOperationToRedo} from '../src'
import './testConfig'
import {
  expectEngineToBeTheSameAs,
  adr
} from './testUtils'

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
      ['1'],
      ['2'],
      ['3'], // move first row before this one
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveRows(0, 0, 1, 2)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo - moving columns', () => {
  it('works', () => {
    const sheet = [
      ['1', '2', '3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.moveColumns(0, 0, 1, 2)

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
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
    engine.removeSheet("Sheet1")

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([]))
  })

  it('works with restoring simple values', () => {
    const sheet = [
      ['1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeSheet("Sheet1")

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works with restoring formulas', () => {
    const sheet = [
      ['=42'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeSheet("Sheet1")

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('restores original sheet name', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.removeSheet("shEEt1")

    engine.undo()

    expect(engine.getSheetName(0)).toEqual("Sheet1")
  })

  it('restores dependent cell formulas', () => {
    const sheets = {
      Sheet1: [['=Sheet2!A1']],
      Sheet2: [['42']],
    }
    const engine = HyperFormula.buildFromSheets(sheets)
    engine.removeSheet("Sheet2")

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
    engine.removeSheet("Sheet2")

    engine.undo()
    engine.resumeEvaluation()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(sheets))
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
    engine.addSheet("SomeSheet")

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([]))
  })
})

describe('Undo - clearing sheet', () => {
  it('works for empty sheet', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.clearSheet("Sheet1")

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([]))
  })

  it('works with restoring simple values', () => {
    const sheet = [
      ['1'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.clearSheet("Sheet1")

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works with restoring formulas', () => {
    const sheet = [
      ['=42'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.clearSheet("Sheet1")

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})

describe('Undo', () => {
  it('when there is no operation to undo', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.undo()
    }).toThrowError(new NoOperationToUndo())
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
})

describe('Redo - removing sheet', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])
    engine.removeSheet("Sheet1")
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })
})

describe('Redo - adding sheet', () => {
  it('works for basic case', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet("SomeSheet")
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(1)).toEqual("SomeSheet")
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })

  it('works for automatic naming', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet()
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expect(engine.getSheetName(1)).toEqual("Sheet2")
    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
  })
})

describe('Redo - clearing sheet', () => {
  it('works', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])
    engine.clearSheet("Sheet1")
    const snapshot = engine.getAllSheetsSerialized()
    engine.undo()

    engine.redo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromSheets(snapshot))
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
})

describe('Redo', () => {
  it('when there is no operation to redo', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.redo()
    }).toThrowError(new NoOperationToRedo())
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
