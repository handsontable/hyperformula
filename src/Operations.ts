/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import { AbsoluteCellRange } from './AbsoluteCellRange'
import { absolutizeDependencies, filterDependenciesOutOfScope } from './absolutizeDependencies'
import { ArraySize, ArraySizePredictor } from './ArraySize'
import { equalSimpleCellAddress, isColOrRowInvalid, simpleCellAddress, SimpleCellAddress } from './Cell'
import { CellContent, CellContentParser, RawCellContent } from './CellContentParser'
import { ClipboardCell, ClipboardCellType } from './ClipboardOperations'
import { Config } from './Config'
import { ContentChanges } from './ContentChanges'
import { ColumnRowIndex } from './CrudOperations'
import {
  AddressMapping,
  ArrayFormulaVertex,
  CellVertex,
  DependencyGraph,
  EmptyCellVertex,
  ScalarFormulaVertex,
  ParsingErrorVertex,
  SheetMapping,
  SparseStrategy,
  ValueCellVertex,
} from './DependencyGraph'
import { FormulaVertex } from './DependencyGraph/FormulaVertex'
import { RawAndParsedValue, ValueCellVertexValue } from './DependencyGraph/ValueCellVertex'
import { AddColumnsTransformer } from './dependencyTransformers/AddColumnsTransformer'
import { AddRowsTransformer } from './dependencyTransformers/AddRowsTransformer'
import { CleanOutOfScopeDependenciesTransformer } from './dependencyTransformers/CleanOutOfScopeDependenciesTransformer'
import { MoveCellsTransformer } from './dependencyTransformers/MoveCellsTransformer'
import { RemoveColumnsTransformer } from './dependencyTransformers/RemoveColumnsTransformer'
import { RemoveRowsTransformer } from './dependencyTransformers/RemoveRowsTransformer'
import { RenameSheetTransformer } from './dependencyTransformers/RenameSheetTransformer'
import {
  InvalidArgumentsError,
  NamedExpressionDoesNotExistError,
  NoRelativeAddressesAllowedError,
  SheetSizeLimitExceededError,
  SourceLocationHasArrayError,
  TargetLocationHasArrayError
} from './errors'
import { EmptyValue, getRawValue } from './interpreter/InterpreterValue'
import { LazilyTransformingAstService } from './LazilyTransformingAstService'
import { ColumnSearchStrategy } from './Lookup/SearchStrategy'
import { Maybe } from './Maybe'
import {
  doesContainRelativeReferences,
  InternalNamedExpression,
  NamedExpressionOptions,
  NamedExpressions
} from './NamedExpressions'
import { NamedExpressionDependency, ParserWithCaching, ParsingErrorType, RelativeDependency } from './parser'
import { ParsingError } from './parser/Ast'
import { ParsingResult } from './parser/ParserWithCaching'
import { ColumnsSpan, RowsSpan } from './Span'
import { Statistics, StatType } from './statistics'

export class RemoveRowsCommand {
  constructor(
    public readonly sheet: number,
    public readonly indexes: ColumnRowIndex[]
  ) {
  }

  public normalizedIndexes(): ColumnRowIndex[] {
    return normalizeRemovedIndexes(this.indexes)
  }

  public rowsSpans(): RowsSpan[] {
    return this.normalizedIndexes().map(normalizedIndex =>
      RowsSpan.fromNumberOfRows(this.sheet, normalizedIndex[0], normalizedIndex[1])
    )
  }
}

export class AddRowsCommand {
  constructor(
    public readonly sheet: number,
    public readonly indexes: ColumnRowIndex[]
  ) {
  }

  public normalizedIndexes(): ColumnRowIndex[] {
    return normalizeAddedIndexes(this.indexes)
  }

  public rowsSpans(): RowsSpan[] {
    return this.normalizedIndexes().map(normalizedIndex =>
      RowsSpan.fromNumberOfRows(this.sheet, normalizedIndex[0], normalizedIndex[1])
    )
  }
}

export class AddColumnsCommand {
  constructor(
    public readonly sheet: number,
    public readonly indexes: ColumnRowIndex[]
  ) {
  }

  public normalizedIndexes(): ColumnRowIndex[] {
    return normalizeAddedIndexes(this.indexes)
  }

  public columnsSpans(): ColumnsSpan[] {
    return this.normalizedIndexes().map(normalizedIndex =>
      ColumnsSpan.fromNumberOfColumns(this.sheet, normalizedIndex[0], normalizedIndex[1])
    )
  }
}

export class RemoveColumnsCommand {
  constructor(
    public readonly sheet: number,
    public readonly indexes: ColumnRowIndex[]
  ) {
  }

  public normalizedIndexes(): ColumnRowIndex[] {
    return normalizeRemovedIndexes(this.indexes)
  }

  public columnsSpans(): ColumnsSpan[] {
    return this.normalizedIndexes().map(normalizedIndex =>
      ColumnsSpan.fromNumberOfColumns(this.sheet, normalizedIndex[0], normalizedIndex[1])
    )
  }
}

export interface ChangedCell {
  address: SimpleCellAddress,
  cellType: ClipboardCell,
}

export interface RowsRemoval {
  rowFrom: number,
  rowCount: number,
  version: number,
  removedCells: ChangedCell[],
}

export interface ColumnsRemoval {
  columnFrom: number,
  columnCount: number,
  version: number,
  removedCells: ChangedCell[],
}

export interface MoveCellsResult {
  version: number,
  overwrittenCellsData: [SimpleCellAddress, ClipboardCell][],
  addedGlobalNamedExpressions: string[],
}

export class Operations {
  private changes: ContentChanges = ContentChanges.empty()
  private readonly maxRows: number
  private readonly maxColumns: number

  constructor(
    config: Config,
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
    private readonly cellContentParser: CellContentParser,
    private readonly parser: ParserWithCaching,
    private readonly stats: Statistics,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly namedExpressions: NamedExpressions,
    private readonly arraySizePredictor: ArraySizePredictor,
  ) {
    this.allocateNamedExpressionAddressSpace()
    this.maxColumns = config.maxColumns
    this.maxRows = config.maxRows
  }

  private get sheetMapping(): SheetMapping {
    return this.dependencyGraph.sheetMapping
  }

  private get addressMapping(): AddressMapping {
    return this.dependencyGraph.addressMapping
  }

  public removeRows(cmd: RemoveRowsCommand): RowsRemoval[] {
    const rowsRemovals: RowsRemoval[] = []
    for (const rowsToRemove of cmd.rowsSpans()) {
      const rowsRemoval = this.doRemoveRows(rowsToRemove)
      if (rowsRemoval) {
        rowsRemovals.push(rowsRemoval)
      }
    }
    return rowsRemovals
  }

  public addRows(cmd: AddRowsCommand) {
    for (const addedRows of cmd.rowsSpans()) {
      this.doAddRows(addedRows)
    }
  }

  public addColumns(cmd: AddColumnsCommand) {
    for (const addedColumns of cmd.columnsSpans()) {
      this.doAddColumns(addedColumns)
    }
  }

  public removeColumns(cmd: RemoveColumnsCommand): ColumnsRemoval[] {
    const columnsRemovals: ColumnsRemoval[] = []
    for (const columnsToRemove of cmd.columnsSpans()) {
      const columnsRemoval = this.doRemoveColumns(columnsToRemove)
      if (columnsRemoval) {
        columnsRemovals.push(columnsRemoval)
      }
    }
    return columnsRemovals
  }

  /**
   * Clears the sheet content.
   */
  public clearSheet(sheetId: number) {
    this.dependencyGraph.clearSheet(sheetId)
    this.columnSearch.removeSheet(sheetId)
  }

  /**
   * Adds a new sheet to the workbook.
   */
  public addSheet(name?: string): { sheetName: string, sheetId: number } {
    const sheetId = this.sheetMapping.addSheet(name)
    this.dependencyGraph.addSheet(sheetId)
    return { sheetName: this.sheetMapping.getSheetNameOrThrowError(sheetId), sheetId }
  }

  /**
   * Adds a sheet with a specific ID for redo operations.
   */
  public addSheetWithId(sheetId: number, name: string): void {
    this.sheetMapping.addSheetWithId(sheetId, name)
    this.dependencyGraph.addSheet(sheetId)
  }

  /**
   * Adds a placeholder sheet with a specific ID for undo operations.
   * Used to restore previously merged placeholder sheets.
   *
   * Note: Unlike `addSheetWithId`, this does NOT call `dependencyGraph.addSheet()`
   * because placeholders don't need dirty marking or strategy changes - they only
   * need to exist in the mappings so formulas can reference them again.
   */
  public addPlaceholderSheetWithId(sheetId: number, name: string): void {
    this.sheetMapping.addPlaceholderWithId(sheetId, name)
    this.addressMapping.addSheetStrategyPlaceholderIfNotExists(sheetId)
  }

  /**
   * Removes a sheet from the workbook.
   */
  public removeSheet(sheetId: number): [InternalNamedExpression, ClipboardCell][] {
    this.dependencyGraph.removeSheet(sheetId)
    this.columnSearch.removeSheet(sheetId)
    const scopedNamedExpressions = this.namedExpressions.getAllNamedExpressionsForScope(sheetId).map(
      (namedExpression) => this.removeNamedExpression(namedExpression.normalizeExpressionName(), sheetId)
    )
    return scopedNamedExpressions
  }

  /**
   * Removes a sheet from the workbook by name.
   */
  public removeSheetByName(sheetName: string) {
    const sheetId = this.sheetMapping.getSheetIdOrThrowError(sheetName)
    return this.removeSheet(sheetId)
  }

  /**
   * Renames a sheet in the workbook.
   */
  public renameSheet(sheetId: number, newName: string): {
    previousDisplayName: Maybe<string>,
    version?: number,
    mergedPlaceholderSheetId?: number,
  } {
    const { previousDisplayName, mergedWithPlaceholderSheet } = this.sheetMapping.renameSheet(sheetId, newName)

    let version: number | undefined
    if (mergedWithPlaceholderSheet !== undefined) {
      this.dependencyGraph.mergeSheets(sheetId, mergedWithPlaceholderSheet)
      this.stats.measure(StatType.TRANSFORM_ASTS, () => {
        const transformation = new RenameSheetTransformer(sheetId, mergedWithPlaceholderSheet)
        transformation.performEagerTransformations(this.dependencyGraph, this.parser)
        version = this.lazilyTransformingAstService.addTransformation(transformation)
      })
    }

    return {
      previousDisplayName,
      version,
      mergedPlaceholderSheetId: mergedWithPlaceholderSheet,
    }
  }

  public moveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): number {
    const rowsToAdd = RowsSpan.fromNumberOfRows(sheet, targetRow, numberOfRows)
    this.lazilyTransformingAstService.beginCombinedMode(sheet)

    this.doAddRows(rowsToAdd)

    if (targetRow < startRow) {
      startRow += numberOfRows
    }

    const startAddress = simpleCellAddress(sheet, 0, startRow)
    const targetAddress = simpleCellAddress(sheet, 0, targetRow)
    this.moveCells(startAddress, Number.POSITIVE_INFINITY, numberOfRows, targetAddress)
    const rowsToRemove = RowsSpan.fromNumberOfRows(sheet, startRow, numberOfRows)
    this.doRemoveRows(rowsToRemove)

    return this.lazilyTransformingAstService.commitCombinedMode()
  }

  public moveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): number {
    const columnsToAdd = ColumnsSpan.fromNumberOfColumns(sheet, targetColumn, numberOfColumns)
    this.lazilyTransformingAstService.beginCombinedMode(sheet)

    this.doAddColumns(columnsToAdd)

    if (targetColumn < startColumn) {
      startColumn += numberOfColumns
    }

    const startAddress = simpleCellAddress(sheet, startColumn, 0)
    const targetAddress = simpleCellAddress(sheet, targetColumn, 0)
    this.moveCells(startAddress, numberOfColumns, Number.POSITIVE_INFINITY, targetAddress)
    const columnsToRemove = ColumnsSpan.fromNumberOfColumns(sheet, startColumn, numberOfColumns)
    this.doRemoveColumns(columnsToRemove)

    return this.lazilyTransformingAstService.commitCombinedMode()
  }

  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): MoveCellsResult {
    this.ensureItIsPossibleToMoveCells(sourceLeftCorner, width, height, destinationLeftCorner)

    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    const toRight = destinationLeftCorner.col - sourceLeftCorner.col
    const toBottom = destinationLeftCorner.row - sourceLeftCorner.row
    const toSheet = destinationLeftCorner.sheet

    const currentDataAtTarget = this.getRangeClipboardCells(targetRange)

    const valuesToRemove = this.dependencyGraph.rawValuesFromRange(targetRange)
    this.columnSearch.removeValues(valuesToRemove)
    const valuesToMove = this.dependencyGraph.rawValuesFromRange(sourceRange)
    this.columnSearch.moveValues(valuesToMove, toRight, toBottom, toSheet)

    let version = 0
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new MoveCellsTransformer(sourceRange, toRight, toBottom, toSheet)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.dependencyGraph.moveCells(sourceRange, toRight, toBottom, toSheet)

    const addedGlobalNamedExpressions = this.updateNamedExpressionsForMovedCells(sourceLeftCorner, width, height, destinationLeftCorner)

    return {
      version: version,
      overwrittenCellsData: currentDataAtTarget,
      addedGlobalNamedExpressions: addedGlobalNamedExpressions
    }
  }

  public setRowOrder(sheetId: number, rowMapping: [number, number][]): [SimpleCellAddress, ClipboardCell][] {
    const buffer: [SimpleCellAddress, ClipboardCell][][] = []
    let oldContent: [SimpleCellAddress, ClipboardCell][] = []
    for (const [source, target] of rowMapping) {
      if (source !== target) {
        const rowRange = AbsoluteCellRange.spanFrom({ sheet: sheetId, col: 0, row: source }, Infinity, 1)
        const row = this.getRangeClipboardCells(rowRange)
        oldContent = oldContent.concat(row)
        buffer.push(
          row.map(
            ([{ sheet, col }, cell]) => [{ sheet, col, row: target }, cell]
          )
        )
      }
    }
    buffer.forEach(
      row => this.restoreClipboardCells(sheetId, row.values())
    )
    return oldContent
  }

  public setColumnOrder(sheetId: number, columnMapping: [number, number][]): [SimpleCellAddress, ClipboardCell][] {
    const buffer: [SimpleCellAddress, ClipboardCell][][] = []
    let oldContent: [SimpleCellAddress, ClipboardCell][] = []
    for (const [source, target] of columnMapping) {
      if (source !== target) {
        const rowRange = AbsoluteCellRange.spanFrom({ sheet: sheetId, col: source, row: 0 }, 1, Infinity)
        const column = this.getRangeClipboardCells(rowRange)
        oldContent = oldContent.concat(column)
        buffer.push(
          column.map(
            ([{ sheet, col: _col, row }, cell]) => [{ sheet, col: target, row }, cell]
          )
        )
      }
    }
    buffer.forEach(
      column => this.restoreClipboardCells(sheetId, column.values())
    )
    return oldContent
  }

  public addNamedExpression(expressionName: string, expression: RawCellContent, sheetId?: number, options?: NamedExpressionOptions) {
    const namedExpression = this.namedExpressions.addNamedExpression(expressionName, sheetId, options)
    this.storeNamedExpressionInCell(namedExpression.address, expression)
    this.adjustNamedExpressionEdges(namedExpression, expressionName, sheetId)
  }

  public restoreNamedExpression(namedExpression: InternalNamedExpression, content: ClipboardCell, sheetId?: number) {
    const expressionName = namedExpression.displayName
    this.restoreCell(namedExpression.address, content)
    const restoredNamedExpression = this.namedExpressions.restoreNamedExpression(namedExpression, sheetId)
    this.adjustNamedExpressionEdges(restoredNamedExpression, expressionName, sheetId)
  }

  public changeNamedExpressionExpression(expressionName: string, newExpression: RawCellContent, sheetId?: number, options?: NamedExpressionOptions): [InternalNamedExpression, ClipboardCell] {
    const namedExpression = this.namedExpressions.namedExpressionForScope(expressionName, sheetId)
    if (!namedExpression) {
      throw new NamedExpressionDoesNotExistError(expressionName)
    }

    const oldNamedExpression = namedExpression.copy()

    namedExpression.options = options
    const content = this.getClipboardCell(namedExpression.address)
    this.storeNamedExpressionInCell(namedExpression.address, newExpression)
    return [oldNamedExpression, content]
  }

  public removeNamedExpression(expressionName: string, sheetId?: number): [InternalNamedExpression, ClipboardCell] {
    const namedExpression = this.namedExpressions.namedExpressionForScope(expressionName, sheetId)
    if (!namedExpression) {
      throw new NamedExpressionDoesNotExistError(expressionName)
    }
    this.namedExpressions.remove(namedExpression.displayName, sheetId)
    const content = this.getClipboardCell(namedExpression.address)
    if (sheetId !== undefined) {
      const globalNamedExpression = this.namedExpressions.workbookNamedExpressionOrPlaceholder(expressionName)
      this.dependencyGraph.exchangeNode(namedExpression.address, globalNamedExpression.address)
    } else {
      this.dependencyGraph.setCellEmpty(namedExpression.address)
    }
    return [
      namedExpression,
      content
    ]
  }

  public ensureItIsPossibleToMoveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): void {
    if (
      isColOrRowInvalid(sourceLeftCorner) ||
      !((isPositiveInteger(width) && isPositiveInteger(height)) || isRowOrColumnRange(sourceLeftCorner, width, height)) ||
      isColOrRowInvalid(destinationLeftCorner) ||
      !this.sheetMapping.hasSheetWithId(sourceLeftCorner.sheet) ||
      !this.sheetMapping.hasSheetWithId(destinationLeftCorner.sheet)
    ) {
      throw new InvalidArgumentsError('a valid range of cells to move.')
    }

    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    if (targetRange.exceedsSheetSizeLimits(this.maxColumns, this.maxRows)) {
      throw new SheetSizeLimitExceededError()
    }

    if (this.dependencyGraph.arrayMapping.isFormulaArrayInRange(sourceRange)) {
      throw new SourceLocationHasArrayError()
    }

    if (this.dependencyGraph.arrayMapping.isFormulaArrayInRange(targetRange)) {
      throw new TargetLocationHasArrayError()
    }
  }

  public restoreClipboardCells(sourceSheetId: number, cells: IterableIterator<[SimpleCellAddress, ClipboardCell]>): string[] {
    const addedNamedExpressions: string[] = []
    for (const [address, clipboardCell] of cells) {
      this.restoreCell(address, clipboardCell)
      if (clipboardCell.type === ClipboardCellType.FORMULA) {
        const { dependencies } = this.parser.fetchCachedResult(clipboardCell.hash)
        addedNamedExpressions.push(...this.updateNamedExpressionsForTargetAddress(sourceSheetId, address, dependencies))
      }
    }
    return addedNamedExpressions
  }


  /**
   * Restores a single cell.
   */
  public restoreCell(address: SimpleCellAddress, clipboardCell: ClipboardCell): void {
    switch (clipboardCell.type) {
      case ClipboardCellType.VALUE: {
        this.setValueToCell(clipboardCell, address)
        break
      }
      case ClipboardCellType.FORMULA: {
        this.setFormulaToCellFromCache(clipboardCell.hash, address)
        break
      }
      case ClipboardCellType.EMPTY: {
        this.setCellEmpty(address)
        break
      }
      case ClipboardCellType.PARSING_ERROR: {
        this.setParsingErrorToCell(clipboardCell.rawInput, clipboardCell.errors, address)
        break
      }
    }
  }

  public getOldContent(address: SimpleCellAddress): [SimpleCellAddress, ClipboardCell] {
    const vertex = this.dependencyGraph.getCell(address)

    if (vertex === undefined || vertex instanceof EmptyCellVertex) {
      return [address, { type: ClipboardCellType.EMPTY }]
    } else if (vertex instanceof ValueCellVertex) {
      return [address, { type: ClipboardCellType.VALUE, ...vertex.getValues() }]
    } else if (vertex instanceof FormulaVertex) {
      return [vertex.getAddress(this.lazilyTransformingAstService), {
        type: ClipboardCellType.FORMULA,
        hash: this.parser.computeHashFromAst(vertex.getFormula(this.lazilyTransformingAstService))
      }]
    } else if (vertex instanceof ParsingErrorVertex) {
      return [address, { type: ClipboardCellType.PARSING_ERROR, rawInput: vertex.rawInput, errors: vertex.errors }]
    }

    throw Error('Trying to copy unsupported type')
  }

  public getClipboardCell(address: SimpleCellAddress): ClipboardCell {
    const vertex = this.dependencyGraph.getCell(address)

    if (vertex === undefined || vertex instanceof EmptyCellVertex) {
      return { type: ClipboardCellType.EMPTY }
    } else if (vertex instanceof ValueCellVertex) {
      return { type: ClipboardCellType.VALUE, ...vertex.getValues() }
    } else if (vertex instanceof ArrayFormulaVertex) {
      const val = vertex.getArrayCellValue(address)
      if (val === EmptyValue) {
        return { type: ClipboardCellType.EMPTY }
      }
      return { type: ClipboardCellType.VALUE, parsedValue: val, rawValue: vertex.getArrayCellRawValue(address) }
    } else if (vertex instanceof ScalarFormulaVertex) {
      return {
        type: ClipboardCellType.FORMULA,
        hash: this.parser.computeHashFromAst(vertex.getFormula(this.lazilyTransformingAstService))
      }
    } else if (vertex instanceof ParsingErrorVertex) {
      return { type: ClipboardCellType.PARSING_ERROR, rawInput: vertex.rawInput, errors: vertex.errors }
    }

    throw Error('Trying to copy unsupported type')
  }

  public getSheetClipboardCells(sheet: number): ClipboardCell[][] {
    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const sheetWidth = this.dependencyGraph.getSheetWidth(sheet)

    const arr: ClipboardCell[][] = new Array<ClipboardCell[]>(sheetHeight)
    for (let i = 0; i < sheetHeight; i++) {
      arr[i] = new Array<ClipboardCell>(sheetWidth)

      for (let j = 0; j < sheetWidth; j++) {
        const address = simpleCellAddress(sheet, j, i)
        arr[i][j] = this.getClipboardCell(address)
      }
    }
    return arr
  }

  public getRangeClipboardCells(range: AbsoluteCellRange): [SimpleCellAddress, ClipboardCell][] {
    const result: [SimpleCellAddress, ClipboardCell][] = []
    for (const address of range.addresses(this.dependencyGraph)) {
      result.push([address, this.getClipboardCell(address)])
    }
    return result
  }

  public setCellContent(address: SimpleCellAddress, newCellContent: RawCellContent): [SimpleCellAddress, ClipboardCell] {
    const parsedCellContent = this.cellContentParser.parse(newCellContent)
    const oldContent = this.getOldContent(address)

    if (parsedCellContent instanceof CellContent.Formula) {
      const parserResult = this.parser.parse(parsedCellContent.formula, address)
      const { ast, errors } = parserResult
      if (errors.length > 0) {
        this.setParsingErrorToCell(parsedCellContent.formula, errors, address)
      } else {
        try {
          const size = this.arraySizePredictor.checkArraySize(ast, address)

          if (size.width <= 0 || size.height <= 0) {
            throw Error('Incorrect array size')
          }

          this.setFormulaToCell(address, size, parserResult)
        } catch (error) {
          if (!(error as Error).message) {
            throw error
          }

          const parsingError: ParsingError = { type: ParsingErrorType.InvalidRangeSize, message: 'Invalid range size.' }
          this.setParsingErrorToCell(parsedCellContent.formula, [parsingError], address)
        }
      }
    } else if (parsedCellContent instanceof CellContent.Empty) {
      this.setCellEmpty(address)
    } else {
      this.setValueToCell({ parsedValue: parsedCellContent.value, rawValue: newCellContent }, address)
    }

    return oldContent
  }

  public setSheetContent(sheetId: number, newSheetContent: RawCellContent[][]) {
    this.clearSheet(sheetId)
    for (let i = 0; i < newSheetContent.length; i++) {
      for (let j = 0; j < newSheetContent[i].length; j++) {
        const address = simpleCellAddress(sheetId, j, i)
        this.setCellContent(address, newSheetContent[i][j])
      }
    }
  }

  /**
   * Sets cell content to an instance of parsing error.
   * Creates a ParsingErrorVertex and updates the dependency graph and column search index.
   */
  public setParsingErrorToCell(rawInput: string, errors: ParsingError[], address: SimpleCellAddress) {
    this.removeCellValueFromColumnSearch(address)

    const vertex = new ParsingErrorVertex(errors, rawInput)
    const arrayChanges = this.dependencyGraph.setParsingErrorToCell(address, vertex)

    this.columnSearch.applyChanges(arrayChanges.getChanges())
    this.changes.addAll(arrayChanges)
    this.changes.addChange(vertex.getCellValue(), address)
  }

  /**
   * Sets cell content to a formula.
   * Creates a ScalarFormulaVertex and updates the dependency graph and column search index.
   */
  public setFormulaToCell(address: SimpleCellAddress, size: ArraySize, {
    ast,
    hasVolatileFunction,
    hasStructuralChangeFunction,
    dependencies
  }: ParsingResult) {
    this.removeCellValueFromColumnSearch(address)

    const arrayChanges = this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), size, hasVolatileFunction, hasStructuralChangeFunction)

    this.columnSearch.applyChanges(arrayChanges.getChanges())
    this.changes.addAll(arrayChanges)
  }

  /**
   * Sets cell content to a value.
   * Creates a ValueCellVertex and updates the dependency graph and column search index.
   */
  public setValueToCell(value: RawAndParsedValue, address: SimpleCellAddress) {
    this.changeCellValueInColumnSearch(address, value.parsedValue)

    const arrayChanges = this.dependencyGraph.setValueToCell(address, value)

    this.columnSearch.applyChanges(arrayChanges.getChanges().filter(change => !equalSimpleCellAddress(change.address, address)))
    this.changes.addAll(arrayChanges)
    this.changes.addChange(value.parsedValue, address)
  }

  /**
   * Sets cell content to an empty value.
   * Creates an EmptyCellVertex and updates the dependency graph and column search index.
   */
  public setCellEmpty(address: SimpleCellAddress) {
    if (this.dependencyGraph.isArrayInternalCell(address)) {
      return
    }

    this.removeCellValueFromColumnSearch(address)

    const arrayChanges = this.dependencyGraph.setCellEmpty(address)

    this.columnSearch.applyChanges(arrayChanges.getChanges())
    this.changes.addAll(arrayChanges)
    this.changes.addChange(EmptyValue, address)
  }

  public setFormulaToCellFromCache(formulaHash: string, address: SimpleCellAddress) {
    const {
      ast,
      hasVolatileFunction,
      hasStructuralChangeFunction,
      dependencies
    } = this.parser.fetchCachedResult(formulaHash)
    const absoluteDependencies = absolutizeDependencies(dependencies, address)
    const [cleanedAst] = new CleanOutOfScopeDependenciesTransformer(address.sheet).transformSingleAst(ast, address)
    this.parser.rememberNewAst(cleanedAst)
    const cleanedDependencies = filterDependenciesOutOfScope(absoluteDependencies)
    const size = this.arraySizePredictor.checkArraySize(ast, address)
    this.dependencyGraph.setFormulaToCell(address, cleanedAst, cleanedDependencies, size, hasVolatileFunction, hasStructuralChangeFunction)
  }

  /**
   * Returns true if row number is outside of given sheet.
   * @param {number} row - row number
   * @param {number} sheet - sheet ID number
   */
  public rowEffectivelyNotInSheet(row: number, sheet: number): boolean {
    const height = this.dependencyGraph.addressMapping.getSheetHeight(sheet)
    return row >= height
  }

  public getAndClearContentChanges(): ContentChanges {
    const changes = this.changes
    this.changes = ContentChanges.empty()
    return changes
  }

  public forceApplyPostponedTransformations(): void {
    this.dependencyGraph.forceApplyPostponedTransformations()
  }

  /**
   * Removes multiple rows from sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   * @param {RowsSpan} rowsToRemove - rows to remove
   */
  private doRemoveRows(rowsToRemove: RowsSpan): RowsRemoval | undefined {
    if (this.rowEffectivelyNotInSheet(rowsToRemove.rowStart, rowsToRemove.sheet)) {
      return
    }

    const removedCells: ChangedCell[] = []
    for (const [address] of this.dependencyGraph.entriesFromRowsSpan(rowsToRemove)) {
      removedCells.push({ address, cellType: this.getClipboardCell(address) })
    }

    const { affectedArrays, contentChanges } = this.dependencyGraph.removeRows(rowsToRemove)

    this.columnSearch.applyChanges(contentChanges.getChanges())

    let version = 0
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveRowsTransformer(rowsToRemove)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.rewriteAffectedArrays(affectedArrays)

    return { version: version, removedCells, rowFrom: rowsToRemove.rowStart, rowCount: rowsToRemove.numberOfRows }
  }

  /**
   * Removes multiple columns from sheet. </br>
   * Does nothing if columns are outside of effective sheet size.
   * @param {ColumnsSpan} columnsToRemove - columns to remove
   */
  private doRemoveColumns(columnsToRemove: ColumnsSpan): ColumnsRemoval | undefined {
    if (this.columnEffectivelyNotInSheet(columnsToRemove.columnStart, columnsToRemove.sheet)) {
      return
    }

    const removedCells: ChangedCell[] = []
    for (const [address] of this.dependencyGraph.entriesFromColumnsSpan(columnsToRemove)) {
      removedCells.push({ address, cellType: this.getClipboardCell(address) })
    }

    const { affectedArrays, contentChanges } = this.dependencyGraph.removeColumns(columnsToRemove)
    this.columnSearch.applyChanges(contentChanges.getChanges())
    this.columnSearch.removeColumns(columnsToRemove)

    let version = 0
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveColumnsTransformer(columnsToRemove)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.rewriteAffectedArrays(affectedArrays)

    return {
      version: version,
      removedCells,
      columnFrom: columnsToRemove.columnStart,
      columnCount: columnsToRemove.numberOfColumns
    }
  }

  /**
   * Add multiple rows to sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   * @param {RowsSpan} addedRows - rows to add
   */
  private doAddRows(addedRows: RowsSpan) {
    if (this.rowEffectivelyNotInSheet(addedRows.rowStart, addedRows.sheet)) {
      return
    }

    const { affectedArrays } = this.dependencyGraph.addRows(addedRows)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new AddRowsTransformer(addedRows)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.rewriteAffectedArrays(affectedArrays)
  }

  private rewriteAffectedArrays(affectedArrays: Set<ArrayFormulaVertex>) {
    for (const arrayVertex of affectedArrays.values()) {
      if (arrayVertex.array.size.isRef) {
        continue
      }
      const ast = arrayVertex.getFormula(this.lazilyTransformingAstService)
      const address = arrayVertex.getAddress(this.lazilyTransformingAstService)
      const hash = this.parser.computeHashFromAst(ast)
      this.setFormulaToCellFromCache(hash, address)
    }
  }

  /**
   * Add multiple columns to sheet </br>
   * Does nothing if columns are outside of effective sheet size
   * @param {ColumnsSpan} addedColumns - object containing information about columns to add
   */
  private doAddColumns(addedColumns: ColumnsSpan): void {
    if (this.columnEffectivelyNotInSheet(addedColumns.columnStart, addedColumns.sheet)) {
      return
    }

    const { affectedArrays, contentChanges } = this.dependencyGraph.addColumns(addedColumns)
    this.columnSearch.addColumns(addedColumns)
    this.columnSearch.applyChanges(contentChanges.getChanges())

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new AddColumnsTransformer(addedColumns)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.rewriteAffectedArrays(affectedArrays)
  }

  /**
   * Returns true if row number is outside of given sheet.
   * @param {number} column - row number
   * @param {number} sheet - sheet ID number
   */
  private columnEffectivelyNotInSheet(column: number, sheet: number): boolean {
    const width = this.dependencyGraph.addressMapping.getSheetWidth(sheet)
    return column >= width
  }

  private adjustNamedExpressionEdges(namedExpression: InternalNamedExpression, expressionName: string, sheetId?: number) {
    if (sheetId === undefined) {
      return
    }
    const { vertex: localVertex, id: maybeLocalVertexId } = this.dependencyGraph.fetchCellOrCreateEmpty(namedExpression.address)
    const localVertexId = maybeLocalVertexId ?? localVertex.idInGraph

    const globalNamedExpression = this.namedExpressions.workbookNamedExpressionOrPlaceholder(expressionName)
    const { vertex: globalVertex, id: maybeGlobalVertexId } = this.dependencyGraph.fetchCellOrCreateEmpty(globalNamedExpression.address)
    const globalVertexId = maybeGlobalVertexId ?? globalVertex.idInGraph

    for (const adjacentNode of this.dependencyGraph.graph.adjacentNodes(globalVertex)) {
      if (adjacentNode instanceof ScalarFormulaVertex && adjacentNode.getAddress(this.lazilyTransformingAstService).sheet === sheetId) {
        const ast = adjacentNode.getFormula(this.lazilyTransformingAstService)
        const formulaAddress = adjacentNode.getAddress(this.lazilyTransformingAstService)
        const { dependencies } = this.parser.fetchCachedResultForAst(ast)
        for (const dependency of absolutizeDependencies(dependencies, formulaAddress)) {
          if (dependency instanceof NamedExpressionDependency && dependency.name.toLowerCase() === namedExpression.displayName.toLowerCase()) {
            this.dependencyGraph.graph.removeEdgeIfExists(globalVertexId as number, adjacentNode)
            this.dependencyGraph.graph.addEdge(localVertexId as number, adjacentNode)
          }
        }
      }
    }
  }

  private storeNamedExpressionInCell(address: SimpleCellAddress, expression: RawCellContent) {
    const parsedCellContent = this.cellContentParser.parse(expression)
    if (parsedCellContent instanceof CellContent.Formula) {
      const parsingResult = this.parser.parse(parsedCellContent.formula, simpleCellAddress(-1, 0, 0))
      if (doesContainRelativeReferences(parsingResult.ast)) {
        throw new NoRelativeAddressesAllowedError()
      }
      const { ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies } = parsingResult
      this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), ArraySize.scalar(), hasVolatileFunction, hasStructuralChangeFunction)
    } else if (parsedCellContent instanceof CellContent.Empty) {
      this.setCellEmpty(address)
    } else {
      this.setValueToCell({ parsedValue: parsedCellContent.value, rawValue: expression }, address)
    }
  }

  private updateNamedExpressionsForMovedCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): string[] {
    if (sourceLeftCorner.sheet === destinationLeftCorner.sheet) {
      return []
    }

    const addedGlobalNamedExpressions: string[] = []
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    for (const formulaAddress of targetRange.addresses(this.dependencyGraph)) {
      const vertex = this.addressMapping.getCell(formulaAddress, { throwIfCellNotExists: true })
      if (vertex instanceof ScalarFormulaVertex && formulaAddress.sheet !== sourceLeftCorner.sheet) {
        const ast = vertex.getFormula(this.lazilyTransformingAstService)
        const { dependencies } = this.parser.fetchCachedResultForAst(ast)
        addedGlobalNamedExpressions.push(...this.updateNamedExpressionsForTargetAddress(sourceLeftCorner.sheet, formulaAddress, dependencies))
      }
    }

    return addedGlobalNamedExpressions
  }

  private updateNamedExpressionsForTargetAddress(sourceSheet: number, targetAddress: SimpleCellAddress, dependencies: RelativeDependency[]): string[] {
    if (sourceSheet === targetAddress.sheet) {
      return []
    }

    const addedGlobalNamedExpressions: string[] = []
    const vertex = this.addressMapping.getCellOrThrow(targetAddress)

    for (const namedExpressionDependency of absolutizeDependencies(dependencies, targetAddress)) {
      if (!(namedExpressionDependency instanceof NamedExpressionDependency)) {
        continue
      }

      const expressionName = namedExpressionDependency.name
      const sourceVertex = this.dependencyGraph.fetchNamedExpressionVertex(expressionName, sourceSheet).vertex
      const namedExpressionInTargetScope = this.namedExpressions.isExpressionInScope(expressionName, targetAddress.sheet)

      const targetScopeExpressionVertex = namedExpressionInTargetScope
        ? this.dependencyGraph.fetchNamedExpressionVertex(expressionName, targetAddress.sheet).vertex
        : this.copyOrFetchGlobalNamedExpressionVertex(expressionName, sourceVertex, addedGlobalNamedExpressions)

      if (targetScopeExpressionVertex !== sourceVertex) {
        this.dependencyGraph.graph.removeEdgeIfExists(sourceVertex, vertex)
        this.dependencyGraph.graph.addEdge(targetScopeExpressionVertex, vertex)
      }
    }

    return addedGlobalNamedExpressions
  }

  private allocateNamedExpressionAddressSpace() {
    this.dependencyGraph.addressMapping.addSheetWithStrategy(NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS, new SparseStrategy(0, 0))
  }

  private copyOrFetchGlobalNamedExpressionVertex(expressionName: string, sourceVertex: CellVertex, addedNamedExpressions: string[]): CellVertex {
    let expression = this.namedExpressions.namedExpressionForScope(expressionName)
    if (expression === undefined) {
      expression = this.namedExpressions.addNamedExpression(expressionName)
      addedNamedExpressions.push(expression.normalizeExpressionName())
      if (sourceVertex instanceof ScalarFormulaVertex) {
        const parsingResult = this.parser.fetchCachedResultForAst(sourceVertex.getFormula(this.lazilyTransformingAstService))
        const { ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies } = parsingResult
        this.dependencyGraph.setFormulaToCell(expression.address, ast, absolutizeDependencies(dependencies, expression.address), ArraySize.scalar(), hasVolatileFunction, hasStructuralChangeFunction)
      } else if (sourceVertex instanceof EmptyCellVertex) {
        this.setCellEmpty(expression.address)
      } else if (sourceVertex instanceof ValueCellVertex) {
        this.setValueToCell(sourceVertex.getValues(), expression.address)
      }
    }
    return this.dependencyGraph.fetchCellOrCreateEmpty(expression.address).vertex
  }

  /**
   * Removes a cell value from the columnSearch index.
   * Ignores the non-computed formula vertices.
   */
  private removeCellValueFromColumnSearch(address: SimpleCellAddress): void {
    if (this.isNotComputed(address)) {
      return
    }

    const oldValue = this.dependencyGraph.getCellValue(address)
    this.columnSearch.remove(getRawValue(oldValue), address)
  }

  /**
   * Changes a cell value in the columnSearch index.
   * Ignores the non-computed formula vertices.
   */
  private changeCellValueInColumnSearch(address: SimpleCellAddress, newValue: ValueCellVertexValue): void {
    if (this.isNotComputed(address)) {
      return
    }

    const oldValue = this.dependencyGraph.getCellValue(address)
    this.columnSearch.change(getRawValue(oldValue), getRawValue(newValue), address)
  }

  /**
   * Checks if the ScalarFormulaVertex or ArrayFormulaVertex at the given address is not computed.
   */
  private isNotComputed(address: SimpleCellAddress): boolean {
    const vertex = this.dependencyGraph.getCell(address)

    if (!vertex) {
      return false
    }

    return vertex instanceof FormulaVertex && !vertex.isComputed()
  }
}

export function normalizeRemovedIndexes(indexes: ColumnRowIndex[]): ColumnRowIndex[] {
  if (indexes.length <= 1) {
    return indexes
  }

  const sorted = [...indexes].sort(([a], [b]) => a - b)

  /* merge overlapping and adjacent indexes */
  const merged = sorted.reduce((acc: ColumnRowIndex[], [startIndex, amount]: ColumnRowIndex) => {
    const previous = acc[acc.length - 1]
    const lastIndex = previous[0] + previous[1]

    if (startIndex <= lastIndex) {
      previous[1] += Math.max(0, amount - (lastIndex - startIndex))
    } else {
      acc.push([startIndex, amount])
    }

    return acc
  }, [sorted[0]])

  /* shift further indexes */
  let shift = 0
  for (let i = 0; i < merged.length; ++i) {
    merged[i][0] -= shift
    shift += merged[i][1]
  }

  return merged
}

export function normalizeAddedIndexes(indexes: ColumnRowIndex[]): ColumnRowIndex[] {
  if (indexes.length <= 1) {
    return indexes
  }

  const sorted = [...indexes].sort(([a], [b]) => a - b)

  /* merge indexes with same start */
  const merged = sorted.reduce((acc: ColumnRowIndex[], [startIndex, amount]: ColumnRowIndex) => {
    const previous = acc[acc.length - 1]
    if (startIndex === previous[0]) {
      previous[1] = Math.max(previous[1], amount)
    } else {
      acc.push([startIndex, amount])
    }
    return acc
  }, [sorted[0]])

  /* shift further indexes */
  let shift = 0
  for (let i = 0; i < merged.length; ++i) {
    merged[i][0] += shift
    shift += merged[i][1]
  }

  return merged
}

function isPositiveInteger(n: number): boolean {
  return Number.isInteger(n) && n > 0
}

function isRowOrColumnRange(leftCorner: SimpleCellAddress, width: number, height: number): boolean {
  return (leftCorner.row === 0 && isPositiveInteger(width) && height === Number.POSITIVE_INFINITY)
    || (leftCorner.col === 0 && isPositiveInteger(height) && width === Number.POSITIVE_INFINITY)
}
