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
import {Interpreter} from './interpreter/Interpreter'
import {InterpreterState} from './interpreter/InterpreterState'
import {EmptyValue, getRawValue, InterpreterValue} from './interpreter/InterpreterValue'
import {SimpleRangeValue} from './SimpleRangeValue'
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

  public run(): void {
    this.stats.start(StatType.TOP_SORT)
    const {sorted, cycled} = this.dependencyGraph.topSortWithScc()
    this.stats.end(StatType.TOP_SORT)

    this.stats.measure(StatType.EVALUATION, () => {
      this.recomputeFormulas(cycled, sorted)
    })
  }

  public partialRun(vertices: Vertex[]): ContentChanges {
    const changes = ContentChanges.empty()
    const cycled: Vertex[] = []
    const postCycleVertices: Vertex[] = []
    const cycledSet = new Set<Vertex>()
    const dependsOnCycleCache = new Set<Vertex>()

    this.stats.measure(StatType.EVALUATION, () => {
      this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(vertices,
        (vertex: Vertex) => {
          // Check if this vertex depends on any cycled vertex (directly or transitively)
          if (cycledSet.size > 0 && this.dependsOnCycle(vertex, cycledSet, dependsOnCycleCache)) { // TODO: performance!
            // Defer computation until after cycles are processed
            postCycleVertices.push(vertex)
            return true // Signal that changes may occur
          }
          return this.recomputeVertex(vertex, changes)
        },
        (vertex: Vertex) => {
          if (vertex instanceof RangeVertex) {
            vertex.clearCache()
            // RangeVertices in an SCC are part of the cycle dependency chain
            cycledSet.add(vertex)
          } else if (vertex instanceof FormulaVertex) {
            cycled.push(vertex)
            cycledSet.add(vertex)
          }
        },
      )
    })

    // Process circular dependencies
    const cycledChanges = this.iterateCircularDependencies(cycled)
    changes.addAll(cycledChanges)

    // Process vertices that depend on cycles
    postCycleVertices.forEach((vertex: Vertex) => {
      this.recomputeVertex(vertex, changes)
    })

    return changes
  }

  /**
   * Checks if a vertex depends (directly or transitively) on any vertex in the cycled set.
   * Uses caching to avoid recomputation for vertices already known to depend on cycles.
   *
   * @param vertex - The vertex to check
   * @param cycledSet - Set of vertices known to be part of a cycle
   * @param dependsOnCycleCache - Cache of vertices known to depend on cycles
   * @returns True if the vertex depends on any cycled vertex
   */
  private dependsOnCycle(vertex: Vertex, cycledSet: Set<Vertex>, dependsOnCycleCache: Set<Vertex>): boolean {
    // Already known to depend on cycle
    if (dependsOnCycleCache.has(vertex)) {
      return true
    }

    // Check if any cycled vertex has a path to this vertex
    // A vertex depends on a cycle if:
    // 1. A cycled vertex directly points to this vertex, OR
    // 2. A cycled vertex points to an intermediate vertex that points to this vertex
    for (const cycledVertex of cycledSet) {
      if (this.dependencyGraph.graph.adjacentNodes(cycledVertex).has(vertex)) {
        dependsOnCycleCache.add(vertex)
        return true
      }
    }

    // Check if any known cycle-dependent vertex points to this vertex
    for (const depVertex of dependsOnCycleCache) {
      if (this.dependencyGraph.graph.adjacentNodes(depVertex).has(vertex)) {
        dependsOnCycleCache.add(vertex)
        return true
      }
    }

    return false
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
   * Recalculates the value of a single vertex, assuming its dependencies have already been recalculated.
   *
   * @param vertex - The vertex to recompute
   * @param changes - Content changes tracker to record value changes
   * @returns True if the value changed, false otherwise
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
   * Recalculates formulas in the topological sort order
   * First computes non-cyclic dependencies, then iterates cycles, then computes dependents
   */
  private recomputeFormulas(cycled: Vertex[], sorted: Vertex[]): void {
    const cyclicSet = new Set(cycled)

    // Build set of vertices that depend on cycles (directly or transitively)
    const dependsOnCycleSet = new Set<Vertex>()

    // Start with direct dependents of cycled vertices
    const queue: Vertex[] = []
    cycled.forEach(cycledVertex => {
      this.dependencyGraph.graph.adjacentNodes(cycledVertex).forEach(dependent => {
        if (!cyclicSet.has(dependent) && !dependsOnCycleSet.has(dependent)) {
          dependsOnCycleSet.add(dependent)
          queue.push(dependent)
        }
      })
    })

    // Propagate transitively: if X depends on cycle, and Y depends on X, then Y depends on cycle
    while (queue.length > 0) {
      const vertex = queue.shift()!
      this.dependencyGraph.graph.adjacentNodes(vertex).forEach(dependent => {
        if (!cyclicSet.has(dependent) && !dependsOnCycleSet.has(dependent)) {
          dependsOnCycleSet.add(dependent)
          queue.push(dependent)
        }
      })
    }

    // Split sorted into: vertices that don't depend on cycles vs those that do
    const preCycleVertices: Vertex[] = []
    const postCycleVertices: Vertex[] = []

    sorted.forEach(vertex => {
      if (dependsOnCycleSet.has(vertex)) {
        postCycleVertices.push(vertex)
      } else {
        preCycleVertices.push(vertex)
      }
    })

    // First: compute non-cyclic vertices that cycles may depend on
    preCycleVertices.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex) {
        const newCellValue = this.recomputeFormulaVertexValue(vertex)
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        this.columnSearch.add(getRawValue(newCellValue), address)
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    })

    // Then iterate the circular dependencies
    this.iterateCircularDependencies(cycled)

    // Finally: compute vertices that depend on cycle results
    postCycleVertices.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex) {
        const newCellValue = this.recomputeFormulaVertexValue(vertex)
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        this.columnSearch.add(getRawValue(newCellValue), address)
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    })
  }

  /**
   * Blocks circular dependencies by setting #CYCLE! error on all cycled formula vertices.
   * Used when iterative calculation is disabled.
   *
   * @param cycled - Array of vertices involved in circular dependencies
   * @returns Content changes from setting errors on cycled cells
   */
  private blockCircularDependencies(cycled: Vertex[]): ContentChanges {
    const changes = ContentChanges.empty()

    cycled.forEach((vertex: Vertex) => {
      if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      } else if (vertex instanceof FormulaVertex) {
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        this.columnSearch.remove(getRawValue(vertex.valueOrUndef()), address)
        const error = new CellError(ErrorType.CYCLE, undefined, vertex)
        vertex.setCellValue(error)
        changes.addChange(error, address)
      }
    })

    return changes
  }

  /**
   * Iterates over all circular dependencies (cycled vertices) until convergence or max iterations.
   * Uses Gauss-Seidel style iteration where each cell immediately sees updated values from
   * earlier cells in the same iteration.
   *
   * Iteration stops when:
   * - All cell value changes are strictly less than the convergence threshold, OR
   * - Maximum iterations are reached
   *
   * @param cycled - Array of vertices involved in circular dependencies
   * @returns Content changes from the iterative calculation
   */
  private iterateCircularDependencies(cycled: Vertex[]): ContentChanges {
    if (!this.config.iterativeCalculationEnable) {
      return this.blockCircularDependencies(cycled)
    }

    const changes = ContentChanges.empty()
    const maxIterations = this.config.iterativeCalculationMaxIterations
    const threshold = this.config.iterativeCalculationConvergenceThreshold
    const initialValue = this.config.iterativeCalculationInitialValue

    // Extract and sort formula vertices by address for consistent evaluation order
    const formulaVertices = cycled
      .filter((vertex): vertex is FormulaVertex => vertex instanceof FormulaVertex)
      .sort((a, b) => {
        const addrA = a.getAddress(this.lazilyTransformingAstService)
        const addrB = b.getAddress(this.lazilyTransformingAstService)
        if (addrA.sheet !== addrB.sheet) return addrA.sheet - addrB.sheet
        if (addrA.row !== addrB.row) return addrA.row - addrB.row
        return addrA.col - addrB.col
      })

    // Always initialize cycle vertices to initialValue (restart on recalculation)
    formulaVertices.forEach(vertex => {
      vertex.setCellValue(initialValue)
    })

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      this.clearCachesForCyclicRanges(cycled)

      // Store previous values for convergence check
      const previousValues = new Map<FormulaVertex, InterpreterValue>()
      formulaVertices.forEach(vertex => {
        previousValues.set(vertex, vertex.getCellValue())
      })

      // Recompute all formula vertices in order (Gauss-Seidel style)
      formulaVertices.forEach(vertex => {
        this.recomputeFormulaVertexValue(vertex)
      })

      // Check for convergence: all changes must be strictly less than threshold
      const converged = formulaVertices.every(vertex => {
        const oldValue = previousValues.get(vertex)
        const newValue = vertex.getCellValue()
        return this.isConverged(oldValue, newValue, threshold)
      })

      if (converged) {
        break
      }
    }

    // Record final values in changes and column search
    formulaVertices.forEach(vertex => {
      const address = vertex.getAddress(this.lazilyTransformingAstService)
      const finalValue = vertex.getCellValue()
      this.columnSearch.add(getRawValue(finalValue), address)
      changes.addChange(finalValue, address)
    })

    const dependentChanges = this.updateNonCyclicDependents(cycled)
    changes.addAll(dependentChanges)

    return changes
  }

  /**
   * Checks if the change between old and new values is below the convergence threshold.
   * For numeric values, uses absolute difference; for non-numeric, checks strict equality.
   *
   * @param oldValue - The previous value (undefined if not yet computed)
   * @param newValue - The new computed value
   * @param threshold - The convergence threshold (change must be strictly less than)
   * @returns True if converged (change < threshold for numbers, or values are equal)
   */
  private isConverged(oldValue: InterpreterValue | undefined, newValue: InterpreterValue, threshold: number): boolean {
    if (oldValue === undefined) {
      return false
    }

    // For numeric values, compare absolute difference
    if (typeof oldValue === 'number' && typeof newValue === 'number') {
      return Math.abs(newValue - oldValue) < threshold
    }

    // For non-numeric values (strings, booleans, errors), check strict equality
    return oldValue === newValue
  }

  /**
   * Updates all non-cyclic cells that depend on the given cycled vertices.
   * Uses topological sorting to ensure correct dependency order.
   *
   * @param cycled - Array of vertices involved in circular dependencies
   * @returns Content changes from updating dependent cells
   */
  private updateNonCyclicDependents(cycled: Vertex[]): ContentChanges {
    const changes = ContentChanges.empty()
    const cyclicSet = new Set(cycled)

    const dependents = new Set<Vertex>()
    cycled.forEach(vertex => {
      this.dependencyGraph.graph.adjacentNodes(vertex).forEach(dependent => {
        if (!cyclicSet.has(dependent) && dependent instanceof FormulaVertex) {
          dependents.add(dependent)
        }
      })
    })

    if (dependents.size === 0) {
      return changes
    }

    const {sorted} = this.dependencyGraph.topSortWithScc()
    const orderedDependents = sorted.filter(vertex => dependents.has(vertex))

    orderedDependents.forEach(vertex => {
      if (vertex instanceof FormulaVertex) {
        const newCellValue = this.recomputeFormulaVertexValue(vertex)
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        this.columnSearch.add(getRawValue(newCellValue), address)
        changes.addChange(newCellValue, address)
      }
    })

    return changes
  }

  /**
   * Clears function caches for ranges that contain any of the given cyclic vertices.
   * This ensures fresh computation during circular dependency iteration.
   *
   * @param cycled - Array of vertices involved in circular dependencies
   */
  private clearCachesForCyclicRanges(cycled: Vertex[]): void {
    const cyclicAddresses = new Set<string>()
    const sheetsWithCycles = new Set<number>()

    // Collect cyclic addresses and sheets in a single pass
    cycled.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex) {
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        cyclicAddresses.add(`${address.sheet}:${address.col}:${address.row}`)
        sheetsWithCycles.add(address.sheet)
      }
    })

    sheetsWithCycles.forEach(sheet => {
      for (const rangeVertex of this.dependencyGraph.rangeMapping.rangesInSheet(sheet)) {
        const range = rangeVertex.range
        let containsCyclicCell = false

        for (const address of range.addresses(this.dependencyGraph)) {
          const addressKey = `${address.sheet}:${address.col}:${address.row}`
          if (cyclicAddresses.has(addressKey)) {
            containsCyclicCell = true
            break
          }
        }

        if (containsCyclicCell) {
          rangeVertex.clearCache()
        }
      }
    })
  }

  private recomputeFormulaVertexValue(vertex: FormulaVertex): InterpreterValue {
    const address = vertex.getAddress(this.lazilyTransformingAstService)
    if (vertex instanceof ArrayFormulaVertex && (vertex.array.size.isRef || !this.dependencyGraph.isThereSpaceForArray(vertex))) {
      return vertex.setNoSpace()
    } else {
      const formula = vertex.getFormula(this.lazilyTransformingAstService)
      const newCellValue = this.evaluateAstToCellValue(formula, new InterpreterState(address, this.config.useArrayArithmetic, vertex))
      return vertex.setCellValue(newCellValue)
    }
  }

  private evaluateAstToCellValue(ast: Ast, state: InterpreterState): InterpreterValue {
    const interpreterValue = this.interpreter.evaluateAst(ast, state)
    if (interpreterValue instanceof SimpleRangeValue) {
      return interpreterValue
    } else if (interpreterValue === EmptyValue && this.config.evaluateNullToZero) {
      return 0
    } else {
      return interpreterValue
    }
  }
}
