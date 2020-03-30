import {AbsoluteCellRange} from './AbsoluteCellRange'
import {absolutizeDependencies} from './absolutizeDependencies'
import {EmptyValue, invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, isMatrix, RawCellContent} from './CellContentParser'
import {ClipboardOperations} from './ClipboardOperations'
import {
  AddRowsCommand,
  normalizeAddedIndexes,
  normalizeRemovedIndexes,
  Operations,
  RemoveRowsCommand
} from './Operations'
import {ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {ColumnsSpan} from './ColumnsSpan'
import {Config} from './Config'
import {ContentChanges} from './ContentChanges'
import {
  AddressMapping,
  DependencyGraph,
  MatrixVertex,
  ParsingErrorVertex,
  SheetMapping,
  ValueCellVertex,
} from './DependencyGraph'
import {ValueCellVertexValue} from './DependencyGraph/ValueCellVertex'
import {RemoveSheetDependencyTransformer} from './dependencyTransformers/removeSheet'
import {InvalidAddressError, InvalidArgumentsError, NoSheetWithIdError, NoSheetWithNameError} from './errors'
import {buildMatrixVertex} from './GraphBuilder'
import {Index} from './HyperFormula'
import {LazilyTransformingAstService, TransformationType} from './LazilyTransformingAstService'
import {ParserWithCaching, ProcedureAst} from './parser'
import {RowsSpan} from './RowsSpan'
import {Statistics, StatType} from './statistics/Statistics'
import {UndoRedo} from './UndoRedo'
import {AddColumnsTransformer} from './dependencyTransformers/AddColumnsTransformer'
import {RemoveColumnsTransformer} from './dependencyTransformers/RemoveColumnsTransformer'
import {MoveCellsTransformer} from './dependencyTransformers/MoveCellsTransformer'

export class CrudOperations {

  private changes: ContentChanges = ContentChanges.empty()
  private readonly clipboardOperations: ClipboardOperations
  public readonly operations: Operations

  constructor(
    /** Engine config */
    private readonly config: Config,
    /** Statistics module for benchmarking */
    private readonly stats: Statistics,
    /** Dependency graph storing sheets structure */
    private readonly dependencyGraph: DependencyGraph,
    /** Column search strategy used by VLOOKUP plugin */
    private readonly columnSearch: ColumnSearchStrategy,
    /** Parser with caching */
    private readonly parser: ParserWithCaching,
    /** Raw cell input parser */
    private readonly cellContentParser: CellContentParser,
    /** Service handling postponed CRUD transformations */
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly undoRedo: UndoRedo,
  ) {
    this.clipboardOperations = new ClipboardOperations(this.dependencyGraph, this, this.parser, this.lazilyTransformingAstService)
    this.operations = new Operations(this.dependencyGraph, this.parser, this.stats, this.lazilyTransformingAstService)
  }

  public addRows(sheet: number, ...indexes: Index[]): void {
    const addRowsCommand = new AddRowsCommand(sheet, indexes)
    this.ensureItIsPossibleToAddRows(sheet, ...indexes)
    this.clipboardOperations.abortCut()
    const rowsAdditions = this.operations.addRows(addRowsCommand)
    this.undoRedo.saveOperationAddRows(addRowsCommand, rowsAdditions)
  }

  public removeRows(sheet: number, ...indexes: Index[]): void {
    const removeRowsCommand = new RemoveRowsCommand(sheet, indexes)
    this.ensureItIsPossibleToRemoveRows(sheet, ...indexes)
    this.clipboardOperations.abortCut()
    const rowsRemovals = this.operations.removeRows(removeRowsCommand)
    this.undoRedo.saveOperationRemoveRows(removeRowsCommand, rowsRemovals)
  }

  public addColumns(sheet: number, ...indexes: Index[]): void {
    const normalizedIndexes = normalizeAddedIndexes(indexes)
    this.ensureItIsPossibleToAddColumns(sheet, ...indexes)
    this.clipboardOperations.abortCut()
    for (const index of normalizedIndexes) {
      this.doAddColumns(sheet, index[0], index[1])
    }
  }

  public removeColumns(sheet: number, ...indexes: Index[]): void {
    const normalizedIndexes = normalizeRemovedIndexes(indexes)
    this.ensureItIsPossibleToRemoveColumns(sheet, ...indexes)
    this.clipboardOperations.abortCut()
    for (const index of normalizedIndexes) {
      this.doRemoveColumns(sheet, index[0], index[0] + index[1] - 1)
    }
  }

  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): void {
    this.ensureItIsPossibleToMoveCells(sourceLeftCorner, width, height, destinationLeftCorner)
    this.clipboardOperations.abortCut()

    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    this.dependencyGraph.breakNumericMatricesInRange(sourceRange)
    this.dependencyGraph.breakNumericMatricesInRange(targetRange)

    const toRight = destinationLeftCorner.col - sourceLeftCorner.col
    const toBottom = destinationLeftCorner.row - sourceLeftCorner.row
    const toSheet = destinationLeftCorner.sheet

    const valuesToRemove = this.dependencyGraph.valuesFromRange(targetRange)
    this.columnSearch.removeValues(valuesToRemove)
    const valuesToMove = this.dependencyGraph.valuesFromRange(sourceRange)
    this.columnSearch.moveValues(valuesToMove, toRight, toBottom, toSheet)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      new MoveCellsTransformer({
        type: TransformationType.MOVE_CELLS,
        sourceRange,
        toRight,
        toBottom,
        toSheet,
        sheet: sourceRange.sheet,
      }).transform(this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addMoveCellsTransformation(sourceRange, toRight, toBottom, toSheet)
    })

    this.dependencyGraph.moveCells(sourceRange, toRight, toBottom, toSheet)
  }

  public moveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): void {
    this.ensureItIsPossibleToMoveRows(sheet, startRow, numberOfRows, targetRow)

    const width = this.dependencyGraph.getSheetWidth(sheet)
    this.addRows(sheet, [targetRow, numberOfRows])

    if (targetRow < startRow) {
      startRow += numberOfRows
    }

    const startAddress = simpleCellAddress(sheet, 0, startRow)
    const targetAddress = simpleCellAddress(sheet, 0, targetRow)
    this.moveCells(startAddress, width, numberOfRows, targetAddress)
    this.removeRows(sheet, [startRow, numberOfRows])
  }

  public moveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): void {
    this.ensureItIsPossibleToMoveColumns(sheet, startColumn, numberOfColumns, targetColumn)

    const height = this.dependencyGraph.getSheetHeight(sheet)
    this.addColumns(sheet, [targetColumn, numberOfColumns])

    if (targetColumn < startColumn) {
      startColumn += numberOfColumns
    }

    const startAddress = simpleCellAddress(sheet, startColumn, 0)
    const targetAddress = simpleCellAddress(sheet, targetColumn, 0)
    this.moveCells(startAddress, numberOfColumns, height, targetAddress)
    this.removeColumns(sheet, [startColumn, numberOfColumns])
  }

  public cut(sourceLeftCorner: SimpleCellAddress, width: number, height: number): void {
    this.clipboardOperations.cut(sourceLeftCorner, width, height)
  }

  public copy(sourceLeftCorner: SimpleCellAddress, width: number, height: number): void {
    this.clipboardOperations.copy(sourceLeftCorner, width, height)
  }

  public paste(targetLeftCorner: SimpleCellAddress): void {
    this.clipboardOperations.paste(targetLeftCorner)
  }

  public clearClipboard(): void {
    this.clipboardOperations.clear()
  }

  public addSheet(name?: string): string {
    if (name) {
      this.ensureItIsPossibleToAddSheet(name)
    }
    const sheetId = this.sheetMapping.addSheet(name)
    this.addressMapping.autoAddSheet(sheetId, [])
    return this.sheetMapping.fetchDisplayName(sheetId)
  }

  public removeSheet(sheetName: string): void {
    this.ensureSheetExists(sheetName)
    this.clipboardOperations.abortCut()

    const sheetId = this.sheetMapping.fetch(sheetName)

    this.dependencyGraph.removeSheet(sheetId)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveSheetDependencyTransformer.transform(sheetId, this.dependencyGraph)
      this.lazilyTransformingAstService.addRemoveSheetTransformation(sheetId)
    })

    this.sheetMapping.removeSheet(sheetId)
    this.columnSearch.removeSheet(sheetId)
  }

  public clearSheet(sheetName: string): void {
    this.ensureSheetExists(sheetName)
    this.clipboardOperations.abortCut()

    const sheetId = this.sheetMapping.fetch(sheetName)

    this.dependencyGraph.clearSheet(sheetId)

    this.columnSearch.removeSheet(sheetId)
  }

  public setCellContents(topLeftCornerAddress: SimpleCellAddress, cellContents: RawCellContent[][] | RawCellContent): void {
    if (!(cellContents instanceof Array)) {
      this.setCellContent(topLeftCornerAddress, cellContents)
      return
    }
    for (let i = 0; i < cellContents.length; i++) {
      if (!(cellContents[i] instanceof Array)) {
        throw new Error('Expected an array of arrays or a raw cell value.')
      }
      for (let j = 0; j < cellContents[i].length; j++) {
        if (isMatrix(cellContents[i][j])) {
          throw new Error('Cant change matrices in batch operation')
        }
      }
    }

    for (let i = 0; i < cellContents.length; i++) {
      for (let j = 0; j < cellContents[i].length; j++) {
        this.setCellContent({
          sheet: topLeftCornerAddress.sheet,
          row: topLeftCornerAddress.row + i,
          col: topLeftCornerAddress.col + j,
        }, cellContents[i][j])
      }
    }
  }

  public setSheetContent(sheetName: string, values: RawCellContent[][]): void {
    this.ensureSheetExists(sheetName)
    const sheetId = this.sheetMapping.fetch(sheetName)

    this.clearSheet(sheetName)
    if (!(values instanceof Array)) {
      throw new Error('Expected an array of arrays.')
    }
    for (let i = 0; i < values.length; i++) {
      if (!(values[i] instanceof Array)) {
        throw new Error('Expected an array of arrays.')
      }
      for (let j = 0; j < values[i].length; j++) {
        this.setCellContent({
          sheet: sheetId,
          row: i,
          col: j,
        }, values[i][j])
      }
    }
  }

  public setCellContent(address: SimpleCellAddress, newCellContent: RawCellContent): void {
    this.ensureItIsPossibleToChangeContent(address)
    this.clipboardOperations.abortCut()

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

  public ensureItIsPossibleToAddRows(sheet: number, ...indexes: Index[]): void {
    for (const [row, numberOfRowsToAdd] of indexes) {
      if (!isNonnegativeInteger(row) || !isPositiveInteger(numberOfRowsToAdd)) {
        throw new InvalidArgumentsError()
      }

      if (!this.sheetMapping.hasSheetWithId(sheet)) {
        throw new NoSheetWithIdError(sheet)
      }

      if (isPositiveInteger(row)
        && this.dependencyGraph.matrixMapping.isFormulaMatrixInRow(sheet, row - 1)
        && this.dependencyGraph.matrixMapping.isFormulaMatrixInRow(sheet, row)
      ) {
        throw Error('It is not possible to add row in row with matrix')
      }
    }
  }

  public ensureItIsPossibleToRemoveRows(sheet: number, ...indexes: Index[]): void {
    for (const [rowStart, numberOfRows] of indexes) {
      const rowEnd = rowStart + numberOfRows - 1
      if (!isNonnegativeInteger(rowStart) || !isNonnegativeInteger(rowEnd)) {
        throw new InvalidArgumentsError()
      }
      if (rowEnd < rowStart) {
        throw new InvalidArgumentsError()
      }
      const rowsToRemove = RowsSpan.fromRowStartAndEnd(sheet, rowStart, rowEnd)

      if (!this.sheetMapping.hasSheetWithId(sheet)) {
        throw new NoSheetWithIdError(sheet)
      }

      if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRows(rowsToRemove)) {
        throw Error('It is not possible to remove row with matrix')
      }
    }
  }

  public ensureItIsPossibleToAddColumns(sheet: number, ...indexes: Index[]): void {
    for (const [column, numberOfColumnsToAdd] of indexes) {
      if (!isNonnegativeInteger(column) || !isPositiveInteger(numberOfColumnsToAdd)) {
        throw new InvalidArgumentsError()
      }

      if (!this.sheetMapping.hasSheetWithId(sheet)) {
        throw new NoSheetWithIdError(sheet)
      }

      if (isPositiveInteger(column)
        && this.dependencyGraph.matrixMapping.isFormulaMatrixInColumn(sheet, column - 1)
        && this.dependencyGraph.matrixMapping.isFormulaMatrixInColumn(sheet, column)
      ) {
        throw Error('It is not possible to add column in column with matrix')
      }
    }
  }

  public ensureItIsPossibleToRemoveColumns(sheet: number, ...indexes: Index[]): void {
    for (const [columnStart, numberOfColumns] of indexes) {
      const columnEnd = columnStart + numberOfColumns - 1

      if (!isNonnegativeInteger(columnStart) || !isNonnegativeInteger(columnEnd)) {
        throw new InvalidArgumentsError()
      }
      if (columnEnd < columnStart) {
        throw new InvalidArgumentsError()
      }
      const columnsToRemove = ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart, columnEnd)

      if (!this.sheetMapping.hasSheetWithId(sheet)) {
        throw new NoSheetWithIdError(sheet)
      }

      if (this.dependencyGraph.matrixMapping.isFormulaMatrixInColumns(columnsToRemove)) {
        throw Error('It is not possible to remove column within matrix')
      }
    }
  }

  public ensureItIsPossibleToMoveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress): void {
    if (
      invalidSimpleCellAddress(sourceLeftCorner) ||
      !isPositiveInteger(width) ||
      !isPositiveInteger(height) ||
      invalidSimpleCellAddress(destinationLeftCorner) ||
      !this.sheetMapping.hasSheetWithId(sourceLeftCorner.sheet) ||
      !this.sheetMapping.hasSheetWithId(destinationLeftCorner.sheet)
    ) {
      throw new InvalidArgumentsError()
    }

    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(sourceRange)) {
      throw new Error('It is not possible to move matrix')
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(targetRange)) {
      throw new Error('It is not possible to replace cells with matrix')
    }
  }

  public ensureItIsPossibleToMoveRows(sheet: number, startRow: number, numberOfRows: number, targetRow: number): void {
    this.ensureItIsPossibleToAddRows(sheet, [targetRow, numberOfRows])

    const sourceStart = simpleCellAddress(sheet, 0, startRow)
    const targetStart = simpleCellAddress(sheet, 0, targetRow)

    if (
      !this.sheetMapping.hasSheetWithId(sheet)
      || invalidSimpleCellAddress(sourceStart)
      || invalidSimpleCellAddress(targetStart)
      || !isPositiveInteger(numberOfRows)
      || (targetRow <= startRow + numberOfRows && targetRow >= startRow)
    ) {
      throw new InvalidArgumentsError()
    }

    const width = this.dependencyGraph.getSheetWidth(sheet)
    const sourceRange = AbsoluteCellRange.spanFrom(sourceStart, width, numberOfRows)

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(sourceRange)) {
      throw new Error('It is not possible to move matrix')
    }
  }

  public ensureItIsPossibleToMoveColumns(sheet: number, startColumn: number, numberOfColumns: number, targetColumn: number): void {
    this.ensureItIsPossibleToAddColumns(sheet, [targetColumn, numberOfColumns])

    const sourceStart = simpleCellAddress(sheet, startColumn, 0)
    const targetStart = simpleCellAddress(sheet, targetColumn, 0)

    if (
      !this.sheetMapping.hasSheetWithId(sheet)
      || invalidSimpleCellAddress(sourceStart)
      || invalidSimpleCellAddress(targetStart)
      || !isPositiveInteger(numberOfColumns)
      || (targetColumn <= startColumn + numberOfColumns && targetColumn >= startColumn)
    ) {
      throw new InvalidArgumentsError()
    }

    const sheetHeight = this.dependencyGraph.getSheetHeight(sheet)
    const sourceRange = AbsoluteCellRange.spanFrom(sourceStart, numberOfColumns, sheetHeight)

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(sourceRange)) {
      throw new Error('It is not possible to move matrix')
    }
  }

  public ensureItIsPossibleToAddSheet(name: string): void {
    if (this.sheetMapping.hasSheetWithName(name)) {
      throw Error(`Sheet with name ${name} already exists`)
    }
  }

  public ensureItIsPossibleToChangeContent(address: SimpleCellAddress): void {
    if (invalidSimpleCellAddress(address)) {
      throw new InvalidAddressError(address)
    }
    if (!this.sheetMapping.hasSheetWithId(address.sheet)) {
      throw new NoSheetWithIdError(address.sheet)
    }

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixAtAddress(address)) {
      throw Error('It is not possible to change part of a matrix')
    }
  }

  public getAndClearContentChanges(): ContentChanges {
    const changes = this.changes
    this.changes = ContentChanges.empty()
    return changes
  }

  public ensureSheetExists(sheetName: string): void {
    if (!this.sheetMapping.hasSheetWithName(sheetName)) {
      throw new NoSheetWithNameError(sheetName)
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
  private doAddColumns(sheet: number, column: number, numberOfColumns: number = 1): void {
    if (this.columnEffectivelyNotInSheet(column, sheet)) {
      return
    }

    const addedColumns = ColumnsSpan.fromNumberOfColumns(sheet, column, numberOfColumns)

    this.dependencyGraph.addColumns(addedColumns)
    this.columnSearch.addColumns(addedColumns)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      const transformer = new AddColumnsTransformer(addedColumns)
      transformer.transform(this.dependencyGraph, this.parser)
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
  private doRemoveColumns(sheet: number, columnStart: number, columnEnd: number = columnStart): void {
    if (this.columnEffectivelyNotInSheet(columnStart, sheet) || columnEnd < columnStart) {
      return
    }

    const removedColumns = ColumnsSpan.fromColumnStartAndEnd(sheet, columnStart, columnEnd)

    this.dependencyGraph.removeColumns(removedColumns)
    this.columnSearch.removeColumns(removedColumns)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      new RemoveColumnsTransformer(removedColumns).transform(this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addRemoveColumnsTransformation(removedColumns)
    })
  }

  /**
   * Returns true if row number is outside of given sheet.
   *
   * @param column - row number
   * @param sheet - sheet id number
   */
  private columnEffectivelyNotInSheet(column: number, sheet: number): boolean {
    const width = this.addressMapping.getWidth(sheet)
    return column >= width
  }

  private get addressMapping(): AddressMapping {
    return this.dependencyGraph.addressMapping
  }

  private get sheetMapping(): SheetMapping {
    return this.dependencyGraph.sheetMapping
  }
}

function isPositiveInteger(x: number): boolean {
  return Number.isInteger(x) && x > 0
}

function isNonnegativeInteger(x: number): boolean {
  return Number.isInteger(x) && x >= 0
}
