/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, isMatrix, RawCellContent} from './CellContentParser'
import {ClipboardCell, ClipboardOperations} from './ClipboardOperations'
import {AddColumnsCommand, AddRowsCommand, Operations, RemoveColumnsCommand, RemoveRowsCommand} from './Operations'
import {ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config} from './Config'
import {ContentChanges} from './ContentChanges'
import {DependencyGraph, SheetMapping} from './DependencyGraph'
import {
  doesContainRelativeReferences,
  InternalNamedExpression,
  NamedExpressionOptions,
  NamedExpressions
} from './NamedExpressions'
import {
  InvalidAddressError,
  InvalidArgumentsError,
  MatrixFormulasNotSupportedError,
  NamedExpressionDoesNotExistError,
  NamedExpressionNameIsAlreadyTakenError,
  NamedExpressionNameIsInvalidError,
  NoOperationToRedoError,
  NoOperationToUndoError,
  NoRelativeAddressesAllowedError,
  NoSheetWithIdError,
  NoSheetWithNameError,
  NothingToPasteError,
  SheetNameAlreadyTakenError,
  SheetSizeLimitExceededError,
  SourceLocationHasMatrixError,
  TargetLocationHasMatrixError
} from './errors'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ParserWithCaching} from './parser'
import {ColumnsSpan, RowsSpan} from './Span'
import {Statistics} from './statistics'
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
  SetSheetContentUndoEntry,
  UndoRedo
} from './UndoRedo'
import {findBoundaries, validateAsSheet} from './Sheet'
import {Maybe} from './Maybe'

export type ColumnRowIndex = [number, number]

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
    /** Storage for named expressions */
    private readonly namedExpressions: NamedExpressions,
  ) {
    this.operations = new Operations(this.dependencyGraph, this.columnSearch, this.cellContentParser, this.parser, this.stats, this.lazilyTransformingAstService, this.namedExpressions, this.config)
    this.clipboardOperations = new ClipboardOperations(this.dependencyGraph, this.operations, this.parser, this.lazilyTransformingAstService, this.config)
    this.undoRedo = new UndoRedo(this.config, this.operations)
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
    const {version, overwrittenCellsData, addedGlobalNamedExpressions} = this.operations.moveCells(sourceLeftCorner, width, height, destinationLeftCorner)
    this.undoRedo.saveOperation(new MoveCellsUndoEntry(sourceLeftCorner, width, height, destinationLeftCorner, overwrittenCellsData, addedGlobalNamedExpressions, version))
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
      this.moveCells(clipboard.sourceLeftCorner, clipboard.width, clipboard.height, targetLeftCorner)
    } else if (this.clipboardOperations.isCopyClipboard()) {
      this.clipboardOperations.ensureItIsPossibleToCopyPaste(targetLeftCorner)
      const targetRange = AbsoluteCellRange.spanFrom(targetLeftCorner, clipboard.width, clipboard.height)
      const oldContent = this.operations.getRangeClipboardCells(targetRange)
      this.undoRedo.clearRedoStack()
      this.dependencyGraph.breakNumericMatricesInRange(targetRange)
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

  public renameSheet(sheetId: number, newName: string): Maybe<string> {
    this.ensureItIsPossibleToRenameSheet(sheetId, newName)
    const oldName = this.operations.renameSheet(sheetId, newName)
    if (oldName !== undefined) {
      this.undoRedo.clearRedoStack()
      this.undoRedo.saveOperation(new RenameSheetUndoEntry(sheetId, oldName, newName))
    }
    return oldName
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
        modifiedCellContents.push({address, newContent: cellContents[i][j], oldContent})
      }
    }
    this.undoRedo.saveOperation(new SetCellContentsUndoEntry(modifiedCellContents))
  }

  public setSheetContent(sheetName: string, values: RawCellContent[][]): void {
    this.ensureSheetExists(sheetName)
    const sheetId = this.sheetMapping.fetch(sheetName)
    this.ensureItIsPossibleToChangeSheetContents(sheetId, values)

    validateAsSheet(values)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    const oldSheetContent = this.operations.getSheetClipboardCells(sheetId)
    this.operations.setSheetContent(sheetId, values)
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

  public addNamedExpression(expressionName: string, expression: RawCellContent, sheetScope?: string, options?: NamedExpressionOptions) {
    const sheetId = this.scopeId(sheetScope)
    this.ensureNamedExpressionNameIsValid(expressionName, sheetId)
    this.operations.addNamedExpression(expressionName, expression, sheetId, options)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.undoRedo.saveOperation(new AddNamedExpressionUndoEntry(expressionName, expression, sheetId, options))
  }

  public changeNamedExpressionExpression(expressionName: string, sheetScope: string | undefined, newExpression: RawCellContent, options?: NamedExpressionOptions) {
    const sheetId = this.scopeId(sheetScope)
    const [oldNamedExpression, content] = this.operations.changeNamedExpressionExpression(expressionName, newExpression, sheetId, options)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.undoRedo.saveOperation(new ChangeNamedExpressionUndoEntry(oldNamedExpression, newExpression, content, sheetId, options))
  }

  public removeNamedExpression(expressionName: string, sheetScope: string | undefined): InternalNamedExpression {
    const sheetId = this.scopeId(sheetScope)
    const [namedExpression, content] = this.operations.removeNamedExpression(expressionName, sheetId)
    this.undoRedo.clearRedoStack()
    this.clipboardOperations.abortCut()
    this.undoRedo.saveOperation(new RemoveNamedExpressionUndoEntry(namedExpression, content, sheetId))

    return namedExpression
  }

  public ensureItIsPossibleToAddNamedExpression(expressionName: string, expression: RawCellContent, sheetScope?: string): void {
    const scopeId = this.scopeId(sheetScope)
    this.ensureNamedExpressionNameIsValid(expressionName, scopeId)
    this.ensureNamedExpressionIsValid(expression)
  }

  public ensureItIsPossibleToChangeNamedExpression(expressionName: string, expression: RawCellContent, sheetScope?: string): void {
    const scopeId = this.scopeId(sheetScope)
    if (this.namedExpressions.namedExpressionForScope(expressionName, scopeId) === undefined) {
      throw new NamedExpressionDoesNotExistError(expressionName)
    }
    this.ensureNamedExpressionIsValid(expression)
  }

  public isItPossibleToRemoveNamedExpression(expressionName: string, sheetScope?: string): void {
    const scopeId = this.scopeId(sheetScope)
    if (this.namedExpressions.namedExpressionForScope(expressionName, scopeId) === undefined) {
      throw new NamedExpressionDoesNotExistError(expressionName)
    }
  }

  public ensureItIsPossibleToAddRows(sheet: number, ...indexes: ColumnRowIndex[]): void {
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
        throw new TargetLocationHasMatrixError()
      }
    }
  }

  public ensureItIsPossibleToRemoveRows(sheet: number, ...indexes: ColumnRowIndex[]): void {
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
        throw new SourceLocationHasMatrixError()
      }
    }
  }

  public ensureItIsPossibleToAddColumns(sheet: number, ...indexes: ColumnRowIndex[]): void {
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
        throw new TargetLocationHasMatrixError()
      }
    }
  }

  public ensureItIsPossibleToRemoveColumns(sheet: number, ...indexes: ColumnRowIndex[]): void {
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
        throw new SourceLocationHasMatrixError()
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
      throw new SourceLocationHasMatrixError()
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
      throw new SourceLocationHasMatrixError()
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

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixAtAddress(address)) {
      throw new SourceLocationHasMatrixError()
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

  public scopeId(sheetName: string | undefined): number | undefined {
    if (sheetName !== undefined) {
      this.ensureSheetExists(sheetName)
      return this.sheetMapping.fetch(sheetName)
    }
    return undefined
  }

  private get sheetMapping(): SheetMapping {
    return this.dependencyGraph.sheetMapping
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
    if (parsedExpression instanceof CellContent.MatrixFormula) {
      throw new MatrixFormulasNotSupportedError()
    } else if (parsedExpression instanceof CellContent.Formula) {
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
