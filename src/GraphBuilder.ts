import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellDependency} from './CellDependency'
import {Config} from './Config'
import {DependencyGraph, FormulaCellVertex, MatrixVertex, ValueCellVertex, Vertex} from './DependencyGraph'
import {GraphBuilderMatrixHeuristic} from './GraphBuilderMatrixHeuristic'
import {checkMatrixSize, MatrixSizeCheck} from './Matrix'
import {isFormula, isMatrix, ParserWithCaching, ProcedureAst} from './parser'
import {Statistics, StatType} from './statistics/Statistics'
import {absolutizeDependencies} from './absolutizeDependencies'
import {IColumnSearchStrategy} from "./ColumnSearch/ColumnSearchStrategy";

/**
 * Two-dimenstional array representation of sheet
 */
export type Sheet = string[][]

export type Dependencies = Map<Vertex, CellDependency[]>

export type Sheets = Record<string, Sheet>

/**
 * Service building the graph and mappings.
 */
export class GraphBuilder {
  private buildStrategy: GraphBuilderStrategy

  /**
   * Configures the building service.
   *
   * @param graph - graph instance in which we want to add vertices and edges
   * @param addressMapping - mapping from addresses to vertices
   * @param rangeMapping - mapping from ranges to range vertices
   * @param stats - dependency tracking building performance
   * @param config - configuration of the sheet
   */
  constructor(
      private readonly dependencyGraph: DependencyGraph,
      private readonly columnSearch: IColumnSearchStrategy,
      private readonly parser: ParserWithCaching,
      private readonly config: Config = new Config(),
      private readonly stats: Statistics = new Statistics(),
  ) {
    if (this.config.matrixDetection) {
      this.buildStrategy = new MatrixDetectionStrategy(this.dependencyGraph, this.columnSearch, this.parser, this.stats, config.matrixDetectionThreshold)
    } else {
      this.buildStrategy = new SimpleStrategy(this.dependencyGraph, this.columnSearch, this.parser, this.stats)
    }
  }

  /**
   * Builds graph.
   *
   * @param sheet - two-dimensional array representation of sheet
   */
  public buildGraph(sheets: Sheets) {
    const dependencies = this.buildStrategy.run(sheets)
    this.processDependencies(dependencies)
  }

  private processDependencies(dependencies: Dependencies) {
    dependencies.forEach((cellDependencies: CellDependency[], endVertex: Vertex) => {
      this.dependencyGraph.processCellDependencies(cellDependencies, endVertex)
    })
  }
}

export interface GraphBuilderStrategy {
  run(sheets: Sheets): Dependencies
}

export class SimpleStrategy implements GraphBuilderStrategy {
  constructor(
      private readonly dependencyGraph: DependencyGraph,
      private readonly columnIndex: IColumnSearchStrategy,
      private readonly parser: ParserWithCaching,
      private readonly stats: Statistics,
  ) {
  }

  public run(sheets: Sheets): Dependencies {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    for (const sheetName in sheets) {
      const sheetId = this.dependencyGraph.getSheetId(sheetName)
      const sheet = sheets[sheetName] as Sheet

      for (let i = 0; i < sheet.length; ++i) {
        const row = sheet[i]
        for (let j = 0; j < row.length; ++j) {
          const cellContent = row[j]
          const address = simpleCellAddress(sheetId, j, i)
          let vertex = null

          if (isMatrix(cellContent)) {
            if (this.dependencyGraph.existsVertex(address)) {
              continue
            }
            const matrixFormula = cellContent.substr(1, cellContent.length - 2)
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(matrixFormula, address))
            vertex = buildMatrixVertex(parseResult.ast as ProcedureAst, address).vertex
            dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
            this.dependencyGraph.addMatrixVertex(address, vertex)
          } else if (isFormula(cellContent)) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, address))
            vertex = new FormulaCellVertex(parseResult.ast, address, 0)
            dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
            this.dependencyGraph.addVertex(address, vertex)
            if (parseResult.hasVolatileFunction) {
              this.dependencyGraph.markAsVolatile(vertex)
            }
            if (parseResult.hasStructuralChangeFunction) {
              this.dependencyGraph.markAsDependentOnStructureChange(vertex)
            }
          } else if (cellContent === '') {
            /* we don't care about empty cells here */
          } else if (!isNaN(Number(cellContent))) {
            vertex = new ValueCellVertex(Number(cellContent))
            this.columnIndex.add(Number(cellContent), address)
            this.dependencyGraph.addVertex(address, vertex)
          } else {
            vertex = new ValueCellVertex(cellContent)
            this.columnIndex.add(cellContent, address)
            this.dependencyGraph.addVertex(address, vertex)
          }
        }
      }
    }

    return dependencies
  }
}

export class MatrixDetectionStrategy implements GraphBuilderStrategy {
  constructor(
      private readonly dependencyGraph: DependencyGraph,
      private readonly columnIndex: IColumnSearchStrategy,
      private readonly parser: ParserWithCaching,
      private readonly stats: Statistics,
      private readonly threshold: number,
  ) {}

  public run(sheets: Sheets): Dependencies {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    const matrixHeuristic = new GraphBuilderMatrixHeuristic(this.dependencyGraph, dependencies, this.threshold)

    for (const sheetName in sheets) {
      const sheetId = this.dependencyGraph.getSheetId(sheetName)
      const sheet = sheets[sheetName] as Sheet

      matrixHeuristic.addSheet(sheetId, {
        width: this.dependencyGraph.getSheetWidth(sheetId),
        height: this.dependencyGraph.getSheetHeight(sheetId),
      })

      for (let i = 0; i < sheet.length; ++i) {
        const row = sheet[i]
        for (let j = 0; j < row.length; ++j) {
          const cellContent = row[j]
          const address = simpleCellAddress(sheetId, j, i)

          if (isMatrix(cellContent)) {
            if (this.dependencyGraph.existsVertex(address)) {
              continue
            }
            const matrixFormula = cellContent.substr(1, cellContent.length - 2)
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(matrixFormula, address))
            const { vertex } = buildMatrixVertex(parseResult.ast as ProcedureAst, address)
            dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
            this.dependencyGraph.addMatrixVertex(address, vertex)
          } else if (isFormula(cellContent)) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, address))
            const vertex = new FormulaCellVertex(parseResult.ast, address, 0)
            dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
            this.dependencyGraph.addVertex(address, vertex)
          } else if (cellContent === '') {
            /* we don't care about empty cells here */
          } else if (!isNaN(Number(cellContent))) {
            matrixHeuristic.add(address)
          } else {
            const vertex = new ValueCellVertex(cellContent)
            this.columnIndex.add(cellContent, address)
            this.dependencyGraph.addVertex(address, vertex)
          }
        }
      }
    }

    this.stats.start(StatType.MATRIX_DETECTION)

    const notMatrices = matrixHeuristic.run(sheets)
    for (let i = notMatrices.length - 1; i >= 0; --i) {
      const elem = notMatrices[i]
      for (const address of elem.cells.reverse()) {
        const value = sheets[this.dependencyGraph.getSheetName(address.sheet)][address.row][address.col]
        const vertex = new ValueCellVertex(Number(value))
        this.columnIndex.add(Number(value), address)
        this.dependencyGraph.addVertex(address, vertex)
      }
    }

    this.stats.end(StatType.MATRIX_DETECTION)

    return dependencies
  }
}

export function buildMatrixVertex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): { vertex: MatrixVertex | ValueCellVertex, size: MatrixSizeCheck } {
  const size = checkMatrixSize(ast, formulaAddress)
  if (!size) {
    return { vertex: new ValueCellVertex(new CellError(ErrorType.VALUE)), size }
  }
  return { vertex: new MatrixVertex(formulaAddress, size.width, size.height, ast), size }
}
