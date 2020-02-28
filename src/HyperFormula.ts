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
import {CellValue, CellValueExporter} from './CellValue'
import {IColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config} from './Config'
import {ChangeList} from './ContentChanges'
import {CrudOperations, normalizeAddedIndexes, normalizeRemovedIndexes} from './CrudOperations'
import {
  AddressMapping,
  DependencyGraph,
  FormulaCellVertex,
  Graph,
  MatrixMapping,
  MatrixVertex,
  RangeMapping,
  SheetMapping,
  SparseStrategy,
  Vertex,
} from './DependencyGraph'
import {EmptyEngineFactory} from './EmptyEngineFactory'
import { NamedExpressionDoesNotExist, NamedExpressionNameIsAlreadyTaken, NamedExpressionNameIsInvalid} from './errors'
import {Evaluator} from './Evaluator'
import {Sheet, Sheets} from './GraphBuilder'
import {IBatchExecutor} from './IBatchExecutor'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {NamedExpressions} from './NamedExpressions'
import {AstNodeType, ParserWithCaching, simpleCellAddressFromString, simpleCellAddressToString, Unparser} from './parser'
import {Statistics, StatType} from './statistics/Statistics'

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
   * Builds the engine for sheet from a two-dimensional array representation.
   * 
   * The engine is created with a single sheet.
   * 
   * Can be configured with the optional second parameter that represents a {Config}.
   * 
   * If not specified the engine will be built with the default configuration.
   *
   * @param sheet - two-dimensional array representation of sheet
   * @param maybeConfig - engine configuration
   * 
   * @return an instance of HyperFormula
   */
  public static buildFromArray(sheet: Sheet, maybeConfig?: Config): HyperFormula {
    return new BuildEngineFromArraysFactory().buildFromSheet(sheet, maybeConfig)
  }

  /**
   * Builds the engine from an object containing multiple sheets with names.
   * 
   * The engine is created with one or more sheets.
   * 
   * Can be configured with the optional second parameter that represents a {Config}.
   * 
   * If not specified the engine will be built with the default configuration.
   *
   * @param sheets - object with sheets definition
   * @param maybeConfig - engine configuration
   * 
   * @return an instance of HyperFormula
   */
  public static buildFromSheets(sheets: Sheets, maybeConfig?: Config): HyperFormula {
    return new BuildEngineFromArraysFactory().buildFromSheets(sheets, maybeConfig)
  }

  /**
   * Builds an empty engine instance.
   * 
   * Can be configured with the optional parameter that represents a {Config}.
   * 
   * If not specified the engine will be built with the default configuration.
   *
   * @param maybeConfig - engine configuration
   * 
   * @return an instance of HyperFormula
   */
  public static buildEmpty(maybeConfig?: Config): HyperFormula {
    return new EmptyEngineFactory().build(maybeConfig)
  }

  private readonly crudOperations: CrudOperations
  private readonly cellValueExporter: CellValueExporter
  private readonly namedExpressions: NamedExpressions

  constructor(
    /** Engine configuration. */
    public readonly config: Config,
    /** Statistics module for benchmarking. */
    public readonly stats: Statistics,
    /** Dependency graph storing sheets structure. */
    public readonly dependencyGraph: DependencyGraph,
    /** Column search strategy used by VLOOKUP plugin. */
    public readonly columnSearch: IColumnSearchStrategy,
    /** Parser with caching. */
    private readonly parser: ParserWithCaching,
    private readonly unparser: Unparser,
    private readonly cellContentParser: CellContentParser,
    /** Formula evaluator. */
    public readonly evaluator: Evaluator,
    /** Service handling postponed CRUD transformations. */
    public readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {
    this.crudOperations = new CrudOperations(config, stats, dependencyGraph, columnSearch, parser, cellContentParser, lazilyTransformingAstService)
    this.cellValueExporter = new CellValueExporter(config)
    this.namedExpressions = new NamedExpressions(this.cellContentParser, this.dependencyGraph, this.parser)
    this.addressMapping.addSheet(-1, new SparseStrategy(0, 0))
  }

  /**
   * Returns the cell value of a given address.
   * 
   * Returned value can be either number or string or boolean or a Symbol() for empty values.
   * 
   * Throws an error if the given sheet ID does not exist.
   * 
   * Applies rounding and post-processing.
   *
   * @param address - cell coordinates
   * 
   * @return which can be a number, string, boolean, Symbol() for empty values or {CellError}
   * 
   */
  public getCellValue(address: SimpleCellAddress): CellValue {
    return this.cellValueExporter.export(this.dependencyGraph.getCellValue(address))
  }

  /**
   * Returns a normalized formula string from the cell of a given address
   * 
   * or undefined for address that does not exist and empty values.
   * 
   * Unparses AST.
   * 
   * @param address - cell coordinates
   * 
   * @return string in a specific format or undefined
   */
  public getCellFormula(address: SimpleCellAddress): string | undefined {
    const formulaVertex = this.dependencyGraph.getCell(address)
    if (formulaVertex instanceof FormulaCellVertex) {
      const formula = formulaVertex.getFormula(this.dependencyGraph.lazilyTransformingAstService)
      return this.unparser.unparse(formula, address)
    } else if (formulaVertex instanceof MatrixVertex) {
      const formula = formulaVertex.getFormula()
      if (formula) {
        return '{' + this.unparser.unparse(formula, formulaVertex.getAddress()) + '}'
      }
    }
    return undefined
  }

  /**
   * Returns an array with values of all cells of a given sheet.
   *
   * Applies rounding and post-processing.
   * 
   * Throws an error if the given sheet ID does not exist.
   * 
   * @param sheet - sheet ID number
   * 
   * @return an array fo arrays with numbers, strings, booleans, Symbol() for empty values or {DetailedCellError}
   */
  public getValues(sheet: number): CellValue[][] {
    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const sheetWidth = this.dependencyGraph.getSheetWidth(sheet)

    const arr: CellValue[][] = new Array(sheetHeight)
    for (let i = 0; i < sheetHeight; i++) {
      arr[i] = new Array(sheetWidth)

      for (let j = 0; j < sheetWidth; j++) {
        const address = simpleCellAddress(sheet, j, i)
        arr[i][j] = this.cellValueExporter.export(this.dependencyGraph.getCellValue(address))
      }
    }

    return arr
  }

  /**
   * Returns a map containing dimensions of all sheets for the engine instance
   * 
   * represented as a key-value pairs where keys are sheet IDs and dimensions are returned as numbers, width and height respectively.
   * 
   * @return key-value pairs where keys are sheet IDs and dimensions are returned as numbers, width and height respectively.
   *
   */
  public getSheetsDimensions(): Map<string, { width: number, height: number }> {
    const sheetDimensions = new Map<string, { width: number, height: number }>()
    for (const sheetName of this.sheetMapping.displayNames()) {
      const sheetId = this.sheetMapping.fetch(sheetName)
      sheetDimensions.set(sheetName, {
        width: this.dependencyGraph.getSheetWidth(sheetId),
        height: this.dependencyGraph.getSheetHeight(sheetId),
      })
    }
    return sheetDimensions
  }

  /**
   * Returns dimensions of a specified sheet.
   * 
   * The sheet dimensions is represented with numbers: width and height.
   * 
   * Throws an error if the given sheet ID does not exist.
   *
   * @param sheet - sheet ID number
   * 
   * @return with and height of the sheet
   */
  public getSheetDimensions(sheet: number): { width: number, height: number } {
    return {
      width: this.dependencyGraph.getSheetWidth(sheet),
      height: this.dependencyGraph.getSheetHeight(sheet),
    }
  }

  /**
   * Returns a snapshot of the computation time statistics.
   * 
   * The method accepts no parameters.
   * 
   * It returns a map with key-value pairs where keys are enums for stat type and time (number)
   * 
   * @return which is a collection of key-value pair where StatType (key) is a named constant and time (value) is a number
   */
  public getStats(): Map<StatType, number> {
    return this.stats.snapshot()
  }

  /**
   * Returns information whether it is possible to change the content in a rectangular area bounded by the box.
   * 
   * The method accepts address which is the cell coordinates, width and height of the block.
   * 
   * If returns true, doing this operation won't throw any errors.
   * 
   * @return true if the action is possible, false if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside selected cells, the address is invalid or the sheet does not exist
   * 
   *
   * @param address - cell coordinates (top left corner)
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
   * Sets the content for a block of cells of a given coordinates.
   * 
   * The method accepts address which is the cell coordinates, width and height of the block.
   * 
   *
   * @param topLeftCornerAddress - top left corner of block of cells
   * @param cellContents - array with content
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * 
   */
  public setCellContents(topLeftCornerAddress: SimpleCellAddress, cellContents: RawCellContent[][] | RawCellContent): ChangeList {
    if (!(cellContents instanceof Array)) {
      this.crudOperations.setCellContent(topLeftCornerAddress, cellContents)
      return this.recomputeIfDependencyGraphNeedsIt()
    }
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
   * Returns information whether it is possible to add rows into a specified position in a given sheet.
   * 
   * The method accepts sheet ID in which addRows is to be called and array of coordinates where the rows should be added.
   * 
   * Checks against particular rules to ascertain that addRows can be called.
   * 
   * If returns true, doing this operation won't throw any errors.
   * 
   * @param sheet - sheet ID in which rows will be added
   * @param indexes - non-contiguous indexes with format [row, amount], where row is a row number above which the rows will be added
   * 
   * @return true if the action is possible, false if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected rows.
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
   * The method accepts sheet ID in which addRows is to be called and array of coordinates where the rows should be added.
   * 
   * Does nothing if rows are outside of effective sheet size.
   *
   * @param sheet - sheet ID in which rows will be added
   * @param indexes - non-contiguous indexes with format [row, amount], where row is a row number above which the rows will be added
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   */
  public addRows(sheet: number, ...indexes: Index[]): ChangeList {
    this.crudOperations.addRows(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to remove rows from a specified position in a given sheet.
   * 
   * The method accepts sheet ID in which removeRows is to be called and array of coordinates of rows to be removed.
   * 
   * Checks against particular rules to ascertain that removeRows can be called.
   * 
   * If returns true, doing this operation won't throw any errors.
   *
   * @param sheet - sheet ID from which rows will be removed
   * @param indexes - non-contiguous indexes with format: [row, amount]
   * 
   * @return true if the action is possible, false if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected rows.
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
   * The method accepts sheet ID in which removeRows is to be called and array of coordinates of rows to be removed.
   * 
   * Does nothing if rows are outside of the effective sheet size.
   *
   * @param sheet - sheet ID from which rows will be removed
   * @param indexes - non-contiguous indexes with format: [row, amount]
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * */
  public removeRows(sheet: number, ...indexes: Index[]): ChangeList {
    this.crudOperations.removeRows(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to add columns into a specified position in a given sheet.
   * 
   * The method accepts sheet ID in which addColumns is to be called and array of coordinates of columns to be added.
   * 
   * Checks against particular rules to ascertain that addColumns can be called.
   * 
   * If returns true, doing this operation won't throw any errors.
   *
   * @param sheet - sheet ID in which columns will be added
   * @param indexes - non-contiguous indexes with format: [column, amount], where column is a column number from which new columns will be added
   * 
   * @return true if the action is possible, false if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns.
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
   * The method accepts sheet ID in which addColumns is to be called and array of coordinates of columns to be added.
   * 
   * Does nothing if the columns are outside of the effective sheet size.
   *
   * @param sheet - sheet ID in which columns will be added
   * @param indexes - non-contiguous indexes with format: [column, amount], where column is a column number from which new columns will be added
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * 
   * */
  public addColumns(sheet: number, ...indexes: Index[]): ChangeList {
    this.crudOperations.addColumns(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to remove columns from a specified position in a given sheet.
   * 
   * The method accepts sheet ID in which removeColumns is to be called and array of coordinates of columns to be removed.
   * 
   * Checks against particular rules to ascertain that removeColumns can be called.
   * 
   * If returns true, doing this operation won't throw any errors.
   *
   * @param sheet - sheet ID from which columns will be removed
   * @param indexes - non-contiguous indexes with format [column, amount]
   * 
   * @return true if the action is possible, false if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns.
   * 
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
   * The method accepts sheet ID in which removeColumns is to be called and array of coordinates of columns to be removed.
   * 
   * Does nothing if columns are outside of the effective sheet size.
   *
   * @param sheet - sheet ID from which columns will be removed
   * @param indexes - non-contiguous indexes with format: [column, amount]
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * */
  public removeColumns(sheet: number, ...indexes: Index[]): ChangeList {
    this.crudOperations.removeColumns(sheet, ...indexes)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to move cells to a specified position in a given sheet.
   * 
   * The method accepts source location, dimensions and the target location of the block.
   * 
   * Checks against particular rules to ascertain that moveCells can be called.
   * 
   * If returns true, doing this operation won't throw any errors.
   *
   * @param sourceLeftCorner - address of the upper left corner of a moved block
   * @param width - width of the cell block that is being moved
   * @param height - height of the cell block that is being moved
   * @param destinationLeftCorner - upper left address of the target cell block
   * 
   * @return true if the action is possible, false if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns, the target location has matrix or the provided address is invalid.
   * 
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
   * The method accepts source location, dimensions and the target location of the block.
   *
   * @param sourceLeftCorner - address of the upper left corner of a moved block
   * @param width - width of the cell block that is being moved
   * @param height - height of the cell block that is being moved
   * @param destinationLeftCorner - upper left address of the target cell block
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * 
   */
  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): ChangeList {
    this.crudOperations.moveCells(sourceLeftCorner, width, height, destinationLeftCorner)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to move a particular number of rows to a specified position in a given sheet.
   * 
   * The method accepts source location, dimensions and the target location of the block.
   * 
   * Checks against particular rules to ascertain that moveRows can be called.
   * 
   * If returns true, doing this operation won't throw any errors.
   *
   * @param sheet - a sheet number in which the operation will be performed
   * @param startRow - number of the first row to move
   * @param numberOfRows - number of rows to move
   * @param targetRow - row number before which rows will be moved
   * 
   * @return true if the action is possible, false if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected rows, the target location has matrix or the provided address is invalid.
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
   * The method accepts source location, dimensions and the target location of the block.
   *
   * @param sheet - a sheet number in which the operation will be performed
   * @param startRow - number of the first row to move
   * @param numberOfRows - number of rows to move
   * @param targetRow - row number before which rows will be moved
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   */
  public moveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): ChangeList {
    this.crudOperations.moveRows(sheet, startRow, numberOfRows, targetRow)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to move a particular number of columns to a specified position in a given sheet.
   * 
   * Checks against particular rules to ascertain that moveColumns can be called.
   * 
   * If returns true, doing this operation won't throw any errors.
   *
   * @param sheet - a sheet number in which the operation will be performed
   * @param startColumn - number of the first column to move
   * @param numberOfColumns - number of columns to move
   * @param targetColumn - column number before which columns will be moved
   * 
   * @return true if the action is possible, false if the operation might be disrupted and causes side-effects by the fact that there is a matrix inside the selected columns, the target location has matrix or the provided address is invalid.
   * 
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
   * The method accepts source location, dimensions and the target location of the block.
   *
   * @param sheet - a sheet number in which the operation will be performed
   * @param startColumn - number of the first column to move
   * @param numberOfColumns - number of columns to move
   * @param targetColumn - column number before which columns will be moved
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * 
   */
  public moveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): ChangeList {
    this.crudOperations.moveColumns(sheet, startColumn, numberOfColumns, targetColumn)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Stores a copy of the cell block in internal clipboard for the further paste.
   * 
   * The method accepts source location and the dimensions of the selected block.
   * 
   * Returns values of cells for use in external clipboard.
   *
   * @param sourceLeftCorner - address of the upper left corner of a copied block
   * @param width - width of the cell block being copied
   * @param height - height of the cell block being copied
   * 
   * @return Which is an array of arrays that can contain numbers, strings, booleans, Symbol() for empty values or {CellError}
   * 
  * */
  public copy(sourceLeftCorner: SimpleCellAddress, width: number, height: number): InternalCellValue[][] {
    this.crudOperations.copy(sourceLeftCorner, width, height)
    return this.getValuesInRange(AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height))
  }

  /**
   * Stores information of the cell block in internal clipboard for further paste.
   * 
   * Calling {@link paste} right after this method is equivalent to call {@link moveCells}.
   * 
   * Almost any CRUD operation called after this method will abort the cut operation.
   * 
   * Returns values of cells for use in external clipboard.
   * 
   * The method accepts source location and the dimensions of the selected block.
   *
   * @param sourceLeftCorner - address of the upper left corner of a copied block
   * @param width - width of the cell block being copied
   * @param height - height of the cell block being copied
   * 
   * @return Which is an array of arrays that can contain numbers, strings, booleans, Symbol() for empty values or {CellError}
   * */
  public cut(sourceLeftCorner: SimpleCellAddress, width: number, height: number): InternalCellValue[][] {
    this.crudOperations.cut(sourceLeftCorner, width, height)
    return this.getValuesInRange(AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height))
  }

  /**
   * When called after {@link copy} it will paste copied values and formulas into a cell block.
   * 
   * When called after {@link paste} it will perform {@link moveCells} operation into the cell block.
   * 
   * Does nothing if the clipboard is empty.
   * 
   * The method accepts source location of the selected block.
   * 
   * @param targetLeftCorner - upper left address of the target cell block
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * */
  public paste(targetLeftCorner: SimpleCellAddress): ChangeList {
    this.crudOperations.paste(targetLeftCorner)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Clears the clipboard content by setting the content to undefined.
   * */
  public clearClipboard(): void {
    this.crudOperations.clearClipboard()
  }

  /**
   * Returns the cell content of a given range in a {InternalCellValue[][]} format.
   *
   * @param range absolute cell range
   * 
   * @return Which is an array of arrays that can contain numbers, strings, booleans, Symbol() for empty values or {CellError}
   */
  public getValuesInRange(range: AbsoluteCellRange): InternalCellValue[][] {
    return this.dependencyGraph.getValuesInRange(range).map(
      (subarray: InternalCellValue[]) => subarray.map(
        (arg) => this.cellValueExporter.export(arg),
      ),
    )
  }

  /**
   * Returns information whether it is possible to add a sheet to the engine.
   * 
   * The method accepts sheet name as a string.
   * 
   * Checks against particular rules to ascertain that addSheet can be called.
   * 
   * If returns true, doing this operation won't throw any errors.
   * 
   * @return true if it possible to add sheet with provided name, meaning the name does not already exists in the instance, false if the chosen name is already used
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
   * The method accepts the name of a new sheet.
   *
   * @param name - if not specified, name will be autogenerated
   * 
   * @returns given or autogenerated name of a new sheet
   */
  public addSheet(name?: string): string {
    return this.crudOperations.addSheet(name)
  }

  /**
   * Returns information whether it is possible to remove sheet for the engine.
   * 
   * The method accepts sheet name as a string.
   * 
   * If returns true, doing this operation won't throw any errors.
   *
   * @param name - sheet name
   * 
   * @return true if the provided name of a sheet exists and then it can be removed, false if there is no sheet with a given name
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
   * @param name - sheet name
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   */
  public removeSheet(name: string): ChangeList {
    this.crudOperations.removeSheet(name)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to clear a specified sheet.
   * 
   * The method accepts sheet name as a string.
   * 
   * If returns true, doing this operation won't throw any errors.
   *
   * @param name - sheet name
   * 
   * @return true if the provided name of a sheet exists and then its content can be cleared, false if there is no sheet with a given name
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
   * The method accepts sheet name.
   * 
   * Based on that the method finds the ID of a sheet to be cleared.
   * 
   * Double-checks if the sheet exists.
   *
   * @param name - sheet name
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * */
  public clearSheet(name: string): ChangeList {
    this.crudOperations.ensureSheetExists(name)
    this.crudOperations.clearSheet(name)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Returns information whether it is possible to replace the sheet content.
   * 
   * The method accepts sheet name as a string.
   * 
   * If returns true, doing this operation won't throw any errors.
   *
   * @param name - sheet name
   * 
   * @return true if the provided name of a sheet exists and then its content can be replaced, false if there is no sheet with a given name
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
   * The method accepts sheet name and an array of new values to be put in a given sheet.
   * 
   * The new value is to be provided as an array of: Date, string, number, boolean, {EmptyValueType}, null, undefined
   * 
   * The method finds sheet ID based on the provided sheet name.
   *
   * @param sheetName - sheet name
   * @param values - array of new values
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * */
  public setSheetContent(sheetName: string, values: RawCellContent[][]): ChangeList {
    this.crudOperations.ensureSheetExists(sheetName)

    const sheetId = this.getSheetId(sheetName)!

    return this.batch((e) => {
      e.clearSheet(sheetName)
      for (let i = 0; i < values.length; i++) {
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
   * Disables numeric arrays detected during graph build phase and replaces them with ordinary numeric cells.
   */
  public disableNumericMatrices(): void {
    this.dependencyGraph.disableNumericMatrices()
  }

  /**
   * Computes simple (absolute) address of a cell address based on its string representation.
   * 
   * If sheet name is present in string representation but not present in the engine, returns undefined.
   * 
   * If sheet name is not present in string representation, returns {@param sheet} as a sheet number.
   *
   * @param stringAddress - string representation of cell address, e.g. 'C64'
   * @param sheet - override sheet index regardless of sheet mapping
   * @returns absolute representation of address, e.g. { sheet: 0, col: 1, row: 1 }
   */
  public simpleCellAddressFromString(stringAddress: string, sheet: number) {
    return simpleCellAddressFromString(this.sheetMapping.get, stringAddress, sheet)
  }

  /**
   * Returns string representation of an absolute address.
   * 
   * Accepts cell address and sheet ID or sheet name.
   * 
   * If the sheet index is not present in the engine, returns undefined.
   *
   * @param address - object representation of an absolute address
   * @param sheet - if is not equal with address sheet index, string representation will contain sheet name
   * 
   * @return absolute address in string or undefined 
   * */
  public simpleCellAddressToString(address: SimpleCellAddress, sheet: number): string | undefined {
    return simpleCellAddressToString(this.sheetMapping.fetchDisplayName, address, sheet)
  }

  /**
   * Returns a unique sheet name assigned to the sheet of a given ID.
   * 
   * Or undefined if the there is no sheet with a given ID.
   * 
   * The method accepts sheet ID as a parameter
   *
   * @param sheetId - ID of the sheet, for which we want to retrieve name
   * 
   * @return name of the sheet or undefined if the sheet does not exist
   */
  public getSheetName(sheetId: number): string | undefined {
    return this.sheetMapping.getDisplayName(sheetId)
  }

  /**
   * Returns a unique sheet ID assigned to the sheet with a given name.
   * 
   * Returns undefined if the there's no sheet with a given name.
   * 
   * The method accepts sheet name as a parameter
   * 
   * @param sheetName - name of the sheet, for which we want to retrieve ID
   * @returns ID of the sheet or undefined if the sheet does not exist
   */
  public getSheetId(sheetName: string): number | undefined {
    return this.sheetMapping.get(sheetName)
  }

  /**
   * Returns true whether sheet with a given name exists.
   * 
   * The methods accepts sheet name to be checked.
   * 
   * @param sheetName - name of the sheet
   * 
   * @return true if a given sheet exists
   */
  public doesSheetExist(sheetName: string): boolean {
    return this.sheetMapping.hasSheetWithName(sheetName)
  }

  /**
   * Returns type of a specified cell of a given address.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param address - cell coordinates
   * 
   * @return a named constant: FORMULA, VALUE, MATRIX, EMPTY
   * */
  public getCellType(address: SimpleCellAddress): CellType {
    const vertex = this.dependencyGraph.getCell(address)
    return getCellType(vertex)
  }

  /**
   * Checks if the specified cell contains a simple value.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   * 
   * @param address - cell coordinates
   * 
   * @return true if cell contains a simple value
   * */
  public doesCellHaveSimpleValue(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.VALUE
  }

  /**
   * Checks if the specified cell contains a formula.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param address - cell coordinates
   * 
   * @return true if cell contains a formula
   * */
  public doesCellHaveFormula(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.FORMULA
  }

  /**
   * Checks if the specified cell is empty.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param address - cell coordinates
   * 
   * @return true if the cell is empty
   * */
  public isCellEmpty(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.EMPTY
  }

  /**
   * Returns true if a given cell is a part of a matrix.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   *
   * @param address - cell coordinates
   * */
  public isCellPartOfMatrix(address: SimpleCellAddress): boolean {
    return this.getCellType(address) === CellType.MATRIX
  }

  /**
   * Returns type of the cell value of a given address.
   * 
   * The methods accepts cell coordinates as object with column, row and sheet numbers.
   * 
   * Gives an empty value if the vertex is null.
   * 
   * @param address - cell coordinates
   * 
   * @return cell value type which is a named constant: EMPTY, NUMBER, STRING, BOOLEAN, ERROR
   * */
  public getCellValueType(address: SimpleCellAddress): CellValueType {
    const value = this.dependencyGraph.getCellValue(address)
    return getCellValueType(value)
  }

  /**
   * Returns the number of existing sheets.
   * 
   * The method does not accept any parameters.
   * 
   * @return which is a number of sheets
   */
  public countSheets(): number {
    return this.sheetMapping.numberOfSheets()
  }

  /**
   * Renames a specified sheet.
   * 
   * The method accepts sheet ID as the first parameter and a new name of a sheet to be given a the second.
   * 
   * If both are same does nothing.
   * 
   * Throws an error if the provided sheet ID does not exists.
   * 
   */
  public renameSheet(sheetId: number, newName: string): void {
    this.sheetMapping.renameSheet(sheetId, newName)
  }

  /**
   * Runs multiple operations and recomputes formulas at the end.
   * 
   * @param batchOperations
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}   * 
   */
  public batch(batchOperations: (e: IBatchExecutor) => void): ChangeList {
    try {
      batchOperations(this.crudOperations)
    } catch (e) {
      /* TODO we should be able to return error information along with changes */
    }
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Adds a specified named expression.
   * 
   * The method accepts expression name as the first parameter and formula string as the second.
   * 
   * Checks if the named expression is valid and available, if not throws errors.
   *
   * @param expressionName
   * @param formulaString
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * 
   */
  public addNamedExpression(expressionName: string, formulaString: string): ChangeList {
    if (!this.namedExpressions.isNameValid(expressionName)) {
      throw new NamedExpressionNameIsInvalid(expressionName)
    }
    if (!this.namedExpressions.isNameAvailable(expressionName)) {
      throw new NamedExpressionNameIsAlreadyTaken(expressionName)
    }
    this.namedExpressions.addNamedExpression(expressionName, formulaString)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Gets specified named expression value.
   * 
   * The method accepts expression name string as a parameter.
   *
   * @param expressionName - expression name
   * 
   * @return which can be a number, string, boolean, Symbol() for empty values or {CellError}, or null
   *
   */
  public getNamedExpressionValue(expressionName: string): CellValue | null {
    const internalNamedExpressionAddress = this.namedExpressions.getInternalNamedExpressionAddress(expressionName)
    if (internalNamedExpressionAddress === null) {
      return null
    } else {
      return this.cellValueExporter.export(this.dependencyGraph.getCellValue(internalNamedExpressionAddress))
    }
  }

  /**
   * Changes a given named expression to a specified formula.
   * 
   * The method accepts expression name as a first parameter and a new formula as a second parameter.
   * 
   * Checks whether the given expression exist, throws an error if does not.
   *
   * @param expressionName - expression name
   * @param newFormulaString - a new formula
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * 
   */
  public changeNamedExpressionFormula(expressionName: string, newFormulaString: string): ChangeList {
    if (!this.namedExpressions.doesNamedExpressionExist(expressionName)) {
      throw new NamedExpressionDoesNotExist(expressionName)
    }
    this.namedExpressions.changeNamedExpressionFormula(expressionName, newFormulaString)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Removes a named expression.
   * 
   * The method accepts string with expression name to be removed as a parameter.
   *
   * @param expressionName - expression name
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * 
   */
  public removeNamedExpression(expressionName: string): ChangeList {
    this.namedExpressions.removeNamedExpression(expressionName)
    return this.recomputeIfDependencyGraphNeedsIt()
  }

  /**
   * Lists all named expressions.
   * 
   * The method does not accept any parameters.
   *
   * @param expressionName - expression name
   * 
   * @return an array of expression names as strings
   */
  public listNamedExpressions(): string[] {
    return this.namedExpressions.getAllNamedExpressionsNames()
  }

  /**
   * Normalizes the formula.
   * 
   * Throws an error if the provided parameter is not a valid formula.
   *
   * @param formulaString - a formula, ex. "=SUM(Sheet1!A1:A100)"
   *
   * @returns a normalized formula, throws an error if the provided string is not a formula, i.e does not start with "="
   */
  public normalizeFormula(formulaString: string): string {
    const parsedCellContent = this.cellContentParser.parse(formulaString)
    if (!(parsedCellContent instanceof CellContent.Formula)) {
      throw new Error('This is not a formula')
    }
    const exampleExternalFormulaAddress = { sheet: -1, col: 0, row: 0 }
    const {ast} = this.parser.parse(parsedCellContent.formula, exampleExternalFormulaAddress)
    return this.unparser.unparse(ast, exampleExternalFormulaAddress)
  }

  /**
   * Validates the formula.
   * 
   * The method accepts string with a formula as a parameter.
   * 
   * If the provided string starts with "=" the method returns true.
   *
   * @param formulaString - a formula, ex. "=SUM(Sheet1!A1:A100)"
   *
   * @returns True if the formula can be executed outside of a regular worksheet
   */
  public validateFormula(formulaString: string): boolean {
    const parsedCellContent = this.cellContentParser.parse(formulaString)
    if (!(parsedCellContent instanceof CellContent.Formula)) {
      return false
    }
    const exampleExternalFormulaAddress = { sheet: -1, col: 0, row: 0 }
    const {ast} = this.parser.parse(parsedCellContent.formula, exampleExternalFormulaAddress)
    if (ast.type === AstNodeType.ERROR && !ast.error) {
      return false
    }
    return true
  }

  /**
   *  Destroys instance of HyperFormula.
   * 
   *  Dependency graph, columns search, evaluator, parser, transforming AST, stats and CRUD operations are removed.
   * 
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
   * Runs a recomputation starting from recently changed vertices.
   * 
   * @return An array of objects that consist of sheets, rows and columns numbers, and internal value of cells {InternalCellValue}
   * 
   */
  private recomputeIfDependencyGraphNeedsIt(): ChangeList {
    const changes = this.crudOperations.getAndClearContentChanges()
    const verticesToRecomputeFrom = Array.from(this.dependencyGraph.verticesToRecompute())
    this.dependencyGraph.clearRecentlyChangedVertices()

    if (verticesToRecomputeFrom.length > 0) {
      changes.addAll(this.evaluator.partialRun(verticesToRecomputeFrom))
    }

    return changes.exportChanges(this.cellValueExporter)
  }
}
