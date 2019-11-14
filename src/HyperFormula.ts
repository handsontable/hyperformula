import {AbsoluteCellRange} from './AbsoluteCellRange'
import {BuildEngineFromArraysFactory} from './BuildEngineFromArraysFactory'
import {CellValue, invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {IColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {ColumnsSpan} from './ColumnsSpan'
import {Config} from './Config'
import {
  AddressMapping,
  DependencyGraph, FormulaCellVertex,
  Graph,
  MatrixMapping, MatrixVertex,
  RangeMapping,
  SheetMapping,
  Vertex
} from './DependencyGraph'
import {MoveCellsDependencyTransformer} from './dependencyTransformers/moveCells'
import {EmptyEngineFactory} from './EmptyEngineFactory'
import {Evaluator} from './Evaluator'
import {Sheet, Sheets} from './GraphBuilder'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {isMatrix, ParserWithCaching, simpleCellAddressFromString, simpleCellAddressToString, Unparser,} from './parser'
import {RowsSpan} from './RowsSpan'
import {Statistics, StatType} from './statistics/Statistics'
import {RemoveSheetDependencyTransformer} from "./dependencyTransformers/removeSheet";
import {CellValueChange, ContentChanges} from "./ContentChanges";
import {CrudOperations, normalizeIndexes} from "./CrudOperations";
import {IBatchExecutor} from "./IBatchExecutor";

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

export type Index = [number, number]

/**
 * Engine for one sheet
 */
export class HyperFormula {

  private crudOperations: CrudOperations

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
      private readonly unparser: Unparser,
      /** Formula evaluator */
      public readonly evaluator: Evaluator,
      /** Service handling postponed CRUD transformations */
      public readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {
    this.crudOperations = new CrudOperations(config, stats, dependencyGraph, columnSearch, parser, evaluator, lazilyTransformingAstService)
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
   */
  public static buildFromSheets(sheets: Sheets, maybeConfig?: Config): HyperFormula {
    return new BuildEngineFromArraysFactory().buildFromSheets(sheets, maybeConfig)
  }

  /**
   * Builds empty engine instance.
   *
   * @param maybeConfig - config
   */
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
   * @param address - cell coordinates
   */
  public getCellValue(address: SimpleCellAddress): CellValue {
    return this.dependencyGraph.getCellValue(address)
  }


  /**
   * Returns normalized formula string from the cell with the given address.
   *
   * @param address - cell coordinates
   */
  public getCellFormula(address: SimpleCellAddress): string | undefined {
    const formulaVertex = this.dependencyGraph.getCell(address)
    if (formulaVertex instanceof FormulaCellVertex) {
      const formula = formulaVertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
      return this.unparser.unparse(formula, address)
    } else if (formulaVertex instanceof MatrixVertex) {
      const formula = formulaVertex.getFormula()
      if (formula) {
        return "{" + this.unparser.unparse(formula, formulaVertex.getAddress()) + "}"
      }
    }
    return undefined
  }

  /**
   * Returns array with values of all cells.
   *
   * @param sheet - sheet id number
   */
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
   *
   */
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
   */
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

  /**
   * Returns information whether its possible to change content in given address
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param address - cell coordinates
   */
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
  public setCellContent(address: SimpleCellAddress, newCellContent: string): CellValueChange[] {
    this.crudOperations.setCellContent(address, newCellContent)
    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
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

    return this.batch((e) => {
      for (let i = 0; i < cellContents.length; i++) {
        for (let j = 0; j < cellContents[i].length; j++) {
          e.setCellContent({
            sheet: topLeftCornerAddress.sheet,
            row: topLeftCornerAddress.row + i,
            col: topLeftCornerAddress.col + j,
          }, cellContents[i][j])
        }
      }
    })
  }

  /**
   * Returns information whether its possible to add rows
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param sheet - sheet id in which rows will be added
   * @param row - row number above which the rows will be added
   * @param numberOfRowsToAdd - number of rows to add
   */
  public isItPossibleToAddRows(sheet: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeIndexes(indexes)

    for (const [row, numberOfRowsToAdd] of normalizedIndexes) {
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
    }

    return true
  }

  public addRows(sheet: number, ...indexes: Index[]): CellValueChange[] {
    this.crudOperations.addRows(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  /**
   * Returns information whether its possible to remove rows
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param sheet - sheet id from which rows will be removed
   * @param rowStart - number of the first row to be deleted
   * @param rowEnd - number of the last row to be deleted
   */
  public isItPossibleToRemoveRows(sheet: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeIndexes(indexes)

    for (const [rowStart, numberOfRows] of normalizedIndexes) {
      const rowEnd = rowStart + numberOfRows - 1
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
    }

    return true
  }

  public removeRows(sheet: number, ...indexes: Index[]): CellValueChange[] {
    this.crudOperations.removeRows(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  /**
   * Returns information whether its possible to add columns
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param sheet - sheet id in which columns will be added
   * @param column - column number above which the columns will be added
   * @param numberOfColumns - number of columns to add
   */
  public isItPossibleToAddColumns(sheet: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeIndexes(indexes)

    for (const [column, numberOfColumnsToAdd] of normalizedIndexes) {
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
    }

    return true
  }

  public addColumns(sheet: number, ...indexes: Index[]): CellValueChange[] {
    this.crudOperations.addColumns(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  /**
   * Returns information whether its possible to remove columns
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param sheet - sheet id from which columns will be removed
   * @param columnStart - number of the first column to be deleted
   * @param columnEnd - number of the last row to be deleted
   */
  public isItPossibleToRemoveColumns(sheet: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeIndexes(indexes)

    for (const [columnStart, numberOfColumns] of normalizedIndexes) {
      const columnEnd = columnStart + numberOfColumns - 1

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
    }

    return true
  }

  public removeColumns(sheet: number, ...indexes: Index[]): CellValueChange[] {
    this.crudOperations.removeColumns(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  /**
   * Returns information whether its possible to move cells
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param sourceLeftCorner - address of the upper left corner of moved block
   * @param width - width of the cell block being moved
   * @param height - height of the cell block being moved
   * @param destinationLeftCorner - upper left address of the target cell block
   */
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
   */
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

  /**
   * Returns information whether its possible to add sheet
   *
   * If returns true, doing this operation won't throw any errors
   */
  public isItPossibleToAddSheet(): boolean {
    return true
  }

  /**
   * Adds new sheet to engine. Name of the new sheet will be autogenerated.
   */
  public addSheet(): void {
    const sheetId = this.sheetMapping.addSheet()
    this.addressMapping.autoAddSheet(sheetId, [])
  }

  /**
   * Returns information whether its possible to remove sheet
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param sheet - sheet id number
   */
  public isItPossibleToRemoveSheet(sheet: number): boolean {
    return this.sheetMapping.hasSheetWithId(sheet)
  }

  /**
   * Removes sheet with given id
   *
   * @param sheet - sheet id number
   */
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
   */
  public forceApplyPostponedTransformations(): void {
    this.dependencyGraph.forceApplyPostponedTransformations()
  }

  /**
   * Disables numeric arrays detected during graph build phase replacing them with ordinary numeric cells.
   */
  public disableNumericMatrices(): void {
    this.dependencyGraph.disableNumericMatrices()
  }

  /**
   * Computes simple (absolute) address of a cell address based on it's string representation.
   * If sheet name is present in string representation but is not present in engine, returns undefined.
   * If sheet name is not present in string representation, returns {@param sheet} as sheet number
   *
   * @param stringAddress - string representation of cell address, e.g. 'C64'
   * @param sheet - override sheet index regardless of sheet mapping
   * @returns absolute representation of address, e.g. { sheet: 0, col: 1, row: 1 }
   */
  public simpleCellAddressFromString(stringAddress: string, sheet: number) {
    return simpleCellAddressFromString(this.sheetMapping.get, stringAddress, sheet)
  }

  /**
   * Returns string representation of absolute address
   * If sheet index is not present in engine, returns undefined
   *
   * @param address - object representation of absolute address
   * @param sheet - if is not equal with address sheet index, string representation will contain sheet name
   * */
  public simpleCellAddressToString(address: SimpleCellAddress, sheet: number): string | undefined {
    return simpleCellAddressToString(this.sheetMapping.name, address, sheet)
  }

  /**
   * Run multiple operations and recompute formulas at the end
   *
   * @param batchOperations
   * */
  public batch(batchOperations: (e: IBatchExecutor) => void): CellValueChange[] {
    batchOperations(this.crudOperations)
    return this.recomputeIfDependencyGraphNeedsIt().getChanges()
  }

  /**
   * Runs recomputation starting from recently changed vertices.
   */
  private recomputeIfDependencyGraphNeedsIt(): ContentChanges {
    const changes = this.crudOperations.getAndClearContentChanges()
    const verticesToRecomputeFrom = Array.from(this.dependencyGraph.verticesToRecompute())
    this.dependencyGraph.clearRecentlyChangedVertices()

    if (verticesToRecomputeFrom.length > 0) {
      changes.addAll(this.evaluator.partialRun(verticesToRecomputeFrom))
    }

    return changes
  }
}
