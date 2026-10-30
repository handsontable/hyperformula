/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {absolutizeDependencies} from './absolutizeDependencies'
import {CellError, ErrorType, SimpleCellAddress} from './Cell'
import {Config} from './Config'
import {ContentChanges} from './ContentChanges'
import {ArrayFormulaVertex, DependencyGraph, RangeVertex, Vertex} from './DependencyGraph'
import {FormulaVertex} from './DependencyGraph/FormulaVertex'
import {TopSortPass} from './DependencyGraph/Graph'
import {NodeProcessingResult} from './DependencyGraph/TopSort'
import {EvaluationPass} from './EvaluationPass'
import {EVALUATION_DEFERRED} from './interpreter/EvaluationDeferred'
import {Interpreter} from './interpreter/Interpreter'
import {InterpreterState} from './interpreter/InterpreterState'
import {EmptyValue, getRawValue, InterpreterValue} from './interpreter/InterpreterValue'
import {SimpleRangeValue} from './SimpleRangeValue'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {Maybe} from './Maybe'
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

  public run(): void {
    this.stats.measure(StatType.EVALUATION, () => {
      this.evaluateInPasses(this.dependencyGraph.graph.getNodes(),
        (vertex: Vertex, pass: EvaluationPass) => this.computeVertexOnInitialRun(vertex, pass),
        (vertex: Vertex) => this.setCycleErrorOnInitialRun(vertex),
      )
    })
  }

  public partialRun(vertices: Vertex[]): ContentChanges {
    const changes = ContentChanges.empty()

    this.stats.measure(StatType.EVALUATION, () => {
      this.evaluateInPasses(vertices,
        (vertex: Vertex, pass: EvaluationPass) => this.recomputeVertex(vertex, changes, pass),
        (vertex: Vertex) => this.processVertexOnCycle(vertex, changes),
      )
    })
    return changes
  }

  public runAndForget(ast: Ast, address: SimpleCellAddress, dependencies: RelativeDependency[]): InterpreterValue {
    const tmpRanges: RangeVertex[] = []
    for (const dep of absolutizeDependencies(dependencies, address)) {
      if (dep instanceof AbsoluteCellRange) {
        const range = dep
        if (this.dependencyGraph.getRange(range.start, range.end) === undefined) {
          const rangeVertex = new RangeVertex(range)
          this.dependencyGraph.rangeMapping.addOrUpdateVertex(rangeVertex)
          tmpRanges.push(rangeVertex)
        }
      }
    }
    const ret = this.evaluateAstToCellValue(ast, new InterpreterState(address, this.config.useArrayArithmetic))

    tmpRanges.forEach((rangeVertex) => {
      this.dependencyGraph.rangeMapping.removeVertexIfExists(rangeVertex)
    })

    return ret
  }

  /**
   * Evaluates the graph starting from the seeds.
   *
   * A formula that reads a cell which is not current yet (see {@link EVALUATION_DEFERRED}) requests that cell. The sort
   * computes the cell, and the pending cells it depends on, right away and then retries the formula, all in the same pass.
   *
   * A formula on a cycle loses its runtime dependencies and is recomputed once more, in another pass, so that a formula
   * that no longer reads a cell on the cycle can leave it. If it reads one again, it keeps #CYCLE!.
   */
  private evaluateInPasses(
    seeds: Vertex[],
    operatingFunction: (vertex: Vertex, pass: EvaluationPass) => NodeProcessingResult,
    onCycle: (vertex: Vertex) => void,
  ): void {
    const retriedAfterCycle = new Set<FormulaVertex>()
    let nextSeeds = seeds

    while (nextSeeds.length > 0) {
      const retrySeeds: Vertex[] = []
      let evaluationPass: Maybe<EvaluationPass> = undefined
      const {deferred} = this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(nextSeeds,
        (vertex: Vertex, topSortPass: TopSortPass<Vertex>) => {
          evaluationPass = evaluationPass ?? new EvaluationPass(this.dependencyGraph, topSortPass)
          return operatingFunction(vertex, evaluationPass)
        },
        (vertex: Vertex) => {
          onCycle(vertex)
          if (vertex instanceof FormulaVertex && !retriedAfterCycle.has(vertex) && this.dependencyGraph.clearRuntimeDependencies(vertex)) {
            retriedAfterCycle.add(vertex)
            retrySeeds.push(vertex)
          }
        },
      )
      nextSeeds = [...deferred, ...retrySeeds]
    }
    this.dependencyGraph.removeUnusedRuntimeVertices()
  }

  /**
   * Computes the value of a vertex during the initial evaluation of the whole graph.
   */
  private computeVertexOnInitialRun(vertex: Vertex, pass: EvaluationPass): NodeProcessingResult {
    if (vertex instanceof FormulaVertex) {
      const address = vertex.getAddress(this.lazilyTransformingAstService)
      const previousValue = vertex.valueOrUndef()
      const newCellValue = this.recomputeFormulaVertexValue(vertex, address, pass)
      if (newCellValue === undefined) {
        return NodeProcessingResult.DEFERRED
      }
      if (previousValue === undefined) {
        this.columnSearch.add(getRawValue(newCellValue), address)
      } else {
        // recomputed in a retry pass after a cycle
        this.columnSearch.change(getRawValue(previousValue), getRawValue(newCellValue), address)
      }
    } else if (vertex instanceof RangeVertex) {
      vertex.clearCache()
    }
    return NodeProcessingResult.CHANGED
  }

  /**
   * Sets the cycle error on a vertex that is part of a cycle, during the initial evaluation of the whole graph.
   */
  private setCycleErrorOnInitialRun(vertex: Vertex): void {
    if (vertex instanceof FormulaVertex) {
      vertex.setCellValue(new CellError(ErrorType.CYCLE, undefined, vertex))
    }
  }

  /**
   * Recalculates the value of a single vertex assuming its dependencies have already been recalculated
   */
  private recomputeVertex(vertex: Vertex, changes: ContentChanges, pass: EvaluationPass): NodeProcessingResult {
    if (vertex instanceof FormulaVertex) {
      const address = vertex.getAddress(this.lazilyTransformingAstService)
      const currentValue = vertex.isComputed() ? vertex.getCellValue() : undefined
      const newCellValue = this.recomputeFormulaVertexValue(vertex, address, pass)
      if (newCellValue === undefined) {
        return NodeProcessingResult.DEFERRED
      }
      if (newCellValue !== currentValue) {
        changes.addChange(newCellValue, address)
        this.columnSearch.change(getRawValue(currentValue), getRawValue(newCellValue), address)
        return NodeProcessingResult.CHANGED
      }
      return NodeProcessingResult.UNCHANGED
    } else if (vertex instanceof RangeVertex) {
      vertex.clearCache()
      return NodeProcessingResult.CHANGED
    } else {
      return NodeProcessingResult.CHANGED
    }
  }

  /**
   * Processes a vertex that is part of a cycle in dependency graph
   */
  private processVertexOnCycle(vertex: Vertex, changes: ContentChanges): void {
    if (vertex instanceof RangeVertex) {
      vertex.clearCache()
    } else if (vertex instanceof FormulaVertex) {
      const address = vertex.getAddress(this.lazilyTransformingAstService)
      this.columnSearch.remove(getRawValue(vertex.valueOrUndef()), address)
      const error = new CellError(ErrorType.CYCLE, undefined, vertex)
      vertex.setCellValue(error)
      changes.addChange(error, address)
    }
  }

  /**
   * Evaluates a formula vertex and stores its value and runtime dependencies.
   *
   * @returns the new value, or undefined if the evaluation requested a cell that is not current yet, so the formula is
   * retried once that cell is computed
   */
  private recomputeFormulaVertexValue(vertex: FormulaVertex, address: SimpleCellAddress, evaluationPass: EvaluationPass): Maybe<InterpreterValue> {
    if (vertex instanceof ArrayFormulaVertex && (vertex.array.size.isRef || !this.dependencyGraph.isThereSpaceForArray(vertex))) {
      this.dependencyGraph.clearRuntimeDependencies(vertex)
      return vertex.setNoSpace()
    }

    const formula = vertex.getFormula(this.lazilyTransformingAstService)
    let newCellValue: InterpreterValue
    evaluationPass.begin(vertex)
    this.interpreter.evaluationPass = evaluationPass
    try {
      newCellValue = this.evaluateAstToCellValue(formula, new InterpreterState(address, this.config.useArrayArithmetic, vertex))
    } catch (e) {
      this.dependencyGraph.keepRuntimeDependencies(vertex, evaluationPass.end())
      if (e === EVALUATION_DEFERRED) {
        return undefined
      }
      throw e
    } finally {
      this.interpreter.evaluationPass = undefined
    }

    if (evaluationPass.pullRequested) {
      // a function caught EVALUATION_DEFERRED, e.g., a custom function with a try/catch: the cell it requested is not
      // current yet, so neither is the value it returned
      this.dependencyGraph.keepRuntimeDependencies(vertex, evaluationPass.end())
      return undefined
    }

    this.dependencyGraph.commitRuntimeDependencies(vertex, evaluationPass.end())
    return vertex.setCellValue(newCellValue)
  }

  private evaluateAstToCellValue(ast: Ast, state: InterpreterState): InterpreterValue {
    let interpreterValue = this.interpreter.evaluateAst(ast, state)
    if (interpreterValue instanceof SimpleRangeValue) {
      // Formulas that read this cell later read the range's cells, so they become dependencies of this formula now
      interpreterValue.runBeforeRead()
      if (interpreterValue.width() !== 1 || interpreterValue.height() !== 1) {
        return interpreterValue
      }
      // a range of one cell from INDIRECT reaches here unreduced (see Interpreter.postprocess); as the whole formula,
      // it is its cell's value, like a literal range of one cell
      interpreterValue = interpreterValue.data[0][0]
    }
    if (interpreterValue === EmptyValue && this.config.evaluateNullToZero) {
      return 0
    }
    return interpreterValue
  }
}
