/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {Statistics, StatType} from './statistics'
import {ClipboardCell, ClipboardCellType} from './ClipboardOperations'
import {EmptyValue, invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, RawCellContent} from './CellContentParser'
import {RowsSpan} from './RowsSpan'
import {ColumnsSpan} from './ColumnsSpan'
import {ContentChanges} from './ContentChanges'
import {ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {absolutizeDependencies} from './absolutizeDependencies'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Index} from './HyperFormula'
import {buildMatrixVertex} from './GraphBuilder'
import {
  AddressMapping,
  CellVertex,
  DependencyGraph,
  EmptyCellVertex,
  FormulaCellVertex,
  MatrixVertex,
  ParsingErrorVertex,
  SheetMapping,
  SparseStrategy,
  ValueCellVertex
} from './DependencyGraph'
import {ValueCellVertexValue} from './DependencyGraph/ValueCellVertex'
import {
  InvalidArgumentsError,
  NamedExpressionDoesNotExist,
  NamedExpressionNameIsAlreadyTaken,
  NamedExpressionNameIsInvalid,
  NoRelativeAddressesAllowedError,
  SheetSizeLimitExceededError
} from './errors'
import {NamedExpressionDependency, ParserWithCaching, ProcedureAst, RelativeDependency} from './parser'
import {ParsingError} from './parser/Ast'
import {AddRowsTransformer} from './dependencyTransformers/AddRowsTransformer'
import {RemoveRowsTransformer} from './dependencyTransformers/RemoveRowsTransformer'
import {AddColumnsTransformer} from './dependencyTransformers/AddColumnsTransformer'
import {MoveCellsTransformer} from './dependencyTransformers/MoveCellsTransformer'
import {RemoveSheetTransformer} from './dependencyTransformers/RemoveSheetTransformer'
import {RemoveColumnsTransformer} from './dependencyTransformers/RemoveColumnsTransformer'
import {AbsoluteCellRange} from './AbsoluteCellRange'
import {findBoundaries, Sheet} from './Sheet'
import {Config} from './Config'
import {doesContainRelativeReferences, NamedExpression, NamedExpressions} from './NamedExpressions'
import {Maybe} from './Maybe'

export class RemoveRowsCommand {
  constructor(
    public readonly sheet: number,
    public readonly indexes: Index[]
  ) {
  }

  public normalizedIndexes(): Index[] {
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
    public readonly indexes: Index[]
  ) {
  }

  public normalizedIndexes(): Index[] {
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
    public readonly indexes: Index[]
  ) {
  }

  public normalizedIndexes(): Index[] {
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
    public readonly indexes: Index[]
  ) {
  }

  public normalizedIndexes(): Index[] {
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

export class Operations {
  private changes: ContentChanges = ContentChanges.empty()

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
    private readonly cellContentParser: CellContentParser,
    private readonly parser: ParserWithCaching,
    private readonly stats: Statistics,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly namedExpressions: NamedExpressions,
    private readonly config: Config,
  ) {
    this.allocateNamedExpressionAddressSpace()
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

  public removeSheet(sheetName: string) {
    const sheetId = this.sheetMapping.fetch(sheetName)

    this.dependencyGraph.removeSheet(sheetId)

    let version: number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveSheetTransformer(sheetId)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.sheetMapping.removeSheet(sheetId)
    this.columnSearch.removeSheet(sheetId)
    return version!
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

  public moveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): void {
    const rowsToAdd = RowsSpan.fromNumberOfRows(sheet, targetRow, numberOfRows)
    this.doAddRows(rowsToAdd)

    if (targetRow < startRow) {
      startRow += numberOfRows
    }

    const startAddress = simpleCellAddress(sheet, 0, startRow)
    const targetAddress = simpleCellAddress(sheet, 0, targetRow)
    this.moveCells(startAddress, Number.POSITIVE_INFINITY, numberOfRows, targetAddress)
    const rowsToRemove = RowsSpan.fromNumberOfRows(sheet, startRow, numberOfRows)
    this.doRemoveRows(rowsToRemove)
  }

  public moveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): void {
    const columnsToAdd = ColumnsSpan.fromNumberOfColumns(sheet, targetColumn, numberOfColumns)
    this.doAddColumns(columnsToAdd)

    if (targetColumn < startColumn) {
      startColumn += numberOfColumns
    }

    const startAddress = simpleCellAddress(sheet, startColumn, 0)
    const targetAddress = simpleCellAddress(sheet, targetColumn, 0)
    this.moveCells(startAddress, numberOfColumns, Number.POSITIVE_INFINITY, targetAddress)
    const columnsToRemove = ColumnsSpan.fromNumberOfColumns(sheet, startColumn, numberOfColumns)
    this.doRemoveColumns(columnsToRemove)
  }

  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): { version: number, overwrittenCellsData: [SimpleCellAddress, ClipboardCell][] } {
    this.ensureItIsPossibleToMoveCells(sourceLeftCorner, width, height, destinationLeftCorner)

    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    this.dependencyGraph.breakNumericMatricesInRange(sourceRange)
    this.dependencyGraph.breakNumericMatricesInRange(targetRange)

    const toRight = destinationLeftCorner.col - sourceLeftCorner.col
    const toBottom = destinationLeftCorner.row - sourceLeftCorner.row
    const toSheet = destinationLeftCorner.sheet

    const currentDataAtTarget = this.getRangeClipboardCells(targetRange)

    const valuesToRemove = this.dependencyGraph.valuesFromRange(targetRange)
    this.columnSearch.removeValues(valuesToRemove)
    const valuesToMove = this.dependencyGraph.valuesFromRange(sourceRange)
    this.columnSearch.moveValues(valuesToMove, toRight, toBottom, toSheet)

    let version: number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new MoveCellsTransformer(sourceRange, toRight, toBottom, toSheet)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })

    this.dependencyGraph.moveCells(sourceRange, toRight, toBottom, toSheet)

    this.updateNamedExpressionsForMovedCells(sourceLeftCorner, width, height, destinationLeftCorner)

    return {version: version!, overwrittenCellsData: currentDataAtTarget}
  }

  public addNamedExpression(expressionName: string, expression: RawCellContent, sheetId?: number) {
    this.storeNamedExpressionInCell(this.namedExpressions.lookupNextAddress(expressionName, sheetId), expression)
    const namedExpression = this.namedExpressions.addNamedExpression(expressionName, sheetId)
    this.adjustNamedExpressionEdges(namedExpression, expressionName, sheetId)
  }

  public restoreNamedExpression(namedExpression: NamedExpression, content: ClipboardCell, sheetId?: number) {
    const expressionName = namedExpression.displayName
    this.restoreCell(namedExpression.address, content)
    const restoredNamedExpression = this.namedExpressions.addNamedExpression(expressionName, sheetId)
    this.adjustNamedExpressionEdges(restoredNamedExpression, expressionName, sheetId)
  }

  public changeNamedExpressionExpression(expressionName: string, newExpression: RawCellContent, sheetId?: number): [NamedExpression, ClipboardCell]  {
    const namedExpression = this.namedExpressions.namedExpressionForScope(expressionName, sheetId)
    if (!namedExpression) {
      throw new NamedExpressionDoesNotExist(expressionName)
    }
    const content = this.getClipboardCell(namedExpression.address)
    this.storeNamedExpressionInCell(namedExpression.address, newExpression)
    return [namedExpression, content]
  }

  public removeNamedExpression(expressionName: string, sheetId?: number): [NamedExpression, ClipboardCell] {
    const namedExpression = this.namedExpressions.namedExpressionForScope(expressionName, sheetId)
    if (!namedExpression) {
      throw new NamedExpressionDoesNotExist(expressionName)
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
      throw new InvalidArgumentsError()
    }

    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    if (targetRange.exceedsSheetSizeLimits(this.config.maxColumns, this.config.maxRows)) {
      throw new SheetSizeLimitExceededError()
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(sourceRange)) {
      throw new Error('It is not possible to move matrix')
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(targetRange)) {
      throw new Error('It is not possible to replace cells with matrix')
    }
  }

  public restoreClipboardCells(sourceSheetId: number, cells: IterableIterator<[SimpleCellAddress, ClipboardCell]>) {
    for (const [address, clipboardCell] of cells) {
      this.restoreCell(address, clipboardCell)
      if (clipboardCell.type === ClipboardCellType.FORMULA) {
        const {dependencies} = this.parser.fetchCachedResult(clipboardCell.hash)
        this.updateNamedExpressionsForTargetAddress(sourceSheetId, address, dependencies)
      }
    }
  }

  public restoreCell(address: SimpleCellAddress, clipboardCell: ClipboardCell) {
    switch (clipboardCell.type) {
      case ClipboardCellType.VALUE: {
        this.setValueToCell(clipboardCell.value, address)
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

    this.dependencyGraph.removeRows(rowsToRemove)

    let version: number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveRowsTransformer(rowsToRemove)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })
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

    this.dependencyGraph.removeColumns(columnsToRemove)
    this.columnSearch.removeColumns(columnsToRemove)

    let version: number
    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new RemoveColumnsTransformer(columnsToRemove)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      version = this.lazilyTransformingAstService.addTransformation(transformation)
    })
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

    this.dependencyGraph.addRows(addedRows)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new AddRowsTransformer(addedRows)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addTransformation(transformation)
    })
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

    this.dependencyGraph.addColumns(addedColumns)
    this.columnSearch.addColumns(addedColumns)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformation = new AddColumnsTransformer(addedColumns)
      transformation.performEagerTransformations(this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addTransformation(transformation)
    })
  }

  public getClipboardCell(address: SimpleCellAddress): ClipboardCell {
    const vertex = this.dependencyGraph.getCell(address)

    if (vertex === null || vertex instanceof EmptyCellVertex) {
      return {type: ClipboardCellType.EMPTY}
    } else if (vertex instanceof ValueCellVertex) {
      /* TODO should we copy errors? */
      return {type: ClipboardCellType.VALUE, value: vertex.getCellValue()}
    } else if (vertex instanceof MatrixVertex) {
      return {type: ClipboardCellType.VALUE, value: vertex.getMatrixCellValue(address)}
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

  public setCellContent(address: SimpleCellAddress, newCellContent: RawCellContent): void {
    const parsedCellContent = this.cellContentParser.parse(newCellContent)

    let vertex = this.dependencyGraph.getCell(address)

    if (vertex instanceof MatrixVertex && !vertex.isFormula() && !(parsedCellContent instanceof CellContent.Number)) {
      this.dependencyGraph.breakNumericMatrix(vertex)
      vertex = this.dependencyGraph.getCell(address)
    }

    if (vertex instanceof MatrixVertex && !vertex.isFormula() && parsedCellContent instanceof CellContent.Number) {
      const newValue = parsedCellContent.value
      const oldValue = this.dependencyGraph.getCellValue(address)
      this.dependencyGraph.graph.markNodeAsSpecialRecentlyChanged(vertex)
      vertex.setMatrixCellValue(address, newValue)
      this.columnSearch.change(oldValue, newValue, address)
      this.changes.addChange(newValue, address)
    } else if (!(vertex instanceof MatrixVertex) && parsedCellContent instanceof CellContent.MatrixFormula) {
      const {ast, errors, dependencies} = this.parser.parse(parsedCellContent.formula, address)
      if (errors.length > 0) {
        this.dependencyGraph.setParsingErrorToCell(address, new ParsingErrorVertex(errors, parsedCellContent.formulaWithBraces()))
      } else {
        const newVertex = buildMatrixVertex(ast as ProcedureAst, address)
        if (newVertex instanceof ValueCellVertex) {
          throw Error('What if new matrix vertex is not properly constructed?')
        }
        this.dependencyGraph.addNewMatrixVertex(newVertex)
        this.dependencyGraph.processCellDependencies(absolutizeDependencies(dependencies, address), newVertex)
        this.dependencyGraph.graph.markNodeAsSpecialRecentlyChanged(newVertex)
      }
    } else if (!(vertex instanceof MatrixVertex)) {
      if (parsedCellContent instanceof CellContent.Formula) {
        const {ast, errors, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(parsedCellContent.formula, address)
        if (errors.length > 0) {
          this.dependencyGraph.setParsingErrorToCell(address, new ParsingErrorVertex(errors, parsedCellContent.formula))
        } else {
          this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
        }
      } else if (parsedCellContent instanceof CellContent.Empty) {
        this.setCellEmpty(address)
      } else if (parsedCellContent instanceof CellContent.MatrixFormula) {
        throw new Error('Cant happen')
      } else {
        this.setValueToCell(parsedCellContent.value, address)
      }
    } else {
      throw new Error('Illegal operation')
    }
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

  public setValueToCell(value: ValueCellVertexValue, address: SimpleCellAddress) {
    const oldValue = this.dependencyGraph.getCellValue(address)
    this.dependencyGraph.setValueToCell(address, value)
    this.columnSearch.change(oldValue, value, address)
    this.changes.addChange(value, address)
  }

  public setCellEmpty(address: SimpleCellAddress) {
    const oldValue = this.dependencyGraph.getCellValue(address)
    this.columnSearch.remove(oldValue, address)
    this.changes.addChange(EmptyValue, address)
    this.dependencyGraph.setCellEmpty(address)
  }

  public setFormulaToCellFromCache(formulaHash: string, address: SimpleCellAddress) {
    const {ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.fetchCachedResult(formulaHash)
    this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
  }

  public setParsingErrorToCell(rawInput: string, errors: ParsingError[], address: SimpleCellAddress) {
    this.dependencyGraph.setParsingErrorToCell(address, new ParsingErrorVertex(errors, rawInput))
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

  private get sheetMapping(): SheetMapping {
    return this.dependencyGraph.sheetMapping
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

  private adjustNamedExpressionEdges(namedExpression: NamedExpression, expressionName: string, sheetId?: number) {
    if (sheetId !== undefined) {
      const localVertex = this.dependencyGraph.fetchCellOrCreateEmpty(namedExpression.address)
      const globalNamedExpression = this.namedExpressions.workbookNamedExpressionOrPlaceholder(expressionName)
      const globalVertex = this.dependencyGraph.fetchCellOrCreateEmpty(globalNamedExpression.address)
      for (const adjacentNode of this.dependencyGraph.graph.adjacentNodes(globalVertex)) {
        if ((adjacentNode instanceof FormulaCellVertex || adjacentNode instanceof MatrixVertex) && adjacentNode.cellAddress.sheet === sheetId) {
          const ast = adjacentNode.getFormula(this.lazilyTransformingAstService)
          if (ast) {
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
    }
  }

  private storeNamedExpressionInCell(address: SimpleCellAddress, expression: RawCellContent) {
    const parsedCellContent = this.cellContentParser.parse(expression)
    if (parsedCellContent instanceof CellContent.MatrixFormula) {
      throw new Error('Matrix formulas are not supported')
    } else if (parsedCellContent instanceof CellContent.Formula) {
      const parsingResult = this.parser.parse(parsedCellContent.formula, simpleCellAddress(-1, 0, 0))
      if (doesContainRelativeReferences(parsingResult.ast)) {
        throw new NoRelativeAddressesAllowedError()
      }
      const {ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = parsingResult
      this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
    } else {
      if (parsedCellContent instanceof CellContent.Empty) {
        this.setCellEmpty(address)
      } else {
        this.setValueToCell(parsedCellContent.value, address)
      }
    }
  }

  private updateNamedExpressionsForMovedCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): void {
    if (sourceLeftCorner.sheet === destinationLeftCorner.sheet) {
      return
    }

    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    for (const formulaAddress of targetRange.addresses(this.dependencyGraph)) {
      const vertex = this.addressMapping.fetchCell(formulaAddress)
      if (vertex instanceof FormulaCellVertex && formulaAddress.sheet !== sourceLeftCorner.sheet) {
        const ast = vertex.getFormula(this.lazilyTransformingAstService)
        const {dependencies} = this.parser.fetchCachedResultForAst(ast)
        this.updateNamedExpressionsForTargetAddress(sourceLeftCorner.sheet, formulaAddress, dependencies)
      }
    }
  }

  private updateNamedExpressionsForTargetAddress(sourceSheet: number, targetAddress: SimpleCellAddress, dependencies: RelativeDependency[]) {
    if (sourceSheet === targetAddress.sheet) {
      return
    }

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
        : this.copyOrFetchGlobalNamedExpressionVertex(expressionName, sourceVertex)

      if (targetScopeExpressionVertex !== sourceVertex) {
        this.dependencyGraph.graph.softRemoveEdge(sourceVertex, vertex)
        this.dependencyGraph.graph.addEdge(targetScopeExpressionVertex, vertex)
      }
    }
  }

  private allocateNamedExpressionAddressSpace() {
    this.dependencyGraph.addressMapping.addSheet(-1, new SparseStrategy(0, 0))
  }

  private copyOrFetchGlobalNamedExpressionVertex(expressionName: string, sourceVertex: CellVertex): CellVertex {
    let expression = this.namedExpressions.namedExpressionForScope(expressionName)
    if (expression === undefined) {
      expression = this.namedExpressions.addNamedExpression(expressionName)
      if (sourceVertex instanceof FormulaCellVertex) {
        const parsingResult = this.parser.fetchCachedResultForAst(sourceVertex.getFormula(this.lazilyTransformingAstService))
        const {ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = parsingResult
        this.dependencyGraph.setFormulaToCell(expression.address, ast, absolutizeDependencies(dependencies, expression.address), hasVolatileFunction, hasStructuralChangeFunction)
      } else if (sourceVertex instanceof EmptyCellVertex) {
        this.setCellEmpty(expression.address)
      } else if (sourceVertex instanceof ValueCellVertex) {
        this.setValueToCell(sourceVertex.getCellValue(), expression.address)
      }
    }
    return this.dependencyGraph.fetchCellOrCreateEmpty(expression.address)
  }

  private get addressMapping(): AddressMapping {
    return this.dependencyGraph.addressMapping
  }
}

export function normalizeRemovedIndexes(indexes: Index[]): Index[] {
  if (indexes.length <= 1) {
    return indexes
  }

  const sorted = indexes.sort(([a], [b]) => (a < b) ? -1 : (a > b) ? 1 : 0)

  /* merge overlapping and adjacent indexes */
  const merged = sorted.reduce((acc: Index[], [startIndex, amount]: Index) => {
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

export function normalizeAddedIndexes(indexes: Index[]): Index[] {
  if (indexes.length <= 1) {
    return indexes
  }

  const sorted = indexes.sort(([a], [b]) => (a < b) ? -1 : (a > b) ? 1 : 0)

  /* merge indexes with same start */
  const merged = sorted.reduce((acc: Index[], [startIndex, amount]: Index) => {
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
