import {RowsSpan} from "./RowsSpan";
import {Statistics, StatType} from "./statistics/Statistics";
import {RemoveRowsDependencyTransformer} from "./dependencyTransformers/removeRows";
import {AddRowsDependencyTransformer} from "./dependencyTransformers/addRows";
import {ColumnsSpan} from "./ColumnsSpan";
import {AddColumnsDependencyTransformer} from "./dependencyTransformers/addColumns";
import {RemoveColumnsDependencyTransformer} from "./dependencyTransformers/removeColumns";
import {Config} from "./Config";
import {AddressMapping, DependencyGraph} from "./DependencyGraph";
import {IColumnSearchStrategy} from "./ColumnSearch/ColumnSearchStrategy";
import {ParserWithCaching} from "./parser";
import {Evaluator} from "./Evaluator";
import {LazilyTransformingAstService} from "./LazilyTransformingAstService";
import {Index, InvalidAddressError, NoSuchSheetError} from "./HyperFormula";
import {IBatchExecutor} from "./IBatchExecutor";
import {invalidSimpleCellAddress, SimpleCellAddress} from "./Cell";
import {AbsoluteCellRange} from "./AbsoluteCellRange";
import {MoveCellsDependencyTransformer} from "./dependencyTransformers/moveCells";

export class CrudOperations implements IBatchExecutor {
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
      /** Formula evaluator */
      private readonly evaluator: Evaluator,
      /** Service handling postponed CRUD transformations */
      private readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {

  }

  public addRows(sheet: number, ...indexes: Index[]) {
    const normalizedIndexes = this.normalizeIndexes(indexes)
    for (const index of normalizedIndexes) {
      this.doAddRows(sheet, index[0], index[1])
    }
  }

  public removeRows(sheet: number, ...indexes: Index[]) {
    const normalizedIndexes = this.normalizeIndexes(indexes)
    for (const index of normalizedIndexes) {
      this.doRemoveRows(sheet, index[0], index[0] + index[1] - 1)
    }
  }

  public addColumns(sheet: number, ...indexes: Index[]) {
    const normalizedIndexes = this.normalizeIndexes(indexes)
    for (const index of normalizedIndexes) {
      this.doAddColumns(sheet, index[0], index[1])
    }
  }

  public removeColumns(sheet: number, ...indexes: Index[]) {
    const normalizedIndexes = this.normalizeIndexes(indexes)
    for (const index of normalizedIndexes) {
      this.doRemoveColumns(sheet, index[0], index[0] + index[1] - 1)
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
  public doAddRows(sheet: number, row: number, numberOfRowsToAdd: number = 1) {
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
  public doRemoveRows(sheet: number, rowStart: number, rowEnd: number = rowStart) {
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
  public doAddColumns(sheet: number, column: number, numberOfColumns: number = 1) {
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
  public doRemoveColumns(sheet: number, columnStart: number, columnEnd: number = columnStart) {
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


  public moveCells (sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress) {
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

  private normalizeIndexes(indexes: Index[]): Index[] {
    /* TODO */
    return indexes
  }
}
