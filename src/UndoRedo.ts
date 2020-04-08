/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {simpleCellAddress, SimpleCellAddress, NoErrorCellValue} from './Cell'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {RawCellContent} from './CellContentParser'
import {RemoveColumnsCommand, AddColumnsCommand, RowsRemoval, ColumnsRemoval, RemoveRowsCommand, AddRowsCommand} from './Operations'
import {CrudOperations} from './CrudOperations'

enum UndoStackElementType {
  REMOVE_ROWS = 'REMOVE_ROWS',
  ADD_ROWS = 'ADD_ROWS',
  MOVE_ROWS = 'MOVE_ROWS',
  ADD_COLUMNS = 'ADD_COLUMNS',
  REMOVE_COLUMNS = 'REMOVE_COLUMNS',
  MOVE_COLUMNS = 'MOVE_COLUMNS',
  SET_CELL_CONTENTS = 'SET_CELL_CONTENTS',
  ADD_SHEET = 'ADD_SHEET',
  REMOVE_SHEET = 'REMOVE_SHEET',
  CLEAR_SHEET = 'CLEAR_SHEET',
  MOVE_CELLS = 'MOVE_CELLS',
  SET_SHEET_CONTENT = 'SET_SHEET_CONTENT',
  PASTE = 'PASTE',
}

interface RemoveRowsUndoData {
  type: UndoStackElementType.REMOVE_ROWS,
  sheet: number,
  rowsRemovals: RowsRemoval[],
}

interface MoveCellsUndoData {
  type: UndoStackElementType.MOVE_CELLS,
  sourceLeftCorner: SimpleCellAddress,
  width: number,
  height: number,
  destinationLeftCorner: SimpleCellAddress,
  overwrittenCellsData: [SimpleCellAddress, ClipboardCell][],
  version: number,
}

interface AddRowsUndoData {
  type: UndoStackElementType.ADD_ROWS,
  command: AddRowsCommand,
}

interface SetSheetContentUndoData {
  type: UndoStackElementType.SET_SHEET_CONTENT,
  sheetId: number,
  oldSheetContent: ClipboardCell[][],
  newSheetContent: RawCellContent[][],
}

interface MoveRowsUndoData {
  type: UndoStackElementType.MOVE_ROWS,
  sheet: number,
  startRow: number,
  numberOfRows: number,
  targetRow: number,
}

interface MoveColumnsUndoData {
  type: UndoStackElementType.MOVE_COLUMNS,
  sheet: number,
  startColumn: number,
  numberOfColumns: number,
  targetColumn: number,
}

interface AddColumnsUndoData {
  type: UndoStackElementType.ADD_COLUMNS,
  command: AddColumnsCommand,
}

interface RemoveColumnsUndoData {
  type: UndoStackElementType.REMOVE_COLUMNS,
  sheet: number,
  columnsRemovals: ColumnsRemoval[],
}

interface AddSheetUndoData {
  type: UndoStackElementType.ADD_SHEET,
  sheetName: string,
}

interface RemoveSheetUndoData {
  type: UndoStackElementType.REMOVE_SHEET,
  sheetName: string,
  sheetId: number,
  oldSheetContent: ClipboardCell[][],
  version: number,
}

interface ClearSheetUndoData {
  type: UndoStackElementType.CLEAR_SHEET,
  sheetId: number,
  oldSheetContent: ClipboardCell[][],
}

interface SetCellContentsUndoData {
  type: UndoStackElementType.SET_CELL_CONTENTS,
  cellContents: {
    address: SimpleCellAddress,
    newContent: RawCellContent,
    oldContent: ClipboardCell,
  }[],
}

interface PasteUndoData {
  type: UndoStackElementType.PASTE,
  targetLeftCorner: SimpleCellAddress,
  oldContent: [SimpleCellAddress, ClipboardCell][],
  newContent: ClipboardCell[][],
}

type UndoStackElement
  = RemoveRowsUndoData
  | AddRowsUndoData
  | MoveRowsUndoData
  | MoveColumnsUndoData
  | AddColumnsUndoData
  | RemoveColumnsUndoData
  | SetCellContentsUndoData
  | AddSheetUndoData
  | RemoveSheetUndoData
  | ClearSheetUndoData
  | MoveCellsUndoData
  | SetSheetContentUndoData
  | PasteUndoData

export class UndoRedo {
  public readonly undoStack: UndoStackElement[] = []
  public readonly redoStack: UndoStackElement[] = []
  public crudOperations?: CrudOperations

  public oldData: Map<number, [SimpleCellAddress, string][]> = new Map()

  public saveOperationAddColumns(addColumnsCommand: AddColumnsCommand) {
    this.undoStack.push({ type: UndoStackElementType.ADD_COLUMNS, command: addColumnsCommand })
  }

  public saveOperationMoveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress, overwrittenCellsData: [SimpleCellAddress, ClipboardCell][], version: number) {
    this.undoStack.push({ type: UndoStackElementType.MOVE_CELLS, sourceLeftCorner, width, height, destinationLeftCorner, overwrittenCellsData, version })
  }

  public saveOperationRemoveColumns(removeColumnsCommand: RemoveColumnsCommand, columnsRemovals: ColumnsRemoval[]) {
    this.undoStack.push({ type: UndoStackElementType.REMOVE_COLUMNS, sheet: removeColumnsCommand.sheet, columnsRemovals })
  }

  public saveOperationRemoveRows(removeRowsCommand: RemoveRowsCommand, rowsRemovals: RowsRemoval[]) {
    this.undoStack.push({ type: UndoStackElementType.REMOVE_ROWS, sheet: removeRowsCommand.sheet, rowsRemovals })
  }

  public saveOperationAddRows(addRowsCommand: AddRowsCommand) {
    this.undoStack.push({ type: UndoStackElementType.ADD_ROWS, command: addRowsCommand })
  }

  public saveOperationMoveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): void {
    this.undoStack.push({ type: UndoStackElementType.MOVE_ROWS, sheet, startRow, numberOfRows, targetRow })
  }

  public saveOperationMoveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): void {
    this.undoStack.push({ type: UndoStackElementType.MOVE_COLUMNS, sheet, startColumn, numberOfColumns, targetColumn })
  }

  public saveOperationSetCellContents(cellContents: { address: SimpleCellAddress, newContent: RawCellContent, oldContent: ClipboardCell }[]) {
    this.undoStack.push({ type: UndoStackElementType.SET_CELL_CONTENTS, cellContents })
  }

  public saveOperationPaste(targetLeftCorner: SimpleCellAddress, newContent: ClipboardCell[][], oldContent: [SimpleCellAddress, ClipboardCell][]) {
    this.undoStack.push({ type: UndoStackElementType.PASTE, targetLeftCorner, oldContent, newContent })
  }

  public saveOperationRemoveSheet(sheetName: string, sheetId: number, oldSheetContent: ClipboardCell[][], version: number): void {
    this.undoStack.push({ type: UndoStackElementType.REMOVE_SHEET, sheetName, sheetId, oldSheetContent, version })
  }

  public saveOperationAddSheet(sheetName: string): void {
    this.undoStack.push({ type: UndoStackElementType.ADD_SHEET, sheetName })
  }

  public saveOperationClearSheet(sheetId: number, oldSheetContent: ClipboardCell[][]) {
    this.undoStack.push({ type: UndoStackElementType.CLEAR_SHEET, sheetId, oldSheetContent })
  }

  public saveOperationSetSheetContent(sheetId: number, oldSheetContent: ClipboardCell[][], newSheetContent: RawCellContent[][]) {
    this.undoStack.push({ type: UndoStackElementType.SET_SHEET_CONTENT, sheetId, oldSheetContent, newSheetContent })
  }

  public storeDataForVersion(version: number, address: SimpleCellAddress, astHash: string) {
    if (!this.oldData.has(version)) {
      this.oldData.set(version, [])
    }
    const currentOldData = this.oldData.get(version)!
    currentOldData.push([address, astHash])
  }

  public isUndoStackEmpty(): boolean {
    return this.undoStack.length === 0
  }

  public isRedoStackEmpty(): boolean {
    return this.redoStack.length === 0
  }

  public undo() {
    const operation = this.undoStack.pop()
    if (!operation) {
      throw 'Attempted to undo without operation on stack'
    }

    switch(operation.type) {
      case UndoStackElementType.REMOVE_ROWS: {
        this.undoRemoveRows(operation)
        break
      }
      case UndoStackElementType.ADD_ROWS: {
        this.undoAddRows(operation)
        break
      }
      case UndoStackElementType.SET_CELL_CONTENTS: {
        this.undoSetCellContents(operation)
        break
      }
      case UndoStackElementType.MOVE_ROWS: {
        this.undoMoveRows(operation)
        break
      }
      case UndoStackElementType.ADD_SHEET: {
        this.undoAddSheet(operation)
        break
      }
      case UndoStackElementType.REMOVE_SHEET: {
        this.undoRemoveSheet(operation)
        break
      }
      case UndoStackElementType.CLEAR_SHEET: {
        this.undoClearSheet(operation)
        break
      }
      case UndoStackElementType.ADD_COLUMNS: {
        this.undoAddColumns(operation)
        break
      }
      case UndoStackElementType.REMOVE_COLUMNS: {
        this.undoRemoveColumns(operation)
        break
      }
      case UndoStackElementType.MOVE_COLUMNS: {
        this.undoMoveColumns(operation)
        break
      }
      case UndoStackElementType.MOVE_CELLS: {
        this.undoMoveCells(operation)
        break
      }
      case UndoStackElementType.SET_SHEET_CONTENT: {
        this.undoSetSheetContent(operation)
        break
      }
      case UndoStackElementType.PASTE: {
        this.undoPaste(operation)
        break
      }
    }
    this.redoStack.push(operation)
  }

  private undoRemoveRows(operation: RemoveRowsUndoData) {
    this.crudOperations!.operations.forceApplyPostponedTransformations()

    const { sheet, rowsRemovals } = operation
    for (let i = rowsRemovals.length - 1; i >= 0; --i) {
      const rowsRemoval = rowsRemovals[i]
      this.crudOperations!.operations.addRows(new AddRowsCommand(sheet, [[rowsRemoval.rowFrom, rowsRemoval.rowCount]]))

      for (const { address, cellType } of rowsRemoval.removedCells) {
        this.crudOperations!.operations.restoreCell(address, cellType)
      }

      this.restoreOldDataFromVersion(rowsRemoval.version - 1)
    }
  }

  private undoRemoveColumns(operation: RemoveColumnsUndoData) {
    this.crudOperations!.operations.forceApplyPostponedTransformations()

    const { sheet, columnsRemovals } = operation
    for (let i = columnsRemovals.length - 1; i >= 0; --i) {
      const columnsRemoval = columnsRemovals[i]
      this.crudOperations!.operations.addColumns(new AddColumnsCommand(sheet, [[columnsRemoval.columnFrom, columnsRemoval.columnCount]]))

      for (const { address, cellType } of columnsRemoval.removedCells) {
        this.crudOperations!.operations.restoreCell(address, cellType)
      }

      this.restoreOldDataFromVersion(columnsRemoval.version - 1)
    }
  }

  private undoAddRows(operation: AddRowsUndoData) {
    const addedRowsSpans = operation.command.rowsSpans()
    for (let i = addedRowsSpans.length - 1; i >= 0; --i) {
      const addedRows = addedRowsSpans[i]
      this.crudOperations!.operations.removeRows(new RemoveRowsCommand(operation.command.sheet, [[addedRows.rowStart, addedRows.numberOfRows]]))
    }
  }

  private undoAddColumns(operation: AddColumnsUndoData) {
    const addedColumnsSpans = operation.command.columnsSpans()
    for (let i = addedColumnsSpans.length - 1; i >= 0; --i) {
      const addedColumns = addedColumnsSpans[i]
      this.crudOperations!.operations.removeColumns(new RemoveColumnsCommand(operation.command.sheet, [[addedColumns.columnStart, addedColumns.numberOfColumns]]))
    }
  }

  private undoSetCellContents(operation: SetCellContentsUndoData) {
    for (const cellContentData of operation.cellContents) {
      this.crudOperations!.operations.restoreCell(cellContentData.address, cellContentData.oldContent)
    }
  }

  private undoPaste(operation: PasteUndoData) {
    for (const [address, clipboardCell] of operation.oldContent) {
      this.crudOperations!.operations.restoreCell(address, clipboardCell)
    }
  }

  private undoMoveRows(operation: MoveRowsUndoData) {
    const { sheet } = operation
    this.crudOperations!.operations.moveRows(sheet, operation.targetRow - operation.numberOfRows, operation.numberOfRows, operation.startRow)
  }

  private undoMoveColumns(operation: MoveColumnsUndoData) {
    const { sheet } = operation
    this.crudOperations!.operations.moveColumns(sheet, operation.targetColumn - operation.numberOfColumns, operation.numberOfColumns, operation.startColumn)
  }

  public undoMoveCells(operation: MoveCellsUndoData): void {
    this.crudOperations!.operations.forceApplyPostponedTransformations()
    this.crudOperations!.operations.moveCells(operation.destinationLeftCorner, operation.width, operation.height, operation.sourceLeftCorner)

    for (const [ address, clipboardCell ] of operation.overwrittenCellsData) {
      this.crudOperations!.operations.restoreCell(address, clipboardCell)
    }

    this.restoreOldDataFromVersion(operation.version - 1)
  }

  private undoAddSheet(operation: AddSheetUndoData) {
    const { sheetName } = operation
    this.crudOperations!.operations.removeSheet(sheetName)
  }

  private undoRemoveSheet(operation: RemoveSheetUndoData) {
    this.crudOperations!.operations.forceApplyPostponedTransformations()
    const { oldSheetContent, sheetId } = operation
    this.crudOperations!.operations.addSheet(operation.sheetName)
    for (let rowIndex = 0; rowIndex < oldSheetContent.length; rowIndex++) {
      const row = oldSheetContent[rowIndex]
      for (let col = 0; col < row.length; col++) {
        const cellType = row[col]
        const address = simpleCellAddress(sheetId, col, rowIndex)
        this.crudOperations!.operations.restoreCell(address, cellType)
      }
    }

    this.restoreOldDataFromVersion(operation.version - 1)
  }

  private undoClearSheet(operation: ClearSheetUndoData) {
    const { oldSheetContent, sheetId } = operation
    for (let rowIndex = 0; rowIndex < oldSheetContent.length; rowIndex++) {
      const row = oldSheetContent[rowIndex]
      for (let col = 0; col < row.length; col++) {
        const cellType = row[col]
        const address = simpleCellAddress(sheetId, col, rowIndex)
        this.crudOperations!.operations.restoreCell(address, cellType)
      }
    }
  }

  private undoSetSheetContent(operation: SetSheetContentUndoData) {
    const { oldSheetContent, newSheetContent, sheetId } = operation
    this.crudOperations!.operations.clearSheet(sheetId)
    for (let rowIndex = 0; rowIndex < oldSheetContent.length; rowIndex++) {
      const row = oldSheetContent[rowIndex]
      for (let col = 0; col < row.length; col++) {
        const cellType = row[col]
        const address = simpleCellAddress(sheetId, col, rowIndex)
        this.crudOperations!.operations.restoreCell(address, cellType)
      }
    }
  }

  public redo() {
    const operation = this.redoStack.pop()

    if (!operation) {
      throw 'Attempted to redo without operation on stack'
    }

    switch(operation.type) {
      case UndoStackElementType.REMOVE_ROWS: {
        this.redoRemoveRows(operation)
        break
      }
      case UndoStackElementType.ADD_ROWS: {
        this.redoAddRows(operation)
        break
      }
      case UndoStackElementType.MOVE_ROWS: {
        this.redoMoveRows(operation)
        break
      }
      case UndoStackElementType.MOVE_COLUMNS: {
        this.redoMoveColumns(operation)
        break
      }
      case UndoStackElementType.SET_CELL_CONTENTS: {
        this.redoSetCellContents(operation)
        break
      }
      case UndoStackElementType.ADD_SHEET: {
        this.redoAddSheet(operation)
        break
      }
      case UndoStackElementType.REMOVE_SHEET: {
        this.redoRemoveSheet(operation)
        break
      }
      case UndoStackElementType.CLEAR_SHEET: {
        this.redoClearSheet(operation)
        break
      }
      case UndoStackElementType.ADD_COLUMNS: {
        this.redoAddColumns(operation)
        break
      }
      case UndoStackElementType.REMOVE_COLUMNS: {
        this.redoRemoveColumns(operation)
        break
      }
      case UndoStackElementType.MOVE_CELLS: {
        this.redoMoveCells(operation)
        break
      }
      case UndoStackElementType.SET_SHEET_CONTENT: {
        this.redoSetSheetContent(operation)
        break
      }
      case UndoStackElementType.PASTE: {
        this.redoPaste(operation)
        break
      }
    }

    this.undoStack.push(operation)
  }

  private redoRemoveRows(operation: RemoveRowsUndoData) {
    const { sheet, rowsRemovals } = operation
    for (const rowsRemoval of rowsRemovals) {
      this.crudOperations!.operations.removeRows(new RemoveRowsCommand(sheet, [[rowsRemoval.rowFrom, rowsRemoval.rowCount]]))
    }
  }

  private redoMoveCells(operation: MoveCellsUndoData) {
    this.crudOperations!.operations.moveCells(operation.sourceLeftCorner, operation.width, operation.height, operation.destinationLeftCorner)
  }

  private redoRemoveColumns(operation: RemoveColumnsUndoData) {
    const { sheet, columnsRemovals } = operation
    for (const columnsRemoval of columnsRemovals) {
      this.crudOperations!.operations.removeColumns(new RemoveColumnsCommand(sheet, [[columnsRemoval.columnFrom, columnsRemoval.columnCount]]))
    }
  }

  private redoPaste(operation: PasteUndoData) {
    const { targetLeftCorner, newContent } = operation
    const height = newContent.length
    const width = newContent[0].length
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const address = simpleCellAddress(targetLeftCorner.sheet, targetLeftCorner.col + x, targetLeftCorner.row + y)
        this.crudOperations!.operations.restoreCell(address, newContent[y][x])
      }
    }
  }

  private redoSetCellContents(operation: SetCellContentsUndoData) {
    for (const cellContentData of operation.cellContents) {
      this.crudOperations!.operations.setCellContent(cellContentData.address, cellContentData.newContent)
    }
  }

  private redoAddRows(operation: AddRowsUndoData) {
    this.crudOperations!.operations.addRows(operation.command)
  }

  private redoAddColumns(operation: AddColumnsUndoData) {
    this.crudOperations!.operations.addColumns(operation.command)
  }

  private redoRemoveSheet(operation: RemoveSheetUndoData) {
    const { sheetName } = operation
    this.crudOperations!.operations.removeSheet(sheetName)
  }

  private redoAddSheet(operation: AddSheetUndoData) {
    const { sheetName } = operation
    this.crudOperations!.operations.addSheet(sheetName)
  }

  private redoMoveRows(operation: MoveRowsUndoData) {
    const { sheet } = operation
    this.crudOperations!.operations.moveRows(sheet, operation.startRow, operation.numberOfRows, operation.targetRow)
  }

  private redoMoveColumns(operation: MoveColumnsUndoData) {
    const { sheet } = operation
    this.crudOperations!.operations.moveColumns(sheet, operation.startColumn, operation.numberOfColumns, operation.targetColumn)
  }

  private redoClearSheet(operation: ClearSheetUndoData) {
    const { sheetId } = operation
    this.crudOperations!.operations.clearSheet(sheetId)
  }

  private redoSetSheetContent(operation: SetSheetContentUndoData) {
    const { sheetId, newSheetContent } = operation
    this.crudOperations!.operations.clearSheet(sheetId)
    for (let row = 0; row < newSheetContent.length; row++) {
      for (let col = 0; col < newSheetContent[row].length; col++) {
        const address = simpleCellAddress(sheetId, col, row)
        this.crudOperations!.operations.setCellContent(address, newSheetContent[row][col])
      }
    }
  }

  private restoreOldDataFromVersion(version: number) {
    const oldDataToRestore = this.oldData.get(version) || []
    for (const entryToRestore of oldDataToRestore) {
      const [ address, hash ] = entryToRestore
      this.crudOperations!.operations.setFormulaToCellFromCache(hash, address)
    }
  }
}
