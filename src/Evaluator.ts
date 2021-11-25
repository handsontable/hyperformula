/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {absolutizeDependencies} from './absolutizeDependencies'
import {CellError, ErrorType, SimpleCellAddress} from './Cell'
import {Config} from './Config'
import {ContentChanges} from './ContentChanges'
import {ArrayVertex, DependencyGraph, RangeVertex, Vertex} from './DependencyGraph'
import {FormulaVertex} from './DependencyGraph/FormulaCellVertex'
import {Interpreter} from './interpreter/Interpreter'
import {InterpreterState} from './interpreter/InterpreterState'
import {AsyncInterpreterValue, EmptyValue, getRawValue} from './interpreter/InterpreterValue'
import {SimpleRangeValue} from './interpreter/SimpleRangeValue'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {Ast, RelativeDependency} from './parser'
import {Statistics, StatType} from './statistics'

export class Evaluator {

  constructor(
    private readonly config: Config,
    private readonly stats: Statistics,
    public readonly interpreter: Interpreter,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
  ) {
  }

  public async run(): Promise<void> {
    this.stats.start(StatType.TOP_SORT)
    const {sorted, cycled} = this.dependencyGraph.topSortWithScc()
    this.stats.end(StatType.TOP_SORT)

    return this.stats.measureAsync(StatType.EVALUATION, async() => {
      await this.recomputeFormulas(cycled, sorted)
    })
  }

  public async partialRun(vertices: Vertex[]): Promise<ContentChanges> {
    const changes = ContentChanges.empty()

    await this.stats.measureAsync(StatType.EVALUATION, async() => {
      await this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(vertices,
        async(vertex: Vertex) => {
          if (vertex instanceof FormulaVertex) {
            const currentValue = vertex.isComputed() ? vertex.getCellValue() : undefined
            const newCellValue = await this.recomputeFormulaVertexValue(vertex)

            if (newCellValue !== currentValue) {
              const address = vertex.getAddress(this.lazilyTransformingAstService)
              changes.addChange(newCellValue, address)
              this.columnSearch.change(getRawValue(currentValue), getRawValue(newCellValue), address)
              return true
            }
            return false
          } else if (vertex instanceof RangeVertex) {
            vertex.clearCache()
            return true
          }

          return true
        },
        (vertex: Vertex) => {
          if (vertex instanceof RangeVertex) {
            vertex.clearCache()
          } else if (vertex instanceof FormulaVertex) {
            const address = vertex.getAddress(this.lazilyTransformingAstService)
            this.columnSearch.remove(getRawValue(vertex.valueOrUndef()), address)
            const error = new CellError(ErrorType.CYCLE, undefined, vertex)
            vertex.setCellValue(error)
            changes.addChange(error, address)
          }
        },
      )
    })

    return changes
  }

  public async runAndForget(ast: Ast, address: SimpleCellAddress, dependencies: RelativeDependency[]): AsyncInterpreterValue {
    const tmpRanges: RangeVertex[] = []
    for (const dep of absolutizeDependencies(dependencies, address)) {
      if (dep instanceof AbsoluteCellRange) {
        const range = dep
        if (this.dependencyGraph.getRange(range.start, range.end) === undefined) {
          const rangeVertex = new RangeVertex(range)
          this.dependencyGraph.rangeMapping.setRange(rangeVertex)
          tmpRanges.push(rangeVertex)
        }
      }
    }
    const ret = await this.evaluateAstToCellValue(ast, new InterpreterState(address, this.config.useArrayArithmetic))

    tmpRanges.forEach((rangeVertex) => {
      this.dependencyGraph.rangeMapping.removeRange(rangeVertex)
    })

    return ret
  }

  /**
   * Recalculates formulas in the topological sort order
   */
   private async recomputeFormulas(cycled: Vertex[], sorted: Vertex[]): Promise<void> {
    cycled.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex) {
        vertex.setCellValue(new CellError(ErrorType.CYCLE, undefined, vertex))
      }
    })

    for (const vertex of sorted) {
      if (vertex instanceof FormulaVertex) {
        const newCellValue = await this.recomputeFormulaVertexValue(vertex)
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        this.columnSearch.add(getRawValue(newCellValue), address)
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    }
  }

  private async recomputeFormulaVertexValue(vertex: FormulaVertex): AsyncInterpreterValue {
    const address = vertex.getAddress(this.lazilyTransformingAstService)
    if (vertex instanceof ArrayVertex && (vertex.array.size.isRef || !this.dependencyGraph.isThereSpaceForArray(vertex))) {
      return vertex.setNoSpace()
    } else {
      const formula = vertex.getFormula(this.lazilyTransformingAstService)
      const newCellValue = await this.evaluateAstToCellValue(formula, new InterpreterState(address, this.config.useArrayArithmetic, vertex))

      return vertex.setCellValue(newCellValue)
    }
  }

  private async evaluateAstToCellValue(ast: Ast, state: InterpreterState): AsyncInterpreterValue {
    const interpreterValue = await this.interpreter.evaluateAst(ast, state)

    if (interpreterValue instanceof SimpleRangeValue) {
      return interpreterValue
    } else if (interpreterValue === EmptyValue && this.config.evaluateNullToZero) {
      return 0
    } else {
      return interpreterValue
    }
  }
}
