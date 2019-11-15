import {RowsSpan} from "./RowsSpan";
import {Statistics, StatType} from "./statistics/Statistics";
import {RemoveRowsDependencyTransformer} from "./dependencyTransformers/removeRows";
import {AddRowsDependencyTransformer} from "./dependencyTransformers/addRows";
import {ColumnsSpan} from "./ColumnsSpan";
import {AddColumnsDependencyTransformer} from "./dependencyTransformers/addColumns";
import {RemoveColumnsDependencyTransformer} from "./dependencyTransformers/removeColumns";
import {Config} from "./Config";
import {
  AddressMapping,
  DependencyGraph,
  EmptyCellVertex,
  FormulaCellVertex,
  MatrixVertex,
  SheetMapping,
  ValueCellVertex
} from "./DependencyGraph";
import {IColumnSearchStrategy} from "./ColumnSearch/ColumnSearchStrategy";
import {isFormula, isMatrix, ParserWithCaching, ProcedureAst} from "./parser";
import {LazilyTransformingAstService} from "./LazilyTransformingAstService";
import {Index} from "./HyperFormula";
import {IBatchExecutor} from "./IBatchExecutor";
import {EmptyValue, invalidSimpleCellAddress, SimpleCellAddress} from "./Cell";
import {AbsoluteCellRange} from "./AbsoluteCellRange";
import {MoveCellsDependencyTransformer} from "./dependencyTransformers/moveCells";
import {ContentChanges} from "./ContentChanges";
import {buildMatrixVertex} from "./GraphBuilder";
import {absolutizeDependencies} from "./absolutizeDependencies";

export class CrudOperations implements IBatchExecutor {

  private changes: ContentChanges = ContentChanges.empty()

  constructor(
      /** Engine config */
      private readonly config: Config,
      /** Statistics module for benchmarking */
      private readonly stats: Statistics,
      /** Dependency graph storing sheets structure */
      private readonly dependencyGraph: DependencyGraph,
      /** Column search strategy used by VLOOKUP plugin */
      private readonly columnSearch: IColumnSearchStrategy,
      /** Parser with caching */
      private readonly parser: ParserWithCaching,
      /** Service handling postponed CRUD transformations */
      private readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {

  }

  public addRows(sheet: number, ...indexes: Index[]) {
    const normalizedIndexes = normalizeIndexes(indexes)
    if (!this.isItPossibleToAddRows(sheet, ...normalizedIndexes)) {
      throw Error()
    }
    for (const index of normalizedIndexes) {
      this.doAddRows(sheet, index[0], index[1])
    }
  }

  public removeRows(sheet: number, ...indexes: Index[]) {
    const normalizedIndexes = normalizeIndexes(indexes)
    if (!this.isItPossibleToRemoveRows(sheet, ...normalizedIndexes)) {
      throw Error()
    }
    for (const index of normalizedIndexes) {
      this.doRemoveRows(sheet, index[0], index[0] + index[1] - 1)
    }
  }

  public addColumns(sheet: number, ...indexes: Index[]) {
    const normalizedIndexes = normalizeIndexes(indexes)
    if (!this.isItPossibleToAddColumns(sheet, ...normalizedIndexes)) {
      throw Error()
    }
    for (const index of normalizedIndexes) {
      this.doAddColumns(sheet, index[0], index[1])
    }
  }

  public removeColumns(sheet: number, ...indexes: Index[]) {
    const normalizedIndexes = normalizeIndexes(indexes)
    if (!this.isItPossibleToRemoveColumns(sheet, ...normalizedIndexes)) {
      throw Error()
    }
    for (const index of normalizedIndexes) {
      this.doRemoveColumns(sheet, index[0], index[0] + index[1] - 1)
    }
  }

  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress) {
    if (!this.isItPossibleToMoveCells(sourceLeftCorner, width, height, destinationLeftCorner)) {
      throw Error()
    }

    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

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
  }

  public setCellContent(address: SimpleCellAddress, newCellContent: string) {
    if (!this.isItPossibleToChangeContent(address)) {
      throw Error()
    }

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
      this.changes.addChange(newValue, address)
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
        this.changes.addChange(EmptyValue, address)
        this.dependencyGraph.setCellEmpty(address)
      } else if (!isNaN(Number(newCellContent))) {
        const newValue = Number(newCellContent)
        const oldValue = this.dependencyGraph.getCellValue(address)
        this.dependencyGraph.setValueToCell(address, newValue)
        this.columnSearch.change(oldValue, newValue, address)
        this.changes.addChange(newValue, address)
      } else {
        const oldValue = this.dependencyGraph.getCellValue(address)
        this.dependencyGraph.setValueToCell(address, newCellContent)
        this.columnSearch.change(oldValue, newCellContent, address)
        this.changes.addChange(newCellContent, address)
      }
    } else {
      throw new Error('Illegal operation')
    }
  }

  public isItPossibleToAddRows(sheet: number, ...indexes: Index[]): boolean {
    for (const [row, numberOfRowsToAdd] of indexes) {
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

  public isItPossibleToRemoveRows(sheet: number, ...indexes: Index[]): boolean {
    for (const [rowStart, numberOfRows] of indexes) {
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

  public isItPossibleToAddColumns(sheet: number, ...indexes: Index[]): boolean {
    for (const [column, numberOfColumnsToAdd] of indexes) {
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

  public isItPossibleToRemoveColumns(sheet: number, ...indexes: Index[]): boolean {
    for (const [columnStart, numberOfColumns] of indexes) {
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

  public isItPossibleToAddSheet(): boolean {
    return true
  }

  public isItPossibleToRemoveSheet(sheet: number): boolean {
    return this.sheetMapping.hasSheetWithId(sheet)
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

  public getAndClearContentChanges(): ContentChanges {
    const changes = this.changes
    this.changes = ContentChanges.empty()
    return changes
  }

  /**
   * Add multiple rows to sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet id in which rows will be added
   * @param row - row number above which the rows will be added
   * @param numberOfRowsToAdd - number of rows to add
   */
  private doAddRows(sheet: number, row: number, numberOfRowsToAdd: number = 1) {
    if (this.rowEffectivelyNotInSheet(row, sheet)) {
      return
    }

    const addedRows = RowsSpan.fromNumberOfRows(sheet, row, numberOfRowsToAdd)

    this.dependencyGraph.addRows(addedRows)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      AddRowsDependencyTransformer.transform(addedRows, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addAddRowsTransformation(addedRows)
    })
  }

  /**
   * Removes multiple rows from sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet id from which rows will be removed
   * @param rowStart - number of the first row to be deleted
   * @param rowEnd - number of the last row to be deleted
   * */
  private doRemoveRows(sheet: number, rowStart: number, rowEnd: number = rowStart) {
    if (this.rowEffectivelyNotInSheet(rowStart, sheet) || rowEnd < rowStart) {
      return
    }

    const removedRows = RowsSpan.fromRowStartAndEnd(sheet, rowStart, rowEnd)

    this.dependencyGraph.removeRows(removedRows)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveRowsDependencyTransformer.transform(removedRows, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addRemoveRowsTransformation(removedRows)
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
  private doAddColumns(sheet: number, column: number, numberOfColumns: number = 1) {
    if (this.columnEffectivelyNotInSheet(column, sheet)) {
      return
    }

    const addedColumns = ColumnsSpan.fromNumberOfColumns(sheet, column, numberOfColumns)

    this.dependencyGraph.addColumns(addedColumns)
    this.columnSearch.addColumns(addedColumns)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      AddColumnsDependencyTransformer.transform(addedColumns, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addAddColumnsTransformation(addedColumns)
    })
  }

  /**
   * Removes multiple columns from sheet. </br>
   * Does nothing if columns are outside of effective sheet size.
   *
   * @param sheet - sheet id from which columns will be removed
   * @param columnStart - number of the first column to be deleted
   * @param columnEnd - number of the last row to be deleted
   */
  private doRemoveColumns(sheet: number, columnStart: number, columnEnd: number = columnStart) {
    if (this.columnEffectivelyNotInSheet(columnStart, sheet) || columnEnd < columnStart) {
      return
    }

    const removedColumns = ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart, columnEnd)

    this.dependencyGraph.removeColumns(removedColumns)
    this.columnSearch.removeColumns(removedColumns)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveColumnsDependencyTransformer.transform(removedColumns, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addRemoveColumnsTransformation(removedColumns)
    })
  }

  /**
   * Returns true if row number is outside of given sheet.
   *
   * @param row - row number
   * @param sheet - sheet id number
   */
  private rowEffectivelyNotInSheet(row: number, sheet: number): boolean {
    const height = this.addressMapping.getHeight(sheet)
    return row >= height;
  }

  /**
   * Returns true if row number is outside of given sheet.
   *
   * @param column - row number
   * @param sheet - sheet id number
   */
  private columnEffectivelyNotInSheet(column: number, sheet: number): boolean {
    const width = this.addressMapping.getWidth(sheet)
    return column >= width;
  }

  private get addressMapping(): AddressMapping {
    return this.dependencyGraph.addressMapping
  }

  private get sheetMapping(): SheetMapping {
    return this.dependencyGraph.sheetMapping
  }
}

export function normalizeIndexes(indexes: Index[]): Index[] {
  if (indexes.length <= 1) {
    return indexes
  }

  const sorted = indexes.sort(([a], [b]) => (a < b) ? -1 : (a > b) ? 1 : 0)

  return sorted.reduce((acc: Index[], [startIndex, amount]: Index) => {
    const previous = acc[acc.length - 1]
    const lastIndex = previous[0] + previous[1]

    if (startIndex <= lastIndex) {
      previous[1] += Math.max(0, amount - (lastIndex - startIndex))
    } else {
      acc.push([startIndex, amount])
    }

    return acc
  }, [sorted[0]])
}

function isPositiveInteger(x: number) {
  return Number.isInteger(x) && x > 0
}

function isNonnegativeInteger(x: number) {
  return Number.isInteger(x) && x >= 0
}
