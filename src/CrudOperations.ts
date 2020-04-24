/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellContentParser, isMatrix, RawCellContent} from './CellContentParser'
import {ClipboardCell, ClipboardOperations} from './ClipboardOperations'
import {AddColumnsCommand, AddRowsCommand, Operations, RemoveColumnsCommand, RemoveRowsCommand} from './Operations'
import {ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {ColumnsSpan} from './ColumnsSpan'
import {Config} from './Config'
import {ContentChanges} from './ContentChanges'
import {AddressMapping, DependencyGraph, SheetMapping} from './DependencyGraph'
import {
  InvalidAddressError,
  InvalidArgumentsError,
  NoOperationToRedoError,
  NoOperationToUndoError,
  NoSheetWithIdError,
  NoSheetWithNameError,
  NothingToPasteError,
  SheetSizeLimitExceededError
} from './errors'
import {Index} from './HyperFormula'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ParserWithCaching} from './parser'
import {RowsSpan} from './RowsSpan'
import {Statistics} from './statistics'
import {
  AddColumnsUndoEntry,
  AddRowsUndoEntry,
  AddSheetUndoEntry,
  ClearSheetUndoEntry,
  MoveCellsUndoEntry,
  MoveColumnsUndoEntry,
  MoveRowsUndoEntry,
  PasteUndoEntry,
  RemoveColumnsUndoEntry,
  RemoveRowsUndoEntry,
  RemoveSheetUndoEntry,
  SetCellContentsUndoEntry,
  SetSheetContentUndoEntry,
  UndoRedo
} from './UndoRedo'
import {findBoundaries} from './Sheet'

export class CrudOperations {

  private readonly clipboardOperations: ClipboardOperations
  public readonly undoRedo: UndoRedo
  public readonly operations: Operations

  constructor(
    /** Engine config */
    private readonly config: Config,
    /** Statistics module for benchmarking */
    private readonly stats: Statistics,
    /** Dependency graph storing sheets structure */
    private readonly dependencyGraph: DependencyGraph,
    /** Column search strategy used by VLOOKUP plugin */
    private readonly columnSearch: ColumnSearchStrategy,
    /** Parser with caching */
    private readonly parser: ParserWithCaching,
    /** Raw cell input parser */
    private readonly cellContentParser: CellContentParser,
    /** Service handling postponed CRUD transformations */
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {
    this.operations = new Operations(this.dependencyGraph, this.columnSearch, this.cellContentParser, this.parser, this.stats, this.lazilyTransformingAstService, this.config)
    this.clipboardOperations = new ClipboardOperations(this.dependencyGraph, this.operations, this.parser, this.lazilyTransformingAstService, this.config)
    this.undoRedo = new UndoRedo(this.config, this.operations)
  }

  public addRows(sheet: number, ...indexes: Index[]): void {
    const addRowsCommand = new AddRowsCommand(sheet, indexes)
    this.ensureItIsPossibleToAddRows(sheet, ...indexes)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.operations.addRows(addRowsCommand)
    this.undoRedo.saveOperation(new AddRowsUndoEntry(addRowsCommand))
  }

  public removeRows(sheet: number, ...indexes: Index[]): void {
    const removeRowsCommand = new RemoveRowsCommand(sheet, indexes)
    this.ensureItIsPossibleToRemoveRows(sheet, ...indexes)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const rowsRemovals = this.operations.removeRows(removeRowsCommand)
    this.undoRedo.saveOperation(new RemoveRowsUndoEntry(removeRowsCommand, rowsRemovals))
  }

  public addColumns(sheet: number, ...indexes: Index[]): void {
    const addColumnsCommand = new AddColumnsCommand(sheet, indexes)
    this.ensureItIsPossibleToAddColumns(sheet, ...indexes)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.operations.addColumns(addColumnsCommand)
    this.undoRedo.saveOperation(new AddColumnsUndoEntry(addColumnsCommand))
  }

  public removeColumns(sheet: number, ...indexes: Index[]): void {
    const removeColumnsCommand = new RemoveColumnsCommand(sheet, indexes)
    this.ensureItIsPossibleToRemoveColumns(sheet, ...indexes)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const columnsRemovals = this.operations.removeColumns(removeColumnsCommand)
    this.undoRedo.saveOperation(new RemoveColumnsUndoEntry(removeColumnsCommand, columnsRemovals))
  }

  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): void {
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const { version, overwrittenCellsData } = this.operations.moveCells(sourceLeftCorner, width, height, destinationLeftCorner)
    this.undoRedo.saveOperation(new MoveCellsUndoEntry(sourceLeftCorner, width, height, destinationLeftCorner, overwrittenCellsData, version))
  }

  public moveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): void {
    this.ensureItIsPossibleToMoveRows(sheet, startRow, numberOfRows, targetRow)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.operations.moveRows(sheet, startRow, numberOfRows, targetRow)
    this.undoRedo.saveOperation(new MoveRowsUndoEntry(sheet, startRow, numberOfRows, targetRow))
  }

  public moveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): void {
    this.ensureItIsPossibleToMoveColumns(sheet, startColumn, numberOfColumns, targetColumn)
    this.undoRedo.clearRedoStack()
    this.operations.moveColumns(sheet, startColumn, numberOfColumns, targetColumn)
    this.undoRedo.saveOperation(new MoveColumnsUndoEntry(sheet, startColumn, numberOfColumns, targetColumn))
  }

  public cut(sourceLeftCorner: SimpleCellAddress, width: number, height: number): void {
    this.clipboardOperations.cut(sourceLeftCorner, width, height)
  }

  public ensureItIsPossibleToCopy(sourceLeftCorner: SimpleCellAddress, width: number, height: number): void {
    if (!isPositiveInteger(width)) {
      throw new InvalidArgumentsError('width to be positive integer')
    }
    if (!isPositiveInteger(height)) {
      throw new InvalidArgumentsError('height to be positive integer')
    }
  }

  public copy(sourceLeftCorner: SimpleCellAddress, width: number, height: number): void {
    this.ensureItIsPossibleToCopy(sourceLeftCorner, width, height)
    this.clipboardOperations.copy(sourceLeftCorner, width, height)
  }

  public paste(targetLeftCorner: SimpleCellAddress): void {
    const clipboard = this.clipboardOperations.clipboard
    if (clipboard === undefined) {
      throw new NothingToPasteError()
    } else if (this.clipboardOperations.isCutClipboard()) {
      this.undoRedo.clearRedoStack()
      const { version, overwrittenCellsData } = this.operations.moveCells(clipboard.sourceLeftCorner, clipboard.width, clipboard.height, targetLeftCorner)
      this.clipboardOperations.abortCut()
      this.undoRedo.saveOperation(new MoveCellsUndoEntry(clipboard.sourceLeftCorner, clipboard.width, clipboard.height, targetLeftCorner, overwrittenCellsData, version))
    } else if (this.clipboardOperations.isCopyClipboard()) {
      this.clipboardOperations.ensureItIsPossibleToCopyPaste(targetLeftCorner)
      const targetRange = AbsoluteCellRange.spanFrom(targetLeftCorner, clipboard.width, clipboard.height)
      const oldContent = this.operations.getRangeClipboardCells(targetRange)
      this.undoRedo.clearRedoStack()
      this.dependencyGraph.breakNumericMatricesInRange(targetRange)
      for (const [address, clipboardCell] of clipboard.getContent(targetLeftCorner)) {
        this.operations.restoreCell(address, clipboardCell)
      }
      this.undoRedo.saveOperation(new PasteUndoEntry(targetLeftCorner, oldContent, clipboard.content!))
    }
  }

  public beginUndoRedoBatchMode(): void {
    this.undoRedo.beginBatchMode()
  }

  public commitUndoRedoBatchMode(): void {
    this.undoRedo.commitBatchMode()
  }

  public isClipboardEmpty(): boolean {
    return this.clipboardOperations.clipboard === undefined
  }

  public clearClipboard(): void {
    this.clipboardOperations.clear()
  }

  public addSheet(name?: string): string {
    if (name) {
      this.ensureItIsPossibleToAddSheet(name)
    }
    this.undoRedo.clearRedoStack()
    const addedSheetName = this.operations.addSheet(name)
    this.undoRedo.saveOperation(new AddSheetUndoEntry(addedSheetName))
    return addedSheetName
  }

  public removeSheet(sheetName: string): void {
    this.ensureSheetExists(sheetName)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const sheetId = this.sheetMapping.fetch(sheetName)
    const originalName = this.sheetMapping.fetchDisplayName(sheetId)
    const oldSheetContent = this.operations.getSheetClipboardCells(sheetId)
    const version = this.operations.removeSheet(sheetName)
    this.undoRedo.saveOperation(new RemoveSheetUndoEntry(originalName, sheetId, oldSheetContent, version))
  }

  public clearSheet(sheetName: string): void {
    this.ensureSheetExists(sheetName)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const sheetId = this.sheetMapping.fetch(sheetName)
    const oldSheetContent = this.operations.getSheetClipboardCells(sheetId)
    this.operations.clearSheet(sheetId)
    this.undoRedo.saveOperation(new ClearSheetUndoEntry(sheetId, oldSheetContent))
  }

  public setCellContents(topLeftCornerAddress: SimpleCellAddress, cellContents: RawCellContent[][] | RawCellContent): void {
    if (!(cellContents instanceof Array)) {
      cellContents = [[cellContents]]
    } else {
      for (let i = 0; i < cellContents.length; i++) {
        if (!(cellContents[i] instanceof Array)) {
          throw new InvalidArgumentsError('an array of arrays or a raw cell value')
        }
        for (let j = 0; j < cellContents[i].length; j++) {
          if (isMatrix(cellContents[i][j])) {
            throw new Error('Cant change matrices in batch operation')
          }
        }
      }
    }

    this.ensureItIsPossibleToChangeCellContents(topLeftCornerAddress, cellContents)

    this.undoRedo.clearRedoStack()
    const modifiedCellContents: { address: SimpleCellAddress, newContent: RawCellContent, oldContent: ClipboardCell }[] = []
    for (let i = 0; i < cellContents.length; i++) {
      for (let j = 0; j < cellContents[i].length; j++) {
        const address = {
          sheet: topLeftCornerAddress.sheet,
          row: topLeftCornerAddress.row + i,
          col: topLeftCornerAddress.col + j,
        }
        this.clipboardOperations.abortCut()
        const oldContent = this.operations.getClipboardCell(address)
        this.operations.setCellContent(address, cellContents[i][j])
        modifiedCellContents.push({ address, newContent: cellContents[i][j], oldContent })
      }
    }
    this.undoRedo.saveOperation(new SetCellContentsUndoEntry(modifiedCellContents))
  }

  public setSheetContent(sheetName: string, values: RawCellContent[][]): void {
    this.ensureSheetExists(sheetName)
    const sheetId = this.sheetMapping.fetch(sheetName)
    this.ensureItIsPossibleToChangeSheetContents(sheetId, values)

    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    if (!(values instanceof Array)) {
      throw new Error('Expected an array of arrays.')
    }
    const oldSheetContent = this.operations.getSheetClipboardCells(sheetId)
    this.operations.clearSheet(sheetId)
    for (let i = 0; i < values.length; i++) {
      if (!(values[i] instanceof Array)) {
        throw new Error('Expected an array of arrays.')
      }
      for (let j = 0; j < values[i].length; j++) {
        const address = simpleCellAddress(sheetId, j, i)
        this.operations.setCellContent(address, values[i][j])
      }
    }
    this.undoRedo.saveOperation(new SetSheetContentUndoEntry(sheetId, oldSheetContent, values))
  }

  public undo() {
    if (this.undoRedo.isUndoStackEmpty()) {
      throw new NoOperationToUndoError()
    }
    this.clipboardOperations.abortCut()
    this.undoRedo.undo()
  }

  public redo() {
    if (this.undoRedo.isRedoStackEmpty()) {
      throw new NoOperationToRedoError()
    }
    this.clipboardOperations.abortCut()
    this.undoRedo.redo()
  }

  public ensureItIsPossibleToAddRows(sheet: number, ...indexes: Index[]): void {
    if (!this.sheetMapping.hasSheetWithId(sheet)) {
      throw new NoSheetWithIdError(sheet)
    }

    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const newRowsCount = indexes.map(index => index[1]).reduce((a, b) => a + b, 0)
    if (sheetHeight + newRowsCount > this.config.maxRows) {
      throw new SheetSizeLimitExceededError()
    }

    for (const [row, numberOfRowsToAdd] of indexes) {
      if (!isNonnegativeInteger(row) || !isPositiveInteger(numberOfRowsToAdd)) {
        throw new InvalidArgumentsError()
      }

      if (isPositiveInteger(row)
        && this.dependencyGraph.matrixMapping.isFormulaMatrixInRow(sheet, row - 1)
        && this.dependencyGraph.matrixMapping.isFormulaMatrixInRow(sheet, row)
      ) {
        throw Error('It is not possible to add row in row with matrix')
      }
    }
  }

  public ensureItIsPossibleToRemoveRows(sheet: number, ...indexes: Index[]): void {
    for (const [rowStart, numberOfRows] of indexes) {
      const rowEnd = rowStart + numberOfRows - 1
      if (!isNonnegativeInteger(rowStart) || !isNonnegativeInteger(rowEnd)) {
        throw new InvalidArgumentsError()
      }
      if (rowEnd < rowStart) {
        throw new InvalidArgumentsError()
      }
      const rowsToRemove = RowsSpan.fromRowStartAndEnd(sheet, rowStart, rowEnd)

      if (!this.sheetMapping.hasSheetWithId(sheet)) {
        throw new NoSheetWithIdError(sheet)
      }

      if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRows(rowsToRemove)) {
        throw Error('It is not possible to remove row with matrix')
      }
    }
  }

  public ensureItIsPossibleToAddColumns(sheet: number, ...indexes: Index[]): void {
    if (!this.sheetMapping.hasSheetWithId(sheet)) {
      throw new NoSheetWithIdError(sheet)
    }

    const sheetWidth = this.dependencyGraph.getSheetWidth(sheet)
    const newColumnsCount = indexes.map(index => index[1]).reduce((a, b) => a + b, 0)
    if (sheetWidth + newColumnsCount > this.config.maxColumns) {
      throw new SheetSizeLimitExceededError()
    }

    for (const [column, numberOfColumnsToAdd] of indexes) {
      if (!isNonnegativeInteger(column) || !isPositiveInteger(numberOfColumnsToAdd)) {
        throw new InvalidArgumentsError()
      }

      if (isPositiveInteger(column)
        && this.dependencyGraph.matrixMapping.isFormulaMatrixInColumn(sheet, column - 1)
        && this.dependencyGraph.matrixMapping.isFormulaMatrixInColumn(sheet, column)
      ) {
        throw Error('It is not possible to add column in column with matrix')
      }
    }
  }

  public ensureItIsPossibleToRemoveColumns(sheet: number, ...indexes: Index[]): void {
    for (const [columnStart, numberOfColumns] of indexes) {
      const columnEnd = columnStart + numberOfColumns - 1

      if (!isNonnegativeInteger(columnStart) || !isNonnegativeInteger(columnEnd)) {
        throw new InvalidArgumentsError()
      }
      if (columnEnd < columnStart) {
        throw new InvalidArgumentsError()
      }
      const columnsToRemove = ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart, columnEnd)

      if (!this.sheetMapping.hasSheetWithId(sheet)) {
        throw new NoSheetWithIdError(sheet)
      }

      if (this.dependencyGraph.matrixMapping.isFormulaMatrixInColumns(columnsToRemove)) {
        throw Error('It is not possible to remove column within matrix')
      }
    }
  }

  public ensureItIsPossibleToMoveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): void {
    this.ensureItIsPossibleToAddRows(sheet, [targetRow, numberOfRows])

    const sourceStart = simpleCellAddress(sheet, 0, startRow)
    const targetStart = simpleCellAddress(sheet, 0, targetRow)

    if (
      !this.sheetMapping.hasSheetWithId(sheet)
      || invalidSimpleCellAddress(sourceStart)
      || invalidSimpleCellAddress(targetStart)
      || !isPositiveInteger(numberOfRows)
      || (targetRow <= startRow + numberOfRows && targetRow >= startRow)
    ) {
      throw new InvalidArgumentsError()
    }

    const width = this.dependencyGraph.getSheetWidth(sheet)
    const sourceRange = AbsoluteCellRange.spanFrom(sourceStart, width, numberOfRows)

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(sourceRange)) {
      throw new Error('It is not possible to move matrix')
    }
  }

  public ensureItIsPossibleToMoveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): void {
    this.ensureItIsPossibleToAddColumns(sheet, [targetColumn, numberOfColumns])

    const sourceStart = simpleCellAddress(sheet, startColumn, 0)
    const targetStart = simpleCellAddress(sheet, targetColumn, 0)

    if (
      !this.sheetMapping.hasSheetWithId(sheet)
      || invalidSimpleCellAddress(sourceStart)
      || invalidSimpleCellAddress(targetStart)
      || !isPositiveInteger(numberOfColumns)
      || (targetColumn <= startColumn + numberOfColumns && targetColumn >= startColumn)
    ) {
      throw new InvalidArgumentsError()
    }

    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const sourceRange = AbsoluteCellRange.spanFrom(sourceStart, numberOfColumns, sheetHeight)

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(sourceRange)) {
      throw new Error('It is not possible to move matrix')
    }
  }

  public ensureItIsPossibleToAddSheet(name: string): void {
    if (this.sheetMapping.hasSheetWithName(name)) {
      throw Error(`Sheet with name ${name} already exists`)
    }
  }

  public ensureItIsPossibleToChangeContent(address: SimpleCellAddress): void {
    if (invalidSimpleCellAddress(address)) {
      throw new InvalidAddressError(address)
    }
    if (!this.sheetMapping.hasSheetWithId(address.sheet)) {
      throw new NoSheetWithIdError(address.sheet)
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixAtAddress(address)) {
      throw Error('It is not possible to change part of a matrix')
    }
  }

  public ensureItIsPossibleToChangeCellContents(address: SimpleCellAddress, content: RawCellContent[][]) {
    const boundaries = findBoundaries(content)
    const targetRange = AbsoluteCellRange.spanFrom(address, boundaries.width, boundaries.height)
    this.ensureRangeInSizeLimits(targetRange)
    for (const address of targetRange.addresses(this.dependencyGraph)) {
      this.ensureItIsPossibleToChangeContent(address)
    }
  }

  public ensureItIsPossibleToChangeSheetContents(sheetId: number, content: RawCellContent[][]) {
    const boundaries = findBoundaries(content)
    const targetRange = AbsoluteCellRange.spanFrom(simpleCellAddress(sheetId, 0, 0), boundaries.width, boundaries.height)
    this.ensureRangeInSizeLimits(targetRange)
  }

  public ensureRangeInSizeLimits(range: AbsoluteCellRange): void {
    if (range.exceedsSheetSizeLimits(this.config.maxColumns, this.config.maxRows)) {
      throw new SheetSizeLimitExceededError()
    }
  }

  public isThereSomethingToUndo() {
    return !this.undoRedo.isUndoStackEmpty()
  }

  public isThereSomethingToRedo() {
    return !this.undoRedo.isRedoStackEmpty()
  }

  public getAndClearContentChanges(): ContentChanges {
    return this.operations.getAndClearContentChanges()
  }

  public ensureSheetExists(sheetName: string): void {
    if (!this.sheetMapping.hasSheetWithName(sheetName)) {
      throw new NoSheetWithNameError(sheetName)
    }
  }

  private get addressMapping(): AddressMapping {
    return this.dependencyGraph.addressMapping
  }

  private get sheetMapping(): SheetMapping {
    return this.dependencyGraph.sheetMapping
  }
}

function isPositiveInteger(x: number): boolean {
  return Number.isInteger(x) && x > 0
}

function isNonnegativeInteger(x: number): boolean {
  return Number.isInteger(x) && x >= 0
}
