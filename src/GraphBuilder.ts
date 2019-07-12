import {AbsoluteCellRange} from './AbsoluteCellRange'
import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellDependency} from './CellDependency'
import {Config} from './Config'
import {GraphBuilderMatrixHeuristic} from './GraphBuilderMatrixHeuristic'
import {findSmallerRange} from './interpreter/plugin/SumprodPlugin'
import {checkMatrixSize, MatrixSizeCheck} from './Matrix'
import {isFormula, isMatrix, ParserWithCaching, ProcedureAst} from './parser'
import {Statistics, StatType} from './statistics/Statistics'
import {DependencyGraph} from './DependencyGraph'
import {
  CellVertex,
  EmptyCellVertex,
  FormulaCellVertex,
  MatrixVertex,
  RangeVertex,
  ValueCellVertex,
  Vertex,
  AddressMapping,
  Graph,
  RangeMapping,
  SheetMapping,
} from './DependencyGraph'

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
      private readonly parser: ParserWithCaching,
      private readonly config: Config = new Config(),
      private readonly stats: Statistics = new Statistics(),
  ) {
    if (this.config.matrixDetection) {
      this.buildStrategy = new MatrixDetectionStrategy(this.dependencyGraph, this.parser, this.stats, config.matrixDetectionThreshold)
    } else {
      this.buildStrategy = new SimpleStrategy(this.dependencyGraph, this.parser, this.stats)
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
      private readonly parser: ParserWithCaching,
      private readonly stats: Statistics
  ) {
  }

  public run(sheets: Sheets): Dependencies {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    this.dependencyGraph.addNode(EmptyCellVertex.getSingletonInstance())

    for (const sheetName in sheets) {
      const sheetId = this.dependencyGraph.getSheetId(sheetName)
      const sheet = sheets[sheetName] as Sheet

      for (let i = 0; i < sheet.length; ++i) {
        const row = sheet[i]
        for (let j = 0; j < row.length; ++j) {
          const cellContent = row[j]
          const cellAddress = simpleCellAddress(sheetId, j, i)
          let vertex = null

          if (isMatrix(cellContent)) {
            if (this.dependencyGraph.existsVertex(cellAddress)) {
              continue
            }
            const matrixFormula = cellContent.substr(1, cellContent.length - 2)
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(matrixFormula, cellAddress))
            vertex = buildMatrixVertex(parseResult.ast as ProcedureAst, cellAddress).vertex
            const absoluteParserResult = this.parser.getAbsolutizedParserResult(parseResult.hash, cellAddress)
            dependencies.set(vertex, absoluteParserResult.dependencies)
            this.dependencyGraph.addNode(vertex)
            setAddressMappingForMatrixVertex(vertex, cellAddress, this.dependencyGraph)
          } else if (isFormula(cellContent)) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, cellAddress))
            vertex = new FormulaCellVertex(parseResult.ast, cellAddress)
            const absoluteParserResult = this.parser.getAbsolutizedParserResult(parseResult.hash, cellAddress)
            dependencies.set(vertex, absoluteParserResult.dependencies)
            this.dependencyGraph.addNode(vertex)
            this.dependencyGraph.setCell(cellAddress, vertex)
          } else if (cellContent === '') {
            /* we don't care about empty cells here */
          } else if (!isNaN(Number(cellContent))) {
            vertex = new ValueCellVertex(Number(cellContent))
            this.dependencyGraph.addNode(vertex)
            this.dependencyGraph.setCell(cellAddress, vertex)
          } else {
            vertex = new ValueCellVertex(cellContent)
            this.dependencyGraph.addNode(vertex)
            this.dependencyGraph.setCell(cellAddress, vertex)
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
      private readonly parser: ParserWithCaching,
      private readonly stats: Statistics,
      private readonly threshold: number
  ) {}

  public run(sheets: Sheets): Dependencies {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    const matrixHeuristic = new GraphBuilderMatrixHeuristic(this.dependencyGraph, dependencies, this.threshold)

    this.dependencyGraph.addNode(EmptyCellVertex.getSingletonInstance())

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
          const cellAddress = simpleCellAddress(sheetId, j, i)

          if (isMatrix(cellContent)) {
            if (this.dependencyGraph.existsVertex(cellAddress)) {
              continue
            }
            const matrixFormula = cellContent.substr(1, cellContent.length - 2)
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(matrixFormula, cellAddress))
            const { vertex } = buildMatrixVertex(parseResult.ast as ProcedureAst, cellAddress)
            const absoluteParserResult = this.parser.getAbsolutizedParserResult(parseResult.hash, cellAddress)
            dependencies.set(vertex, absoluteParserResult.dependencies)
            this.dependencyGraph.addNode(vertex)
            setAddressMappingForMatrixVertex(vertex, cellAddress, this.dependencyGraph)
          } else if (isFormula(cellContent)) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(cellContent, cellAddress))
            matrixHeuristic.add(parseResult.hash, cellAddress)
          } else if (cellContent === '') {
            /* we don't care about empty cells here */
          } else if (!isNaN(Number(cellContent))) {
            matrixHeuristic.add('#', cellAddress)
          } else {
            const vertex = new ValueCellVertex(cellContent)
            this.dependencyGraph.addNode(vertex)
            this.dependencyGraph.setCell(cellAddress, vertex)
          }
        }
      }
    }

    this.stats.start(StatType.MATRIX_DETECTION)

    const notMatrices = matrixHeuristic.run(sheets, this.parser.getCache())
    for (let i = notMatrices.length - 1; i >= 0; --i) {
      const elem = notMatrices[i]
      if (elem.hash === '#') {
        for (let address of elem.cells.reverse()) {
          const value = sheets[this.dependencyGraph.getSheetName(address.sheet)][address.row][address.col]
          const vertex = new ValueCellVertex(Number(value))
          this.dependencyGraph.addNode(vertex)
          this.dependencyGraph.setCell(address, vertex)
        }
      } else {
        for (let address of elem.cells.reverse()) {
          const parserResult = this.parser.getAbsolutizedParserResult(elem.hash, address)
          const vertex = new FormulaCellVertex(parserResult.ast, address)
          this.dependencyGraph.addNode(vertex)
          this.dependencyGraph.setCell(address, vertex)
          dependencies.set(vertex, parserResult.dependencies)
        }
      }
    }

    this.stats.end(StatType.MATRIX_DETECTION)

    return dependencies
  }
}

export function setAddressMappingForMatrixVertex(vertex: CellVertex, formulaAddress: SimpleCellAddress, dependencyGraph: DependencyGraph) {
  /* TODO move to dependency graph? */
  dependencyGraph.setCell(formulaAddress, vertex)

  if (!(vertex instanceof MatrixVertex)) {
    return
  }

  const range = AbsoluteCellRange.spanFrom(formulaAddress, vertex.width, vertex.height)
  dependencyGraph.setMatrix(range, vertex)

  for (let i = 0; i < vertex.width; ++i) {
    for (let j = 0; j < vertex.height; ++j) {
      const address = simpleCellAddress(formulaAddress.sheet, formulaAddress.col + i, formulaAddress.row + j)
      dependencyGraph.setCell(address, vertex)
    }
  }
}

export function buildMatrixVertex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): { vertex: CellVertex, size: MatrixSizeCheck } {
  const size = checkMatrixSize(ast, formulaAddress)
  if (!size) {
    return { vertex: new ValueCellVertex(new CellError(ErrorType.VALUE)), size: size }
  }
  return { vertex: new MatrixVertex(formulaAddress, size.width, size.height, ast), size: size }
}
