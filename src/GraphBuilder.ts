/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {absolutizeDependencies} from './absolutizeDependencies'
import {CellError, simpleCellAddress} from './Cell'
import {CellContent, CellContentParser} from './CellContentParser'
import {CellDependency} from './CellDependency'
import {getRawValue} from './interpreter/InterpreterValue'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {Config} from './Config'
import {
  DependencyGraph,
  FormulaCellVertex,
  MatrixVertex,
  ParsingErrorVertex,
  ValueCellVertex,
  Vertex
} from './DependencyGraph'
import {GraphBuilderMatrixHeuristic} from './GraphBuilderMatrixHeuristic'
import {MatrixSizePredictor} from './MatrixSize'
import {ParserWithCaching} from './parser'
import {Statistics, StatType} from './statistics'
import {Sheets} from './Sheet'

export type Dependencies = Map<Vertex, CellDependency[]>

/**
 * Service building the graph and mappings.
 */
export class GraphBuilder {
  private buildStrategy: GraphBuilderStrategy

  /**
   * Configures the building service.
   */
  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
    private readonly parser: ParserWithCaching,
    private readonly cellContentParser: CellContentParser,
    private readonly config: Config,
    private readonly stats: Statistics,
    private readonly matrixSizePredictor: MatrixSizePredictor,
  ) {
    if (this.config.matrixDetection) {
      this.buildStrategy = new MatrixDetectionStrategy(dependencyGraph, columnSearch, parser, stats, config.matrixDetectionThreshold, cellContentParser, matrixSizePredictor)
    } else {
      this.buildStrategy = new SimpleStrategy(dependencyGraph, columnSearch, parser, stats, cellContentParser, matrixSizePredictor)
    }
  }

  /**
   * Builds graph.
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
    private readonly columnIndex: ColumnSearchStrategy,
    private readonly parser: ParserWithCaching,
    private readonly stats: Statistics,
    private readonly cellContentParser: CellContentParser,
    private readonly matrixSizePredictor: MatrixSizePredictor,
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
          if (parsedCellContent instanceof CellContent.Formula) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(parsedCellContent.formula, address))
            if (parseResult.errors.length > 0) {
              const vertex = new ParsingErrorVertex(parseResult.errors, parsedCellContent.formula)
              this.dependencyGraph.addVertex(address, vertex)
            } else {
              const size = this.matrixSizePredictor.checkMatrixSize(parseResult.ast, address)
              if(size === undefined || (size.width<=1 && size.height<=1) || size.isRef) {
                const vertex = new FormulaCellVertex(parseResult.ast, address, 0)
                dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
                this.dependencyGraph.addVertex(address, vertex)
                if (parseResult.hasVolatileFunction) {
                  this.dependencyGraph.markAsVolatile(vertex)
                }
                if (parseResult.hasStructuralChangeFunction) {
                  this.dependencyGraph.markAsDependentOnStructureChange(vertex)
                }
              } else {
                const vertex = new MatrixVertex(address, size.width, size.height, parseResult.ast)
                dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
                this.dependencyGraph.addMatrixVertex(address, vertex)
              }
            }
          } else if (parsedCellContent instanceof CellContent.Empty) {
            /* we don't care about empty cells here */
          } else {
            const vertex = new ValueCellVertex(parsedCellContent.value, cellContent)
            this.columnIndex.add(getRawValue(parsedCellContent.value), address)
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
    private readonly columnSearch: ColumnSearchStrategy,
    private readonly parser: ParserWithCaching,
    private readonly stats: Statistics,
    private readonly threshold: number,
    private readonly cellContentParser: CellContentParser,
    private readonly matrixSizePredictor: MatrixSizePredictor,
  ) {}

  public run(sheets: Sheets): Dependencies {
    const dependencies: Map<Vertex, CellDependency[]> = new Map()

    const matrixHeuristic = new GraphBuilderMatrixHeuristic(this.dependencyGraph, this.columnSearch, this.threshold, this.cellContentParser)

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
          if (parsedCellContent instanceof CellContent.Formula) {
            const parseResult = this.stats.measure(StatType.PARSER, () => this.parser.parse(parsedCellContent.formula, address))
            if (parseResult.errors.length > 0) {
              const vertex = new ParsingErrorVertex(parseResult.errors, parsedCellContent.formula)
              this.dependencyGraph.addVertex(address, vertex)
            } else {
              const size = this.matrixSizePredictor.checkMatrixSize(parseResult.ast, address)
              if(size === undefined || (size.width<=1 && size.height<=1) || size.isRef) {
                const vertex = new FormulaCellVertex(parseResult.ast, address, 0)
                dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
                this.dependencyGraph.addVertex(address, vertex)
                if (parseResult.hasVolatileFunction) {
                  this.dependencyGraph.markAsVolatile(vertex)
                }
                if (parseResult.hasStructuralChangeFunction) {
                  this.dependencyGraph.markAsDependentOnStructureChange(vertex)
                }
              } else {
                const vertex = new MatrixVertex(address, size.width, size.height, parseResult.ast)
                dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
                this.dependencyGraph.addMatrixVertex(address, vertex)
              }
            }
          } else if (parsedCellContent instanceof CellContent.Empty) {
            /* we don't care about empty cells here */
          } else if (parsedCellContent instanceof CellContent.Number) {
            matrixHeuristic.add(address)
          } else {
            const vertex = new ValueCellVertex(parsedCellContent.value, cellContent)
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
      elem.cells.reverse()
      for (const address of elem.cells) {
        const value = sheets[this.dependencyGraph.getSheetName(address.sheet)][address.row][address.col]
        const vertex = new ValueCellVertex(Number(value), value)
        this.columnSearch.add(Number(value), address)
        this.dependencyGraph.addVertex(address, vertex)
      }
    }

    this.stats.end(StatType.MATRIX_DETECTION)

    return dependencies
  }
}

