import {AbsoluteCellRange} from './AbsoluteCellRange'
import {BuildEngineFromArraysFactory} from './BuildEngineFromArraysFactory'
import {
  CellType,
  CellValueType,
  getCellType,
  getCellValueType,
  InternalCellValue,
  simpleCellAddress,
  SimpleCellAddress,
} from './Cell'
import {CellContent, CellContentParser, isMatrix, RawCellContent} from './CellContentParser'
import {CellValue, ExportedChange, Exporter} from './CellValue'
import {ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config} from './Config'
import {CrudOperations, normalizeAddedIndexes, normalizeRemovedIndexes} from './CrudOperations'
import {
  AddressMapping,
  DependencyGraph,
  FormulaCellVertex,
  Graph,
  MatrixMapping,
  MatrixVertex,
  ParsingErrorVertex,
  RangeMapping,
  SheetMapping,
  Vertex,
} from './DependencyGraph'
import {EmptyEngineFactory} from './EmptyEngineFactory'
import { NamedExpressionDoesNotExist, NamedExpressionNameIsAlreadyTaken, NamedExpressionNameIsInvalid} from './errors'
import {Evaluator} from './Evaluator'
import {Sheet, Sheets} from './GraphBuilder'
import {IBatchExecutor} from './IBatchExecutor'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {Maybe} from './Maybe'
import {NamedExpressions} from './NamedExpressions'
import {AstNodeType, ParserWithCaching, simpleCellAddressFromString, simpleCellAddressToString, Unparser, Ast} from './parser'
import {Statistics, StatType} from './statistics/Statistics'
import {TinyEmitter} from 'tiny-emitter'
import {Events, SheetAddedHandler, SheetRemovedHandler, SheetRenamedHandler, NamedExpressionAddedHandler, NamedExpressionRemovedHandler, ValuesUpdatedHandler} from './Emitter'

export type Index = [number, number]

/**
 * Engine for one sheet
 */
export class HyperFormula {

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

  private readonly crudOperations: CrudOperations
  private readonly exporter: Exporter
  private readonly namedExpressions: NamedExpressions
  private readonly emitter: TinyEmitter = new TinyEmitter()

  constructor(
    /** Engine config */
    public readonly config: Config,
    /** Statistics module for benchmarking */
    public readonly stats: Statistics,
    /** Dependency graph storing sheets structure */
    public readonly dependencyGraph: DependencyGraph,
    /** Column search strategy used by VLOOKUP plugin */
    public readonly columnSearch: ColumnSearchStrategy,
    /** Parser with caching */
    private readonly parser: ParserWithCaching,
    private readonly unparser: Unparser,
    private readonly cellContentParser: CellContentParser,
    /** Formula evaluator */
    public readonly evaluator: Evaluator,
    /** Service handling postponed CRUD transformations */
    public readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {
    this.crudOperations = new CrudOperations(config, stats, dependencyGraph, columnSearch, parser, cellContentParser, lazilyTransformingAstService)
    this.namedExpressions = new NamedExpressions(this.addressMapping, this.cellContentParser, this.dependencyGraph, this.parser, this.crudOperations)
    this.exporter = new Exporter(config, this.namedExpressions)
  }

  /**
   * Returns value of the cell with the given address.
   * Applies rounding and post-processing.
   *
   * @param address - cell coordinates
   */
  public getCellValue(address: SimpleCellAddress): CellValue {
    return this.exporter.exportValue(this.dependencyGraph.getCellValue(address))
  }

  /**
   * Returns normalized formula string from the cell with the given address.
   *
   * @param address - cell coordinates
   */
  public getCellFormula(address: SimpleCellAddress): Maybe<string> {
    const formulaVertex = this.dependencyGraph.getCell(address)
    if (formulaVertex instanceof FormulaCellVertex) {
      const formula = formulaVertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
      return this.unparser.unparse(formula, address)
    } else if (formulaVertex instanceof MatrixVertex) {
      const formula = formulaVertex.getFormula()
      if (formula) {
        return '{' + this.unparser.unparse(formula, formulaVertex.getAddress()) + '}'
      }
    } else if (formulaVertex instanceof ParsingErrorVertex) {
      return formulaVertex.getFormula()
    }
    return undefined
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
   * @returns {string} in a specific format or value or undefined
   */
  public getCellSerialized(address: SimpleCellAddress): CellValue {
    const formula: Maybe<string> = this.getCellFormula(address)
    return formula !== undefined ? formula : this.getCellValue(address)
  }

  /**
   * Returns array with values of all cells from Sheet
   *
   * @param sheet - sheet id number
   */
  public getSheetValues(sheet: number): CellValue[][] {
    return this.genericSheetGetter(sheet, (...args) => this.getCellValue(...args))
  }

  /**
   * Returns an array with normalized formula strings from Sheet,
   *
   * or undefined for a cells that have no value.
   *
   * Unparses AST.
   *
   * @param {SimpleCellAddress} address - cell coordinates
   *
   * @returns {string} in a specific format or undefined
   */
  public getSheetFormulas(sheet: number): Maybe<string>[][] {
    return this.genericSheetGetter(sheet, (...args) => this.getCellFormula(...args))
  }

  /**
   * Returns an array with serialized content of cells from Sheet,
   *
   * either a cell formula or an explicit value.
   *
   * Unparses AST. Applies post-processing.
   *
   * @param {SimpleCellAddress} address - cell coordinates
   *
   * @returns {string} in a specific format or undefined
   */
  public getSheetSerialized(sheet: number): CellValue[][] {
    return this.genericSheetGetter(sheet, (...args) => this.getCellSerialized(...args))
  }

  private genericSheetGetter<T>(sheet: number, getter: (address: SimpleCellAddress) => T): T[][] {
    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const sheetWidth = this.dependencyGraph.getSheetWidth(sheet)

    const arr: T[][] = new Array(sheetHeight)
    for (let i = 0; i < sheetHeight; i++) {
      arr[i] = new Array(sheetWidth)

      for (let j = 0; j < sheetWidth; j++) {
        const address = simpleCellAddress(sheet, j, i)
        arr[i][j] = getter(address)
      }
    }
    return arr
  }

  /**
   * Returns map containing dimensions of all sheets.
   *
   */
  public getAllSheetsDimensions(): Record<string, { width: number, height: number }> {
    return this.genericAllGetter((...args) => this.getSheetDimensions(...args))
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
   * Returns map containing values of all sheets.
   *
   */
  public getAllSheetsValues(): Record<string, CellValue[][]> {
    return this.genericAllGetter((...args) => this.getSheetValues(...args))
  }

  /**
   * Returns map containing formulas of all sheets.
   *
   */
  public getAllSheetsFormulas(): Record<string, Maybe<string>[][]> {
    return this.genericAllGetter((...args) => this.getSheetFormulas(...args))
  }

  /**
   * Returns map containing formulas or values of all sheets.
   *
   */
  public getAllSheetsSerialized(): Record<string, CellValue[][]> {
    return this.genericAllGetter((...args) => this.getSheetSerialized(...args))
  }

  private genericAllGetter<T>( sheetGetter: (sheet: number) => T): Record<string, T> {
    const result: Record<string, T> = {}
    for (const sheetName of this.sheetMapping.displayNames()) {
      const sheetId = this.sheetMapping.fetch(sheetName)
      result[sheetName] =  sheetGetter(sheetId)
    }
    return result
  }

  /**
   * Returns snapshot of a computation time statistics.
   */
  public getStats(): Map<StatType, number> {
    return this.stats.snapshot()
  }

  /**
   * Returns information whether its possible to change content in a rectangular idea bounded by the box
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param address - cell coordinate (top left corner)
   * @param width - width of the box
   * @param height - height of the box
   */
  public isItPossibleToSetCellContents(address: SimpleCellAddress, width: number = 1, height: number = 1): boolean {
    try {
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          this.crudOperations.ensureItIsPossibleToChangeContent({col: address.col + i, row: address.row + j, sheet: address.sheet})
        }
      }
    } catch (e) {
      return false
    }
    return true
  }

  /**
   * Sets content of a block of cells.
   *
   * @param topLeftCornerAddress - top left corner of block of cells
   * @param cellContents - array with content
   */
  public setCellContents(topLeftCornerAddress: SimpleCellAddress, cellContents: RawCellContent[][] | RawCellContent): ExportedChange[] {
    if (!(cellContents instanceof Array)) {
      this.crudOperations.setCellContent(topLeftCornerAddress, cellContents)
      return this.recomputeIfDependencyGraphNeedsIt()
    }
    for (let i = 0; i < cellContents.length; i++) {
      if(!(cellContents[i] instanceof Array)) {
        throw new Error('Expected an array of arrays or a raw cell value.')
      }
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
   * @param indexes - non-contiguous indexes with format [row, amount], where row is a row number above which the rows will be added
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
   * Add multiple rows to sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet id in which rows will be added
   * @param indexes - non-contiguous indexes with format [row, amount], where row is a row number above which the rows will be added
   */
  public addRows(sheet: number, ...indexes: Index[]): ExportedChange[] {
    this.crudOperations.addRows(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether its possible to remove rows
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param sheet - sheet id from which rows will be removed
   * @param indexes - non-contiguous indexes with format [row, amount]
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
   * Removes multiple rows from sheet. </br>
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet id from which rows will be removed
   * @param indexes - non-contiguous indexes with format [row, amount]
   * */
  public removeRows(sheet: number, ...indexes: Index[]): ExportedChange[] {
    this.crudOperations.removeRows(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether its possible to add columns
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param sheet - sheet id in which columns will be added
   * @param indexes - non-contiguous indexes with format [column, amount], where column is a column number from which new columns will be added
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
   * Add multiple columns to sheet </br>
   * Does nothing if columns are outside of effective sheet size
   *
   * @param sheet - sheet id in which columns will be added
   * @param indexes - non-contiguous indexes with format [column, amount], where column is a column number from which new columns will be added
   * */
  public addColumns(sheet: number, ...indexes: Index[]): ExportedChange[] {
    this.crudOperations.addColumns(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether its possible to remove columns
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param sheet - sheet id from which columns will be removed
   * @param indexes - non-contiguous indexes with format [column, amount]
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
   * Removes multiple columns from sheet. </br>
   * Does nothing if columns are outside of effective sheet size.
   *
   * @param sheet - sheet id from which columns will be removed
   * @param indexes - non-contiguous indexes with format [column, amount]
   * */
  public removeColumns(sheet: number, ...indexes: Index[]): ExportedChange[] {
    this.crudOperations.removeColumns(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
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
    try {
      this.crudOperations.ensureItIsPossibleToMoveCells(sourceLeftCorner, width, height, destinationLeftCorner)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Moves content of the cell block.
   *
   * @param sourceLeftCorner - address of the upper left corner of moved block
   * @param width - width of the cell block being moved
   * @param height - height of the cell block being moved
   * @param destinationLeftCorner - upper left address of the target cell block
   */
  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): ExportedChange[] {
    this.crudOperations.moveCells(sourceLeftCorner, width, height, destinationLeftCorner)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether its possible to move rows.
   *
   * If returns true, doing this operation won't throw any errors.
   *
   * @param sheet - number of sheet in which the operation will be performed
   * @param startRow - number of the first row to move
   * @param numberOfRows - number of rows to move
   * @param targetRow - row number before which rows will be moved
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
   * Moves selected rows before target row.
   *
   * @param sheet - number of sheet in which the operation will be performed
   * @param startRow - number of the first row to move
   * @param numberOfRows - number of rows to move
   * @param targetRow - row number before which rows will be moved
   */
  public moveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): ExportedChange[] {
    this.crudOperations.moveRows(sheet, startRow, numberOfRows, targetRow)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether its possible to move columns.
   *
   * If returns true, doing this operation won't throw any errors.
   *
   * @param sheet - number of sheet in which the operation will be performed
   * @param startColumn - number of the first column to move
   * @param numberOfColumns - number of columns to move
   * @param targetColumn - column number before which columns will be moved
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
   * Moves selected columns before target column.
   *
   * @param sheet - number of sheet in which the operation will be performed
   * @param startColumn - number of the first column to move
   * @param numberOfColumns - number of columns to move
   * @param targetColumn - column number before which columns will be moved
   */
  public moveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): ExportedChange[] {
    this.crudOperations.moveColumns(sheet, startColumn, numberOfColumns, targetColumn)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Stores copy of cell block in internal clipboard for further paste.</br>
   * Returns values of cells for use in external clipboard.
   *
   * @param sourceLeftCorner - address of the upper left corner of copied block
   * @param width - width of the cell block being copied
   * @param height - height of the cell block being copied
  * */
  public copy(sourceLeftCorner: SimpleCellAddress, width: number, height: number): InternalCellValue[][] {
    this.crudOperations.copy(sourceLeftCorner, width, height)
    return this.getValuesInRange(AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height))
  }

  /**
   * Stores information of cell block in internal clipboard for further paste. </br>
   * Calling {@link paste} right after this method is equivalent to call {@link moveCells}.</br>
   * Almost any CRUD operation called after this method will abortCut cut operation.</br>
   * Returns values of cells for use in external clipboard.
   *
   * @param sourceLeftCorner - address of the upper left corner of copied block
   * @param width - width of the cell block being copied
   * @param height - height of the cell block being copied
   * */
  public cut(sourceLeftCorner: SimpleCellAddress, width: number, height: number): InternalCellValue[][] {
    this.crudOperations.cut(sourceLeftCorner, width, height)
    return this.getValuesInRange(AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height))
  }

  /**
   * When called after {@link copy} it will paste copied values and formulas into cell block.</br>
   * When called after {@link paste} it will perform {@link moveCells} operation into the cell block.</br>
   * Does nothing if clipboard is empty.
   *
   * @param targetLeftCorner - upper left address of the target cell block
   * */
  public paste(targetLeftCorner: SimpleCellAddress): ExportedChange[] {
    this.crudOperations.paste(targetLeftCorner)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Clears clipboard content.
   * */
  public clearClipboard(): void {
    this.crudOperations.clearClipboard()
  }

  /**
   * Returns cell content of cells in given range
   *
   * @param range
   */
  public getValuesInRange(range: AbsoluteCellRange): InternalCellValue[][] {
    return this.dependencyGraph.getValuesInRange(range).map(
      (subarray: InternalCellValue[]) => subarray.map(
        (arg) => this.exporter.exportValue(arg),
      ),
    )
  }

  /**
   * Returns information whether its possible to add sheet
   *
   * If returns true, doing this operation won't throw any errors
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
   * Adds new sheet to engine.
   *
   * @param name - if not specified, name will be autogenerated
   * @returns given or autogenerated name of a new sheet
   */
  public addSheet(name?: string): string {
    const addedSheetName = this.crudOperations.addSheet(name)
    this.emitter.emit(Events.SheetAdded, addedSheetName)
    return addedSheetName
  }

  /**
   * Returns information whether its possible to remove sheet
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param name - sheet name
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
   * Removes sheet with given name
   *
   * @param name - sheet name
   */
  public removeSheet(name: string): ExportedChange[] {
    const displayName = this.sheetMapping.getDisplayNameByName(name)!
    this.crudOperations.removeSheet(name)
    const changes = this.recomputeIfDependencyGraphNeedsIt()
    this.emitter.emit(Events.SheetRemoved, displayName, changes)
    return changes
  }

  /**
   * Returns information whether its possible to clear sheet
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param name - sheet name
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
   * Clears sheet content
   *
   * @param name - sheet name
   * */
  public clearSheet(name: string): ExportedChange[] {
    this.crudOperations.ensureSheetExists(name)
    this.crudOperations.clearSheet(name)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether its possible to replace sheet content
   *
   * If returns true, doing this operation won't throw any errors
   *
   * @param name - sheet name
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
   * Replaces sheet content with new values.
   *
   * @param sheetName - sheet name
   * @param values - array of new values
   * */
  public setSheetContent(sheetName: string, values: RawCellContent[][]): ExportedChange[] {
    this.crudOperations.ensureSheetExists(sheetName)

    const sheetId = this.getSheetId(sheetName)!

    return this.batch((e) => {
      e.clearSheet(sheetName)
      if(!(values instanceof Array)) {
        throw new Error('Expected an array of arrays.')
      }
      for (let i = 0; i < values.length; i++) {
        if(!(values[i] instanceof Array)) {
          throw new Error('Expected an array of arrays.')
        }
        for (let j = 0; j < values[i].length; j++) {
          e.setCellContent({
            sheet: sheetId,
            row: i,
            col: j,
          }, values[i][j])
        }
      }
    })
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
  public simpleCellAddressToString(address: SimpleCellAddress, sheet: number): Maybe<string> {
    return simpleCellAddressToString(this.sheetMapping.fetchDisplayName, address, sheet)
  }

  /**
   * Returns a unique sheet name assigned to the sheet of given id
   *
   * Or undefined if the there's no sheet with given ID
   *
   * @param sheetId - ID of the sheet, for which we want to retrieve name
   * @returns name of the sheet
   */
  public getSheetName(sheetId: number): Maybe<string> {
    return this.sheetMapping.getDisplayName(sheetId)
  }

  /**
   * Returns a unique sheet ID assigned to the sheet with given name
   *
   * Or undefined if the there's no sheet with given name
   *
   * @param sheetName - name of the sheet, for which we want to retrieve ID
   * @returns ID of the sheet
   */
  public getSheetId(sheetName: string): Maybe<number> {
    return this.sheetMapping.get(sheetName)
  }

  /**
   * Returns whether sheet with given name exists
   *
   * @param sheetName - name of the sheet
   */
  public doesSheetExist(sheetName: string): boolean {
    return this.sheetMapping.hasSheetWithName(sheetName)
  }

  /**
   * Returns type of a cell at given address
   *
   * @param address - cell coordinates
   * @returns type of a cell
   * */
  public getCellType(address: SimpleCellAddress): CellType {
    const vertex = this.dependencyGraph.getCell(address)
    return getCellType(vertex)
  }

  /**
   * Returns weather cell contains simple value
   *
   * @param address - cell coordinates
   * */
  public doesCellHaveSimpleValue(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.VALUE
  }

  /**
   * Returns weather cell contains formula
   *
   * @param address - cell coordinates
   * */
  public doesCellHaveFormula(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.FORMULA
  }

  /**
   * Returns weather cell is empty
   *
   * @param address - cell coordinates
   * */
  public isCellEmpty(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.EMPTY
  }

  /**
   * Returns weather cell is part o a matrix
   *
   * @param address - cell coordinates
   * */
  public isCellPartOfMatrix(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.MATRIX
  }

  /**
   * Returns type of a cell value at given address
   *
   * @param address - cell coordinates
   * */
  public getCellValueType(address: SimpleCellAddress): CellValueType {
    const value = this.dependencyGraph.getCellValue(address)
    return getCellValueType(value)
  }

  /**
   * Returns number of existing sheets
   */
  public countSheets(): number {
    return this.sheetMapping.numberOfSheets()
  }

  public renameSheet(sheetId: number, newName: string): void {
    const oldName = this.sheetMapping.renameSheet(sheetId, newName)
    if (oldName !== SheetMapping.NO_CHANGE) {
      this.emitter.emit(Events.SheetRenamed, oldName, newName)
    }
  }

  /**
   * Run multiple operations and recompute formulas at the end
   *
   * @param batchOperations
   */
  public batch(batchOperations: (e: IBatchExecutor) => void): ExportedChange[] {
    try {
      batchOperations(this.crudOperations)
    } catch (e) {
      this.recomputeIfDependencyGraphNeedsIt()
      throw( e )
    }
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Add named expression
   *
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
   * Get named expression value
   *
   * @param expressionName - an expression name
   *
   * @returns CellValue | null
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
   * Change named expression expression
   *
   * @param expressionName - an expression name
   * @param newExpression - a new expression
   */
  public changeNamedExpression(expressionName: string, newExpression: RawCellContent): ExportedChange[] {
    if (!this.namedExpressions.doesNamedExpressionExist(expressionName)) {
      throw new NamedExpressionDoesNotExist(expressionName)
    }
    this.namedExpressions.changeNamedExpressionExpression(expressionName, newExpression)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Remove named expression
   *
   * @param expressionName - an expression name
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
   * List all named expression
   *
   * @param expressionName - an expression name
   */
  public listNamedExpressions(): string[] {
    return this.namedExpressions.getAllNamedExpressionsNames()
  }

  /**
   * Normalizes formula
   *
   * @param formulaString - a formula, ex. "=SUM(Sheet1!A1:A100)"
   *
   * @returns normalized formula
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
   * @param formulaString - a formula, ex. "=SUM(Sheet1!A1:A100)"
   * @param sheetName - a name of the sheet in context of which we evaluate formula
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
   * Validates formula
   *
   * @param formulaString - a formula, ex. "=SUM(Sheet1!A1:A100)"
   *
   * @returns whether formula can be executed outside of regular worksheet
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

  public onSheetAdded(handler: SheetAddedHandler): void {
    this.emitter.on(Events.SheetAdded, handler)
  }

  public onSheetRemoved(handler: SheetRemovedHandler): void {
    this.emitter.on(Events.SheetRemoved, handler)
  }

  public onSheetRenamed(handler: SheetRenamedHandler): void {
    this.emitter.on(Events.SheetRenamed, handler)
  }

  public onNamedExpressionAdded(handler: NamedExpressionAddedHandler): void {
    this.emitter.on(Events.NamedExpressionAdded, handler)
  }

  public onNamedExpressionRemoved(handler: NamedExpressionRemovedHandler): void {
    this.emitter.on(Events.NamedExpressionRemoved, handler)
  }

  public onValuesUpdated(handler: ValuesUpdatedHandler): void {
    this.emitter.on(Events.ValuesUpdated, handler)
  }

  /**
   *  Destroys instance of HyperFormula
   * */
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
   * Runs recomputation starting from recently changed vertices.
   */
  private recomputeIfDependencyGraphNeedsIt(): ExportedChange[] {
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
  }
}
