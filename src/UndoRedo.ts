/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {equalSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {RawCellContent} from './CellContentParser'
import {ClipboardCell} from './ClipboardOperations'
import {Config} from './Config'
import {InternalNamedExpression, NamedExpressionOptions} from './NamedExpressions'
import {
  AddColumnsCommand,
  AddRowsCommand,
  ColumnsRemoval,
  Operations,
  RemoveColumnsCommand,
  RemoveRowsCommand,
  RowsRemoval
} from './Operations'

export interface UndoEntry {
  doUndo(undoRedo: UndoRedo): void,

  doRedo(undoRedo: UndoRedo): void,

  /**
   * Returns the LazilyTransformingAstService version keys referenced by this entry's oldData storage.
   * Used to clean up oldData when the entry is permanently evicted from the undo/redo stack.
   */
  getReferencedOldDataVersions(): number[],
}

export abstract class BaseUndoEntry implements UndoEntry {
  abstract doUndo(undoRedo: UndoRedo): void

  abstract doRedo(undoRedo: UndoRedo): void

  /**
   * Returns LazilyTransformingAstService version keys referenced by this entry's oldData.
   * Default implementation returns empty — override in entries that store oldData.
   */
  public getReferencedOldDataVersions(): number[] {
    return []
  }
}

export class RemoveRowsUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly command: RemoveRowsCommand,
    public readonly rowsRemovals: RowsRemoval[],
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoRemoveRows(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoRemoveRows(this)
  }

  public getReferencedOldDataVersions(): number[] {
    return this.rowsRemovals.map(r => r.version - 1)
  }
}

export class MoveCellsUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly sourceLeftCorner: SimpleCellAddress,
    public readonly width: number,
    public readonly height: number,
    public readonly destinationLeftCorner: SimpleCellAddress,
    public readonly overwrittenCellsData: [SimpleCellAddress, ClipboardCell][],
    public readonly addedGlobalNamedExpressions: string[],
    public readonly version: number,
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoMoveCells(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoMoveCells(this)
  }

  public getReferencedOldDataVersions(): number[] {
    return this.version > 0 ? [this.version - 1] : []
  }
}

export class AddRowsUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly command: AddRowsCommand,
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoAddRows(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoAddRows(this)
  }
}

export class SetRowOrderUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly sheetId: number,
    public readonly rowMapping: [number, number][],
    public readonly oldContent: [SimpleCellAddress, ClipboardCell][]
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoSetRowOrder(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoSetRowOrder(this)
  }
}

export class SetColumnOrderUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly sheetId: number,
    public readonly columnMapping: [number, number][],
    public readonly oldContent: [SimpleCellAddress, ClipboardCell][]
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoSetColumnOrder(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoSetColumnOrder(this)
  }
}

export class SetSheetContentUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly sheetId: number,
    public readonly oldSheetContent: ClipboardCell[][],
    public readonly newSheetContent: RawCellContent[][],
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoSetSheetContent(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoSetSheetContent(this)
  }
}

export class MoveRowsUndoEntry extends BaseUndoEntry {
  public readonly undoStart: number
  public readonly undoEnd: number

  constructor(
    public readonly sheet: number,
    public readonly startRow: number,
    public readonly numberOfRows: number,
    public readonly targetRow: number,
    public readonly version: number,
  ) {
    super()
    this.undoStart = this.startRow < this.targetRow ? this.targetRow - this.numberOfRows : this.targetRow
    this.undoEnd = this.startRow > this.targetRow ? this.startRow + this.numberOfRows : this.startRow
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoMoveRows(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoMoveRows(this)
  }

  public getReferencedOldDataVersions(): number[] {
    return this.version > 0 ? [this.version - 1] : []
  }
}

export class MoveColumnsUndoEntry extends BaseUndoEntry {
  public readonly undoStart: number
  public readonly undoEnd: number

  constructor(
    public readonly sheet: number,
    public readonly startColumn: number,
    public readonly numberOfColumns: number,
    public readonly targetColumn: number,
    public readonly version: number,
  ) {
    super()
    this.undoStart = this.startColumn < this.targetColumn ? this.targetColumn - this.numberOfColumns : this.targetColumn
    this.undoEnd = this.startColumn > this.targetColumn ? this.startColumn + this.numberOfColumns : this.startColumn
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoMoveColumns(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoMoveColumns(this)
  }

  public getReferencedOldDataVersions(): number[] {
    return this.version > 0 ? [this.version - 1] : []
  }
}

export class AddColumnsUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly command: AddColumnsCommand,
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoAddColumns(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoAddColumns(this)
  }
}

export class RemoveColumnsUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly command: RemoveColumnsCommand,
    public readonly columnsRemovals: ColumnsRemoval[],
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoRemoveColumns(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoRemoveColumns(this)
  }

  public getReferencedOldDataVersions(): number[] {
    return this.columnsRemovals.map(r => r.version - 1)
  }
}

export class AddSheetUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly sheetName: string,
    public readonly sheetId: number,
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoAddSheet(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoAddSheet(this)
  }
}

export class RemoveSheetUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly sheetName: string,
    public readonly sheetId: number,
    public readonly oldSheetContent: ClipboardCell[][],
    public readonly scopedNamedExpressions: [InternalNamedExpression, ClipboardCell][],
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoRemoveSheet(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoRemoveSheet(this)
  }
}

/**
 * Undo entry for renaming a sheet.
 *
 * When renaming a sheet to a name that was previously referenced (but didn't exist),
 * a placeholder sheet gets merged into the renamed sheet. In this case:
 * - `version` contains the transformation version for restoring formulas during undo
 * - `mergedPlaceholderSheetId` contains the ID of the placeholder sheet that was merged
 *
 * When renaming to a name not previously referenced, both optional params are undefined.
 */
export class RenameSheetUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly sheetId: number,
    public readonly oldName: string,
    public readonly newName: string,
    public readonly version?: number,
    public readonly mergedPlaceholderSheetId?: number,
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoRenameSheet(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoRenameSheet(this)
  }

  public getReferencedOldDataVersions(): number[] {
    return this.version !== undefined ? [this.version - 1] : []
  }
}

export class ClearSheetUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly sheetId: number,
    public readonly oldSheetContent: ClipboardCell[][],
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoClearSheet(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoClearSheet(this)
  }
}

export class SetCellContentsUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly cellContents: {
      address: SimpleCellAddress,
      newContent: RawCellContent,
      oldContent: [SimpleCellAddress, ClipboardCell],
    }[],
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoSetCellContents(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoSetCellContents(this)
  }
}

export class PasteUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly targetLeftCorner: SimpleCellAddress,
    public readonly oldContent: [SimpleCellAddress, ClipboardCell][],
    public readonly newContent: ClipboardCell[][],
    public readonly addedGlobalNamedExpressions: string[],
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoPaste(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoPaste(this)
  }
}

export class AddNamedExpressionUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly name: string,
    public readonly newContent: RawCellContent,
    public readonly scope?: number,
    public readonly options?: NamedExpressionOptions
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoAddNamedExpression(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoAddNamedExpression(this)
  }
}

export class RemoveNamedExpressionUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly namedExpression: InternalNamedExpression,
    public readonly content: ClipboardCell,
    public readonly scope?: number,
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoRemoveNamedExpression(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoRemoveNamedExpression(this)
  }
}

export class ChangeNamedExpressionUndoEntry extends BaseUndoEntry {
  constructor(
    public readonly namedExpression: InternalNamedExpression,
    public readonly newContent: RawCellContent,
    public readonly oldContent: ClipboardCell,
    public readonly scope?: number,
    public readonly options?: NamedExpressionOptions
  ) {
    super()
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoChangeNamedExpression(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoChangeNamedExpression(this)
  }
}

export class BatchUndoEntry extends BaseUndoEntry {
  public readonly operations: UndoEntry[] = []

  public add(operation: UndoEntry) {
    this.operations.push(operation)
  }

  public* reversedOperations() {
    for (let i = this.operations.length - 1; i >= 0; i--) {
      yield this.operations[i]
    }
  }

  public doUndo(undoRedo: UndoRedo): void {
    undoRedo.undoBatch(this)
  }

  public doRedo(undoRedo: UndoRedo): void {
    undoRedo.redoBatch(this)
  }

  public getReferencedOldDataVersions(): number[] {
    return this.operations.flatMap(op => op.getReferencedOldDataVersions())
  }
}

/**
 * Manages undo/redo stacks for all spreadsheet operations.
 *
 * ## oldData: Preserving Formula ASTs Across Irreversible Transformations
 *
 * Some structural operations (e.g., removing rows/columns, moving cells) destroy
 * formula information that cannot be reconstructed from the transformation alone.
 * For example, when a row is removed, formulas referencing that row are rewritten
 * to `#REF!` — an irreversible change.
 *
 * To support undo of such operations, `oldData` stores snapshots of formula AST
 * hashes keyed by the LazilyTransformingAstService version at which the irreversible
 * transformation was applied. Each entry maps a version number to an array of
 * `[cellAddress, astHash]` pairs that can be used to restore the original formula
 * from the parser cache.
 *
 * ### Memory Management
 *
 * Without cleanup, `oldData` grows indefinitely because:
 * 1. When undo entries are evicted (due to `undoLimit`), their referenced oldData
 *    keys are deleted via `cleanupOldDataForEntries()`.
 * 2. When compaction forces lazy formula evaluation, it may write new oldData entries
 *    for versions that belong to already-evicted undo entries. These orphaned entries
 *    are cleaned up by `cleanupOrphanedOldData()`, which retains only versions
 *    still referenced by entries on the undo or redo stack.
 * 3. When `undoLimit` is 0 (undo disabled), `storeDataForVersion()` short-circuits
 *    to avoid storing data that would never be used.
 */
export class UndoRedo {
  public oldData: Map<number, [SimpleCellAddress, string][]> = new Map()
  private undoStack: UndoEntry[] = []
  private redoStack: UndoEntry[] = []
  private readonly undoLimit: number
  private batchUndoEntry?: BatchUndoEntry

  constructor(
    config: Config,
    private readonly operations: Operations,
  ) {
    this.undoLimit = config.undoLimit
  }

  public saveOperation(operation: UndoEntry) {
    if (this.batchUndoEntry !== undefined) {
      this.batchUndoEntry.add(operation)
    } else {
      this.addUndoEntry(operation)
    }
  }

  public beginBatchMode() {
    this.batchUndoEntry = new BatchUndoEntry()
  }

  public commitBatchMode() {
    if (this.batchUndoEntry === undefined) {
      throw Error('Batch mode wasn\'t started')
    }
    this.addUndoEntry(this.batchUndoEntry)
    this.batchUndoEntry = undefined
  }

  public storeDataForVersion(version: number, address: SimpleCellAddress, astHash: string) {
    if (this.undoLimit === 0) {
      return
    }
    if (!this.oldData.has(version)) {
      this.oldData.set(version, [])
    }
    const currentOldData = this.oldData.get(version)!
    currentOldData.push([address, astHash])
  }

  public clearRedoStack() {
    this.cleanupOldDataForEntries(this.redoStack, this.undoStack)
    this.redoStack = []
  }

  public clearUndoStack() {
    this.cleanupOldDataForEntries(this.undoStack, this.redoStack)
    this.undoStack = []
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
      throw Error('Attempted to undo without operation on stack')
    }

    this.undoEntry(operation)

    this.redoStack.push(operation)
  }

  public undoBatch(batchOperation: BatchUndoEntry) {
    for (const operation of batchOperation.reversedOperations()) {
      this.undoEntry(operation)
    }
  }

  public undoRemoveRows(operation: RemoveRowsUndoEntry) {
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

  public undoRemoveColumns(operation: RemoveColumnsUndoEntry) {
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

  public undoAddRows(operation: AddRowsUndoEntry) {
    const addedRowsSpans = operation.command.rowsSpans()
    for (let i = addedRowsSpans.length - 1; i >= 0; --i) {
      const addedRows = addedRowsSpans[i]
      this.operations.removeRows(new RemoveRowsCommand(operation.command.sheet, [[addedRows.rowStart, addedRows.numberOfRows]]))
    }
  }

  public undoAddColumns(operation: AddColumnsUndoEntry) {
    const addedColumnsSpans = operation.command.columnsSpans()
    for (let i = addedColumnsSpans.length - 1; i >= 0; --i) {
      const addedColumns = addedColumnsSpans[i]
      this.operations.removeColumns(new RemoveColumnsCommand(operation.command.sheet, [[addedColumns.columnStart, addedColumns.numberOfColumns]]))
    }
  }

  public undoSetCellContents(operation: SetCellContentsUndoEntry) {
    for (const cellContentData of operation.cellContents) {
      const address = cellContentData.address
      const [oldContentAddress, oldContent] = cellContentData.oldContent
      if (!equalSimpleCellAddress(address, oldContentAddress)) {
        this.operations.setCellEmpty(address)
      }
      this.operations.restoreCell(oldContentAddress, oldContent)
    }
  }

  public undoPaste(operation: PasteUndoEntry) {
    this.restoreOperationOldContent(operation.oldContent)
    for (const namedExpression of operation.addedGlobalNamedExpressions) {
      this.operations.removeNamedExpression(namedExpression)
    }
  }

  public undoMoveRows(operation: MoveRowsUndoEntry) {
    this.operations.forceApplyPostponedTransformations()
    const {sheet} = operation
    this.operations.moveRows(sheet, operation.undoStart, operation.numberOfRows, operation.undoEnd)
    this.restoreOldDataFromVersion(operation.version - 1)
  }

  public undoMoveColumns(operation: MoveColumnsUndoEntry) {
    this.operations.forceApplyPostponedTransformations()
    const {sheet} = operation
    this.operations.moveColumns(sheet, operation.undoStart, operation.numberOfColumns, operation.undoEnd)
    this.restoreOldDataFromVersion(operation.version - 1)
  }

  public undoMoveCells(operation: MoveCellsUndoEntry): void {
    this.operations.forceApplyPostponedTransformations()
    this.operations.moveCells(operation.destinationLeftCorner, operation.width, operation.height, operation.sourceLeftCorner)

    this.restoreOperationOldContent(operation.overwrittenCellsData)

    this.restoreOldDataFromVersion(operation.version - 1)
    for (const namedExpression of operation.addedGlobalNamedExpressions) {
      this.operations.removeNamedExpression(namedExpression)
    }
  }

  public undoAddSheet(operation: AddSheetUndoEntry) {
    const {sheetName} = operation
    this.operations.removeSheetByName(sheetName)
  }

  public undoRemoveSheet(operation: RemoveSheetUndoEntry) {
    this.operations.forceApplyPostponedTransformations()
    const {oldSheetContent, sheetId, scopedNamedExpressions, sheetName} = operation
    this.operations.addSheetWithId(sheetId, sheetName)
    for (let rowIndex = 0; rowIndex < oldSheetContent.length; rowIndex++) {
      const row = oldSheetContent[rowIndex]
      for (let col = 0; col < row.length; col++) {
        const cellType = row[col]
        const address = simpleCellAddress(sheetId, col, rowIndex)
        this.operations.restoreCell(address, cellType)
      }
    }

    for (const [namedexpression, content] of scopedNamedExpressions) {
      this.operations.restoreNamedExpression(namedexpression, content, sheetId)
    }
  }

  public undoRenameSheet(operation: RenameSheetUndoEntry) {
    this.operations.forceApplyPostponedTransformations()
    this.operations.renameSheet(operation.sheetId, operation.oldName)

    if (operation.mergedPlaceholderSheetId !== undefined && operation.version !== undefined) {
      this.operations.addPlaceholderSheetWithId(operation.mergedPlaceholderSheetId, operation.newName)
      this.restoreOldDataFromVersion(operation.version - 1)
    }
  }

  public undoClearSheet(operation: ClearSheetUndoEntry) {
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

  public undoSetSheetContent(operation: SetSheetContentUndoEntry) {
    const {oldSheetContent, sheetId} = operation
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

  public undoAddNamedExpression(operation: AddNamedExpressionUndoEntry) {
    this.operations.removeNamedExpression(operation.name, operation.scope)
  }

  public undoRemoveNamedExpression(operation: RemoveNamedExpressionUndoEntry) {
    this.operations.restoreNamedExpression(operation.namedExpression, operation.content, operation.scope)
  }

  public undoChangeNamedExpression(operation: ChangeNamedExpressionUndoEntry) {
    this.operations.restoreNamedExpression(operation.namedExpression, operation.oldContent, operation.scope)
  }

  public undoSetRowOrder(operation: SetRowOrderUndoEntry) {
    this.restoreOperationOldContent(operation.oldContent)
  }

  public undoSetColumnOrder(operation: SetColumnOrderUndoEntry) {
    this.restoreOperationOldContent(operation.oldContent)
  }

  public redo() {
    const operation = this.redoStack.pop()

    if (!operation) {
      throw Error('Attempted to redo without operation on stack')
    }

    this.redoEntry(operation)

    this.undoStack.push(operation)
  }

  public redoBatch(batchOperation: BatchUndoEntry) {
    for (const operation of batchOperation.operations) {
      this.redoEntry(operation)
    }
  }

  public redoRemoveRows(operation: RemoveRowsUndoEntry) {
    this.operations.removeRows(operation.command)
  }

  public redoMoveCells(operation: MoveCellsUndoEntry) {
    this.operations.moveCells(operation.sourceLeftCorner, operation.width, operation.height, operation.destinationLeftCorner)
  }

  public redoRemoveColumns(operation: RemoveColumnsUndoEntry) {
    this.operations.removeColumns(operation.command)
  }

  public redoPaste(operation: PasteUndoEntry) {
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

  public redoSetCellContents(operation: SetCellContentsUndoEntry) {
    for (const cellContentData of operation.cellContents) {
      this.operations.setCellContent(cellContentData.address, cellContentData.newContent)
    }
  }

  public redoAddRows(operation: AddRowsUndoEntry) {
    this.operations.addRows(operation.command)
  }

  public redoAddColumns(operation: AddColumnsUndoEntry) {
    this.operations.addColumns(operation.command)
  }

  public redoRemoveSheet(operation: RemoveSheetUndoEntry) {
    this.operations.removeSheetByName(operation.sheetName)
  }

  public redoAddSheet(operation: AddSheetUndoEntry) {
    this.operations.addSheetWithId(operation.sheetId, operation.sheetName)
  }

  public redoRenameSheet(operation: RenameSheetUndoEntry) {
    this.operations.renameSheet(operation.sheetId, operation.newName)
  }

  public redoMoveRows(operation: MoveRowsUndoEntry) {
    this.operations.moveRows(operation.sheet, operation.startRow, operation.numberOfRows, operation.targetRow)
  }

  public redoMoveColumns(operation: MoveColumnsUndoEntry) {
    this.operations.moveColumns(operation.sheet, operation.startColumn, operation.numberOfColumns, operation.targetColumn)
  }

  public redoClearSheet(operation: ClearSheetUndoEntry) {
    this.operations.clearSheet(operation.sheetId)
  }

  public redoSetSheetContent(operation: SetSheetContentUndoEntry) {
    const {sheetId, newSheetContent} = operation
    this.operations.setSheetContent(sheetId, newSheetContent)
  }

  public redoAddNamedExpression(operation: AddNamedExpressionUndoEntry) {
    this.operations.addNamedExpression(operation.name, operation.newContent, operation.scope, operation.options)
  }

  public redoRemoveNamedExpression(operation: RemoveNamedExpressionUndoEntry) {
    this.operations.removeNamedExpression(operation.namedExpression.displayName, operation.scope)
  }

  public redoChangeNamedExpression(operation: ChangeNamedExpressionUndoEntry) {
    this.operations.changeNamedExpressionExpression(operation.namedExpression.displayName, operation.newContent, operation.scope, operation.options)
  }

  public redoSetRowOrder(operation: SetRowOrderUndoEntry) {
    this.operations.setRowOrder(operation.sheetId, operation.rowMapping)
  }

  public redoSetColumnOrder(operation: SetColumnOrderUndoEntry) {
    this.operations.setColumnOrder(operation.sheetId, operation.columnMapping)
  }

  /**
   * Adds an entry to the undo stack, evicting the oldest entries when undoLimit is exceeded.
   * Evicted entries have their oldData keys cleaned up to prevent memory leaks.
   */
  private addUndoEntry(operation: UndoEntry) {
    this.undoStack.push(operation)
    const evictCount = Math.max(0, this.undoStack.length - this.undoLimit)
    if (evictCount > 0) {
      const evicted = this.undoStack.splice(0, evictCount)
      this.cleanupOldDataForEntries(evicted, [...this.undoStack, ...this.redoStack])
    }
  }

  /**
   * Removes oldData entries whose version keys are not referenced by any
   * entry on the undo stack, redo stack, or in-progress batch. Called after
   * compaction forces lazy formula evaluation, which may insert oldData for
   * already-evicted entries.
   */
  public cleanupOrphanedOldData() {
    const referencedVersions = this.collectReferencedOldDataVersions(this.undoStack, this.redoStack)
    for (const version of this.oldData.keys()) {
      if (!referencedVersions.has(version)) {
        this.oldData.delete(version)
      }
    }
  }

  /**
   * Removes oldData entries referenced by permanently discarded undo/redo entries,
   * but only if not still referenced by entries remaining on the other stack or
   * in-progress batch.
   */
  private cleanupOldDataForEntries(discardedEntries: UndoEntry[], retainedEntries: UndoEntry[]) {
    const retainedVersions = this.collectReferencedOldDataVersions(retainedEntries)
    for (const entry of discardedEntries) {
      for (const version of entry.getReferencedOldDataVersions()) {
        if (!retainedVersions.has(version)) {
          this.oldData.delete(version)
        }
      }
    }
  }

  /** Collects all oldData version keys referenced by the given entry lists and in-progress batch. */
  private collectReferencedOldDataVersions(...entryLists: UndoEntry[][]): Set<number> {
    return new Set<number>([
      ...entryLists.flatMap(list => list.flatMap(e => e.getReferencedOldDataVersions())),
      ...(this.batchUndoEntry?.getReferencedOldDataVersions() ?? []),
    ])
  }

  private undoEntry(operation: UndoEntry) {
    operation.doUndo(this)
  }

  private restoreOperationOldContent(oldContent: [SimpleCellAddress, ClipboardCell][]) {
    for (const [address, clipboardCell] of oldContent) {
      this.operations.restoreCell(address, clipboardCell)
    }
  }

  private redoEntry(operation: UndoEntry) {
    operation.doRedo(this)
  }

  private restoreOldDataFromVersion(version: number) {
    const oldDataToRestore = this.oldData.get(version) || []
    for (const entryToRestore of oldDataToRestore) {
      const [address, hash] = entryToRestore
      this.operations.setFormulaToCellFromCache(hash, address)
    }
  }
}
