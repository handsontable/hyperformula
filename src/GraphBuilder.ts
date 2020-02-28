import {absolutizeDependencies} from './absolutizeDependencies'
import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, RawCellContent} from './CellContentParser'
import {CellDependency} from './CellDependency'
import {IColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config} from './Config'
import {DependencyGraph, FormulaCellVertex, MatrixVertex, ValueCellVertex, Vertex} from './DependencyGraph'
import {GraphBuilderMatrixHeuristic} from './GraphBuilderMatrixHeuristic'
import {checkMatrixSize, MatrixSizeCheck} from './Matrix'
import {ParserWithCaching, ProcedureAst} from './parser'
import {Statistics, StatType} from './statistics/Statistics'

/**
 * Two-dimenstional array representation of sheet
 */
export type Sheet = RawCellContent[][]

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
    private readonly cellContentParser: CellContentParser,
    private readonly config: Config = new Config(),
    private readonly stats: Statistics = new Statistics(),
  ) {
    if (this.config.matrixDetection) {
      this.buildStrategy = new MatrixDetectionStrategy(this.dependencyGraph, this.columnSearch, this.parser, this.stats, config.matrixDetectionThreshold, this.cellContentParser)
    } else {
      this.buildStrategy = new SimpleStrategy(this.dependencyGraph, this.columnSearch, this.parser, this.stats, this.cellContentParser)
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
  run(sheets: Sheets): Dependencies,
}

export class SimpleStrategy implements GraphBuilderStrategy {
  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnIndex: IColumnSearchStrategy,
    private readonly parser: ParserWithCaching,
    private readonly stats: Statistics,
    private readonly cellContentParser: CellContentParser,
  ) {
  }

  public run(sheets: Sheets): Dependencies {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    for (const sheetName in sheets) {
      const sheetId = this.dependencyGraph.getSheetId(sheetName)
      const sheet = sheets[sheetName]

      for (let i = 0; i < sheet.length; ++i) {
        const row = sheet[i]
        for (let j = 0; j < row.length; ++j) {
          const cellContent = row[j]
          const address = simpleCellAddress(sheetId, j, i)

          const parsedCellContent = this.cellContentParser.parse(cellContent)
          if (parsedCellContent instanceof CellContent.MatrixFormula) {
            if (this.dependencyGraph.existsVertex(address)) {
              continue
            }
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(parsedCellContent.formula, address))
            const vertex = buildMatrixVertex(parseResult.ast as ProcedureAst, address)
            dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
            this.dependencyGraph.addMatrixVertex(address, vertex)
          } else if (parsedCellContent instanceof CellContent.Formula) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(parsedCellContent.formula, address))
            const vertex = new FormulaCellVertex(parseResult.ast, address, 0)
            dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
            this.dependencyGraph.addVertex(address, vertex)
            if (parseResult.hasVolatileFunction) {
              this.dependencyGraph.markAsVolatile(vertex)
            }
            if (parseResult.hasStructuralChangeFunction) {
              this.dependencyGraph.markAsDependentOnStructureChange(vertex)
            }
          } else if (parsedCellContent instanceof CellContent.Empty) {
            /* we don't care about empty cells here */
          } else {
            const vertex = new ValueCellVertex(parsedCellContent.value)
            this.columnIndex.add(parsedCellContent.value, address)
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
    private readonly columnSearch: IColumnSearchStrategy,
    private readonly parser: ParserWithCaching,
    private readonly stats: Statistics,
    private readonly threshold: number,
    private readonly cellContentParser: CellContentParser,
  ) {}

  public run(sheets: Sheets): Dependencies {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    const matrixHeuristic = new GraphBuilderMatrixHeuristic(this.dependencyGraph, this.columnSearch, dependencies, this.threshold, this.cellContentParser)

    for (const sheetName in sheets) {
      const sheetId = this.dependencyGraph.getSheetId(sheetName)
      const sheet = sheets[sheetName]

      matrixHeuristic.addSheet(sheetId, {
        width: this.dependencyGraph.getSheetWidth(sheetId),
        height: this.dependencyGraph.getSheetHeight(sheetId),
      })

      for (let i = 0; i < sheet.length; ++i) {
        const row = sheet[i]
        for (let j = 0; j < row.length; ++j) {
          const cellContent = row[j]
          const address = simpleCellAddress(sheetId, j, i)

          const parsedCellContent = this.cellContentParser.parse(cellContent)
          if (parsedCellContent instanceof CellContent.MatrixFormula) {
            if (this.dependencyGraph.existsVertex(address)) {
              continue
            }
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(parsedCellContent.formula, address))
            const vertex = buildMatrixVertex(parseResult.ast as ProcedureAst, address)
            dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
            this.dependencyGraph.addMatrixVertex(address, vertex)
          } else if (parsedCellContent instanceof CellContent.Formula) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(parsedCellContent.formula, address))
            const vertex = new FormulaCellVertex(parseResult.ast, address, 0)
            dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
            this.dependencyGraph.addVertex(address, vertex)
          } else if (parsedCellContent instanceof CellContent.Empty) {
            /* we don't care about empty cells here */
          } else if (parsedCellContent instanceof CellContent.Number) {
            matrixHeuristic.add(address)
          } else {
            const vertex = new ValueCellVertex(parsedCellContent.value)
            this.columnSearch.add(parsedCellContent.value, address)
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
        this.columnSearch.add(Number(value), address)
        this.dependencyGraph.addVertex(address, vertex)
      }
    }

    this.stats.end(StatType.MATRIX_DETECTION)

    return dependencies
  }
}

export function buildMatrixVertex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): MatrixVertex | ValueCellVertex {
  const size = checkMatrixSize(ast, formulaAddress)
  if (size instanceof CellError) {
    return new ValueCellVertex(size)
  }
  return new MatrixVertex(formulaAddress, size.width, size.height, ast)
}
