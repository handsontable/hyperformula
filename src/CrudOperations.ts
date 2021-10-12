/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, RawCellContent} from './CellContentParser'
import {ClipboardCell, ClipboardOperations} from './ClipboardOperations'
import {Config} from './Config'
import {ContentChanges} from './ContentChanges'
import {DependencyGraph, SheetMapping} from './DependencyGraph'
import {
  InvalidAddressError,
  InvalidArgumentsError,
  NamedExpressionDoesNotExistError,
  NamedExpressionNameIsAlreadyTakenError,
  NamedExpressionNameIsInvalidError,
  NoOperationToRedoError,
  NoOperationToUndoError,
  NoRelativeAddressesAllowedError,
  NoSheetWithIdError,
  NothingToPasteError,
  SheetNameAlreadyTakenError,
  SheetSizeLimitExceededError,
  SourceLocationHasArrayError,
  TargetLocationHasArrayError
} from './errors'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {Maybe} from './Maybe'
import {
  doesContainRelativeReferences,
  InternalNamedExpression,
  NamedExpressionOptions,
  NamedExpressions
} from './NamedExpressions'
import {AddColumnsCommand, AddRowsCommand, Operations, RemoveColumnsCommand, RemoveRowsCommand} from './Operations'
import {ParserWithCaching} from './parser'
import {findBoundaries, validateAsSheet} from './Sheet'
import {ColumnsSpan, RowsSpan} from './Span'
import {
  AddColumnsUndoEntry,
  AddNamedExpressionUndoEntry,
  AddRowsUndoEntry,
  AddSheetUndoEntry,
  ChangeNamedExpressionUndoEntry,
  ClearSheetUndoEntry,
  MoveCellsUndoEntry,
  MoveColumnsUndoEntry,
  MoveRowsUndoEntry,
  PasteUndoEntry,
  RemoveColumnsUndoEntry,
  RemoveNamedExpressionUndoEntry,
  RemoveRowsUndoEntry,
  RemoveSheetUndoEntry,
  RenameSheetUndoEntry,
  SetCellContentsUndoEntry,
  SetColumnOrderUndoEntry,
  SetRowOrderUndoEntry,
  SetSheetContentUndoEntry,
  UndoRedo
} from './UndoRedo'

export type ColumnRowIndex = [number, number]

export class CrudOperations {

  private readonly maxRows: number
  private readonly maxColumns: number

  constructor(
    config: Config,
    public readonly operations: Operations,
    public readonly undoRedo: UndoRedo,
    private readonly clipboardOperations: ClipboardOperations,
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
    private readonly parser: ParserWithCaching,
    private readonly cellContentParser: CellContentParser,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly namedExpressions: NamedExpressions,
  ) {
    this.maxRows = config.maxRows
    this.maxColumns = config.maxColumns
  }

  private get sheetMapping(): SheetMapping {
    return this.dependencyGraph.sheetMapping
  }

  public addRows(sheet: number, ...indexes: ColumnRowIndex[]): void {
    const addRowsCommand = new AddRowsCommand(sheet, indexes)
    this.ensureItIsPossibleToAddRows(sheet, ...indexes)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.operations.addRows(addRowsCommand)
    this.undoRedo.saveOperation(new AddRowsUndoEntry(addRowsCommand))
  }

  public removeRows(sheet: number, ...indexes: ColumnRowIndex[]): void {
    const removeRowsCommand = new RemoveRowsCommand(sheet, indexes)
    this.ensureItIsPossibleToRemoveRows(sheet, ...indexes)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const rowsRemovals = this.operations.removeRows(removeRowsCommand)
    this.undoRedo.saveOperation(new RemoveRowsUndoEntry(removeRowsCommand, rowsRemovals))
  }

  public addColumns(sheet: number, ...indexes: ColumnRowIndex[]): void {
    const addColumnsCommand = new AddColumnsCommand(sheet, indexes)
    this.ensureItIsPossibleToAddColumns(sheet, ...indexes)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.operations.addColumns(addColumnsCommand)
    this.undoRedo.saveOperation(new AddColumnsUndoEntry(addColumnsCommand))
  }

  public removeColumns(sheet: number, ...indexes: ColumnRowIndex[]): void {
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
    const {
      version,
      overwrittenCellsData,
      addedGlobalNamedExpressions
    } = this.operations.moveCells(sourceLeftCorner, width, height, destinationLeftCorner)
    this.undoRedo.saveOperation(new MoveCellsUndoEntry(sourceLeftCorner, width, height, destinationLeftCorner, overwrittenCellsData, addedGlobalNamedExpressions, version))
  }

  public moveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): void {
    this.ensureItIsPossibleToMoveRows(sheet, startRow, numberOfRows, targetRow)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const version = this.operations.moveRows(sheet, startRow, numberOfRows, targetRow)
    this.undoRedo.saveOperation(new MoveRowsUndoEntry(sheet, startRow, numberOfRows, targetRow, version))
  }

  public moveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): void {
    this.ensureItIsPossibleToMoveColumns(sheet, startColumn, numberOfColumns, targetColumn)
    this.undoRedo.clearRedoStack()
    const version = this.operations.moveColumns(sheet, startColumn, numberOfColumns, targetColumn)
    this.undoRedo.saveOperation(new MoveColumnsUndoEntry(sheet, startColumn, numberOfColumns, targetColumn, version))
  }

  public cut(sourceLeftCorner: SimpleCellAddress, width: number, height: number): void {
    this.clipboardOperations.cut(sourceLeftCorner, width, height)
  }

  public ensureItIsPossibleToCopy(sourceLeftCorner: SimpleCellAddress, width: number, height: number): void {
    if (!isPositiveInteger(width)) {
      throw new InvalidArgumentsError('width to be positive integer.')
    }
    if (!isPositiveInteger(height)) {
      throw new InvalidArgumentsError('height to be positive integer.')
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
      this.moveCells(clipboard.sourceLeftCorner, clipboard.width, clipboard.height, targetLeftCorner)
    } else if (this.clipboardOperations.isCopyClipboard()) {
      this.clipboardOperations.ensureItIsPossibleToCopyPaste(targetLeftCorner)
      const targetRange = AbsoluteCellRange.spanFrom(targetLeftCorner, clipboard.width, clipboard.height)
      const oldContent = this.operations.getRangeClipboardCells(targetRange)
      this.undoRedo.clearRedoStack()
      const addedGlobalNamedExpressions = this.operations.restoreClipboardCells(clipboard.sourceLeftCorner.sheet, clipboard.getContent(targetLeftCorner))
      this.undoRedo.saveOperation(new PasteUndoEntry(targetLeftCorner, oldContent, clipboard.content!, addedGlobalNamedExpressions))
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
    if (name !== undefined) {
      this.ensureItIsPossibleToAddSheet(name)
    }
    this.undoRedo.clearRedoStack()
    const addedSheetName = this.operations.addSheet(name)
    this.undoRedo.saveOperation(new AddSheetUndoEntry(addedSheetName))
    return addedSheetName
  }

  public removeSheet(sheetId: number): void {
    this.ensureScopeIdIsValid(sheetId)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const originalName = this.sheetMapping.fetchDisplayName(sheetId)
    const oldSheetContent = this.operations.getSheetClipboardCells(sheetId)
    const {version, scopedNamedExpressions} = this.operations.removeSheet(sheetId)
    this.undoRedo.saveOperation(new RemoveSheetUndoEntry(originalName, sheetId, oldSheetContent, scopedNamedExpressions, version))
  }

  public renameSheet(sheetId: number, newName: string): Maybe<string> {
    this.ensureItIsPossibleToRenameSheet(sheetId, newName)
    const oldName = this.operations.renameSheet(sheetId, newName)
    if (oldName !== undefined) {
      this.undoRedo.clearRedoStack()
      this.undoRedo.saveOperation(new RenameSheetUndoEntry(sheetId, oldName, newName))
    }
    return oldName
  }

  public clearSheet(sheetId: number): void {
    this.ensureScopeIdIsValid(sheetId)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
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
          throw new InvalidArgumentsError('an array of arrays or a raw cell value.')
        }
      }
    }

    this.ensureItIsPossibleToChangeCellContents(topLeftCornerAddress, cellContents)

    this.undoRedo.clearRedoStack()

    const oldContents: { address: SimpleCellAddress, newContent: RawCellContent, oldContent: [SimpleCellAddress, ClipboardCell] }[] = []

    for (let i = 0; i < cellContents.length; i++) {
      for (let j = 0; j < cellContents[i].length; j++) {
        const address = {
          sheet: topLeftCornerAddress.sheet,
          row: topLeftCornerAddress.row + i,
          col: topLeftCornerAddress.col + j,
        }
        const newContent = cellContents[i][j]
        this.clipboardOperations.abortCut()
        const oldContent = this.operations.setCellContent(address, newContent)
        oldContents.push({address, newContent, oldContent})
      }
    }

    this.undoRedo.saveOperation(new SetCellContentsUndoEntry(oldContents))
  }

  public setSheetContent(sheetId: number, values: RawCellContent[][]): void {
    this.ensureScopeIdIsValid(sheetId)
    this.ensureItIsPossibleToChangeSheetContents(sheetId, values)

    validateAsSheet(values)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const oldSheetContent = this.operations.getSheetClipboardCells(sheetId)
    this.operations.setSheetContent(sheetId, values)
    this.undoRedo.saveOperation(new SetSheetContentUndoEntry(sheetId, oldSheetContent, values))
  }

  public setRowOrder(sheetId: number, rowMapping: [number, number][]): void {
    this.validateSwapRowIndexes(sheetId, rowMapping)
    this.testRowOrderForArrays(sheetId, rowMapping)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const oldContent = this.operations.setRowOrder(sheetId, rowMapping)
    this.undoRedo.saveOperation(new SetRowOrderUndoEntry(sheetId, rowMapping, oldContent))
  }

  public validateSwapRowIndexes(sheetId: number, rowMapping: [number, number][]): void {
    if (!this.sheetMapping.hasSheetWithId(sheetId)) {
      throw new NoSheetWithIdError(sheetId)
    }
    this.validateRowOrColumnMapping(sheetId, rowMapping, 'row')
  }

  public testColumnOrderForArrays(sheetId: number, columnMapping: [number, number][]): void {
    for (const [source, target] of columnMapping) {
      if (source !== target) {
        const rowRange = AbsoluteCellRange.spanFrom({sheet: sheetId, col: source, row: 0}, 1, Infinity)
        if (this.dependencyGraph.arrayMapping.isFormulaArrayInRange(rowRange)) {
          throw new SourceLocationHasArrayError()
        }
      }
    }
  }

  public setColumnOrder(sheetId: number, columnMapping: [number, number][]): void {
    this.validateSwapColumnIndexes(sheetId, columnMapping)
    this.testColumnOrderForArrays(sheetId, columnMapping)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const oldContent = this.operations.setColumnOrder(sheetId, columnMapping)
    this.undoRedo.saveOperation(new SetColumnOrderUndoEntry(sheetId, columnMapping, oldContent))
  }

  public validateSwapColumnIndexes(sheetId: number, columnMapping: [number, number][]): void {
    if (!this.sheetMapping.hasSheetWithId(sheetId)) {
      throw new NoSheetWithIdError(sheetId)
    }
    this.validateRowOrColumnMapping(sheetId, columnMapping, 'column')
  }

  public testRowOrderForArrays(sheetId: number, rowMapping: [number, number][]): void {
    for (const [source, target] of rowMapping) {
      if (source !== target) {
        const rowRange = AbsoluteCellRange.spanFrom({sheet: sheetId, col: 0, row: source}, Infinity, 1)
        if (this.dependencyGraph.arrayMapping.isFormulaArrayInRange(rowRange)) {
          throw new SourceLocationHasArrayError()
        }
      }
    }
  }

  public mappingFromOrder(sheetId: number, newOrder: number[], rowOrColumn: 'row' | 'column'): [number, number][] {
    if (!this.sheetMapping.hasSheetWithId(sheetId)) {
      throw new NoSheetWithIdError(sheetId)
    }
    const limit = rowOrColumn === 'row' ? this.dependencyGraph.getSheetHeight(sheetId) : this.dependencyGraph.getSheetWidth(sheetId)
    if (newOrder.length !== limit) {
      throw new InvalidArgumentsError(`number of ${rowOrColumn}s provided to be sheet ${rowOrColumn === 'row' ? 'height' : 'width'}.`)
    }
    const ret: [number, number][] = []
    for (let i = 0; i < limit; i++) {
      if (newOrder[i] !== i) {
        ret.push([i, newOrder[i]])
      }
    }
    return ret
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

  public addNamedExpression(expressionName: string, expression: RawCellContent, sheetId?: number, options?: NamedExpressionOptions) {
    this.ensureItIsPossibleToAddNamedExpression(expressionName, expression, sheetId)
    this.operations.addNamedExpression(expressionName, expression, sheetId, options)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.undoRedo.saveOperation(new AddNamedExpressionUndoEntry(expressionName, expression, sheetId, options))
  }

  public changeNamedExpressionExpression(expressionName: string, sheetId: number | undefined, newExpression: RawCellContent, options?: NamedExpressionOptions) {
    this.ensureItIsPossibleToChangeNamedExpression(expressionName, newExpression, sheetId)
    const [oldNamedExpression, content] = this.operations.changeNamedExpressionExpression(expressionName, newExpression, sheetId, options)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.undoRedo.saveOperation(new ChangeNamedExpressionUndoEntry(oldNamedExpression, newExpression, content, sheetId, options))
  }

  public removeNamedExpression(expressionName: string, sheetId?: number): InternalNamedExpression {
    this.ensureScopeIdIsValid(sheetId)
    const [namedExpression, content] = this.operations.removeNamedExpression(expressionName, sheetId)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.undoRedo.saveOperation(new RemoveNamedExpressionUndoEntry(namedExpression, content, sheetId))

    return namedExpression
  }

  public ensureItIsPossibleToAddNamedExpression(expressionName: string, expression: RawCellContent, sheetId?: number): void {
    this.ensureScopeIdIsValid(sheetId)
    this.ensureNamedExpressionNameIsValid(expressionName, sheetId)
    this.ensureNamedExpressionIsValid(expression)
  }

  public ensureItIsPossibleToChangeNamedExpression(expressionName: string, expression: RawCellContent, sheetId?: number): void {
    this.ensureScopeIdIsValid(sheetId)
    if (this.namedExpressions.namedExpressionForScope(expressionName, sheetId) === undefined) {
      throw new NamedExpressionDoesNotExistError(expressionName)
    }
    this.ensureNamedExpressionIsValid(expression)
  }

  public isItPossibleToRemoveNamedExpression(expressionName: string, sheetId?: number): void {
    this.ensureScopeIdIsValid(sheetId)
    if (this.namedExpressions.namedExpressionForScope(expressionName, sheetId) === undefined) {
      throw new NamedExpressionDoesNotExistError(expressionName)
    }
  }

  public ensureItIsPossibleToAddRows(sheet: number, ...indexes: ColumnRowIndex[]): void {
    if (!this.sheetMapping.hasSheetWithId(sheet)) {
      throw new NoSheetWithIdError(sheet)
    }

    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const newRowsCount = indexes.map(index => index[1]).reduce((a, b) => a + b, 0)
    if (sheetHeight + newRowsCount > this.maxRows) {
      throw new SheetSizeLimitExceededError()
    }

    for (const [row, numberOfRowsToAdd] of indexes) {
      if (!isNonnegativeInteger(row) || !isPositiveInteger(numberOfRowsToAdd)) {
        throw new InvalidArgumentsError('row number to be nonnegative and number of rows to add to be positive.')
      }
    }
  }

  public ensureItIsPossibleToRemoveRows(sheet: number, ...indexes: ColumnRowIndex[]): void {
    for (const [rowStart, numberOfRows] of indexes) {
      const rowEnd = rowStart + numberOfRows - 1
      if (!isNonnegativeInteger(rowStart) || !isNonnegativeInteger(rowEnd)) {
        throw new InvalidArgumentsError('starting and ending row to be nonnegative.')
      }
      if (rowEnd < rowStart) {
        throw new InvalidArgumentsError('starting row to be smaller than the ending row.')
      }
      if (!this.sheetMapping.hasSheetWithId(sheet)) {
        throw new NoSheetWithIdError(sheet)
      }
    }
  }

  public ensureItIsPossibleToAddColumns(sheet: number, ...indexes: ColumnRowIndex[]): void {
    if (!this.sheetMapping.hasSheetWithId(sheet)) {
      throw new NoSheetWithIdError(sheet)
    }

    const sheetWidth = this.dependencyGraph.getSheetWidth(sheet)
    const newColumnsCount = indexes.map(index => index[1]).reduce((a, b) => a + b, 0)
    if (sheetWidth + newColumnsCount > this.maxColumns) {
      throw new SheetSizeLimitExceededError()
    }

    for (const [column, numberOfColumnsToAdd] of indexes) {
      if (!isNonnegativeInteger(column) || !isPositiveInteger(numberOfColumnsToAdd)) {
        throw new InvalidArgumentsError('column number to be nonnegative and number of columns to add to be positive.')
      }
    }
  }

  public ensureItIsPossibleToRemoveColumns(sheet: number, ...indexes: ColumnRowIndex[]): void {
    for (const [columnStart, numberOfColumns] of indexes) {
      const columnEnd = columnStart + numberOfColumns - 1

      if (!isNonnegativeInteger(columnStart) || !isNonnegativeInteger(columnEnd)) {
        throw new InvalidArgumentsError('starting and ending column to be nonnegative.')
      }
      if (columnEnd < columnStart) {
        throw new InvalidArgumentsError('starting column to be smaller than the ending column.')
      }
      if (!this.sheetMapping.hasSheetWithId(sheet)) {
        throw new NoSheetWithIdError(sheet)
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
      throw new InvalidArgumentsError('a valid range of rows to move.')
    }

    const width = this.dependencyGraph.getSheetWidth(sheet)
    const sourceRange = AbsoluteCellRange.spanFrom(sourceStart, width, numberOfRows)

    if (this.dependencyGraph.arrayMapping.isFormulaArrayInRange(sourceRange)) {
      throw new SourceLocationHasArrayError()
    }
    if (targetRow > 0 && this.dependencyGraph.arrayMapping.isFormulaArrayInAllRows(RowsSpan.fromNumberOfRows(sheet, targetRow - 1, 2))) {
      throw new TargetLocationHasArrayError()
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
      throw new InvalidArgumentsError('a valid range of columns to move.')
    }

    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const sourceRange = AbsoluteCellRange.spanFrom(sourceStart, numberOfColumns, sheetHeight)

    if (this.dependencyGraph.arrayMapping.isFormulaArrayInRange(sourceRange)) {
      throw new SourceLocationHasArrayError()
    }
    if (targetColumn > 0 && this.dependencyGraph.arrayMapping.isFormulaArrayInAllColumns(ColumnsSpan.fromNumberOfColumns(sheet, targetColumn - 1, 2))) {
      throw new TargetLocationHasArrayError()
    }
  }

  public ensureItIsPossibleToAddSheet(name: string): void {
    if (this.sheetMapping.hasSheetWithName(name)) {
      throw new SheetNameAlreadyTakenError(name)
    }
  }

  public ensureItIsPossibleToRenameSheet(sheetId: number, name: string): void {
    if (!this.sheetMapping.hasSheetWithId(sheetId)) {
      throw new NoSheetWithIdError(sheetId)
    }

    const existingSheetId = this.sheetMapping.get(name)
    if (existingSheetId !== undefined && existingSheetId !== sheetId) {
      throw new SheetNameAlreadyTakenError(name)
    }
  }

  public ensureItIsPossibleToChangeContent(address: SimpleCellAddress): void {
    if (invalidSimpleCellAddress(address)) {
      throw new InvalidAddressError(address)
    }
    if (!this.sheetMapping.hasSheetWithId(address.sheet)) {
      throw new NoSheetWithIdError(address.sheet)
    }
  }

  public ensureItIsPossibleToChangeCellContents(inputAddress: SimpleCellAddress, content: RawCellContent[][]) {
    const boundaries = findBoundaries(content)
    const targetRange = AbsoluteCellRange.spanFrom(inputAddress, boundaries.width, boundaries.height)
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
    if (range.exceedsSheetSizeLimits(this.maxColumns, this.maxRows)) {
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

  public ensureScopeIdIsValid(scopeId?: number): void {
    if (scopeId !== undefined && !this.sheetMapping.hasSheetWithId(scopeId)) {
      throw new NoSheetWithIdError(scopeId)
    }
  }

  private validateRowOrColumnMapping(sheetId: number, rowMapping: [number, number][], rowOrColumn: 'row' | 'column'): void {
    const limit = rowOrColumn === 'row' ? this.dependencyGraph.getSheetHeight(sheetId) : this.dependencyGraph.getSheetWidth(sheetId)
    const sources = rowMapping.map(([a, _]) => a).sort((a, b) => a - b)
    const targets = rowMapping.map(([_, b]) => b).sort((a, b) => a - b)

    for (let i = 0; i < sources.length; i++) {
      if (!isNonnegativeInteger(sources[i]) || sources[i] >= limit) {
        throw new InvalidArgumentsError(`${rowOrColumn} numbers to be nonnegative integers and less than sheet ${rowOrColumn === 'row' ? 'height' : 'width'}.`)
      }
      if (sources[i] === sources[i + 1]) {
        throw new InvalidArgumentsError(`source ${rowOrColumn} numbers to be unique.`)
      }
      if (sources[i] !== targets[i]) {
        throw new InvalidArgumentsError(`target ${rowOrColumn} numbers to be permutation of source ${rowOrColumn} numbers.`)
      }
    }
  }

  private ensureNamedExpressionNameIsValid(expressionName: string, sheetId?: number) {
    if (!this.namedExpressions.isNameValid(expressionName)) {
      throw new NamedExpressionNameIsInvalidError(expressionName)
    }
    if (!this.namedExpressions.isNameAvailable(expressionName, sheetId)) {
      throw new NamedExpressionNameIsAlreadyTakenError(expressionName)
    }
  }

  private ensureNamedExpressionIsValid(expression: RawCellContent): void {
    const parsedExpression = this.cellContentParser.parse(expression)
    if (parsedExpression instanceof CellContent.Formula) {
      const parsingResult = this.parser.parse(parsedExpression.formula, simpleCellAddress(-1, 0, 0))
      if (doesContainRelativeReferences(parsingResult.ast)) {
        throw new NoRelativeAddressesAllowedError()
      }
    }
  }
}

function isPositiveInteger(x: number): boolean {
  return Number.isInteger(x) && x > 0
}

function isNonnegativeInteger(x: number): boolean {
  return Number.isInteger(x) && x >= 0
}
