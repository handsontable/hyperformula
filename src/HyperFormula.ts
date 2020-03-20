import { AbsoluteCellRange } from './AbsoluteCellRange'
import { BuildEngineFromArraysFactory } from './BuildEngineFromArraysFactory'
import {
  CellType,
  CellValueType,
  getCellType,
  getCellValueType,
  NoErrorCellValue, SimpleCellAddress,
} from './Cell'
import {CellContent, CellContentParser, isMatrix, RawCellContent} from './CellContentParser'
import {CellValue, ExportedChange, Exporter} from './CellValue'
import {ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config, ConfigParams} from './Config'
import {CrudOperations} from './CrudOperations'
import {normalizeRemovedIndexes, normalizeAddedIndexes} from './Operations'
import {
  AddressMapping,
  DependencyGraph,
  Graph,
  MatrixMapping,
  RangeMapping,
  SheetMapping,
  Vertex,
} from './DependencyGraph'
import {EmptyEngineFactory} from './EmptyEngineFactory'
import { NamedExpressionDoesNotExist, NamedExpressionNameIsAlreadyTaken, NamedExpressionNameIsInvalid, NoOperationToUndo, EvaluationSuspendedError} from './errors'
import {Evaluator} from './Evaluator'
import {Sheet, Sheets} from './GraphBuilder'
import {IBatchExecutor} from './IBatchExecutor'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Maybe} from './Maybe'
import {NamedExpressions} from './NamedExpressions'
import {
  AstNodeType,
  ParserWithCaching,
  simpleCellAddressFromString,
  simpleCellAddressToString,
  Unparser,
  Ast,
} from './parser'
import {RebuildEngineWithConfigFactory} from './RebuildEngineWithConfigFactory'
import {
  Serialization
} from './Serialization'
import {Statistics, StatType} from './statistics/Statistics'
import {Emitter, TypedEmitter, Listeners, Events} from './Emitter'
import {UndoRedo} from './UndoRedo'

export type Index = [number, number]

/**
 * Engine for one sheet
 */
export class HyperFormula implements TypedEmitter {

  public static version = (process.env.HT_VERSION || '')
  public static buildDate = (process.env.HT_BUILD_DATE || '')

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
   * Builds the engine for sheet from a two-dimensional array representation.
   * 
   * The engine is created with a single sheet.
   * 
   * Can be configured with the optional second parameter that represents a [[Config]].
   * 
   * If not specified the engine will be built with the default configuration.
   *
   * @param {Sheet} sheet - two-dimensional array representation of sheet
   * @param {Partial<ConfigParams>} [configInput] - engine configuration
   */
  public static buildFromArray(sheet: Sheet, configInput?: Partial<ConfigParams>): HyperFormula {
    return new BuildEngineFromArraysFactory().buildFromSheet(sheet, configInput)
  }

  /**
   * Builds the engine from an object containing multiple sheets with names.
   * 
   * The engine is created with one or more sheets.
   * 
   * Can be configured with the optional second parameter that represents a [[Config]].
   * 
   * If not specified the engine will be built with the default configuration.
   *
   * @param {Sheet} sheets - object with sheets definition
   * @param {Partial<ConfigParams>} [configInput]- engine configuration
   */
  public static buildFromSheets(sheets: Sheets, configInput?: Partial<ConfigParams>): HyperFormula {
    return new BuildEngineFromArraysFactory().buildFromSheets(sheets, configInput)
  }

  /**
   * Builds an empty engine instance.
   * 
   * Can be configured with the optional parameter that represents a [[Config]].
   * 
   * If not specified the engine will be built with the default configuration.
   *
   * @param {Partial<ConfigParams>} [configInput] - engine configuration
   */
  public static buildEmpty(configInput?: Partial<ConfigParams>): HyperFormula {
    return new EmptyEngineFactory().build(configInput)
  }

  private crudOperations: CrudOperations
  private exporter: Exporter
  private namedExpressions: NamedExpressions
  private readonly emitter: Emitter = new Emitter()
  public serialization: Serialization
  private evaluationSuspended: boolean

  constructor(
    /** Engine configuration. */
    public config: Config,
    /** Statistics module for benchmarking. */
    public stats: Statistics,
    /** Dependency graph storing sheets structure. */
    public dependencyGraph: DependencyGraph,
    /** Column search strategy used by VLOOKUP plugin. */
    public columnSearch: ColumnSearchStrategy,
    /** Parser with caching. */
    private parser: ParserWithCaching,
    private unparser: Unparser,
    private cellContentParser: CellContentParser,
    /** Formula evaluator. */
    public evaluator: Evaluator,
    /** Service handling postponed CRUD transformations. */
    public lazilyTransformingAstService: LazilyTransformingAstService,
    public undoRedo: UndoRedo,
  ) {
    this.crudOperations = new CrudOperations(config, stats, dependencyGraph, columnSearch, parser, cellContentParser, lazilyTransformingAstService, undoRedo)
    undoRedo.crudOperations = this.crudOperations
    this.namedExpressions = new NamedExpressions(this.addressMapping, this.cellContentParser, this.dependencyGraph, this.parser, this.crudOperations)
    this.exporter = new Exporter(config, this.namedExpressions)
    this.serialization = new Serialization(this.dependencyGraph, this.unparser, this.config, this.exporter)
    this.evaluationSuspended = false
  }

  /**
   * Returns the cell value of a given address.
   * 
   * Applies rounding and post-processing.
   * 
   * @throws Throws an error if the given sheet ID does not exist.
   *
   * @param {SimpleCellAddress} address - cell coordinates
   */
  public getCellValue(address: SimpleCellAddress): CellValue {
    this.ensureComputationIsNotSuspended()
    return this.serialization.getCellValue(address)
  }

  private ensureComputationIsNotSuspended() {
    if (this.evaluationSuspended) {
      throw new EvaluationSuspendedError()
    }
  }

  /**
   * Returns a normalized formula string from the cell of a given address
   * 
   * or `undefined` for an address that does not exist and empty values.
   * 
   * Unparses AST.
   * 
   * @param {SimpleCellAddress} address - cell coordinates
   */
  public getCellFormula(address: SimpleCellAddress): Maybe<string> {
    return this.serialization.getCellFormula(address)
  }

  /**
   * Returns a serialized content of the cell of a given address
   *
   * either a cell formula or an explicit value.
   *
   * Unparses AST. Applies post-processing.
   *
   * @param {SimpleCellAddress} address - cell coordinates
   *
   * @returns a [[CellValue]] which is a value of a cell or an error
   */
  public getCellSerialized(address: SimpleCellAddress): NoErrorCellValue {
    this.ensureComputationIsNotSuspended()
    return this.serialization.getCellSerialized(address)
  }

  /**
   * Returns array with values of all cells from Sheet
   *
   * Applies rounding and post-processing.
   * 
   * @throws Throws an error if the given sheet ID does not exist.
   * 
   * @param {number} sheet - sheet ID number
   */
  public getSheetValues(sheet: number): CellValue[][] {
    this.ensureComputationIsNotSuspended()
    return this.serialization.getSheetValues(sheet)
  }

  /**
   * Returns an array with normalized formula strings from Sheet,
   *
   * or `undefined` for a cells that have no value.
   *
   * Unparses AST.
   *
   * @param {SimpleCellAddress} address - cell coordinates
   */
  public getSheetFormulas(sheet: number): Maybe<string>[][] {
    return this.serialization.getSheetFormulas(sheet)
  }

  /**
   * Returns an array with serialized content of cells from Sheet,
   *
   * either a cell formula or an explicit value.
   *
   * Unparses AST. Applies post-processing.
   *
   * @param {SimpleCellAddress} address - cell coordinates
   */
  public getSheetSerialized(sheet: number): NoErrorCellValue[][] {
    this.ensureComputationIsNotSuspended()
    return this.serialization.getSheetSerialized(sheet)
  }

  /**
   * Returns a map containing dimensions of all sheets for the engine instance
   * 
   * represented as a key-value pairs where keys are sheet IDs and dimensions are returned as numbers, width and height respectively.
   * 
   * @returns key-value pairs where keys are sheet IDs and dimensions are returned as numbers, width and height respectively.
   */
  public getAllSheetsDimensions(): Record<string, { width: number, height: number }> {
    return this.serialization.genericAllSheetsGetter((arg) => this.getSheetDimensions(arg))
  }

  /**
   * Returns dimensions of a specified sheet.
   * 
   * The sheet dimensions is represented with numbers: width and height.
   * 
   * @throws Throws an error if the given sheet ID does not exist.
   *
   * @param {number} sheet - sheet ID number
   */
  public getSheetDimensions(sheet: number): { width: number, height: number } {
    return {
      width: this.dependencyGraph.getSheetWidth(sheet),
      height: this.dependencyGraph.getSheetHeight(sheet),
    }
  }

  /**
   * Returns map containing values of all sheets.
   * 
   * @returns an object which property keys are strings and values are arrays of arrays of [[CellValue]]
   */
  public getAllSheetsValues(): Record<string, CellValue[][]> {
    this.ensureComputationIsNotSuspended()
    return this.serialization.getAllSheetsValues()
  }

  /**
   * Returns map containing formulas of all sheets.
   * 
   * @returns an object which property keys are strings and values are arrays of arrays of strings or possibly `undefined`
   */
  public getAllSheetsFormulas(): Record<string, Maybe<string>[][]> {
    return this.serialization.getAllSheetsFormulas()
  }

  /**
   * Returns map containing formulas or values of all sheets.
   * 
   * @returns an object which property keys are strings and values are arrays of arrays of [[CellValue]]
   */
  public getAllSheetsSerialized(): Record<string, NoErrorCellValue[][]> {
    this.ensureComputationIsNotSuspended()
    return this.serialization.getAllSheetsSerialized()
  }

  /**
   * Updates the config with given new parameters.
   *
   * @param newParams
   */
  public updateConfig(newParams: Partial<ConfigParams>): void {
    const newEngine = new RebuildEngineWithConfigFactory().rebuildWithConfig(this, newParams)
    this.crudOperations = newEngine.crudOperations
    this.exporter = newEngine.exporter
    this.namedExpressions = newEngine.namedExpressions
    this.config = newEngine.config
    this.dependencyGraph = newEngine.dependencyGraph
    this.columnSearch = newEngine.columnSearch
    this.parser = newEngine.parser
    this.unparser = newEngine.unparser
    this.cellContentParser = newEngine.cellContentParser
    this.evaluator = newEngine.evaluator
    this.lazilyTransformingAstService = newEngine.lazilyTransformingAstService
    this.undoRedo = newEngine.undoRedo
    this.serialization = newEngine.serialization
  }

  /**
   * Returns snapshot of a computation time statistics.
   * 
   * It returns a map with key-value pairs where keys are enums for stat type and time (number)
   */
  public getStats(): Map<StatType, number> {
    return this.stats.snapshot()
  }

  public undo() {
    if (this.undoRedo.isUndoStackEmpty()) {
      throw new NoOperationToUndo()
    }
    this.undoRedo.undo()
    this.recomputeIfDependencyGraphNeedsIt()
  }

  public isThereSomethingToUndo() {
    return !this.undoRedo.isUndoStackEmpty()
  }

  /**
   * Returns information whether it is possible to change the content in a rectangular area bounded by the box.
   * 
   * If returns `true`, doing [[setCellContents]] operation won't throw any errors.
   * 
   * @param {SimpleCellAddress} address - cell coordinates (top left corner)
   * @param {number} width - width of the box
   * @param {number} height - height of the box
   * 
   * @returns `true` if the action is possible, `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside selected cells, the address is invalid or the sheet does not exist
   */
  public isItPossibleToSetCellContents(address: SimpleCellAddress, width: number = 1, height: number = 1): boolean {
    try {
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          this.crudOperations.ensureItIsPossibleToChangeContent({ col: address.col + i, row: address.row + j, sheet: address.sheet })
        }
      }
    } catch (e) {
      return false
    }
    return true
  }

  /**
   * Sets the content for a block of cells of a given coordinates.
   * 
   * Note that this method may trigger dependency graph recalculation.
   * 
   * @param {SimpleCellAddress} topLeftCornerAddress - top left corner of block of cells
   * @param {(RawCellContent[][]|RawCellContent)} cellContents - array with content
   * 
   * @fires Events#valuesUpdated
   * 
   * @returns an array of [[ExportedChange]]
   */
  public setCellContents(topLeftCornerAddress: SimpleCellAddress, cellContents: RawCellContent[][] | RawCellContent): ExportedChange[] {
    this.crudOperations.setCellContents(topLeftCornerAddress, cellContents)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to add rows into a specified position in a given sheet.
   * 
   * Checks against particular rules to ascertain that addRows can be called.
   * 
   * If returns `true`, doing [[addRows]] operation won't throw any errors.
   * 
   * @param {number} sheet - sheet ID in which rows will be added
   * @param {Index[]} indexes - non-contiguous indexes with format [row, amount], where row is a row number above which the rows will be added
   * 
   * @returns `true` if the action is possible, `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected rows.
   */
  public isItPossibleToAddRows(sheet: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeAddedIndexes(indexes)
    try {
      this.crudOperations.ensureItIsPossibleToAddRows(sheet, ...normalizedIndexes)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Adds multiple rows into a specified position in a given sheet.
   * 
   * Does nothing if rows are outside of effective sheet size.
   * 
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheet - sheet ID in which rows will be added
   * @param {Index[]} indexes - non-contiguous indexes with format [row, amount], where row is a row number above which the rows will be added
   * 
   * @fires Events#valuesUpdated
   */
  public addRows(sheet: number, ...indexes: Index[]): ExportedChange[] {
    this.crudOperations.addRows(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to remove rows from a specified position in a given sheet.
   * 
   * Checks against particular rules to ascertain that removeRows can be called.
   * 
   * If returns `true`, doing [[removeRows]] operation won't throw any errors.
   *
   * @param {number} sheet - sheet ID from which rows will be removed
   * @param {Index[]} indexes - non-contiguous indexes with format: [row, amount]
   * 
   * @returns `true` if the action is possible, `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected rows.
   */
  public isItPossibleToRemoveRows(sheet: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeRemovedIndexes(indexes)
    try {
      this.crudOperations.ensureItIsPossibleToRemoveRows(sheet, ...normalizedIndexes)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Removes multiple rows from a specified position in a given sheet.
   * 
   * Does nothing if rows are outside of the effective sheet size.
   * 
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheet - sheet ID from which rows will be removed
   * @param {Index[]} indexes - non-contiguous indexes with format: [row, amount]
   * 
   * @fires Events#valuesUpdated
   */
  public removeRows(sheet: number, ...indexes: Index[]): ExportedChange[] {
    this.crudOperations.removeRows(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to add columns into a specified position in a given sheet.
   * 
   * Checks against particular rules to ascertain that addColumns can be called.
   * 
   * If returns `true`, doing [[addColumns]] operation won't throw any errors.
   *
   * @param {number} sheet - sheet ID in which columns will be added
   * @param {Index[]} indexes - non-contiguous indexes with format: [column, amount], where column is a column number from which new columns will be added
   * 
   * @returns `true` if the action is possible, `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns.
   * 
   */
  public isItPossibleToAddColumns(sheet: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeAddedIndexes(indexes)
    try {
      this.crudOperations.ensureItIsPossibleToAddColumns(sheet, ...normalizedIndexes)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Adds multiple columns into a specified position in a given sheet.
   * 
   * Does nothing if the columns are outside of the effective sheet size.
   * 
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheet - sheet ID in which columns will be added
   * @param {Index[]} indexes - non-contiguous indexes with format: [column, amount], where column is a column number from which new columns will be added
   * 
   * @fires Events#valuesUpdated
   */
  public addColumns(sheet: number, ...indexes: Index[]): ExportedChange[] {
    this.crudOperations.addColumns(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to remove columns from a specified position in a given sheet.
   * 
   * Checks against particular rules to ascertain that removeColumns can be called.
   * 
   * If returns `true`, doing [[removeColumns]] operation won't throw any errors.
   *
   * @param {number} sheet - sheet ID from which columns will be removed
   * @param {Index[]} indexes - non-contiguous indexes with format [column, amount]
   * 
   * @returns `true` if the action is possible, `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns.
   */
  public isItPossibleToRemoveColumns(sheet: number, ...indexes: Index[]): boolean {
    const normalizedIndexes = normalizeRemovedIndexes(indexes)
    try {
      this.crudOperations.ensureItIsPossibleToRemoveColumns(sheet, ...normalizedIndexes)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Removes multiple columns from a specified position in a given sheet.
   * 
   * Does nothing if columns are outside of the effective sheet size.
   * 
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheet - sheet ID from which columns will be removed
   * @param {Index[]} indexes - non-contiguous indexes with format: [column, amount]
   * 
   * @fires Events#valuesUpdated
   */
  public removeColumns(sheet: number, ...indexes: Index[]): ExportedChange[] {
    this.crudOperations.removeColumns(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to move cells to a specified position in a given sheet.
   * 
   * Checks against particular rules to ascertain that moveCells can be called.
   * 
   * If returns `true`, doing [[moveCells]] operation won't throw any errors.
   *
   * @param {SimpleCellAddress} sourceLeftCorner - address of the upper left corner of a moved block
   * @param {number} width - width of the cell block that is being moved
   * @param {number} height - height of the cell block that is being moved
   * @param {SimpleCellAddress} destinationLeftCorner - upper left address of the target cell block
   * 
   * @returns `true` if the action is possible, `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns, the target location has matrix or the provided address is invalid.
   */
  public isItPossibleToMoveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): boolean {
    try {
      this.crudOperations.ensureItIsPossibleToMoveCells(sourceLeftCorner, width, height, destinationLeftCorner)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Moves the content of a cell block from source to the target location.
   * 
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {SimpleCellAddress} sourceLeftCorner - address of the upper left corner of a moved block
   * @param {number} width - width of the cell block that is being moved
   * @param {number} height - height of the cell block that is being moved
   * @param {SimpleCellAddress} destinationLeftCorner - upper left address of the target cell block
   * 
   * @fires Events#valuesUpdated
   */
  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): ExportedChange[] {
    this.crudOperations.moveCells(sourceLeftCorner, width, height, destinationLeftCorner)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to move a particular number of rows to a specified position in a given sheet.
   * 
   * Checks against particular rules to ascertain that moveRows can be called.
   * 
   * If returns `true`, doing [[moveRows]] operation won't throw any errors.
   *
   * @param {number} sheet - a sheet number in which the operation will be performed
   * @param {number} startRow - number of the first row to move
   * @param {number} numberOfRows - number of rows to move
   * @param {number} targetRow - row number before which rows will be moved
   * 
   * @returns `true` if the action is possible, `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected rows, the target location has matrix or the provided address is invalid.
   * 
   */
  public isItPossibleToMoveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): boolean {
    try {
      this.crudOperations.ensureItIsPossibleToMoveRows(sheet, startRow, numberOfRows, targetRow)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Moves a particular number of rows to a specified position in a given sheet.
   * 
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheet - a sheet number in which the operation will be performed
   * @param {number} startRow - number of the first row to move
   * @param {number} numberOfRows - number of rows to move
   * @param {number} targetRow - row number before which rows will be moved
   * 
   * @fires Events#valuesUpdated
   */
  public moveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): ExportedChange[] {
    this.crudOperations.moveRows(sheet, startRow, numberOfRows, targetRow)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to move a particular number of columns to a specified position in a given sheet.
   * 
   * Checks against particular rules to ascertain that moveColumns can be called.
   * 
   * If returns `true`, doing [[moveColumns]] operation won't throw any errors.
   *
   * @param {number} sheet - a sheet number in which the operation will be performed
   * @param {number} startColumn - number of the first column to move
   * @param {number} numberOfColumns - number of columns to move
   * @param {number} targetColumn - column number before which columns will be moved
   * 
   * @returns `true` if the action is possible, `false` if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns, the target location has matrix or the provided address is invalid.
   */
  public isItPossibleToMoveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): boolean {
    try {
      this.crudOperations.ensureItIsPossibleToMoveColumns(sheet, startColumn, numberOfColumns, targetColumn)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Moves a particular number of columns to a specified position in a given sheet.
   * 
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {number} sheet - a sheet number in which the operation will be performed
   * @param {number} startColumn - number of the first column to move
   * @param {number} numberOfColumns - number of columns to move
   * @param {number} targetColumn - column number before which columns will be moved
   * 
   * @fires Events#valuesUpdated
   */
  public moveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): ExportedChange[] {
    this.crudOperations.moveColumns(sheet, startColumn, numberOfColumns, targetColumn)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Stores a copy of the cell block in internal clipboard for the further paste.
   * 
   * Returns values of cells for use in external clipboard.
   *
   * @param {SimpleCellAddress} sourceLeftCorner - address of the upper left corner of a copied block
   * @param {number} width - width of the cell block being copied
   * @param {number} height - height of the cell block being copied
  */
  public copy(sourceLeftCorner: SimpleCellAddress, width: number, height: number): CellValue[][] {
    this.crudOperations.copy(sourceLeftCorner, width, height)
    return this.getRangeValues(AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height))
  }

  /**
   * Stores information of the cell block in internal clipboard for further paste.
   * 
   * Calling [[paste]] right after this method is equivalent to call [[moveCells]].
   * 
   * Almost any CRUD operation called after this method will abort the cut operation.
   * 
   * Returns values of cells for use in external clipboard.
   *
   * @param {SimpleCellAddress} sourceLeftCorner - address of the upper left corner of a copied block
   * @param {number} width - width of the cell block being copied
   * @param {number} height - height of the cell block being copied
   */
  public cut(sourceLeftCorner: SimpleCellAddress, width: number, height: number): CellValue[][] {
    this.crudOperations.cut(sourceLeftCorner, width, height)
    return this.getRangeValues(AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height))
  }

  /**
   * When called after [[copy]] it will paste copied values and formulas into a cell block.
   * 
   * When called after [[paste]] it will perform [[moveCells]] operation into the cell block.
   * 
   * Does nothing if the clipboard is empty.
   * 
   * Note that this method may trigger dependency graph recalculation.
   * 
   * @param {SimpleCellAddress} targetLeftCorner - upper left address of the target cell block
   * 
   * @fires Events#valuesUpdated
   */
  public paste(targetLeftCorner: SimpleCellAddress): ExportedChange[] {
    this.crudOperations.paste(targetLeftCorner)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Clears the clipboard content by setting the content to `undefined`.
   */
  public clearClipboard(): void {
    this.crudOperations.clearClipboard()
  }

  /**
   * Returns the cell content of a given range in a [[InternalCellValue]][][] format.
   *
   * @param {AbsoluteCellRange} range absolute cell range
   */
  public getRangeValues(range: AbsoluteCellRange): CellValue[][] {
    return range.arrayOfAddressesInRange().map(
      (subarray) => subarray.map(
        (address) => this.getCellValue(address)
      )
    )
  }

  /**
   * Returns cell formulas in given range
   *
   * @param range
   */
  public getRangeFormulas(range: AbsoluteCellRange): Maybe<string>[][] {
    return range.arrayOfAddressesInRange().map(
      (subarray) => subarray.map(
        (address) => this.getCellFormula(address)
      )
    )
  }

  /**
   * Returns serialized cell in given range
   *
   * @param range
   */
  public getRangeSerialized(range: AbsoluteCellRange): CellValue[][] {
    return range.arrayOfAddressesInRange().map(
      (subarray) => subarray.map(
        (address) => this.getCellSerialized(address)
      )
    )
  }

  /**
   * Returns information whether it is possible to add a sheet to the engine.
   * 
   * Checks against particular rules to ascertain that addSheet can be called.
   * 
   * If returns `true`, doing [[addSheet]] operation won't throw any errors.
   * 
   * @param {string} name - sheet name, case insensitive
   * 
   * @returns `true` if it possible to add sheet with provided name, meaning the name does not already exists in the instance, `false` if the chosen name is already used
   */
  public isItPossibleToAddSheet(name: string): boolean {
    try {
      this.crudOperations.ensureItIsPossibleToAddSheet(name)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Adds a new sheet to the engine.
   * 
   * @param {string} [name] - if not specified, name will be autogenerated
   * 
   * @fires Events#sheetAdded
   * 
   * @returns given or autogenerated name of a new sheet
   */
  public addSheet(name?: string): string {
    const addedSheetName = this.crudOperations.addSheet(name)
    this.emitter.emit(Events.SheetAdded, addedSheetName)
    return addedSheetName
  }

  /**
   * Returns information whether it is possible to remove sheet for the engine.
   * 
   * If returns true, doing [[removeSheet]] operation won't throw any errors.
   * 
   * @param {string} name - sheet name, case insensitive
   * 
   * @returns `true` if the provided name of a sheet exists and then it can be removed, `false` if there is no sheet with a given name
   */
  public isItPossibleToRemoveSheet(name: string): boolean {
    try {
      this.crudOperations.ensureSheetExists(name)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Removes sheet with a specified name.
   * 
   * Note that this method may trigger dependency graph recalculation.
   * 
   * @param {string} name - sheet name, case insensitive
   * 
   * @fires Events#sheetRemoved
   * @fires Events#valuesUpdated
   */
  public removeSheet(name: string): ExportedChange[] {
    const displayName = this.sheetMapping.getDisplayNameByName(name)!
    this.crudOperations.removeSheet(name)
    const changes = this.recomputeIfDependencyGraphNeedsIt()
    this.emitter.emit(Events.SheetRemoved, displayName, changes)
    return changes
  }

  /**
   * Returns information whether it is possible to clear a specified sheet.
   * 
   * If returns `true`, doing [[clearSheet]] operation won't throw any errors.
   * 
   * @param {string} name - sheet name, case insensitive.
   * 
   * @returns `true` if the provided name of a sheet exists and then its content can be cleared, `false` if there is no sheet with a given name
   */
  public isItPossibleToClearSheet(name: string): boolean {
    try {
      this.crudOperations.ensureSheetExists(name)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Clears the sheet content.
   * 
   * Based on that the method finds the ID of a sheet to be cleared.
   * 
   * Double-checks if the sheet exists.
   * 
   * Note that this method may trigger dependency graph recalculation.
   * 
   * @param {string} name - sheet name, case insensitive.
   * 
   * @fires Events#valuesUpdated
   */
  public clearSheet(name: string): ExportedChange[] {
    this.crudOperations.ensureSheetExists(name)
    this.crudOperations.clearSheet(name)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to replace the sheet content.
   * 
   * If returns `true`, doing [[setSheetContent]] operation won't throw any errors.
   *
   * @param {string} name - sheet name, case insensitive.
   * 
   * @returns `true` if the provided name of a sheet exists and then its content can be replaced, `false` if there is no sheet with a given name
   */
  public isItPossibleToReplaceSheetContent(name: string): boolean {
    try {
      this.crudOperations.ensureSheetExists(name)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Replaces the sheet content with new values.
   * 
   * The new value is to be provided as an array of arrays of [[RawCellContent]]
   * 
   * The method finds sheet ID based on the provided sheet name.
   *
   * @param {string} sheetName - sheet name, case insensitive.
   * @param {RawCellContent[][]} values - array of new values
   */
  public setSheetContent(sheetName: string, values: RawCellContent[][]): ExportedChange[] {
    this.crudOperations.setSheetContent(sheetName, values)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Forces engine to recompute postponed transformations. Useful during testing.
   */
  public forceApplyPostponedTransformations(): void {
    this.dependencyGraph.forceApplyPostponedTransformations()
  }

  /**
   * Disables numeric arrays detected during graph build phase and replaces them with ordinary numeric cells.
   */
  public disableNumericMatrices(): void {
    this.dependencyGraph.disableNumericMatrices()
  }

  /**
   * Computes simple (absolute) address of a cell address based on its string representation.
   * 
   * If sheet name is present in string representation but not present in the engine, returns `undefined`.
   * 
   * If sheet name is not present in string representation, returns the sheet number.
   *
   * @param {string} stringAddress - string representation of cell address, e.g. 'C64'
   * @param {number} sheet - override sheet index regardless of sheet mapping
   * 
   * @returns absolute representation of address, e.g. `{ sheet: 0, col: 1, row: 1 }`
   */
  public simpleCellAddressFromString(stringAddress: string, sheet: number) {
    return simpleCellAddressFromString(this.sheetMapping.get, stringAddress, sheet)
  }

  /**
   * Returns string representation of an absolute address in A1 notation.
   * 
   * @param {SimpleCellAddress} address - object representation of an absolute address
   * @param {number} sheet - if is not equal with address sheet index, string representation will contain sheet name
   * 
   * @returns absolute address in string or `undefined` if the sheet index is not present in the engine
   */
  public simpleCellAddressToString(address: SimpleCellAddress, sheet: number): Maybe<string> {
    return simpleCellAddressToString(this.sheetMapping.fetchDisplayName, address, sheet)
  }

  /**
   * Returns a unique sheet name assigned to the sheet of a given ID.
   * 
   * Or `undefined` if the there is no sheet with a given ID.
   * 
   * @param {number} sheetId - ID of the sheet, for which we want to retrieve name
   * 
   * @returns name of the sheet or `undefined` if the sheet does not exist
   */
  public getSheetName(sheetId: number): Maybe<string> {
    return this.sheetMapping.getDisplayName(sheetId)
  }

  /**
   * Returns a unique sheet ID assigned to the sheet with a given name.
   * 
   * Returns `undefined` if the there's no sheet with a given name.
   * 
   * @param {string} sheetName - name of the sheet, for which we want to retrieve ID, case insensitive.
   * 
   * @returns ID of the sheet or `undefined` if the sheet does not exist
   */
  public getSheetId(sheetName: string): Maybe<number> {
    return this.sheetMapping.get(sheetName)
  }

  /**
   * Returns true whether sheet with a given name exists.
   * 
   * The methods accepts sheet name to be checked.
   * 
   * @param {string} sheetName - name of the sheet, case insensitive.
   * 
   * @returns `true` if a given sheet exists
   */
  public doesSheetExist(sheetName: string): boolean {
    return this.sheetMapping.hasSheetWithName(sheetName)
  }

  /**
   * Returns type of a specified cell of a given address.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param {SimpleCellAddress} address - cell coordinates
   */
  public getCellType(address: SimpleCellAddress): CellType {
    const vertex = this.dependencyGraph.getCell(address)
    return getCellType(vertex)
  }

  /**
   * Checks if the specified cell contains a simple value.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   * 
   * @param {SimpleCellAddress} address - cell coordinates
   * 
   * @returns `true` if cell contains a simple value
   */
  public doesCellHaveSimpleValue(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.VALUE
  }

  /**
   * Checks if the specified cell contains a formula.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param {SimpleCellAddress} address - cell coordinates
   * 
   * @returns `true` if cell contains a formula
   */
  public doesCellHaveFormula(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.FORMULA
  }

  /**
   * Checks if the specified cell is empty.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param {SimpleCellAddress} address - cell coordinates
   * 
   * @returns `true` if the cell is empty
   */
  public isCellEmpty(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.EMPTY
  }

  /**
   * Returns true if a given cell is a part of a matrix.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param {SimpleCellAddress} address - cell coordinates
   */
  public isCellPartOfMatrix(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.MATRIX
  }

  /**
   * Returns type of the cell value of a given address.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   * 
   * @param {SimpleCellAddress} address - cell coordinates
   */
  public getCellValueType(address: SimpleCellAddress): CellValueType {
    this.ensureComputationIsNotSuspended()
    const value = this.dependencyGraph.getCellValue(address)
    return getCellValueType(value)
  }

  /**
   * Returns the number of existing sheets.
   * 
   * @returns which is a number of sheets
   */
  public countSheets(): number {
    return this.sheetMapping.numberOfSheets()
  }

  /**
   * Renames a specified sheet.
   * 
   * @param {number} sheetId - a sheet number
   * @param {string} newName - a name of the sheet to be given, if is the same as the old one the method does nothing
   * 
   * @fires Events#sheetRenamed
   * 
   * @throws Throws an error if the provided sheet ID does not exists.
   */
  public renameSheet(sheetId: number, newName: string): void {
    const oldName = this.sheetMapping.renameSheet(sheetId, newName)
    if (oldName !== undefined) {
      this.emitter.emit(Events.SheetRenamed, oldName, newName)
    }
  }

  /**
   * Runs multiple operations and recomputes formulas at the end.
   * 
   * Note that this method may trigger dependency graph recalculation.
   * 
   * @param {(e: IBatchExecutor) => void} batchOperations
   * @fires Events#valuesUpdated
   */
  public batch(batchOperations: (e: IBatchExecutor) => void): ExportedChange[] {
    this.suspendEvaluation()
    try {
      batchOperations(this)
    } catch (e) {
      this.resumeEvaluation()
      throw (e)
    }
    return this.resumeEvaluation()
  }

  public suspendEvaluation(): void {
    this.evaluationSuspended = true
  }

  public resumeEvaluation(): ExportedChange[] {
    this.evaluationSuspended = false
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  public isEvaluationSuspended(): boolean {
    return this.evaluationSuspended
  }

  /**
   * Adds a specified named expression.
   * 
   * @throws Throws an error if the named expression is not valid and available.
   * 
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} expressionName - a name of the expression to be added
   * @param {RawCellContent} expression - the expression
   * 
   * @fires Events#namedExpressionAdded
   * @fires Events#valuesUpdated
   */
  public addNamedExpression(expressionName: string, expression: RawCellContent): ExportedChange[] {
    if (!this.namedExpressions.isNameValid(expressionName)) {
      throw new NamedExpressionNameIsInvalid(expressionName)
    }
    if (!this.namedExpressions.isNameAvailable(expressionName)) {
      throw new NamedExpressionNameIsAlreadyTaken(expressionName)
    }
    this.namedExpressions.addNamedExpression(expressionName, expression)
    const changes = this.recomputeIfDependencyGraphNeedsIt()
    this.emitter.emit(Events.NamedExpressionAdded, expressionName, changes)
    return changes
  }

  /**
   * Gets specified named expression value.
   *
   * @param {string} expressionName - expression name, case insensitive.
   * 
   * @returns a [[CellValue]] or null if the given named expression does not exists
   */
  public getNamedExpressionValue(expressionName: string): CellValue | null {
    const namedExpressionValue = this.namedExpressions.getNamedExpressionValue(expressionName)
    if (namedExpressionValue === null) {
      return null
    } else {
      return this.exporter.exportValue(namedExpressionValue)
    }
  }

  /**
   * Changes a given named expression to a specified formula.
   * 
   * @throws Throws an error if the given expression does not exist.
   * 
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} expressionName - an expression name, case insensitive.
   * @param {RawCellContent} newExpression - a new expression
   * 
   * @fires Events#valuesUpdated
   */
  public changeNamedExpression(expressionName: string, newExpression: RawCellContent): ExportedChange[] {
    if (!this.namedExpressions.doesNamedExpressionExist(expressionName)) {
      throw new NamedExpressionDoesNotExist(expressionName)
    }
    this.namedExpressions.changeNamedExpressionExpression(expressionName, newExpression)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Removes a named expression.
   * 
   * Note that this method may trigger dependency graph recalculation.
   *
   * @param {string} expressionName - expression name, case insensitive.
   * 
   * @fires Events#namedExpressionRemoved
   * @fires Events#valuesUpdated
   */
  public removeNamedExpression(expressionName: string): ExportedChange[] {
    const namedExpressionDisplayName = this.namedExpressions.getDisplayNameByName(expressionName)!
    const actuallyRemoved = this.namedExpressions.removeNamedExpression(expressionName)
    if (actuallyRemoved) {
      const changes = this.recomputeIfDependencyGraphNeedsIt()
      this.emitter.emit(Events.NamedExpressionRemoved, namedExpressionDisplayName, changes)
      return changes
    } else {
      return []
    }
  }

  /**
   * Lists all named expressions.
   * 
   * The method does not accept any parameters.
   * 
   * @returns an array of expression names as strings
   */
  public listNamedExpressions(): string[] {
    return this.namedExpressions.getAllNamedExpressionsNames()
  }

  /**
   * Normalizes the formula.
   * 
   * @throws Throws an error if the provided parameter is not a valid formula.
   *
   * @param {string} formulaString - a formula, ex. "=SUM(Sheet1!A1:A100)"
   *
   * @returns a normalized formula, throws an error if the provided string is not a formula, i.e does not start with "="
   */
  public normalizeFormula(formulaString: string): string {
    const [ast, address] = this.extractTemporaryFormula(formulaString)
    if (!ast) {
      throw new Error('This is not a formula')
    }
    return this.unparser.unparse(ast, address)
  }

  /**
   * Calculates fire-and-forget formula
   *
   * @param {string} formulaString - a formula, ex. "=SUM(Sheet1!A1:A100)"
   * @param {string} sheetName - a name of the sheet in context of which we evaluate formula, case insensitive.
   * 
   * @returns value of the formula
   */
  public calculateFormula(formulaString: string, sheetName: string): CellValue {
    this.crudOperations.ensureSheetExists(sheetName)
    const sheetId = this.sheetMapping.fetch(sheetName)
    const [ast, address] = this.extractTemporaryFormula(formulaString, sheetId)
    if (!ast) {
      throw new Error('This is not a formula')
    }
    const internalCellValue = this.evaluator.runAndForget(ast, address)
    return this.exporter.exportValue(internalCellValue)
  }

  /**
   * Validates the formula.
   * 
   * If the provided string starts with "=" and is a parsable formula the method returns true.
   *
   * @param {string} formulaString - a formula, ex. "=SUM(Sheet1!A1:A100)"
   *
   * @returns `true` if the string is a parsable formula
   */
  public validateFormula(formulaString: string): boolean {
    const [ast, address] = this.extractTemporaryFormula(formulaString)
    if (!ast) {
      return false
    }
    if (ast.type === AstNodeType.ERROR && !ast.error) {
      return false
    }
    return true
  }

  private extractTemporaryFormula(formulaString: string, sheetId: number = 1): [Ast | false, SimpleCellAddress] {
    const parsedCellContent = this.cellContentParser.parse(formulaString)
    const exampleTemporaryFormulaAddress = { sheet: sheetId, col: 0, row: 0 }
    if (!(parsedCellContent instanceof CellContent.Formula)) {
      return [false, exampleTemporaryFormulaAddress]
    }

    const { ast, errors } = this.parser.parse(parsedCellContent.formula, exampleTemporaryFormulaAddress)

    if (errors.length > 0) {
      return [false, exampleTemporaryFormulaAddress]
    }

    return [ast, exampleTemporaryFormulaAddress]
  }

  /**
   * A method that listens on events.
   * 
   * @param {Event} event to listen on
   * @param {Listener} handler to be called on event
   */
  public on<Event extends keyof Listeners>(event: Event, listener: Listeners[Event]): void {
    this.emitter.on(event, listener)
  }

  public once<Event extends keyof Listeners>(event: Event, listener: Listeners[Event]): void {
    this.emitter.once(event, listener)
  }

  public off<Event extends keyof Listeners>(event: Event, listener: Listeners[Event]): void {
    this.emitter.off(event, listener)
  }

  /**
   *  Destroys instance of HyperFormula.
   * 
   *  Dependency graph, optimization indexes, statistics and parser are removed.
   */
  public destroy(): void {
    this.dependencyGraph.destroy()
    this.columnSearch.destroy()
    this.evaluator.destroy()
    this.parser.destroy()
    this.lazilyTransformingAstService.destroy()
    this.stats.destroy()
    this.crudOperations.clearClipboard()
  }

  /**
   * Runs a recomputation starting from recently changed vertices.
   * 
   * Note that this method may trigger dependency graph recalculation.
   * 
   * @fires Events#valuesUpdated
   */
  private recomputeIfDependencyGraphNeedsIt(): ExportedChange[] {
    if (!this.evaluationSuspended) {
      const changes = this.crudOperations.getAndClearContentChanges()
      const verticesToRecomputeFrom = Array.from(this.dependencyGraph.verticesToRecompute())
      this.dependencyGraph.clearRecentlyChangedVertices()

      if (verticesToRecomputeFrom.length > 0) {
        changes.addAll(this.evaluator.partialRun(verticesToRecomputeFrom))
      }

      const exportedChanges = changes.exportChanges(this.exporter)

      if (!changes.isEmpty()) {
        this.emitter.emit(Events.ValuesUpdated, exportedChanges)
      }

      return exportedChanges
    } else {
      return []
    }
  }
}
