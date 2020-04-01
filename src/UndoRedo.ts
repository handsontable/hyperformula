/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {simpleCellAddress, SimpleCellAddress, NoErrorCellValue} from './Cell'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {RawCellContent} from './CellContentParser'
import {RowsRemoval, RemoveRowsCommand, RowsAddition, AddRowsCommand} from './Operations'
import {CrudOperations} from './CrudOperations'

enum UndoStackElementType {
  REMOVE_ROWS = 'REMOVE_ROWS',
  ADD_ROWS = 'ADD_ROWS',
  MOVE_ROWS = 'MOVE_ROWS',
  SET_CELL_CONTENTS = 'SET_CELL_CONTENTS',
  ADD_SHEET = 'ADD_SHEET',
  REMOVE_SHEET = 'REMOVE_SHEET',
}

interface RemoveRowsUndoData {
  type: UndoStackElementType.REMOVE_ROWS,
  sheet: number,
  rowsRemovals: RowsRemoval[],
}

interface AddRowsUndoData {
  type: UndoStackElementType.ADD_ROWS,
  sheet: number,
  rowsAdditions: RowsAddition[],
}

interface MoveRowsUndoData {
  type: UndoStackElementType.MOVE_ROWS,
  sheet: number,
  startRow: number,
  numberOfRows: number,
  targetRow: number,
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
}

interface SetCellContentsUndoData {
  type: UndoStackElementType.SET_CELL_CONTENTS,
  cellContents: {
    address: SimpleCellAddress,
    newContent: RawCellContent,
    oldContent: NoErrorCellValue,
  }[],
}

type UndoStackElement
  = RemoveRowsUndoData
  | AddRowsUndoData
  | MoveRowsUndoData
  | SetCellContentsUndoData
  | AddSheetUndoData
  | RemoveSheetUndoData

export class UndoRedo {

  constructor() {
  }

  public readonly undoStack: UndoStackElement[] = []
  public readonly redoStack: UndoStackElement[] = []
  public crudOperations?: CrudOperations

  public oldData: Map<number, [SimpleCellAddress, string][]> = new Map()

  public saveOperationRemoveRows(removeRowsCommand: RemoveRowsCommand, rowsRemovals: RowsRemoval[]) {
    this.undoStack.push({ type: UndoStackElementType.REMOVE_ROWS, sheet: removeRowsCommand.sheet, rowsRemovals })
  }

  public saveOperationAddRows(addRowsCommand: AddRowsCommand, rowsAdditions: RowsAddition[]) {
    this.undoStack.push({ type: UndoStackElementType.ADD_ROWS, sheet: addRowsCommand.sheet, rowsAdditions })
  }

  public saveOperationMoveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): void {
    this.undoStack.push({ type: UndoStackElementType.MOVE_ROWS, sheet, startRow, numberOfRows, targetRow })
  }

  public saveOperationSetCellContents(cellContents: { address: SimpleCellAddress, newContent: RawCellContent, oldContent: NoErrorCellValue }[]) {
    this.undoStack.push({ type: UndoStackElementType.SET_CELL_CONTENTS, cellContents })
  }

  public saveOperationRemoveSheet(sheetName: string, sheetId: number, oldSheetContent: ClipboardCell[][]): void {
    this.undoStack.push({ type: UndoStackElementType.REMOVE_SHEET, sheetName, sheetId, oldSheetContent })
  }

  public saveOperationAddSheet(sheetName: string): void {
    this.undoStack.push({ type: UndoStackElementType.ADD_SHEET, sheetName })
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

      const oldDataToRestore = this.oldData.get(rowsRemoval.version - 1) || []
      for (const entryToRestore of oldDataToRestore) {
        const [ address, hash ] = entryToRestore
        this.crudOperations!.operations.setFormulaToCellFromCache(hash, address)
      }
    }
  }

  private undoAddRows(operation: AddRowsUndoData) {
    const { sheet, rowsAdditions } = operation
    for (let i = rowsAdditions.length - 1; i >= 0; --i) {
      const rowsAddition = rowsAdditions[i]
      this.crudOperations!.operations.removeRows(new RemoveRowsCommand(sheet, [[rowsAddition.afterRow, rowsAddition.rowCount]]))
    }
  }

  private undoSetCellContents(operation: SetCellContentsUndoData) {
    for (const cellContentData of operation.cellContents) {
      this.crudOperations!.operations.setCellContent(cellContentData.address, cellContentData.oldContent)
    }
  }

  private undoMoveRows(operation: MoveRowsUndoData) {
    const { sheet } = operation
    this.crudOperations!.operations.moveRows(sheet, operation.targetRow - operation.numberOfRows, operation.numberOfRows, operation.startRow)
  }

  private undoAddSheet(operation: AddSheetUndoData) {
    const { sheetName } = operation
    this.crudOperations!.operations.removeSheet(sheetName)
  }

  private undoRemoveSheet(operation: RemoveSheetUndoData) {
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
    }

    this.undoStack.push(operation)
  }

  private redoRemoveRows(operation: RemoveRowsUndoData) {
    const { sheet, rowsRemovals } = operation
    for (const rowsRemoval of rowsRemovals) {
      this.crudOperations!.operations.removeRows(new RemoveRowsCommand(sheet, [[rowsRemoval.rowFrom, rowsRemoval.rowCount]]))
    }
  }

  private redoSetCellContents(operation: SetCellContentsUndoData) {
    for (const cellContentData of operation.cellContents) {
      this.crudOperations!.operations.setCellContent(cellContentData.address, cellContentData.newContent)
    }
  }

  private redoAddRows(operation: AddRowsUndoData) {
    const { sheet, rowsAdditions } = operation
    for (const rowsAddition of rowsAdditions) {
      this.crudOperations!.operations.addRows(new AddRowsCommand(sheet, [[rowsAddition.afterRow, rowsAddition.rowCount]]))
    }
  }

  private redoRemoveSheet(operation: RemoveSheetUndoData) {
    const { sheetName } = operation
    this.crudOperations!.operations.removeSheet(sheetName)
  }

  private redoAddSheet(operation: AddSheetUndoData) {
    const { sheetName } = operation
    this.crudOperations!.operations.addSheet(sheetName)
  }
}
