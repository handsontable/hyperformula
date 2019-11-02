import {AbsoluteCellRange} from './AbsoluteCellRange'
import {absolutizeDependencies} from './absolutizeDependencies'
import {BuildEngineFromArraysFactory} from './BuildEngineFromArraysFactory'
import {CellValue, EmptyValue, invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {IColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {ColumnsSpan} from './ColumnsSpan'
import {Config} from './Config'
import {
  AddressMapping,
  DependencyGraph,
  EmptyCellVertex,
  FormulaCellVertex,
  Graph,
  MatrixMapping,
  MatrixVertex,
  RangeMapping,
  SheetMapping,
  ValueCellVertex,
  Vertex
} from './DependencyGraph'
import {AddColumnsDependencyTransformer} from './dependencyTransformers/addColumns'
import {AddRowsDependencyTransformer} from './dependencyTransformers/addRows'
import {MoveCellsDependencyTransformer} from './dependencyTransformers/moveCells'
import {RemoveColumnsDependencyTransformer} from './dependencyTransformers/removeColumns'
import {RemoveRowsDependencyTransformer} from './dependencyTransformers/removeRows'
import {EmptyEngineFactory} from './EmptyEngineFactory'
import {Evaluator} from './Evaluator'
import {buildMatrixVertex, Sheet, Sheets} from './GraphBuilder'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {CellAddress, cellAddressFromString, isFormula, isMatrix, ParserWithCaching, ProcedureAst} from './parser'
import {RowsSpan} from './RowsSpan'
import {Statistics, StatType} from './statistics/Statistics'
import {RemoveSheetDependencyTransformer} from "./dependencyTransformers/removeSheet";
import {CellValueChange, ContentChanges} from "./ContentChanges";

export class NoSuchSheetError extends Error {
  constructor(sheetId: number) {
    super(`There's no sheet with id = ${sheetId}`)
  }
}

export class InvalidAddressError extends Error {
  constructor(address: SimpleCellAddress) {
    super(`Address (row = ${address.row}, col = ${address.col}) is invalid`)
  }
}

function isPositiveInteger(x: number) {
  return Number.isInteger(x) && x > 0
}

function isNonnegativeInteger(x: number) {
  return Number.isInteger(x) && x >= 0
}

/**
 * Engine for one sheet
 */
export class HyperFormula {
  constructor(
      /** Engine config */
      public readonly config: Config,
      /** Statistics module for benchmarking */
      public readonly stats: Statistics,
      /** Dependency graph storing sheets structure */
      public readonly dependencyGraph: DependencyGraph,
      /** Column search strategy used by VLOOKUP plugin */
      public readonly columnSearch: IColumnSearchStrategy,
      /** Parser with caching */
      private readonly parser: ParserWithCaching,
      /** Formula evaluator */
      public readonly evaluator: Evaluator,
      /** Service handling postponed CRUD transformations */
      public readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {
  }

  /**
   * Builds engine for sheet from two-dimensional array representation.
   *
   * @param sheet - two-dimensional array representation of sheet
   * @param maybeConfig - config
   */
  public static buildFromArray(sheet: Sheet, maybeConfig?: Config): HyperFormula {
    return new BuildEngineFromArraysFactory().buildFromSheet(sheet, maybeConfig)
  }

  /**
   * Builds engine from object containing multiple sheets with names.
   *
   * @param sheets - object with sheets definition
   * @param maybeConfig - config
  * */
  public static buildFromSheets(sheets: Sheets, maybeConfig?: Config): HyperFormula {
    return new BuildEngineFromArraysFactory().buildFromSheets(sheets, maybeConfig)
  }

  /**
   * Builds empty engine instance.
   *
   * @param maybeConfig - config
   * */
  public static buildEmpty(maybeConfig?: Config): HyperFormula {
    return new EmptyEngineFactory().build(maybeConfig)
  }

  public get graph(): Graph<Vertex> {
    return this.dependencyGraph.graph
  }

  public get rangeMapping(): RangeMapping {
    return this.dependencyGraph.rangeMapping
  }

  public get matrixMapping(): MatrixMapping {
    return this.dependencyGraph.matrixMapping
  }

  public get sheetMapping(): SheetMapping {
    return this.dependencyGraph.sheetMapping
  }

  public get addressMapping(): AddressMapping {
    return this.dependencyGraph.addressMapping
  }

  /**
   * Returns value of the cell with the given address.
   *
   * @param stringAddress - cell coordinates (e.g. 'A1')
   */
  public getCellValue(address: SimpleCellAddress): CellValue {
    return this.dependencyGraph.getCellValue(address)
  }

  /**
   * Returns array with values of all cells.
   *
   * @param sheet - sheet id number
   * */
  public getValues(sheet: number): CellValue[][] {
    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const sheetWidth = this.dependencyGraph.getSheetWidth(sheet)

    const arr: CellValue[][] = new Array(sheetHeight)
    for (let i = 0; i < sheetHeight; i++) {
      arr[i] = new Array(sheetWidth)

      for (let j = 0; j < sheetWidth; j++) {
        const address = simpleCellAddress(sheet, j, i)
        arr[i][j] = this.dependencyGraph.getCellValue(address)
      }
    }

    return arr
  }

  /**
   * Returns map containing dimensions of all sheets.
   * */
  public getSheetsDimensions(): Map<string, { width: number, height: number }> {
    const sheetDimensions = new Map<string, { width: number, height: number }>()
    for (const sheetName of this.sheetMapping.names()) {
      const sheetId = this.sheetMapping.fetch(sheetName)
      sheetDimensions.set(sheetName, {
        width: this.dependencyGraph.getSheetWidth(sheetId),
        height: this.dependencyGraph.getSheetHeight(sheetId),
      })
    }
    return sheetDimensions
  }

  /**
  * Returns dimensions of specific sheet.
  *
  * @param sheet - sheet id number
  * */
  public getSheetDimensions(sheet: number): { width: number, height: number } {
    return {
      width: this.dependencyGraph.getSheetWidth(sheet),
      height: this.dependencyGraph.getSheetHeight(sheet),
    }
  }

  /**
   * Returns snapshot of a computation time statistics.
   */
  public getStats(): Map<StatType, number> {
    return this.stats.snapshot()
  }

  public isItPossibleToChangeContent(address: SimpleCellAddress): boolean {
    if (
      invalidSimpleCellAddress(address) ||
      !this.sheetMapping.hasSheetWithId(address.sheet)
    ) {
      return false
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixAtAddress(address)) {
      return false
    }

    return true
  }

  /**
   * Sets content of a cell with given address.
   *
   * @param address - cell coordinates
   * @param newCellContent - new cell content
   * @param recompute - specifies if recomputation should be fired after change
   */
  public setCellContent(address: SimpleCellAddress, newCellContent: string, recompute: boolean = true): CellValueChange[] {
    this.ensureThatAddressIsCorrect(address)

    const changes = new ContentChanges()
    let vertex = this.dependencyGraph.getCell(address)

    if (vertex instanceof MatrixVertex && !vertex.isFormula() && isNaN(Number(newCellContent))) {
      this.dependencyGraph.breakNumericMatrix(vertex)
      vertex = this.dependencyGraph.getCell(address)
    }

    if (vertex instanceof MatrixVertex && !vertex.isFormula() && !isNaN(Number(newCellContent))) {
      const newValue = Number(newCellContent)
      const oldValue = this.dependencyGraph.getCellValue(address)
      this.dependencyGraph.graph.markNodeAsSpecialRecentlyChanged(vertex)
      vertex.setMatrixCellValue(address, newValue)
      this.columnSearch.change(oldValue, newValue, address)
      changes.addChange(newValue, address)
    } else if (!(vertex instanceof MatrixVertex) && isMatrix(newCellContent)) {
      const matrixFormula = newCellContent.substr(1, newCellContent.length - 2)
      const parseResult = this.parser.parse(matrixFormula, address)

      const {vertex: newVertex, size} = buildMatrixVertex(parseResult.ast as ProcedureAst, address)

      if (!size || !(newVertex instanceof MatrixVertex)) {
        throw Error('What if new matrix vertex is not properly constructed?')
      }

      this.dependencyGraph.addNewMatrixVertex(newVertex)
      this.dependencyGraph.processCellDependencies(absolutizeDependencies(parseResult.dependencies, address), newVertex)
      this.dependencyGraph.graph.markNodeAsSpecialRecentlyChanged(newVertex)
    } else if (vertex instanceof FormulaCellVertex || vertex instanceof ValueCellVertex || vertex instanceof EmptyCellVertex || vertex === null) {
      if (isFormula(newCellContent)) {
        const {ast, hash, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(newCellContent, address)
        this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
      } else if (newCellContent === '') {
        const oldValue = this.dependencyGraph.getCellValue(address)
        this.columnSearch.remove(oldValue, address)
        changes.addChange(EmptyValue, address)
        this.dependencyGraph.setCellEmpty(address)
      } else if (!isNaN(Number(newCellContent))) {
        const newValue = Number(newCellContent)
        const oldValue = this.dependencyGraph.getCellValue(address)
        this.dependencyGraph.setValueToCell(address, newValue)
        this.columnSearch.change(oldValue, newValue, address)
        changes.addChange(newValue, address)
      } else {
        const oldValue = this.dependencyGraph.getCellValue(address)
        this.dependencyGraph.setValueToCell(address, newCellContent)
        this.columnSearch.change(oldValue, newCellContent, address)
        changes.addChange(newCellContent, address)
      }
    } else {
      throw new Error('Illegal operation')
    }

    if (recompute) {
      return this.recomputeIfDependencyGraphNeedsIt().addAll(changes).getChanges()
    }

    return changes.getChanges()
  }

  /**
   * Sets content of a block of cells.
   *
   * @param topLeftCornerAddress - top left corner of block of cells
   * @param cellContents - array with content
   */
  public setMultipleCellContents(topLeftCornerAddress: SimpleCellAddress, cellContents: string[][]): CellValueChange[] {
    for (let i = 0; i < cellContents.length; i++) {
      for (let j = 0; j < cellContents[i].length; j++) {
        if (isMatrix(cellContents[i][j])) {
          throw new Error('Cant change matrices in batch operation')
        }
      }
    }

    const changes = new ContentChanges()

    for (let i = 0; i < cellContents.length; i++) {
      for (let j = 0; j < cellContents[i].length; j++) {
        const change = this.setCellContent({
          sheet: topLeftCornerAddress.sheet,
          row: topLeftCornerAddress.row + i,
          col: topLeftCornerAddress.col + j,
        }, cellContents[i][j], false)
        changes.add(...change)
      }
    }

    return this.recomputeIfDependencyGraphNeedsIt().addAll(changes).getChanges()
  }

  public isItPossibleToAddRows(sheet: number, row: number, numberOfRowsToAdd: number = 1): boolean {
    if (!isNonnegativeInteger(row) || !isPositiveInteger(numberOfRowsToAdd)) {
      return false
    }
    const rowsToAdd = RowsSpan.fromNumberOfRows(sheet, row, numberOfRowsToAdd)

    if (!this.sheetMapping.hasSheetWithId(sheet)) {
      return false
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRows(rowsToAdd.firstRow())) {
      return false
    }

    return true
  }

  /**
   * Add multiple rows to sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet id in which rows will be added
   * @param row - row number above which the rows will be added
   * @param numberOfRowsToAdd - number of rows to add
   * */
  public addRows(sheet: number, row: number, numberOfRowsToAdd: number = 1): CellValueChange[] {
    if (this.rowEffectivelyNotInSheet(row, sheet)) {
      return []
    }

    const addedRows = RowsSpan.fromNumberOfRows(sheet, row, numberOfRowsToAdd)

    this.dependencyGraph.addRows(addedRows)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      AddRowsDependencyTransformer.transform(addedRows, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addAddRowsTransformation(addedRows)
    })

    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  public isItPossibleToRemoveRows(sheet: number, rowStart: number, rowEnd: number = rowStart): boolean {
    if (!isNonnegativeInteger(rowStart) || !isNonnegativeInteger(rowEnd)) {
      return false
    }
    if (rowEnd < rowStart) {
      return false
    }
    const rowsToRemove = RowsSpan.fromRowStartAndEnd(sheet, rowStart, rowEnd)

    if (!this.sheetMapping.hasSheetWithId(sheet)) {
      return false
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRows(rowsToRemove)) {
      return false
    }

    return true
  }

  /**
   * Removes multiple rows from sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet id from which rows will be removed
   * @param rowStart - number of the first row to be deleted
   * @param rowEnd - number of the last row to be deleted
   * */
  public removeRows(sheet: number, rowStart: number, rowEnd: number = rowStart): CellValueChange[] {
    if (this.rowEffectivelyNotInSheet(rowStart, sheet) || rowEnd < rowStart) {
      return []
    }

    const removedRows = RowsSpan.fromRowStartAndEnd(sheet, rowStart, rowEnd)

    this.dependencyGraph.removeRows(removedRows)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveRowsDependencyTransformer.transform(removedRows, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addRemoveRowsTransformation(removedRows)
    })

    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  public isItPossibleToAddColumns(sheet: number, column: number, numberOfColumnsToAdd: number = 1): boolean {
    if (!isNonnegativeInteger(column) || !isPositiveInteger(numberOfColumnsToAdd)) {
      return false
    }
    const columnsToAdd = ColumnsSpan.fromNumberOfColumns(sheet, column, numberOfColumnsToAdd)

    if (!this.sheetMapping.hasSheetWithId(sheet)) {
      return false
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInColumns(columnsToAdd.firstColumn())) {
      return false
    }

    return true
  }

  /**
   * Add multiple columns to sheet </br>
   * Does nothing if columns are outside of effective sheet size
   *
   * @param sheet - sheet id in which columns will be added
   * @param column - column number above which the columns will be added
   * @param numberOfColumns - number of columns to add
   * */
  public addColumns(sheet: number, column: number, numberOfColumns: number = 1): CellValueChange[] {
    if (this.columnEffectivelyNotInSheet(column, sheet)) {
      return []
    }

    const addedColumns = ColumnsSpan.fromNumberOfColumns(sheet, column, numberOfColumns)

    this.dependencyGraph.addColumns(addedColumns)
    this.columnSearch.addColumns(addedColumns)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      AddColumnsDependencyTransformer.transform(addedColumns, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addAddColumnsTransformation(addedColumns)
    })

    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  public isItPossibleToRemoveColumns(sheet: number, columnStart: number, columnEnd: number = columnStart): boolean {
    if (!isNonnegativeInteger(columnStart) || !isNonnegativeInteger(columnEnd)) {
      return false
    }
    if (columnEnd < columnStart) {
      return false
    }
    const columnsToRemove = ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart, columnEnd)

    if (!this.sheetMapping.hasSheetWithId(sheet)) {
      return false
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInColumns(columnsToRemove)) {
      return false
    }

    return true
  }

  /**
   * Removes multiple columns from sheet. </br>
   * Does nothing if columns are outside of effective sheet size.
   *
   * @param sheet - sheet id from which columns will be removed
   * @param columnStart - number of the first column to be deleted
   * @param columnEnd - number of the last row to be deleted
   * */
  public removeColumns(sheet: number, columnStart: number, columnEnd: number = columnStart): CellValueChange[] {
    if (this.columnEffectivelyNotInSheet(columnStart, sheet) || columnEnd < columnStart) {
      return []
    }

    const removedColumns = ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart, columnEnd)

    this.dependencyGraph.removeColumns(removedColumns)
    this.columnSearch.removeColumns(removedColumns)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveColumnsDependencyTransformer.transform(removedColumns, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addRemoveColumnsTransformation(removedColumns)
    })

    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  public isItPossibleToMoveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): boolean {
    if (
      invalidSimpleCellAddress(sourceLeftCorner) ||
      !isPositiveInteger(width) ||
      !isPositiveInteger(height) ||
      invalidSimpleCellAddress(destinationLeftCorner) ||
      !this.sheetMapping.hasSheetWithId(sourceLeftCorner.sheet) ||
      !this.sheetMapping.hasSheetWithId(destinationLeftCorner.sheet)
    ) {
      return false
    }

    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    if (this.dependencyGraph.matrixMapping.isMatrixInRange(sourceRange)) {
      return false
    }

    if (this.dependencyGraph.matrixMapping.isMatrixInRange(targetRange)) {
      return false
    }

    return true
  }

  /**
   * Moves content of the cell block.
   *
   * @param sourceLeftCorner - address of the upper left corner of moved block
   * @param width - width of the cell block being moved
   * @param height - height of the cell block being moved
   * @param destinationLeftCorner - upper left address of the target cell block
   * */
  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): CellValueChange[] {
    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    this.dependencyGraph.ensureNoMatrixInRange(sourceRange)
    this.dependencyGraph.ensureNoMatrixInRange(targetRange)

    const toRight = destinationLeftCorner.col - sourceLeftCorner.col
    const toBottom = destinationLeftCorner.row - sourceLeftCorner.row
    const toSheet = destinationLeftCorner.sheet

    const valuesToRemove = this.dependencyGraph.addressMapping.valuesFromRange(targetRange)
    this.columnSearch.removeValues(valuesToRemove)
    const valuesToMove = this.dependencyGraph.addressMapping.valuesFromRange(sourceRange)
    this.columnSearch.moveValues(valuesToMove, toRight, toBottom, toSheet)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      MoveCellsDependencyTransformer.transform(sourceRange, toRight, toBottom, toSheet, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addMoveCellsTransformation(sourceRange, toRight, toBottom, toSheet)
    })

    this.dependencyGraph.moveCells(sourceRange, toRight, toBottom, toSheet)

    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  public isItPossibleToAddSheet(): boolean {
    return true
  }

  /**
   * Adds new sheet to engine. Name of the new sheet will be autogenerated.
   * */
  public addSheet(): void {
    const sheetId = this.sheetMapping.addSheet()
    this.addressMapping.autoAddSheet(sheetId, [])
  }

  public isItPossibleToRemoveSheet(sheet: number): boolean {
    return this.sheetMapping.hasSheetWithId(sheet)
  }

  /**
   * Removes sheet with given id
   *
   * @param sheet - sheet id number
   * */
  public removeSheet(sheet: number): CellValueChange[] {
    this.dependencyGraph.removeSheet(sheet)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveSheetDependencyTransformer.transform(sheet, this.dependencyGraph)
      this.lazilyTransformingAstService.addRemoveSheetTransformation(sheet)
    })

    this.sheetMapping.removeSheet(sheet)
    this.columnSearch.removeSheet(sheet)

    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  /**
   * Forces engine to recompute postponed transformations. Useful during testing.
   * */
  public forceApplyPostponedTransformations(): void {
    this.dependencyGraph.forceApplyPostponedTransformations()
  }

  /**
   * Disables numeric arrays detected during graph build phase replacing them with ordinary numeric cells.
   * */
  public disableNumericMatrices(): void {
    this.dependencyGraph.disableNumericMatrices()
  }

  /**
   * Runs recomputation starting from recently changed vertices.
   * */
  private recomputeIfDependencyGraphNeedsIt(): ContentChanges {
    const verticesToRecomputeFrom = Array.from(this.dependencyGraph.verticesToRecompute())
    this.dependencyGraph.clearRecentlyChangedVertices()

    if (verticesToRecomputeFrom) {
      return this.evaluator.partialRun(verticesToRecomputeFrom)
    }

    return ContentChanges.empty()
  }

  /**
   * Throws error when given address is incorrect.
  * */
  private ensureThatAddressIsCorrect(address: SimpleCellAddress): void {
    if (invalidSimpleCellAddress(address)) {
      throw new InvalidAddressError(address)
    }

    if (!this.sheetMapping.hasSheetWithId(address.sheet)) {
      throw new NoSuchSheetError(address.sheet)
    }
  }

  /**
   * Returns true if row number is outside of given sheet.
   *
   * @param row - row number
   * @param sheet - sheet id number
  * */
  private rowEffectivelyNotInSheet(row: number, sheet: number): boolean {
    const height = this.addressMapping.getHeight(sheet)
    return row >= height;
  }

  /**
   * Returns true if row number is outside of given sheet.
   *
   * @param column - row number
   * @param sheet - sheet id number
   * */
  private columnEffectivelyNotInSheet(column: number, sheet: number): boolean {
    const width = this.addressMapping.getWidth(sheet)
    return column >= width;
  }
}
