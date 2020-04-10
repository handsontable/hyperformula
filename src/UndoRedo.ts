/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {simpleCellAddress, SimpleCellAddress, NoErrorCellValue} from './Cell'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {RawCellContent} from './CellContentParser'
import {RemoveColumnsCommand, AddColumnsCommand, RowsRemoval, ColumnsRemoval, RemoveRowsCommand, AddRowsCommand} from './Operations'
import {Operations} from './Operations'

export class RemoveRowsUndoData {
  constructor(
    public readonly command: RemoveRowsCommand,
    public readonly rowsRemovals: RowsRemoval[],
  ) { }
}

export class MoveCellsUndoData {
  constructor(
    public readonly sourceLeftCorner: SimpleCellAddress,
    public readonly width: number,
    public readonly height: number,
    public readonly destinationLeftCorner: SimpleCellAddress,
    public readonly overwrittenCellsData: [SimpleCellAddress, ClipboardCell][],
    public readonly version: number,
  ) { }
}

export class AddRowsUndoData {
  constructor(
    public readonly command: AddRowsCommand,
  ) { }
}

export class SetSheetContentUndoData {
  constructor(
    public readonly sheetId: number,
    public readonly oldSheetContent: ClipboardCell[][],
    public readonly newSheetContent: RawCellContent[][],
  ) { }
}

export class MoveRowsUndoData {
  constructor(
    public readonly sheet: number,
    public readonly startRow: number,
    public readonly numberOfRows: number,
    public readonly targetRow: number,
  ) { }
}

export class MoveColumnsUndoData {
  constructor(
    public readonly sheet: number,
    public readonly startColumn: number,
    public readonly numberOfColumns: number,
    public readonly targetColumn: number,
  ) { }
}

export class AddColumnsUndoData {
  constructor(
    public readonly command: AddColumnsCommand,
  ) { }
}

export class RemoveColumnsUndoData {
  constructor(
    public readonly command: RemoveColumnsCommand,
    public readonly columnsRemovals: ColumnsRemoval[],
  ) { }
}

export class AddSheetUndoData {
  constructor(
    public readonly sheetName: string,
  ) { }
}

export class RemoveSheetUndoData {
  constructor(
    public readonly sheetName: string,
    public readonly sheetId: number,
    public readonly oldSheetContent: ClipboardCell[][],
    public readonly version: number,
  ) { }
}

export class ClearSheetUndoData {
  constructor(
    public readonly sheetId: number,
    public readonly oldSheetContent: ClipboardCell[][],
  ) { }
}

export class SetCellContentsUndoData {
  constructor(
    public readonly cellContents: {
      address: SimpleCellAddress,
      newContent: RawCellContent,
      oldContent: ClipboardCell,
    }[],
  ) { }
}

export class PasteUndoData {
  constructor(
    public readonly targetLeftCorner: SimpleCellAddress,
    public readonly oldContent: [SimpleCellAddress, ClipboardCell][],
    public readonly newContent: ClipboardCell[][],
  ) { }
}

export class BatchUndoData {
  public readonly operations: UndoStackElement[] = []

  public add(operation: UndoStackElement) {
    this.operations.push(operation)
  }

  public* reversedOperations() {
    for (let i = this.operations.length - 1; i >= 0; i--) {
      yield this.operations[i]
    }
  }
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
  | BatchUndoData

export class UndoRedo {
  private readonly undoStack: UndoStackElement[] = []
  private redoStack: UndoStackElement[] = []
  private batchUndoEntry?: BatchUndoData

  constructor(
    public readonly operations: Operations
  ) {
  }

  public oldData: Map<number, [SimpleCellAddress, string][]> = new Map()

  public saveOperation(operation: UndoStackElement) {
    if (this.batchUndoEntry !== undefined) {
      this.batchUndoEntry.add(operation)
    } else {
      this.undoStack.push(operation)
    }
  }

  public beginBatchMode() {
    this.batchUndoEntry = new BatchUndoData()
  }
  
  public commitBatchMode() {
    if (this.batchUndoEntry === undefined) {
      throw "Batch mode wasn't started"
    }
    this.undoStack.push(this.batchUndoEntry)
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

  private undoEntry(operation: UndoStackElement) {
    if (operation instanceof RemoveRowsUndoData) {
      this.undoRemoveRows(operation)
    } else if (operation instanceof RemoveRowsUndoData) {
      this.undoRemoveRows(operation)
    } else if (operation instanceof AddRowsUndoData) {
      this.undoAddRows(operation)
    } else if (operation instanceof SetCellContentsUndoData) {
      this.undoSetCellContents(operation)
    } else if (operation instanceof MoveRowsUndoData) {
      this.undoMoveRows(operation)
    } else if (operation instanceof AddSheetUndoData) {
      this.undoAddSheet(operation)
    } else if (operation instanceof RemoveSheetUndoData) {
      this.undoRemoveSheet(operation)
    } else if (operation instanceof ClearSheetUndoData) {
      this.undoClearSheet(operation)
    } else if (operation instanceof AddColumnsUndoData) {
      this.undoAddColumns(operation)
    } else if (operation instanceof RemoveColumnsUndoData) {
      this.undoRemoveColumns(operation)
    } else if (operation instanceof MoveColumnsUndoData) {
      this.undoMoveColumns(operation)
    } else if (operation instanceof MoveCellsUndoData) {
      this.undoMoveCells(operation)
    } else if (operation instanceof SetSheetContentUndoData) {
      this.undoSetSheetContent(operation)
    } else if (operation instanceof PasteUndoData) {
      this.undoPaste(operation)
    } else if (operation instanceof BatchUndoData) {
      this.undoBatch(operation)
    } else {
      throw "Unknown element"
    }
  }

  private undoBatch(batchOperation: BatchUndoData) {
    for (const operation of batchOperation.reversedOperations()) {
      this.undoEntry(operation)
    }
  }

  private undoRemoveRows(operation: RemoveRowsUndoData) {
    this.operations.forceApplyPostponedTransformations()

    const { command: { sheet }, rowsRemovals } = operation
    for (let i = rowsRemovals.length - 1; i >= 0; --i) {
      const rowsRemoval = rowsRemovals[i]
      this.operations.addRows(new AddRowsCommand(sheet, [[rowsRemoval.rowFrom, rowsRemoval.rowCount]]))

      for (const { address, cellType } of rowsRemoval.removedCells) {
        this.operations.restoreCell(address, cellType)
      }

      this.restoreOldDataFromVersion(rowsRemoval.version - 1)
    }
  }

  private undoRemoveColumns(operation: RemoveColumnsUndoData) {
    this.operations.forceApplyPostponedTransformations()

    const { command: { sheet }, columnsRemovals } = operation
    for (let i = columnsRemovals.length - 1; i >= 0; --i) {
      const columnsRemoval = columnsRemovals[i]
      this.operations.addColumns(new AddColumnsCommand(sheet, [[columnsRemoval.columnFrom, columnsRemoval.columnCount]]))

      for (const { address, cellType } of columnsRemoval.removedCells) {
        this.operations.restoreCell(address, cellType)
      }

      this.restoreOldDataFromVersion(columnsRemoval.version - 1)
    }
  }

  private undoAddRows(operation: AddRowsUndoData) {
    const addedRowsSpans = operation.command.rowsSpans()
    for (let i = addedRowsSpans.length - 1; i >= 0; --i) {
      const addedRows = addedRowsSpans[i]
      this.operations.removeRows(new RemoveRowsCommand(operation.command.sheet, [[addedRows.rowStart, addedRows.numberOfRows]]))
    }
  }

  private undoAddColumns(operation: AddColumnsUndoData) {
    const addedColumnsSpans = operation.command.columnsSpans()
    for (let i = addedColumnsSpans.length - 1; i >= 0; --i) {
      const addedColumns = addedColumnsSpans[i]
      this.operations.removeColumns(new RemoveColumnsCommand(operation.command.sheet, [[addedColumns.columnStart, addedColumns.numberOfColumns]]))
    }
  }

  private undoSetCellContents(operation: SetCellContentsUndoData) {
    for (const cellContentData of operation.cellContents) {
      this.operations.restoreCell(cellContentData.address, cellContentData.oldContent)
    }
  }

  private undoPaste(operation: PasteUndoData) {
    for (const [address, clipboardCell] of operation.oldContent) {
      this.operations.restoreCell(address, clipboardCell)
    }
  }

  private undoMoveRows(operation: MoveRowsUndoData) {
    const { sheet } = operation
    this.operations.moveRows(sheet, operation.targetRow - operation.numberOfRows, operation.numberOfRows, operation.startRow)
  }

  private undoMoveColumns(operation: MoveColumnsUndoData) {
    const { sheet } = operation
    this.operations.moveColumns(sheet, operation.targetColumn - operation.numberOfColumns, operation.numberOfColumns, operation.startColumn)
  }

  public undoMoveCells(operation: MoveCellsUndoData): void {
    this.operations.forceApplyPostponedTransformations()
    this.operations.moveCells(operation.destinationLeftCorner, operation.width, operation.height, operation.sourceLeftCorner)

    for (const [ address, clipboardCell ] of operation.overwrittenCellsData) {
      this.operations.restoreCell(address, clipboardCell)
    }

    this.restoreOldDataFromVersion(operation.version - 1)
  }

  private undoAddSheet(operation: AddSheetUndoData) {
    const { sheetName } = operation
    this.operations.removeSheet(sheetName)
  }

  private undoRemoveSheet(operation: RemoveSheetUndoData) {
    this.operations.forceApplyPostponedTransformations()
    const { oldSheetContent, sheetId } = operation
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

  private undoClearSheet(operation: ClearSheetUndoData) {
    const { oldSheetContent, sheetId } = operation
    for (let rowIndex = 0; rowIndex < oldSheetContent.length; rowIndex++) {
      const row = oldSheetContent[rowIndex]
      for (let col = 0; col < row.length; col++) {
        const cellType = row[col]
        const address = simpleCellAddress(sheetId, col, rowIndex)
        this.operations.restoreCell(address, cellType)
      }
    }
  }

  private undoSetSheetContent(operation: SetSheetContentUndoData) {
    const { oldSheetContent, newSheetContent, sheetId } = operation
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

  public redo() {
    const operation = this.redoStack.pop()

    if (!operation) {
      throw 'Attempted to redo without operation on stack'
    }

    this.redoEntry(operation)

    this.undoStack.push(operation)
  }

  private redoEntry(operation: UndoStackElement) {
    if (operation instanceof RemoveRowsUndoData) {
      this.redoRemoveRows(operation)
    } else if (operation instanceof RemoveRowsUndoData) {
      this.redoRemoveRows(operation)
    } else if (operation instanceof AddRowsUndoData) {
      this.redoAddRows(operation)
    } else if (operation instanceof SetCellContentsUndoData) {
      this.redoSetCellContents(operation)
    } else if (operation instanceof MoveRowsUndoData) {
      this.redoMoveRows(operation)
    } else if (operation instanceof AddSheetUndoData) {
      this.redoAddSheet(operation)
    } else if (operation instanceof RemoveSheetUndoData) {
      this.redoRemoveSheet(operation)
    } else if (operation instanceof ClearSheetUndoData) {
      this.redoClearSheet(operation)
    } else if (operation instanceof AddColumnsUndoData) {
      this.redoAddColumns(operation)
    } else if (operation instanceof RemoveColumnsUndoData) {
      this.redoRemoveColumns(operation)
    } else if (operation instanceof MoveColumnsUndoData) {
      this.redoMoveColumns(operation)
    } else if (operation instanceof MoveCellsUndoData) {
      this.redoMoveCells(operation)
    } else if (operation instanceof SetSheetContentUndoData) {
      this.redoSetSheetContent(operation)
    } else if (operation instanceof PasteUndoData) {
      this.redoPaste(operation)
    } else if (operation instanceof BatchUndoData) {
      this.redoBatch(operation)
    } else {
      throw "Unknown element"
    }
  }

  private redoBatch(batchOperation: BatchUndoData) {
    for (const operation of batchOperation.operations) {
      this.redoEntry(operation)
    }
  }

  private redoRemoveRows(operation: RemoveRowsUndoData) {
    this.operations.removeRows(operation.command)
  }

  private redoMoveCells(operation: MoveCellsUndoData) {
    this.operations.moveCells(operation.sourceLeftCorner, operation.width, operation.height, operation.destinationLeftCorner)
  }

  private redoRemoveColumns(operation: RemoveColumnsUndoData) {
    this.operations.removeColumns(operation.command)
  }

  private redoPaste(operation: PasteUndoData) {
    const { targetLeftCorner, newContent } = operation
    const height = newContent.length
    const width = newContent[0].length
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const address = simpleCellAddress(targetLeftCorner.sheet, targetLeftCorner.col + x, targetLeftCorner.row + y)
        this.operations.restoreCell(address, newContent[y][x])
      }
    }
  }

  private redoSetCellContents(operation: SetCellContentsUndoData) {
    for (const cellContentData of operation.cellContents) {
      this.operations.setCellContent(cellContentData.address, cellContentData.newContent)
    }
  }

  private redoAddRows(operation: AddRowsUndoData) {
    this.operations.addRows(operation.command)
  }

  private redoAddColumns(operation: AddColumnsUndoData) {
    this.operations.addColumns(operation.command)
  }

  private redoRemoveSheet(operation: RemoveSheetUndoData) {
    const { sheetName } = operation
    this.operations.removeSheet(sheetName)
  }

  private redoAddSheet(operation: AddSheetUndoData) {
    const { sheetName } = operation
    this.operations.addSheet(sheetName)
  }

  private redoMoveRows(operation: MoveRowsUndoData) {
    const { sheet } = operation
    this.operations.moveRows(sheet, operation.startRow, operation.numberOfRows, operation.targetRow)
  }

  private redoMoveColumns(operation: MoveColumnsUndoData) {
    const { sheet } = operation
    this.operations.moveColumns(sheet, operation.startColumn, operation.numberOfColumns, operation.targetColumn)
  }

  private redoClearSheet(operation: ClearSheetUndoData) {
    const { sheetId } = operation
    this.operations.clearSheet(sheetId)
  }

  private redoSetSheetContent(operation: SetSheetContentUndoData) {
    const { sheetId, newSheetContent } = operation
    this.operations.clearSheet(sheetId)
    for (let row = 0; row < newSheetContent.length; row++) {
      for (let col = 0; col < newSheetContent[row].length; col++) {
        const address = simpleCellAddress(sheetId, col, row)
        this.operations.setCellContent(address, newSheetContent[row][col])
      }
    }
  }

  private restoreOldDataFromVersion(version: number) {
    const oldDataToRestore = this.oldData.get(version) || []
    for (const entryToRestore of oldDataToRestore) {
      const [ address, hash ] = entryToRestore
      this.operations.setFormulaToCellFromCache(hash, address)
    }
  }
}
