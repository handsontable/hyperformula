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
import {EvaluationCacheEntry, Interpreter} from './interpreter/Interpreter'
import {PendingValueRead} from './interpreter/PendingValueRead'
import {InterpreterState} from './interpreter/InterpreterState'
import {EmptyValue, getRawValue, InterpreterValue} from './interpreter/InterpreterValue'
import {SimpleRangeValue} from './SimpleRangeValue'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {Ast, RelativeDependency} from './parser'
import {Statistics, StatType} from './statistics'

/** Coordinates ordinary traversal with runtime reads during one recalculation. */
interface CalculationContext {
  initial: boolean,
  seeds: Vertex[],
  pending?: Set<Vertex>,
  cycled: Set<Vertex>,
  completed: Map<Vertex, boolean>,
  evaluating: Set<Vertex>,
  processing: Set<Vertex>,
  processingPath: Vertex[],
  runtimeCycleMembers: Set<Vertex>,
  expressionResults: Map<FormulaVertex, EvaluationCacheEntry>,
  staticDependencies?: Map<Vertex, Vertex[]>,
  runtimeReads: Map<FormulaVertex, Map<string, SimpleCellAddress>>,
  changes: ContentChanges,
}

export class Evaluator {
  private activeCalculation?: CalculationContext

  constructor(
    private readonly config: Config,
    private readonly stats: Statistics,
    public readonly interpreter: Interpreter,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
  ) {
    this.dependencyGraph.setCurrentValueReader((address, owner) => this.readCurrentValue(address, owner))
  }

  public run(): void {
    this.stats.start(StatType.TOP_SORT)
    const {sorted, cycled} = this.dependencyGraph.topSortWithScc()
    this.stats.end(StatType.TOP_SORT)

    if (this.canUseOrdinaryPath()) {
      this.stats.measure(StatType.EVALUATION, () => this.recomputeFormulas(cycled, sorted))
      return
    }

    const calculation = this.newCalculation(true, this.dependencyGraph.graph.getNodes())
    calculation.cycled = new Set(cycled)
    this.activeCalculation = calculation
    try {
      this.stats.measure(StatType.EVALUATION, () => {
        this.recomputeFormulas(cycled, sorted)
      })
    } finally {
      try {
        this.discardAllExpressionResults(calculation)
      } finally {
        this.activeCalculation = undefined
      }
    }
  }

  public partialRun(vertices: Vertex[]): ContentChanges {
    const changes = ContentChanges.empty()
    if (this.canUseOrdinaryPath()) {
      this.stats.measure(StatType.EVALUATION, () => {
        this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(vertices,
          (vertex: Vertex) => this.recomputeVertex(vertex, changes),
          (vertex: Vertex) => this.processVertexOnCycle(vertex, changes),
        )
      })
      return changes
    }
    const calculation = this.newCalculation(false, vertices, changes)
    this.activeCalculation = calculation

    try {
      this.stats.measure(StatType.EVALUATION, () => {
        this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(vertices,
          (vertex: Vertex) => this.calculateScheduledVertex(vertex, calculation),
          (vertex: Vertex) => this.calculateCycleVertex(vertex, calculation),
          cycled => {
            calculation.cycled = new Set(cycled)
          },
        )
      })
    } finally {
      try {
        this.discardAllExpressionResults(calculation)
      } finally {
        this.activeCalculation = undefined
      }
    }
    return changes
  }

  /** Uses direct traversal only when no volatile or array formula can request a runtime read. */
  private canUseOrdinaryPath(): boolean {
    return !this.dependencyGraph.graph.hasVolatileNodes() && this.dependencyGraph.arrayMapping.count() === 0
  }

  /** Creates state that is discarded after one build or edit calculation. */
  private newCalculation(initial: boolean, seeds: Vertex[], changes = ContentChanges.empty()): CalculationContext {
    return {
      initial, seeds, cycled: new Set(), completed: new Map(), evaluating: new Set(), processing: new Set(),
      processingPath: [], runtimeCycleMembers: new Set(),
      expressionResults: new Map(),
      runtimeReads: new Map(), changes,
    }
  }

  /**
   * A runtime reference reads a value only when a consumer needs it. Pending targets
   * and their ordinary prerequisites are completed before the caller resumes.
   */
  private readCurrentValue(address: SimpleCellAddress, owner?: FormulaVertex): InterpreterValue {
    const calculation = this.activeCalculation
    if (calculation === undefined || owner === undefined) {
      return this.dependencyGraph.getCellValue(address)
    }

    const reads = calculation.runtimeReads.get(owner)
    reads?.set(`${address.sheet}:${address.col}:${address.row}`, address)
    const target = this.dependencyGraph.getCell(address)
    if (target !== undefined) {
      if (calculation.processing.has(target) || calculation.evaluating.has(target)) {
        this.markRuntimeCycle(target, calculation)
        return new CellError(ErrorType.CYCLE, undefined, target instanceof FormulaVertex ? target : owner)
      }
      if (this.needsCalculation(target, calculation)) {
        throw new PendingValueRead(target)
      }
    }
    return this.dependencyGraph.getCellValue(address)
  }

  /** A back-edge marks only the vertices between its target and the current caller. */
  private markRuntimeCycle(target: Vertex, calculation: CalculationContext): void {
    const start = calculation.processingPath.indexOf(target)
    if (start < 0) {
      calculation.runtimeCycleMembers.add(target)
    } else {
      for (let i = start; i < calculation.processingPath.length; i++) {
        calculation.runtimeCycleMembers.add(calculation.processingPath[i])
      }
    }
  }

  /** Captures work reachable from this edit before normal traversal prunes unchanged results. */
  private pendingVertices(calculation: CalculationContext): Set<Vertex> {
    if (calculation.pending !== undefined) {
      return calculation.pending
    }
    const pending = new Set(calculation.seeds)
    const queue = [...calculation.seeds]
    for (let i = 0; i < queue.length; i++) {
      for (const dependent of this.dependencyGraph.graph.adjacentNodes(queue[i])) {
        if (!pending.has(dependent)) {
          pending.add(dependent)
          queue.push(dependent)
        }
      }
    }
    calculation.pending = pending
    return pending
  }

  /** A stored value is current only after this calculation has completed its pending work. */
  private needsCalculation(vertex: Vertex, calculation: CalculationContext): boolean {
    return !calculation.completed.has(vertex) &&
      (this.pendingVertices(calculation).has(vertex) || vertex instanceof FormulaVertex && !vertex.isComputed())
  }

  /** Keeps ordinary evaluation on its existing path until a runtime read suspends it. */
  private calculateScheduledVertex(vertex: Vertex, calculation: CalculationContext): boolean {
    try {
      if (vertex instanceof FormulaVertex && !this.dependencyGraph.graph.isNodeVolatile(vertex)) {
        return this.calculatePlainFormulaVertex(vertex, calculation)
      }
      return this.calculateVertex(vertex, calculation)
    } catch (error) {
      if (error instanceof PendingValueRead) {
        return this.ensureCurrent(vertex, calculation, false)
      }
      throw error
    }
  }

  /** Calculates an ordinary formula without allocating runtime-read state. */
  private calculatePlainFormulaVertex(vertex: FormulaVertex, calculation: CalculationContext): boolean {
    const completed = calculation.completed.get(vertex)
    if (completed !== undefined) {
      return completed
    }
    let changed: boolean
    if (calculation.initial) {
      const value = this.recomputeFormulaVertexValue(vertex)
      this.columnSearch.add(getRawValue(value), vertex.getAddress(this.lazilyTransformingAstService))
      changed = true
    } else {
      changed = this.recomputeVertex(vertex, calculation.changes)
    }
    this.dependencyGraph.replaceRuntimeDependencies(vertex, [])
    calculation.completed.set(vertex, changed)
    return changed
  }

  /**
   * Walks static prerequisites iteratively so a deep ordinary chain does not add
   * another JavaScript frame for each node reached by a runtime reference.
   */
  private ensureCurrent(target: Vertex, calculation: CalculationContext, walkDependencies = true): boolean {
    const stack: {vertex: Vertex, dependencies?: Vertex[], next: number}[] = [
      {vertex: target, dependencies: walkDependencies ? undefined : [], next: 0}
    ]
    calculation.processing.add(target)
    calculation.processingPath.push(target)
    while (stack.length > 0) {
      const frame = stack[stack.length - 1]
      const vertex = frame.vertex
      if (!this.needsCalculation(vertex, calculation)) {
        stack.pop()
        calculation.processing.delete(vertex)
        calculation.processingPath.pop()
        continue
      }
      if (calculation.cycled.has(vertex) && !(vertex instanceof RangeVertex)) {
        this.calculateCycleVertex(vertex, calculation)
        stack.pop()
        calculation.processing.delete(vertex)
        calculation.processingPath.pop()
        continue
      }
      if (frame.dependencies === undefined) {
        calculation.staticDependencies ??= this.dependencyGraph.graph.dependencyNodes()
        frame.dependencies = calculation.staticDependencies.get(vertex) ?? []
      }
      if (frame.next < frame.dependencies.length) {
        const prerequisite = frame.dependencies[frame.next++]
        if (calculation.processing.has(prerequisite)) {
          this.markRuntimeCycle(prerequisite, calculation)
          // Finish cyclic formulas, but keep walking ranges for prerequisites outside the cycle.
          for (let i = calculation.processingPath.length - 1; i >= 0; i--) {
            const member = calculation.processingPath[i]
            this.calculateCycleVertex(member, calculation)
            if (member === prerequisite) {
              break
            }
          }
        } else if (this.needsCalculation(prerequisite, calculation)) {
          stack.push({vertex: prerequisite, next: 0})
          calculation.processing.add(prerequisite)
          calculation.processingPath.push(prerequisite)
        }
      } else {
        try {
          this.calculateVertex(vertex, calculation)
          stack.pop()
          calculation.processing.delete(vertex)
          calculation.processingPath.pop()
        } catch (error) {
          if (error instanceof PendingValueRead) {
            stack.push({vertex: error.target, next: 0})
            calculation.processing.add(error.target)
            calculation.processingPath.push(error.target)
          } else {
            throw error
          }
        }
      }
    }
    return calculation.completed.get(target) ?? false
  }

  /** Evaluates once, or keeps its expression results if it must wait for a target. */
  private calculateVertex(vertex: Vertex, calculation: CalculationContext): boolean {
    const completed = calculation.completed.get(vertex)
    if (completed !== undefined) {
      return completed
    }
    if (vertex instanceof FormulaVertex && this.dependencyGraph.graph.isNodeVolatile(vertex) && !calculation.evaluating.has(vertex)) {
      calculation.evaluating.add(vertex)
      calculation.runtimeReads.set(vertex, new Map())
      if (this.interpreter.containsIndirect(vertex.getFormula(this.lazilyTransformingAstService))) {
        calculation.expressionResults.set(vertex, {children: [], nextChild: 0})
      }
    }
    let changed: boolean
    try {
      if (calculation.initial) {
        if (vertex instanceof FormulaVertex) {
          const value = this.recomputeFormulaVertexValue(vertex)
          this.columnSearch.add(getRawValue(value), vertex.getAddress(this.lazilyTransformingAstService))
        } else if (vertex instanceof RangeVertex) {
          vertex.clearCache()
        }
        changed = true
      } else {
        changed = this.recomputeVertex(vertex, calculation.changes)
      }
    } catch (error) {
      if (error instanceof PendingValueRead) {
        throw error
      }
      if (vertex instanceof FormulaVertex) {
        calculation.evaluating.delete(vertex)
        calculation.runtimeReads.delete(vertex)
        this.discardExpressionResults(vertex, calculation)
      }
      throw error
    }
    if (vertex instanceof FormulaVertex) {
      calculation.evaluating.delete(vertex)
      const reads = calculation.runtimeReads.get(vertex)
      this.dependencyGraph.replaceRuntimeDependencies(vertex, [...(reads?.values() ?? [])])
      calculation.runtimeReads.delete(vertex)
      this.discardExpressionResults(vertex, calculation)
    }
    calculation.completed.set(vertex, changed)
    return changed
  }

  /** Completes cyclic formulas; ranges remain pending until all their prerequisites are current. */
  private calculateCycleVertex(vertex: Vertex, calculation: CalculationContext): void {
    if (calculation.completed.has(vertex)) {
      return
    }
    if (vertex instanceof RangeVertex) {
      vertex.clearCache()
      return
    }
    this.discardExpressionResults(vertex, calculation)
    calculation.evaluating.delete(vertex)
    if (vertex instanceof FormulaVertex) {
      calculation.runtimeReads.delete(vertex)
    }
    if (calculation.initial) {
      if (vertex instanceof FormulaVertex) {
        vertex.setCellValue(new CellError(ErrorType.CYCLE, undefined, vertex))
      }
    } else {
      this.processVertexOnCycle(vertex, calculation.changes)
    }
    calculation.completed.set(vertex, true)
  }

  /** Closes suspended plugin methods when a formula is abandoned or completed. */
  private discardExpressionResults(vertex: Vertex, calculation: CalculationContext): void {
    if (!(vertex instanceof FormulaVertex)) {
      return
    }
    const expressions = calculation.expressionResults.get(vertex)
    calculation.expressionResults.delete(vertex)
    const pending = expressions === undefined ? [] : [{entry: expressions, visited: false}]
    let firstError: unknown
    while (pending.length > 0) {
      const {entry, visited} = pending.pop()!
      if (!visited) {
        pending.push({entry, visited: true})
        for (const child of entry.children) {
          pending.push({entry: child, visited: false})
        }
        continue
      }
      const execution = entry.execution
      if (execution !== undefined) {
        entry.execution = undefined
        try {
          execution.return(EmptyValue)
        } catch (error) {
          firstError ??= error
        }
      }
    }
    if (firstError !== undefined) {
      throw firstError
    }
  }

  /** Closes every formula owner's suspended methods even if one cleanup fails. */
  private discardAllExpressionResults(calculation: CalculationContext): void {
    let firstError: unknown
    for (const vertex of [...calculation.expressionResults.keys()].reverse()) {
      try {
        this.discardExpressionResults(vertex, calculation)
      } catch (error) {
        firstError ??= error
      }
    }
    if (firstError !== undefined) {
      throw firstError
    }
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
   * Recalculates the value of a single vertex assuming its dependencies have already been recalculated
   */
  private recomputeVertex(vertex: Vertex, changes: ContentChanges): boolean {
    if (vertex instanceof FormulaVertex) {
      const currentValue = vertex.isComputed() ? vertex.getCellValue() : undefined
      const newCellValue = this.recomputeFormulaVertexValue(vertex)
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
    } else {
      return true
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
   * Recalculates formulas in the topological sort order
   */
  private recomputeFormulas(cycled: Vertex[], sorted: Vertex[]): void {
    const calculation = this.activeCalculation
    if (calculation === undefined) {
      cycled.forEach((vertex: Vertex) => {
        if (vertex instanceof FormulaVertex) {
          vertex.setCellValue(new CellError(ErrorType.CYCLE, undefined, vertex))
        }
      })
      sorted.forEach((vertex: Vertex) => {
        if (vertex instanceof FormulaVertex) {
          const value = this.recomputeFormulaVertexValue(vertex)
          this.columnSearch.add(getRawValue(value), vertex.getAddress(this.lazilyTransformingAstService))
        } else if (vertex instanceof RangeVertex) {
          vertex.clearCache()
        }
      })
    } else {
      cycled.forEach((vertex: Vertex) => this.calculateCycleVertex(vertex, calculation))
      sorted.forEach((vertex: Vertex) => this.calculateScheduledVertex(vertex, calculation))
    }
  }

  private recomputeFormulaVertexValue(vertex: FormulaVertex): InterpreterValue {
    const address = vertex.getAddress(this.lazilyTransformingAstService)
    if (vertex instanceof ArrayFormulaVertex && (vertex.array.size.isRef || !this.dependencyGraph.isThereSpaceForArray(vertex))) {
      return vertex.setNoSpace()
    } else {
      const formula = vertex.getFormula(this.lazilyTransformingAstService)
      let newCellValue = this.evaluateAstToCellValue(formula, new InterpreterState(address, this.config.useArrayArithmetic, vertex))
      if (this.activeCalculation?.runtimeCycleMembers.has(vertex)) {
        newCellValue = new CellError(ErrorType.CYCLE, undefined, vertex)
      }
      return vertex.setCellValue(newCellValue)
    }
  }

  private evaluateAstToCellValue(ast: Ast, state: InterpreterState): InterpreterValue {
    this.interpreter.setEvaluationCache(state.formulaVertex === undefined ? undefined :
      this.activeCalculation?.expressionResults.get(state.formulaVertex))
    let interpreterValue: InterpreterValue
    try {
      // Retain reference identity until the final cell value is materialized.
      interpreterValue = this.interpreter.evaluateAst(ast, state, true)
      if (interpreterValue instanceof SimpleRangeValue && interpreterValue.width() === 1 && interpreterValue.height() === 1) {
        const range = interpreterValue
        interpreterValue = range.data[0][0]
        if (interpreterValue === EmptyValue && range.hasValueReader()) {
          interpreterValue = 0
        } else if (interpreterValue instanceof CellError && state.formulaVertex !== undefined) {
          interpreterValue = interpreterValue.attachRootVertex(state.formulaVertex)
        }
      }
    } finally {
      this.interpreter.setEvaluationCache(undefined)
    }
    if (interpreterValue instanceof SimpleRangeValue) {
      return interpreterValue
    } else if (interpreterValue === EmptyValue && this.config.evaluateNullToZero) {
      return 0
    } else {
      return interpreterValue
    }
  }
}
