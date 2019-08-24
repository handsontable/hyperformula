import {AbsoluteCellRange} from './AbsoluteCellRange'
import {CellValue, simpleCellAddress, SimpleCellAddress} from './Cell'
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
import {Evaluator} from './Evaluator'
import {buildMatrixVertex, Sheet, Sheets} from './GraphBuilder'
import {Ast, cellAddressFromString, isFormula, isMatrix, ParserWithCaching, ProcedureAst} from './parser'
import {CellAddress} from './parser/CellAddress'
import {Statistics, StatType} from './statistics/Statistics'
import {absolutizeDependencies} from './absolutizeDependencies'
import {EmptyEngineFactory} from './EmptyEngineFactory'
import {BuildEngineFromArraysFactory} from './BuildEngineFromArraysFactory'

export enum TransformationType {
  ADD_ROWS,
  ADD_COLUMNS,
  REMOVE_ROWS,
  REMOVE_COLUMNS,
}

export interface AddColumnsTransformation {
  type: TransformationType.ADD_COLUMNS,
  sheet: number,
  col: number,
  numberOfCols: number,
}

export interface AddRowsTransformation {
  type: TransformationType.ADD_ROWS,
  sheet: number,
  row: number,
  numberOfRowsToAdd: number,
}

export interface RemoveRowsTransformation {
  type: TransformationType.REMOVE_ROWS,
  sheet: number,
  rowStart: number,
  rowEnd: number,
}

export interface RemoveColumnsTransformation {
  type: TransformationType.REMOVE_COLUMNS,
  sheet: number,
  columnStart: number,
  columnEnd: number,
}

export type Transformation =
    AddRowsTransformation
    | AddColumnsTransformation
    | RemoveRowsTransformation
    | RemoveColumnsTransformation

export class LazilyTransformingAstService {
  private transformations: Transformation[] = []

  public parser?: ParserWithCaching

  constructor(
      private readonly stats: Statistics
  ) {
  }

  public version(): number {
    return this.transformations.length
  }

  public addAddColumnsTransformation(sheet: number, col: number, numberOfCols: number) {
    this.transformations.push({
      type: TransformationType.ADD_COLUMNS,
      sheet,
      col,
      numberOfCols
    })
  }

  public addAddRowsTransformation(sheet: number, row: number, numberOfRowsToAdd: number) {
    this.transformations.push({
      type: TransformationType.ADD_ROWS,
      sheet,
      row,
      numberOfRowsToAdd,
    })
  }

  public addRemoveRowsTransformation(sheet: number, rowStart: number, rowEnd: number) {
    this.transformations.push({
      type: TransformationType.REMOVE_ROWS,
      sheet,
      rowStart,
      rowEnd,
    })
  }

  public addRemoveColumnsTransformation(sheet: number, columnStart: number, columnEnd: number) {
    this.transformations.push({
      type: TransformationType.REMOVE_COLUMNS,
      sheet,
      columnStart,
      columnEnd,
    })
  }

  public applyTransformations(ast: Ast, address: SimpleCellAddress, version: number): [Ast, SimpleCellAddress, number] {
    this.stats.start(StatType.TRANSFORM_ASTS_POSTPONED)

    for (let v = version; v < this.transformations.length; v++) {
      const transformation = this.transformations[v]
      switch (transformation.type) {
        case TransformationType.ADD_COLUMNS: {
          const [newAst, newAddress] = AddColumnsDependencyTransformer.transform2(
              transformation.sheet,
              transformation.col,
              transformation.numberOfCols,
              ast,
              address,
          )
          ast = newAst
          address = newAddress
          break;
        }
        case TransformationType.ADD_ROWS: {
          const [newAst, newAddress] = AddRowsDependencyTransformer.transform2(
              transformation.sheet,
              transformation.row,
              transformation.numberOfRowsToAdd,
              ast,
              address,
          )
          ast = newAst
          address = newAddress
          break;
        }
        case TransformationType.REMOVE_COLUMNS: {
          const numberOfColumnsToDelete = transformation.columnEnd - transformation.columnStart + 1
          const [newAst, newAddress] = RemoveColumnsDependencyTransformer.transform2(
              transformation.sheet,
              transformation.columnStart,
              numberOfColumnsToDelete,
              ast,
              address,
          )
          ast = newAst
          address = newAddress
          break;
        }
        case TransformationType.REMOVE_ROWS: {
          const numberOfRows = transformation.rowEnd - transformation.rowStart + 1
          const [newAst, newAddress] = RemoveRowsDependencyTransformer.transform2(
              transformation.sheet,
              transformation.rowStart,
              numberOfRows,
              ast,
              address,
          )
          ast = newAst
          address = newAddress
          break;
        }
      }
    }
    const cachedAst = this.parser!.rememberNewAst(ast)

    this.stats.end(StatType.TRANSFORM_ASTS_POSTPONED)
    return [cachedAst, address, this.transformations.length]
  }
}

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
  public setCellContent(address: SimpleCellAddress, newCellContent: string) {
    const vertex = this.dependencyGraph.getCell(address)
    let verticesToRecomputeFrom: Vertex[]

    if (vertex instanceof MatrixVertex && !vertex.isFormula() && !isNaN(Number(newCellContent))) {
      vertex.setMatrixCellValue(address, Number(newCellContent))
      verticesToRecomputeFrom = [vertex]
    } else if (!(vertex instanceof MatrixVertex) && isMatrix(newCellContent)) {
      const matrixFormula = newCellContent.substr(1, newCellContent.length - 2)
      const parseResult = this.parser.parse(matrixFormula, address)

      const {vertex: newVertex, size} = buildMatrixVertex(parseResult.ast as ProcedureAst, address)

      if (!size || !(newVertex instanceof MatrixVertex)) {
        throw Error('What if new matrix vertex is not properly constructed?')
      }

      this.dependencyGraph.addNewMatrixVertex(newVertex)
      this.dependencyGraph.processCellDependencies(absolutizeDependencies(parseResult.dependencies, address), newVertex)
      verticesToRecomputeFrom = [newVertex]
    } else if (vertex instanceof FormulaCellVertex || vertex instanceof ValueCellVertex || vertex instanceof EmptyCellVertex || vertex === null) {
      if (isFormula(newCellContent)) {
        const {ast, hash, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(newCellContent, address)
        this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
      } else if (newCellContent === '') {
        this.dependencyGraph.setCellEmpty(address)
      } else if (!isNaN(Number(newCellContent))) {
        this.dependencyGraph.setValueToCell(address, Number(newCellContent))
      } else {
        this.dependencyGraph.setValueToCell(address, newCellContent)
      }
      verticesToRecomputeFrom = Array.from(this.dependencyGraph.verticesToRecompute())
      this.dependencyGraph.clearRecentlyChangedVertices()
    } else {
      throw new Error('Illegal operation')
    }

    if (verticesToRecomputeFrom) {
      this.evaluator.partialRun(verticesToRecomputeFrom)
    }
  }

  public addRows(sheet: number, row: number, numberOfRowsToAdd: number = 1) {
    this.stats.reset()

    this.dependencyGraph.addRows(sheet, row, numberOfRowsToAdd)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      AddRowsDependencyTransformer.transform(sheet, row, numberOfRowsToAdd, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addAddRowsTransformation(sheet, row, numberOfRowsToAdd)
    })

    this.recomputeIfDependencyGraphNeedsIt()
  }

  public removeRows(sheet: number, rowStart: number, rowEnd: number = rowStart) {
    this.stats.reset()

    this.dependencyGraph.removeRows(sheet, rowStart, rowEnd)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveRowsDependencyTransformer.transform(sheet, rowStart, rowEnd, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addRemoveRowsTransformation(sheet, rowStart, rowEnd)
    })

    this.recomputeIfDependencyGraphNeedsIt()
  }

  public addColumns(sheet: number, col: number, numberOfCols: number = 1) {
    this.stats.reset()

    this.dependencyGraph.addColumns(sheet, col, numberOfCols)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      AddColumnsDependencyTransformer.transform(sheet, col, numberOfCols, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addAddColumnsTransformation(sheet, col, numberOfCols)
    })

    this.recomputeIfDependencyGraphNeedsIt()
  }

  public removeColumns(sheet: number, columnStart: number, columnEnd: number = columnStart) {
    this.stats.reset()

    this.dependencyGraph.removeColumns(sheet, columnStart, columnEnd)

    this.stats.measure(StatType.TRANSFORM_ASTS, () => {
      RemoveColumnsDependencyTransformer.transform(sheet, columnStart, columnEnd, this.dependencyGraph, this.parser)
      this.lazilyTransformingAstService.addRemoveColumnsTransformation(sheet, columnStart, columnEnd)
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

    MoveCellsDependencyTransformer.transformDependentFormulas(sourceRange, toRight, toBottom, toSheet, this.dependencyGraph, this.parser)
    MoveCellsDependencyTransformer.transformMovedFormulas(sourceRange, toRight, toBottom, toSheet, this.dependencyGraph, this.parser)

    this.dependencyGraph.moveCells(sourceRange, toRight, toBottom, toSheet)

    this.recomputeIfDependencyGraphNeedsIt()
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
