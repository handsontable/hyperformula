/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {absolutizeDependencies, filterDependenciesOutOfScope} from './absolutizeDependencies'
import {ArraySize, ArraySizePredictor} from './ArraySize'
import {equalSimpleCellAddress, invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, RawCellContent} from './CellContentParser'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {Config} from './Config'
import {ContentChanges} from './ContentChanges'
import {ColumnRowIndex} from './CrudOperations'
import {
  AddressMapping,
  ArrayVertex,
  CellVertex,
  DependencyGraph,
  EmptyCellVertex,
  FormulaCellVertex,
  ParsingErrorVertex,
  SheetMapping,
  SparseStrategy,
  ValueCellVertex
} from './DependencyGraph'
import {FormulaVertex} from './DependencyGraph/FormulaCellVertex'
import {RawAndParsedValue} from './DependencyGraph/ValueCellVertex'
import {AddColumnsTransformer} from './dependencyTransformers/AddColumnsTransformer'
import {AddRowsTransformer} from './dependencyTransformers/AddRowsTransformer'
import {CleanOutOfScopeDependenciesTransformer} from './dependencyTransformers/CleanOutOfScopeDependenciesTransformer'
import {MoveCellsTransformer} from './dependencyTransformers/MoveCellsTransformer'
import {RemoveColumnsTransformer} from './dependencyTransformers/RemoveColumnsTransformer'
import {RemoveRowsTransformer} from './dependencyTransformers/RemoveRowsTransformer'
import {RemoveSheetTransformer} from './dependencyTransformers/RemoveSheetTransformer'
import {
  InvalidArgumentsError,
  NamedExpressionDoesNotExistError,
  NoRelativeAddressesAllowedError,
  SheetSizeLimitExceededError,
  SourceLocationHasArrayError,
  TargetLocationHasArrayError
} from './errors'
import {EmptyValue, getRawValue} from './interpreter/InterpreterValue'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {
  doesContainRelativeReferences,
  InternalNamedExpression,
  NamedExpressionOptions,
  NamedExpressions
} from './NamedExpressions'
import {NamedExpressionDependency, ParserWithCaching, RelativeDependency} from './parser'
import {ParsingError, Ast} from './parser/Ast'
import {ParsingResult} from './parser/ParserWithCaching'
import {findBoundaries, Sheet} from './Sheet'
import {ColumnsSpan, RowsSpan} from './Span'
import {Statistics, StatType} from './statistics'

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
  public changes: ContentChanges = ContentChanges.empty()
  private maxRows: number
  private maxColumns: number

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

  public removeSheet(sheetId: number) {
    this.dependencyGraph.removeSheet(sheetId)

    let version: number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveSheetTransformer(sheetId)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.sheetMapping.removeSheet(sheetId)
    this.columnSearch.removeSheet(sheetId)
    const scopedNamedExpressions = this.namedExpressions.getAllNamedExpressionsForScope(sheetId).map(
      (namedexpression) => this.removeNamedExpression(namedexpression.normalizeExpressionName(), sheetId)
    )
    return {version: version!, scopedNamedExpressions}
  }

  public removeSheetByName(sheetName: string) {
    const sheetId = this.sheetMapping.fetch(sheetName)
    return this.removeSheet(sheetId)
  }

  public clearSheet(sheetId: number) {
    this.dependencyGraph.clearSheet(sheetId)
    this.columnSearch.removeSheet(sheetId)
  }

  public addSheet(name?: string) {
    const sheetId = this.sheetMapping.addSheet(name)
    const sheet: Sheet = []
    this.dependencyGraph.addressMapping.autoAddSheet(sheetId, sheet, findBoundaries(sheet))
    return this.sheetMapping.fetchDisplayName(sheetId)
  }

  public renameSheet(sheetId: number, newName: string) {
    return this.sheetMapping.renameSheet(sheetId, newName)
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

    let version: number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new MoveCellsTransformer(sourceRange, toRight, toBottom, toSheet)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.dependencyGraph.moveCells(sourceRange, toRight, toBottom, toSheet)

    const addedGlobalNamedExpressions = this.updateNamedExpressionsForMovedCells(sourceLeftCorner, width, height, destinationLeftCorner)

    return {
      version: version!,
      overwrittenCellsData: currentDataAtTarget,
      addedGlobalNamedExpressions: addedGlobalNamedExpressions
    }
  }

  public setRowOrder(sheetId: number, rowMapping: [number, number][]): [SimpleCellAddress, ClipboardCell][] {
    const buffer: [SimpleCellAddress, ClipboardCell][][] = []
    let oldContent: [SimpleCellAddress, ClipboardCell][] = []
    for (const [source, target] of rowMapping) {
      if (source !== target) {
        const rowRange = AbsoluteCellRange.spanFrom({sheet: sheetId, col: 0, row: source}, Infinity, 1)
        const row = this.getRangeClipboardCells(rowRange)
        oldContent = oldContent.concat(row)
        buffer.push(
          row.map(
            ([{sheet, col}, cell]) => [{sheet, col, row: target}, cell]
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
        const rowRange = AbsoluteCellRange.spanFrom({sheet: sheetId, col: source, row: 0}, 1, Infinity)
        const column = this.getRangeClipboardCells(rowRange)
        oldContent = oldContent.concat(column)
        buffer.push(
          column.map(
            ([{sheet, col: _col, row}, cell]) => [{sheet, col: target, row}, cell]
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
      invalidSimpleCellAddress(sourceLeftCorner) ||
      !((isPositiveInteger(width) && isPositiveInteger(height)) || isRowOrColumnRange(sourceLeftCorner, width, height)) ||
      invalidSimpleCellAddress(destinationLeftCorner) ||
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
        const {dependencies} = this.parser.fetchCachedResult(clipboardCell.hash)
        addedNamedExpressions.push(...this.updateNamedExpressionsForTargetAddress(sourceSheetId, address, dependencies))
      }
    }
    return addedNamedExpressions
  }

  public restoreCell(address: SimpleCellAddress, clipboardCell: ClipboardCell) {
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
      return [address, {type: ClipboardCellType.EMPTY}]
    } else if (vertex instanceof ValueCellVertex) {
      return [address, {type: ClipboardCellType.VALUE, ...vertex.getValues()}]
    } else if (vertex instanceof FormulaVertex) {
      return [vertex.getAddress(this.lazilyTransformingAstService), {
        type: ClipboardCellType.FORMULA,
        hash: this.parser.computeHashFromAst(vertex.getFormula(this.lazilyTransformingAstService))
      }]
    } else if (vertex instanceof ParsingErrorVertex) {
      return [address, {type: ClipboardCellType.PARSING_ERROR, rawInput: vertex.rawInput, errors: vertex.errors}]
    }

    throw Error('Trying to copy unsupported type')
  }

  public getClipboardCell(address: SimpleCellAddress): ClipboardCell {
    const vertex = this.dependencyGraph.getCell(address)

    if (vertex === undefined || vertex instanceof EmptyCellVertex) {
      return {type: ClipboardCellType.EMPTY}
    } else if (vertex instanceof ValueCellVertex) {
      return {type: ClipboardCellType.VALUE, ...vertex.getValues()}
    } else if (vertex instanceof ArrayVertex) {
      const val = vertex.getArrayCellValue(address)
      if (val === EmptyValue) {
        return {type: ClipboardCellType.EMPTY}
      }
      return {type: ClipboardCellType.VALUE, parsedValue: val, rawValue: vertex.getArrayCellRawValue(address)}
    } else if (vertex instanceof FormulaCellVertex) {
      return {
        type: ClipboardCellType.FORMULA,
        hash: this.parser.computeHashFromAst(vertex.getFormula(this.lazilyTransformingAstService))
      }
    } else if (vertex instanceof ParsingErrorVertex) {
      return {type: ClipboardCellType.PARSING_ERROR, rawInput: vertex.rawInput, errors: vertex.errors}
    }

    throw Error('Trying to copy unsupported type')
  }

  public getSheetClipboardCells(sheet: number): ClipboardCell[][] {
    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const sheetWidth = this.dependencyGraph.getSheetWidth(sheet)

    const arr: ClipboardCell[][] = new Array(sheetHeight)
    for (let i = 0; i < sheetHeight; i++) {
      arr[i] = new Array(sheetWidth)

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
      const {ast, errors} = parserResult
      if (errors.length > 0) {
        this.setParsingErrorToCell(parsedCellContent.formula, errors, address)
      } else {
        const size = this.arraySizePredictor.checkArraySize(ast, address)

        this.setFormulaToCell(address, size, true, parserResult)
      }
    } else if (parsedCellContent instanceof CellContent.Empty) {
      this.setCellEmpty(address)
    } else {
      this.setValueToCell({parsedValue: parsedCellContent.value, rawValue: newCellContent}, address)
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

  public setParsingErrorToCell(rawInput: string, errors: ParsingError[], address: SimpleCellAddress) {
    const oldValue = this.dependencyGraph.getCellValue(address)
    const vertex = new ParsingErrorVertex(errors, rawInput)
    const arrayChanges = this.dependencyGraph.setParsingErrorToCell(address, vertex)
    this.columnSearch.remove(getRawValue(oldValue), address)
    this.columnSearch.applyChanges(arrayChanges.getChanges())
    this.changes.addAll(arrayChanges)
    this.changes.addChange(vertex.getCellValue(), address)
  }

  public setAsyncFormulaToCell(address: SimpleCellAddress, ast: Ast, formulaVertex: FormulaVertex) {
    const parserResult = this.parser.fetchCachedResultForAst(ast)
    const size = this.arraySizePredictor.checkArraySize(ast, address, formulaVertex)

    this.setFormulaToCell(address, size, true, parserResult)
  }

  public setFormulaToCell(address: SimpleCellAddress, size: ArraySize, markNodeAsSpecialRecentlyChanged: boolean, {
    ast,
    hasVolatileFunction,
    hasStructuralChangeFunction,
    hasAsyncFunction,
    dependencies
  }: ParsingResult) {
    const oldValue = this.dependencyGraph.getCellValue(address)
    const arrayChanges = this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), size, hasVolatileFunction, hasStructuralChangeFunction, hasAsyncFunction, markNodeAsSpecialRecentlyChanged)
    this.columnSearch.remove(getRawValue(oldValue), address)
    this.columnSearch.applyChanges(arrayChanges.getChanges())
    this.changes.addAll(arrayChanges)
  }

  public setValueToCell(value: RawAndParsedValue, address: SimpleCellAddress) {
    const oldValue = this.dependencyGraph.getCellValue(address)
    const arrayChanges = this.dependencyGraph.setValueToCell(address, value)
    this.columnSearch.change(getRawValue(oldValue), getRawValue(value.parsedValue), address)
    this.columnSearch.applyChanges(arrayChanges.getChanges().filter(change => !equalSimpleCellAddress(change.address, address)))
    this.changes.addAll(arrayChanges)
    this.changes.addChange(value.parsedValue, address)
  }

  public setCellEmpty(address: SimpleCellAddress) {
    if (this.dependencyGraph.isArrayInternalCell(address)) {
      return
    }
    const oldValue = this.dependencyGraph.getCellValue(address)
    const arrayChanges = this.dependencyGraph.setCellEmpty(address)
    this.columnSearch.remove(getRawValue(oldValue), address)
    this.columnSearch.applyChanges(arrayChanges.getChanges())
    this.changes.addAll(arrayChanges)
    this.changes.addChange(EmptyValue, address)
  }

  public setFormulaToCellFromCache(formulaHash: string, address: SimpleCellAddress) {
    const {
      ast,
      hasVolatileFunction,
      hasStructuralChangeFunction,
      hasAsyncFunction,
      dependencies
    } = this.parser.fetchCachedResult(formulaHash)
    const absoluteDependencies = absolutizeDependencies(dependencies, address)
    const [cleanedAst] = new CleanOutOfScopeDependenciesTransformer(address.sheet).transformSingleAst(ast, address)
    this.parser.rememberNewAst(cleanedAst)
    const cleanedDependencies = filterDependenciesOutOfScope(absoluteDependencies)
    const size = this.arraySizePredictor.checkArraySize(ast, address)
    this.dependencyGraph.setFormulaToCell(address, cleanedAst, cleanedDependencies, size, hasVolatileFunction, hasStructuralChangeFunction, hasAsyncFunction)
  }

  /**
   * Returns true if row number is outside of given sheet.
   *
   * @param row - row number
   * @param sheet - sheet id number
   */
  public rowEffectivelyNotInSheet(row: number, sheet: number): boolean {
    const height = this.dependencyGraph.addressMapping.getHeight(sheet)
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
   *
   * @param sheet - sheet id from which rows will be removed
   * @param rowStart - number of the first row to be deleted
   * @param rowEnd - number of the last row to be deleted
   * */
  private doRemoveRows(rowsToRemove: RowsSpan): RowsRemoval | undefined {
    if (this.rowEffectivelyNotInSheet(rowsToRemove.rowStart, rowsToRemove.sheet)) {
      return
    }

    const removedCells: ChangedCell[] = []
    for (const [address] of this.dependencyGraph.entriesFromRowsSpan(rowsToRemove)) {
      removedCells.push({address, cellType: this.getClipboardCell(address)})
    }

    const {affectedArrays, contentChanges} = this.dependencyGraph.removeRows(rowsToRemove)

    this.columnSearch.applyChanges(contentChanges.getChanges())

    let version: number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveRowsTransformer(rowsToRemove)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.rewriteAffectedArrays(affectedArrays)

    return {version: version!, removedCells, rowFrom: rowsToRemove.rowStart, rowCount: rowsToRemove.numberOfRows}
  }

  /**
   * Removes multiple columns from sheet. </br>
   * Does nothing if columns are outside of effective sheet size.
   *
   * @param sheet - sheet id from which columns will be removed
   * @param columnStart - number of the first column to be deleted
   * @param columnEnd - number of the last row to be deleted
   */
  private doRemoveColumns(columnsToRemove: ColumnsSpan): ColumnsRemoval | undefined {
    if (this.columnEffectivelyNotInSheet(columnsToRemove.columnStart, columnsToRemove.sheet)) {
      return
    }

    const removedCells: ChangedCell[] = []
    for (const [address] of this.dependencyGraph.entriesFromColumnsSpan(columnsToRemove)) {
      removedCells.push({address, cellType: this.getClipboardCell(address)})
    }

    const {affectedArrays, contentChanges} = this.dependencyGraph.removeColumns(columnsToRemove)
    this.columnSearch.applyChanges(contentChanges.getChanges())
    this.columnSearch.removeColumns(columnsToRemove)

    let version: number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveColumnsTransformer(columnsToRemove)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.rewriteAffectedArrays(affectedArrays)

    return {
      version: version!,
      removedCells,
      columnFrom: columnsToRemove.columnStart,
      columnCount: columnsToRemove.numberOfColumns
    }
  }

  /**
   * Add multiple rows to sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet id in which rows will be added
   * @param row - row number above which the rows will be added
   * @param numberOfRowsToAdd - number of rows to add
   */
  private doAddRows(addedRows: RowsSpan) {
    if (this.rowEffectivelyNotInSheet(addedRows.rowStart, addedRows.sheet)) {
      return
    }

    const {affectedArrays} = this.dependencyGraph.addRows(addedRows)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new AddRowsTransformer(addedRows)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.rewriteAffectedArrays(affectedArrays)
  }

  private rewriteAffectedArrays(affectedArrays: Set<ArrayVertex>) {
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
   *
   * @param sheet - sheet id in which columns will be added
   * @param column - column number above which the columns will be added
   * @param numberOfColumns - number of columns to add
   */
  private doAddColumns(addedColumns: ColumnsSpan): void {
    if (this.columnEffectivelyNotInSheet(addedColumns.columnStart, addedColumns.sheet)) {
      return
    }

    const {affectedArrays, contentChanges} = this.dependencyGraph.addColumns(addedColumns)
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
   *
   * @param column - row number
   * @param sheet - sheet id number
   */
  private columnEffectivelyNotInSheet(column: number, sheet: number): boolean {
    const width = this.dependencyGraph.addressMapping.getWidth(sheet)
    return column >= width
  }

  private adjustNamedExpressionEdges(namedExpression: InternalNamedExpression, expressionName: string, sheetId?: number) {
    if (sheetId === undefined) {
      return
    }
    const localVertex = this.dependencyGraph.fetchCellOrCreateEmpty(namedExpression.address)
    const globalNamedExpression = this.namedExpressions.workbookNamedExpressionOrPlaceholder(expressionName)
    const globalVertex = this.dependencyGraph.fetchCellOrCreateEmpty(globalNamedExpression.address)
    for (const adjacentNode of this.dependencyGraph.graph.adjacentNodes(globalVertex)) {
      if (adjacentNode instanceof FormulaCellVertex && adjacentNode.getAddress(this.lazilyTransformingAstService).sheet === sheetId) {
        const ast = adjacentNode.getFormula(this.lazilyTransformingAstService)
        const formulaAddress = adjacentNode.getAddress(this.lazilyTransformingAstService)
        const {dependencies} = this.parser.fetchCachedResultForAst(ast)
        for (const dependency of absolutizeDependencies(dependencies, formulaAddress)) {
          if (dependency instanceof NamedExpressionDependency && dependency.name.toLowerCase() === namedExpression.displayName.toLowerCase()) {
            this.dependencyGraph.graph.removeEdge(globalVertex, adjacentNode)
            this.dependencyGraph.graph.addEdge(localVertex, adjacentNode)
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
      const {ast, hasVolatileFunction, hasStructuralChangeFunction, hasAsyncFunction, dependencies} = parsingResult
      this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), ArraySize.scalar(), hasVolatileFunction, hasStructuralChangeFunction, hasAsyncFunction)
    } else if (parsedCellContent instanceof CellContent.Empty) {
      this.setCellEmpty(address)
    } else {
      this.setValueToCell({parsedValue: parsedCellContent.value, rawValue: expression}, address)
    }
  }

  private updateNamedExpressionsForMovedCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): string[] {
    if (sourceLeftCorner.sheet === destinationLeftCorner.sheet) {
      return []
    }

    const addedGlobalNamedExpressions: string[] = []
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    for (const formulaAddress of targetRange.addresses(this.dependencyGraph)) {
      const vertex = this.addressMapping.fetchCell(formulaAddress)
      if (vertex instanceof FormulaCellVertex && formulaAddress.sheet !== sourceLeftCorner.sheet) {
        const ast = vertex.getFormula(this.lazilyTransformingAstService)
        const {dependencies} = this.parser.fetchCachedResultForAst(ast)
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
    const vertex = this.addressMapping.fetchCell(targetAddress)

    for (const namedExpressionDependency of absolutizeDependencies(dependencies, targetAddress)) {
      if (!(namedExpressionDependency instanceof NamedExpressionDependency)) {
        continue
      }

      const expressionName = namedExpressionDependency.name
      const sourceVertex = this.dependencyGraph.fetchNamedExpressionVertex(expressionName, sourceSheet)
      const namedExpressionInTargetScope = this.namedExpressions.isExpressionInScope(expressionName, targetAddress.sheet)

      const targetScopeExpressionVertex = namedExpressionInTargetScope
        ? this.dependencyGraph.fetchNamedExpressionVertex(expressionName, targetAddress.sheet)
        : this.copyOrFetchGlobalNamedExpressionVertex(expressionName, sourceVertex, addedGlobalNamedExpressions)

      if (targetScopeExpressionVertex !== sourceVertex) {
        this.dependencyGraph.graph.softRemoveEdge(sourceVertex, vertex)
        this.dependencyGraph.graph.addEdge(targetScopeExpressionVertex, vertex)
      }
    }

    return addedGlobalNamedExpressions
  }

  private allocateNamedExpressionAddressSpace() {
    this.dependencyGraph.addressMapping.addSheet(-1, new SparseStrategy(0, 0))
  }

  private copyOrFetchGlobalNamedExpressionVertex(expressionName: string, sourceVertex: CellVertex, addedNamedExpressions: string[]): CellVertex {
    let expression = this.namedExpressions.namedExpressionForScope(expressionName)
    if (expression === undefined) {
      expression = this.namedExpressions.addNamedExpression(expressionName)
      addedNamedExpressions.push(expression.normalizeExpressionName())
      if (sourceVertex instanceof FormulaCellVertex) {
        const parsingResult = this.parser.fetchCachedResultForAst(sourceVertex.getFormula(this.lazilyTransformingAstService))
        const {ast, hasVolatileFunction, hasStructuralChangeFunction, hasAsyncFunction, dependencies} = parsingResult
        this.dependencyGraph.setFormulaToCell(expression.address, ast, absolutizeDependencies(dependencies, expression.address), ArraySize.scalar(), hasVolatileFunction, hasStructuralChangeFunction, hasAsyncFunction)
      } else if (sourceVertex instanceof EmptyCellVertex) {
        this.setCellEmpty(expression.address)
      } else if (sourceVertex instanceof ValueCellVertex) {
        this.setValueToCell(sourceVertex.getValues(), expression.address)
      }
    }
    return this.dependencyGraph.fetchCellOrCreateEmpty(expression.address)
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

function isPositiveInteger(x: number): boolean {
  return Number.isInteger(x) && x > 0
}

function isRowOrColumnRange(leftCorner: SimpleCellAddress, width: number, height: number): boolean {
  return (leftCorner.row === 0 && isPositiveInteger(width) && height === Number.POSITIVE_INFINITY)
    || (leftCorner.col === 0 && isPositiveInteger(height) && width === Number.POSITIVE_INFINITY)
}
