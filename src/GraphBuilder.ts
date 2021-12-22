/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {absolutizeDependencies} from './absolutizeDependencies'
import {ArraySize, ArraySizePredictor} from './ArraySize'
import {SimpleCellAddress, simpleCellAddress} from './Cell'
import {CellContent, CellContentParser} from './CellContentParser'
import {CellDependency} from './CellDependency'
import {
  ArrayVertex,
  DependencyGraph,
  FormulaCellVertex,
  ParsingErrorVertex,
  ValueCellVertex,
  Vertex
} from './DependencyGraph'
import {getRawValue} from './interpreter/InterpreterValue'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {ParserWithCaching} from './parser'
import {Sheets} from './Sheet'
import {Statistics, StatType} from './statistics'

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
    private readonly stats: Statistics,
    private readonly arraySizePredictor: ArraySizePredictor,
  ) {
    this.buildStrategy = new SimpleStrategy(dependencyGraph, columnSearch, parser, stats, cellContentParser, arraySizePredictor)
  }

  /**
   * Builds graph.
   */
  public buildGraph(sheets: Sheets, stats: Statistics) {
    const dependencies = stats.measure(StatType.COLLECT_DEPENDENCIES, () => this.buildStrategy.run(sheets))
    this.dependencyGraph.getAndClearContentChanges()
    stats.measure(StatType.PROCESS_DEPENDENCIES, () => this.processDependencies(dependencies))
  }

  private processDependencies(dependencies: Dependencies) {
    dependencies.forEach((cellPrecedents: CellDependency[], endVertex: Vertex) => {
      this.dependencyGraph.processCellPrecedents(cellPrecedents, endVertex)
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
    private readonly arraySizePredictor: ArraySizePredictor
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
              this.shrinkArrayIfNeeded(address)
              const vertex = new ParsingErrorVertex(parseResult.errors, parsedCellContent.formula)
              this.dependencyGraph.addVertex(address, vertex)
            } else {
              this.shrinkArrayIfNeeded(address)
              
              const size = this.arraySizePredictor.checkArraySize(parseResult.ast, address)
              
              if (size.isScalar()) {
                const vertex = new FormulaCellVertex(parseResult.ast, address, 0)
                dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
                this.dependencyGraph.addVertex(address, vertex)
                if (parseResult.hasVolatileFunction) {
                  this.dependencyGraph.markAsVolatile(vertex)
                }
                if (parseResult.hasStructuralChangeFunction) {
                  this.dependencyGraph.markAsDependentOnStructureChange(vertex)
                }
                if (parseResult.hasAsyncFunction) {
                  this.dependencyGraph.markAsAsync(vertex)
                }
              } else {
                const vertex = new ArrayVertex(parseResult.ast, address, new ArraySize(size.width, size.height))
                dependencies.set(vertex, absolutizeDependencies(parseResult.dependencies, address))
                this.dependencyGraph.addArrayVertex(address, vertex)

                if (parseResult.hasAsyncFunction) {
                  this.dependencyGraph.markAsAsync(vertex)
                }
              }
            }
          } else if (parsedCellContent instanceof CellContent.Empty) {
            /* we don't care about empty cells here */
          } else {
            this.shrinkArrayIfNeeded(address)
            const vertex = new ValueCellVertex(parsedCellContent.value, cellContent)
            this.columnIndex.add(getRawValue(parsedCellContent.value), address)
            this.dependencyGraph.addVertex(address, vertex)
          }
        }
      }
    }

    return dependencies
  }

  private shrinkArrayIfNeeded(address: SimpleCellAddress) {
    const vertex = this.dependencyGraph.getCell(address)
    if (vertex instanceof ArrayVertex) {
      this.dependencyGraph.shrinkArrayToCorner(vertex)
    }
  }
}
