import {AbsoluteCellRange} from './AbsoluteCellRange'
import {absolutizeDependencies} from './absolutizeDependencies'
import {BuildEngineFromArraysFactory} from './BuildEngineFromArraysFactory'
import {CellValue, simpleCellAddress, SimpleCellAddress} from './Cell'
import {IColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {ColumnsSpan} from './ColumnsSpan'
import {Config} from './Config'
import {
  DependencyGraph,
  EmptyCellVertex,
  FormulaCellVertex,
  MatrixVertex,
  ValueCellVertex,
  Vertex,
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
import {cellAddressFromString, isFormula, isMatrix, ParserWithCaching, ProcedureAst} from './parser'
import {CellAddress} from './parser'
import {RowsSpan} from './RowsSpan'
import {Statistics, StatType} from './statistics/Statistics'

/**
 * Engine for one sheet
 */
export class HandsOnEngine {
  /**
   * Builds engine for sheet from two-dimmensional array representation
   *
   * @param sheet - two-dimmensional array representation of sheet
   */
  public static buildFromArray(sheet: Sheet, maybeConfig?: Config): HandsOnEngine {
    return new BuildEngineFromArraysFactory().buildFromSheet(sheet, maybeConfig)
  }

  public static buildFromSheets(sheets: Sheets, maybeConfig?: Config): HandsOnEngine {
    return new BuildEngineFromArraysFactory().buildFromSheets(sheets, maybeConfig)
  }

  public static buildEmpty(maybeConfig?: Config): HandsOnEngine {
    return new EmptyEngineFactory().build(maybeConfig)
  }

  constructor(
      public readonly config: Config,
      /** Statistics module for benchmarking */
      public readonly stats: Statistics,
      public readonly dependencyGraph: DependencyGraph,
      public readonly columnSearch: IColumnSearchStrategy,
      private readonly parser: ParserWithCaching,
      /** Formula evaluator */
      private readonly evaluator: Evaluator,
      public readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {
  }

  /**
   * Returns value of the cell with the given address
   *
   * @param stringAddress - cell coordinates (e.g. 'A1')
   */
  public getCellValue(stringAddress: string): CellValue {
    const address = cellAddressFromString(this.sheetMapping.fetch, stringAddress, CellAddress.absolute(0, 0, 0))
    return this.dependencyGraph.getCellValue(address)
  }

  /**
   * Returns array with values of all cells
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

  public getSheetDimensions(sheetId: number): { width: number, height: number } {
    return {
      width: this.dependencyGraph.getSheetWidth(sheetId),
      height: this.dependencyGraph.getSheetHeight(sheetId),
    }
  }

  /**
   * Returns snapshot of a computation time statistics
   */
  public getStats() {
    return this.stats.snapshot()
  }

  /**
   * Sets content of a cell with given address
   *
   * @param stringAddress - cell coordinates (e.g. 'A1')
   * @param newCellContent - new cell content
   */
  public setCellContent(address: SimpleCellAddress, newCellContent: string, recompute: boolean = true) {
    const vertex = this.dependencyGraph.getCell(address)

    if (vertex instanceof MatrixVertex && !vertex.isFormula() && !isNaN(Number(newCellContent))) {
      vertex.setMatrixCellValue(address, Number(newCellContent))
      this.dependencyGraph.graph.markNodeAsSpecialRecentlyChanged(vertex)
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
        this.dependencyGraph.setCellEmpty(address)
      } else if (!isNaN(Number(newCellContent))) {
        const newValue = Number(newCellContent)
        const oldValue = this.dependencyGraph.getCellValue(address)
        this.dependencyGraph.setValueToCell(address, newValue)
        this.columnSearch.change(oldValue, newValue, address)
      } else {
        const oldValue = this.dependencyGraph.getCellValue(address)
        this.dependencyGraph.setValueToCell(address, newCellContent)
        this.columnSearch.change(oldValue, newCellContent, address)
      }
    } else {
      throw new Error('Illegal operation')
    }

    this.evaluator.partialRun(Array.from(this.dependencyGraph.verticesToRecompute()))
    this.dependencyGraph.clearRecentlyChangedVertices()
  }

  public setMultipleCellContents(topLeftCornerAddress: SimpleCellAddress, cellContents: string[][]) {
    this.setCellContent(topLeftCornerAddress, cellContents[0][0])
  }

  public addRows(sheet: number, row: number, numberOfRowsToAdd: number = 1) {
    const addedRows = RowsSpan.fromNumberOfRows(sheet, row, numberOfRowsToAdd)

    this.dependencyGraph.addRows(addedRows)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      AddRowsDependencyTransformer.transform(addedRows, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addAddRowsTransformation(addedRows)
    })

    this.recomputeIfDependencyGraphNeedsIt()
  }

  public removeRows(sheet: number, rowStart: number, rowEnd: number = rowStart) {
    const removedRows = new RowsSpan(sheet, rowStart, rowEnd)

    this.dependencyGraph.removeRows(removedRows)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveRowsDependencyTransformer.transform(removedRows, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addRemoveRowsTransformation(removedRows)
    })

    this.recomputeIfDependencyGraphNeedsIt()
  }

  public addColumns(sheet: number, col: number, numberOfCols: number = 1) {
    const addedColumns = ColumnsSpan.fromNumberOfColumns(sheet, col, numberOfCols)

    this.dependencyGraph.addColumns(addedColumns)
    this.columnSearch.addColumns(addedColumns)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      AddColumnsDependencyTransformer.transform(addedColumns, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addAddColumnsTransformation(addedColumns)
    })

    this.recomputeIfDependencyGraphNeedsIt()
  }

  public removeColumns(sheet: number, columnStart: number, columnEnd: number = columnStart) {
    const removedColumns = new ColumnsSpan(sheet, columnStart, columnEnd)

    this.dependencyGraph.removeColumns(removedColumns)
    this.columnSearch.removeColumns(removedColumns)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveColumnsDependencyTransformer.transform(removedColumns, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addRemoveColumnsTransformation(removedColumns)
    })

    this.recomputeIfDependencyGraphNeedsIt()
  }

  public moveCells(sourceLeftCorner: SimpleCellAddress, width: number, height: number, destinationLeftCorner: SimpleCellAddress) {
    const sourceRange = AbsoluteCellRange.spanFrom(sourceLeftCorner, width, height)
    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, width, height)

    this.dependencyGraph.ensureNoMatrixInRange(sourceRange)
    this.dependencyGraph.ensureNoMatrixInRange(targetRange)

    const toRight = destinationLeftCorner.col - sourceLeftCorner.col
    const toBottom = destinationLeftCorner.row - sourceLeftCorner.row
    const toSheet = destinationLeftCorner.sheet

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      MoveCellsDependencyTransformer.transform(sourceRange, toRight, toBottom, toSheet, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addMoveCellsTransformation(sourceRange, toRight, toBottom, toSheet)
    })

    this.dependencyGraph.moveCells(sourceRange, toRight, toBottom, toSheet)

    this.recomputeIfDependencyGraphNeedsIt()
  }

  public addSheet() {
    const sheetId = this.sheetMapping.addSheet()
    this.addressMapping.autoAddSheet(sheetId, [])
  }

  public removeSheet(sheetId: number) {
    const sheetHeight = this.addressMapping.getHeight(sheetId)
    if (sheetHeight > 0) {
      this.removeRows(sheetId, 0, sheetHeight - 1)
    }
    this.addressMapping.removeSheet(sheetId)
    this.sheetMapping.removeSheet(sheetId)
  }

  public forceApplyPostponedTransformations() {
    this.dependencyGraph.forceApplyPostponedTransformations()
  }

  public disableNumericMatrices() {
    this.dependencyGraph.disableNumericMatrices()
  }

  public recomputeIfDependencyGraphNeedsIt() {
    const verticesToRecomputeFrom = Array.from(this.dependencyGraph.verticesToRecompute())
    this.dependencyGraph.clearRecentlyChangedVertices()

    if (verticesToRecomputeFrom) {
      this.evaluator.partialRun(verticesToRecomputeFrom)
    }
  }

  public get graph() {
    return this.dependencyGraph.graph
  }

  public get rangeMapping() {
    return this.dependencyGraph.rangeMapping
  }

  public get matrixMapping() {
    return this.dependencyGraph.matrixMapping
  }

  public get sheetMapping() {
    return this.dependencyGraph.sheetMapping
  }

  public get addressMapping() {
    return this.dependencyGraph.addressMapping
  }
}
