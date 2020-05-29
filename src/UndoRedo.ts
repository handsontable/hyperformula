/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {simpleCellAddress, SimpleCellAddress} from './Cell'
import {ClipboardCell} from './ClipboardOperations'
import {RawCellContent} from './CellContentParser'
import {
  AddColumnsCommand,
  AddRowsCommand,
  ColumnsRemoval,
  Operations,
  RemoveColumnsCommand,
  RemoveRowsCommand,
  RowsRemoval
} from './Operations'
import {Config} from './Config'
import {NamedExpression} from './NamedExpressions'

export class RemoveRowsUndoEntry {
  constructor(
    public readonly command: RemoveRowsCommand,
    public readonly rowsRemovals: RowsRemoval[],
  ) {
  }
}

export class MoveCellsUndoEntry {
  constructor(
    public readonly sourceLeftCorner: SimpleCellAddress,
    public readonly width: number,
    public readonly height: number,
    public readonly destinationLeftCorner: SimpleCellAddress,
    public readonly overwrittenCellsData: [SimpleCellAddress, ClipboardCell][],
    public readonly addedGlobalNamedExpressions: string[],
    public readonly version: number,
  ) {
  }
}

export class AddRowsUndoEntry {
  constructor(
    public readonly command: AddRowsCommand,
  ) {
  }
}

export class SetSheetContentUndoEntry {
  constructor(
    public readonly sheetId: number,
    public readonly oldSheetContent: ClipboardCell[][],
    public readonly newSheetContent: RawCellContent[][],
  ) {
  }
}

export class MoveRowsUndoEntry {
  constructor(
    public readonly sheet: number,
    public readonly startRow: number,
    public readonly numberOfRows: number,
    public readonly targetRow: number,
  ) {
  }
}

export class MoveColumnsUndoEntry {
  constructor(
    public readonly sheet: number,
    public readonly startColumn: number,
    public readonly numberOfColumns: number,
    public readonly targetColumn: number,
  ) {
  }
}

export class AddColumnsUndoEntry {
  constructor(
    public readonly command: AddColumnsCommand,
  ) {
  }
}

export class RemoveColumnsUndoEntry {
  constructor(
    public readonly command: RemoveColumnsCommand,
    public readonly columnsRemovals: ColumnsRemoval[],
  ) {
  }
}

export class AddSheetUndoEntry {
  constructor(
    public readonly sheetName: string,
  ) {
  }
}

export class RemoveSheetUndoEntry {
  constructor(
    public readonly sheetName: string,
    public readonly sheetId: number,
    public readonly oldSheetContent: ClipboardCell[][],
    public readonly version: number,
  ) {
  }
}

export class ClearSheetUndoEntry {
  constructor(
    public readonly sheetId: number,
    public readonly oldSheetContent: ClipboardCell[][],
  ) {
  }
}

export class SetCellContentsUndoEntry {
  constructor(
    public readonly cellContents: {
      address: SimpleCellAddress,
      newContent: RawCellContent,
      oldContent: ClipboardCell,
    }[],
  ) {
  }
}

export class PasteUndoEntry {
  constructor(
    public readonly targetLeftCorner: SimpleCellAddress,
    public readonly oldContent: [SimpleCellAddress, ClipboardCell][],
    public readonly newContent: ClipboardCell[][],
    public readonly addedGlobalNamedExpressions: string[],
  ) {
  }
}

export class AddNamedExpressionUndoEntry {
  constructor(
    public readonly name: string,
    public readonly newContent: RawCellContent,
    public readonly scope?: number,
  ) {
  }
}

export class RemoveNamedExpressionUndoEntry {
  constructor(
    public readonly namedExpression: NamedExpression,
    public readonly content: ClipboardCell,
    public readonly scope?: number
  ) {
  }
}

export class ChangeNamedExpressionUndoEntry {
  constructor(
    public readonly namedExpression: NamedExpression,
    public readonly newContent: RawCellContent,
    public readonly oldContent: ClipboardCell,
    public readonly scope?: number
  ) {
  }
}

export class BatchUndoEntry {
  public readonly operations: UndoStackEntry[] = []

  public add(operation: UndoStackEntry) {
    this.operations.push(operation)
  }

  public* reversedOperations() {
    for (let i = this.operations.length - 1; i >= 0; i--) {
      yield this.operations[i]
    }
  }
}

type UndoStackEntry
  = RemoveRowsUndoEntry
  | AddRowsUndoEntry
  | MoveRowsUndoEntry
  | MoveColumnsUndoEntry
  | AddColumnsUndoEntry
  | RemoveColumnsUndoEntry
  | SetCellContentsUndoEntry
  | AddSheetUndoEntry
  | RemoveSheetUndoEntry
  | ClearSheetUndoEntry
  | MoveCellsUndoEntry
  | SetSheetContentUndoEntry
  | PasteUndoEntry
  | BatchUndoEntry
  | AddNamedExpressionUndoEntry
  | RemoveNamedExpressionUndoEntry
  | ChangeNamedExpressionUndoEntry

export class UndoRedo {
  private readonly undoStack: UndoStackEntry[] = []
  private redoStack: UndoStackEntry[] = []
  private readonly undoLimit: number
  private batchUndoEntry?: BatchUndoEntry

  constructor(
    config: Config,
    public readonly operations: Operations,
  ) {
    this.undoLimit = config.undoLimit
  }

  public oldData: Map<number, [SimpleCellAddress, string][]> = new Map()

  public saveOperation(operation: UndoStackEntry) {
    if (this.batchUndoEntry !== undefined) {
      this.batchUndoEntry.add(operation)
    } else {
      this.addUndoEntry(operation)
    }
  }

  public beginBatchMode() {
    this.batchUndoEntry = new BatchUndoEntry()
  }

  private addUndoEntry(operation: UndoStackEntry) {
    this.undoStack.push(operation)
    this.undoStack.splice(0, Math.max(0, this.undoStack.length - this.undoLimit))
  }

  public commitBatchMode() {
    if (this.batchUndoEntry === undefined) {
      throw 'Batch mode wasn\'t started'
    }
    this.addUndoEntry(this.batchUndoEntry)
    this.batchUndoEntry = undefined
  }

  public storeDataForVersion(version: number, address: SimpleCellAddress, astHash: string) {
    if (!this.oldData.has(version)) {
      this.oldData.set(version, [])
    }
    const currentOldData = this.oldData.get(version)!
    currentOldData.push([address, astHash])
  }

  public clearRedoStack() {
    this.redoStack = []
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

    this.undoEntry(operation)

    this.redoStack.push(operation)
  }

  private undoEntry(operation: UndoStackEntry) {
    if (operation instanceof RemoveRowsUndoEntry) {
      this.undoRemoveRows(operation)
    } else if (operation instanceof AddRowsUndoEntry) {
      this.undoAddRows(operation)
    } else if (operation instanceof SetCellContentsUndoEntry) {
      this.undoSetCellContents(operation)
    } else if (operation instanceof MoveRowsUndoEntry) {
      this.undoMoveRows(operation)
    } else if (operation instanceof AddSheetUndoEntry) {
      this.undoAddSheet(operation)
    } else if (operation instanceof RemoveSheetUndoEntry) {
      this.undoRemoveSheet(operation)
    } else if (operation instanceof ClearSheetUndoEntry) {
      this.undoClearSheet(operation)
    } else if (operation instanceof AddColumnsUndoEntry) {
      this.undoAddColumns(operation)
    } else if (operation instanceof RemoveColumnsUndoEntry) {
      this.undoRemoveColumns(operation)
    } else if (operation instanceof MoveColumnsUndoEntry) {
      this.undoMoveColumns(operation)
    } else if (operation instanceof MoveCellsUndoEntry) {
      this.undoMoveCells(operation)
    } else if (operation instanceof SetSheetContentUndoEntry) {
      this.undoSetSheetContent(operation)
    } else if (operation instanceof PasteUndoEntry) {
      this.undoPaste(operation)
    } else if (operation instanceof BatchUndoEntry) {
      this.undoBatch(operation)
    } else if (operation instanceof AddNamedExpressionUndoEntry) {
      this.undoAddNamedExpression(operation)
    } else if (operation instanceof RemoveNamedExpressionUndoEntry) {
      this.undoRemoveNamedExpression(operation)
    } else if (operation instanceof ChangeNamedExpressionUndoEntry) {
      this.undoChangeNamedExpression(operation)
    } else {
      throw 'Unknown element'
    }
  }

  private undoBatch(batchOperation: BatchUndoEntry) {
    for (const operation of batchOperation.reversedOperations()) {
      this.undoEntry(operation)
    }
  }

  private undoRemoveRows(operation: RemoveRowsUndoEntry) {
    this.operations.forceApplyPostponedTransformations()

    const {command: {sheet}, rowsRemovals} = operation
    for (let i = rowsRemovals.length - 1; i >= 0; --i) {
      const rowsRemoval = rowsRemovals[i]
      this.operations.addRows(new AddRowsCommand(sheet, [[rowsRemoval.rowFrom, rowsRemoval.rowCount]]))

      for (const {address, cellType} of rowsRemoval.removedCells) {
        this.operations.restoreCell(address, cellType)
      }

      this.restoreOldDataFromVersion(rowsRemoval.version - 1)
    }
  }

  private undoRemoveColumns(operation: RemoveColumnsUndoEntry) {
    this.operations.forceApplyPostponedTransformations()

    const {command: {sheet}, columnsRemovals} = operation
    for (let i = columnsRemovals.length - 1; i >= 0; --i) {
      const columnsRemoval = columnsRemovals[i]
      this.operations.addColumns(new AddColumnsCommand(sheet, [[columnsRemoval.columnFrom, columnsRemoval.columnCount]]))

      for (const {address, cellType} of columnsRemoval.removedCells) {
        this.operations.restoreCell(address, cellType)
      }

      this.restoreOldDataFromVersion(columnsRemoval.version - 1)
    }
  }

  private undoAddRows(operation: AddRowsUndoEntry) {
    const addedRowsSpans = operation.command.rowsSpans()
    for (let i = addedRowsSpans.length - 1; i >= 0; --i) {
      const addedRows = addedRowsSpans[i]
      this.operations.removeRows(new RemoveRowsCommand(operation.command.sheet, [[addedRows.rowStart, addedRows.numberOfRows]]))
    }
  }

  private undoAddColumns(operation: AddColumnsUndoEntry) {
    const addedColumnsSpans = operation.command.columnsSpans()
    for (let i = addedColumnsSpans.length - 1; i >= 0; --i) {
      const addedColumns = addedColumnsSpans[i]
      this.operations.removeColumns(new RemoveColumnsCommand(operation.command.sheet, [[addedColumns.columnStart, addedColumns.numberOfColumns]]))
    }
  }

  private undoSetCellContents(operation: SetCellContentsUndoEntry) {
    for (const cellContentData of operation.cellContents) {
      this.operations.restoreCell(cellContentData.address, cellContentData.oldContent)
    }
  }

  private undoPaste(operation: PasteUndoEntry) {
    for (const [address, clipboardCell] of operation.oldContent) {
      this.operations.restoreCell(address, clipboardCell)
    }
    for (const namedExpression of operation.addedGlobalNamedExpressions) {
      this.operations.removeNamedExpression(namedExpression)
    }
  }

  private undoMoveRows(operation: MoveRowsUndoEntry) {
    const {sheet} = operation
    this.operations.moveRows(sheet, operation.targetRow - operation.numberOfRows, operation.numberOfRows, operation.startRow)
  }

  private undoMoveColumns(operation: MoveColumnsUndoEntry) {
    const {sheet} = operation
    this.operations.moveColumns(sheet, operation.targetColumn - operation.numberOfColumns, operation.numberOfColumns, operation.startColumn)
  }

  public undoMoveCells(operation: MoveCellsUndoEntry): void {
    this.operations.forceApplyPostponedTransformations()
    this.operations.moveCells(operation.destinationLeftCorner, operation.width, operation.height, operation.sourceLeftCorner)

    for (const [address, clipboardCell] of operation.overwrittenCellsData) {
      this.operations.restoreCell(address, clipboardCell)
    }

    this.restoreOldDataFromVersion(operation.version - 1)
    for (const namedExpression of operation.addedGlobalNamedExpressions) {
      this.operations.removeNamedExpression(namedExpression)
    }
  }

  private undoAddSheet(operation: AddSheetUndoEntry) {
    const {sheetName} = operation
    this.operations.removeSheet(sheetName)
  }

  private undoRemoveSheet(operation: RemoveSheetUndoEntry) {
    this.operations.forceApplyPostponedTransformations()
    const {oldSheetContent, sheetId} = operation
    this.operations.addSheet(operation.sheetName)
    for (let rowIndex = 0; rowIndex < oldSheetContent.length; rowIndex++) {
      const row = oldSheetContent[rowIndex]
      for (let col = 0; col < row.length; col++) {
        const cellType = row[col]
        const address = simpleCellAddress(sheetId, col, rowIndex)
        this.operations.restoreCell(address, cellType)
      }
    }

    this.restoreOldDataFromVersion(operation.version - 1)
  }

  private undoClearSheet(operation: ClearSheetUndoEntry) {
    const {oldSheetContent, sheetId} = operation
    for (let rowIndex = 0; rowIndex < oldSheetContent.length; rowIndex++) {
      const row = oldSheetContent[rowIndex]
      for (let col = 0; col < row.length; col++) {
        const cellType = row[col]
        const address = simpleCellAddress(sheetId, col, rowIndex)
        this.operations.restoreCell(address, cellType)
      }
    }
  }

  private undoSetSheetContent(operation: SetSheetContentUndoEntry) {
    const {oldSheetContent, newSheetContent, sheetId} = operation
    this.operations.clearSheet(sheetId)
    for (let rowIndex = 0; rowIndex < oldSheetContent.length; rowIndex++) {
      const row = oldSheetContent[rowIndex]
      for (let col = 0; col < row.length; col++) {
        const cellType = row[col]
        const address = simpleCellAddress(sheetId, col, rowIndex)
        this.operations.restoreCell(address, cellType)
      }
    }
  }

  private undoAddNamedExpression(operation: AddNamedExpressionUndoEntry) {
    this.operations.removeNamedExpression(operation.name, operation.scope)
  }

  private undoRemoveNamedExpression(operation: RemoveNamedExpressionUndoEntry) {
    this.operations.restoreNamedExpression(operation.namedExpression, operation.content, operation.scope)
  }

  private undoChangeNamedExpression(operation: ChangeNamedExpressionUndoEntry) {
    this.operations.restoreNamedExpression(operation.namedExpression, operation.oldContent, operation.scope)
  }

  public redo() {
    const operation = this.redoStack.pop()

    if (!operation) {
      throw 'Attempted to redo without operation on stack'
    }

    this.redoEntry(operation)

    this.undoStack.push(operation)
  }

  private redoEntry(operation: UndoStackEntry) {
    if (operation instanceof RemoveRowsUndoEntry) {
      this.redoRemoveRows(operation)
    } else if (operation instanceof RemoveRowsUndoEntry) {
      this.redoRemoveRows(operation)
    } else if (operation instanceof AddRowsUndoEntry) {
      this.redoAddRows(operation)
    } else if (operation instanceof SetCellContentsUndoEntry) {
      this.redoSetCellContents(operation)
    } else if (operation instanceof MoveRowsUndoEntry) {
      this.redoMoveRows(operation)
    } else if (operation instanceof AddSheetUndoEntry) {
      this.redoAddSheet(operation)
    } else if (operation instanceof RemoveSheetUndoEntry) {
      this.redoRemoveSheet(operation)
    } else if (operation instanceof ClearSheetUndoEntry) {
      this.redoClearSheet(operation)
    } else if (operation instanceof AddColumnsUndoEntry) {
      this.redoAddColumns(operation)
    } else if (operation instanceof RemoveColumnsUndoEntry) {
      this.redoRemoveColumns(operation)
    } else if (operation instanceof MoveColumnsUndoEntry) {
      this.redoMoveColumns(operation)
    } else if (operation instanceof MoveCellsUndoEntry) {
      this.redoMoveCells(operation)
    } else if (operation instanceof SetSheetContentUndoEntry) {
      this.redoSetSheetContent(operation)
    } else if (operation instanceof PasteUndoEntry) {
      this.redoPaste(operation)
    } else if (operation instanceof BatchUndoEntry) {
      this.redoBatch(operation)
    } else if (operation instanceof AddNamedExpressionUndoEntry) {
      this.redoAddNamedExpression(operation)
    } else if (operation instanceof RemoveNamedExpressionUndoEntry) {
      this.redoRemoveNamedExpression(operation)
    } else if (operation instanceof ChangeNamedExpressionUndoEntry) {
      this.redoChangeNamedExpression(operation)
    } else {
      throw 'Unknown element'
    }
  }

  private redoBatch(batchOperation: BatchUndoEntry) {
    for (const operation of batchOperation.operations) {
      this.redoEntry(operation)
    }
  }

  private redoRemoveRows(operation: RemoveRowsUndoEntry) {
    this.operations.removeRows(operation.command)
  }

  private redoMoveCells(operation: MoveCellsUndoEntry) {
    this.operations.moveCells(operation.sourceLeftCorner, operation.width, operation.height, operation.destinationLeftCorner)
  }

  private redoRemoveColumns(operation: RemoveColumnsUndoEntry) {
    this.operations.removeColumns(operation.command)
  }

  private redoPaste(operation: PasteUndoEntry) {
    const {targetLeftCorner, newContent} = operation
    const height = newContent.length
    const width = newContent[0].length
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const address = simpleCellAddress(targetLeftCorner.sheet, targetLeftCorner.col + x, targetLeftCorner.row + y)
        this.operations.restoreCell(address, newContent[y][x])
      }
    }
  }

  private redoSetCellContents(operation: SetCellContentsUndoEntry) {
    for (const cellContentData of operation.cellContents) {
      this.operations.setCellContent(cellContentData.address, cellContentData.newContent)
    }
  }

  private redoAddRows(operation: AddRowsUndoEntry) {
    this.operations.addRows(operation.command)
  }

  private redoAddColumns(operation: AddColumnsUndoEntry) {
    this.operations.addColumns(operation.command)
  }

  private redoRemoveSheet(operation: RemoveSheetUndoEntry) {
    this.operations.removeSheet(operation.sheetName)
  }

  private redoAddSheet(operation: AddSheetUndoEntry) {
    this.operations.addSheet(operation.sheetName)
  }

  private redoMoveRows(operation: MoveRowsUndoEntry) {
    this.operations.moveRows(operation.sheet, operation.startRow, operation.numberOfRows, operation.targetRow)
  }

  private redoMoveColumns(operation: MoveColumnsUndoEntry) {
    this.operations.moveColumns(operation.sheet, operation.startColumn, operation.numberOfColumns, operation.targetColumn)
  }

  private redoClearSheet(operation: ClearSheetUndoEntry) {
    this.operations.clearSheet(operation.sheetId)
  }

  private redoSetSheetContent(operation: SetSheetContentUndoEntry) {
    const {sheetId, newSheetContent} = operation
    this.operations.setSheetContent(sheetId, newSheetContent)
  }

  private redoAddNamedExpression(operation: AddNamedExpressionUndoEntry) {
    this.operations.addNamedExpression(operation.name, operation.newContent, operation.scope)
  }

  private redoRemoveNamedExpression(operation: RemoveNamedExpressionUndoEntry) {
    this.operations.removeNamedExpression(operation.namedExpression.displayName, operation.scope)
  }

  private redoChangeNamedExpression(operation: ChangeNamedExpressionUndoEntry) {
    this.operations.changeNamedExpressionExpression(operation.namedExpression.displayName, operation.newContent, operation.scope)
  }

  private restoreOldDataFromVersion(version: number) {
    const oldDataToRestore = this.oldData.get(version) || []
    for (const entryToRestore of oldDataToRestore) {
      const [address, hash] = entryToRestore
      this.operations.setFormulaToCellFromCache(hash, address)
    }
  }
}
