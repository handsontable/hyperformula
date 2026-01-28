/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * # Evaluator - Formula Evaluation Engine
 *
 * Responsible for computing cell values based on their formulas and dependencies.
 *
 * ## Evaluation Workflow
 *
 * 1. **Topological Sort with SCC Detection**
 *    - Sorts vertices (cells/ranges) by dependency order
 *    - Identifies Strongly Connected Components (SCCs) as cycles
 *
 * 2. **Pre-cycle Evaluation**
 *    - Computes all vertices that don't depend on cycles
 *    - These provide stable inputs for cycle resolution
 *
 * 3. **Cycle Resolution** (if cycles exist)
 *    - If iterative calculation disabled: sets #CYCLE! error on all cycle members
 *    - If enabled: uses Gauss-Seidel iteration until convergence or max iterations
 *
 * 4. **Post-cycle Evaluation**
 *    - Recomputes vertices that depend on cycle results
 *    - Uses subgraph traversal for efficiency
 *
 * ## Iterative Calculation Algorithm
 *
 * When circular references exist and `iterativeCalculationEnable` is true:
 *
 * 1. Initialize all cycle cells to `iterativeCalculationInitialValue`
 * 2. Repeat up to `iterativeCalculationMaxIterations` times:
 *    a. Clear caches for ranges containing cycle cells
 *    b. Store current values
 *    c. Recompute all cycle cells in address order (Gauss-Seidel style)
 *    d. Check convergence: |new - old| < `iterativeCalculationConvergenceThreshold`
 * 3. If all cells converge, stop early; otherwise continue to max iterations
 *
 * ## Entry Points
 *
 * - `run()`: Full evaluation from scratch (initial load or major changes)
 * - `partialRun()`: Incremental evaluation starting from changed vertices
 * - `runAndForget()`: One-off formula evaluation without side effects
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

/**
 * Evaluates formulas in the dependency graph, handling both acyclic and cyclic dependencies.
 *
 * Uses topological sorting for acyclic portions and iterative calculation for cycles.
 * Maintains integration with column search index for VLOOKUP/MATCH optimization.
 */
export class Evaluator {
  /**
   * @param config - Configuration including iterative calculation settings
   * @param stats - Statistics collector for performance measurement
   * @param interpreter - AST interpreter for formula evaluation
   * @param lazilyTransformingAstService - Service for lazy AST transformations (address updates)
   * @param dependencyGraph - Graph of cell/range dependencies
   * @param columnSearch - Search index for efficient column lookups
   */
  constructor(
    private readonly config: Config,
    private readonly stats: Statistics,
    public readonly interpreter: Interpreter,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
  ) {
  }

  /**
   * Performs full evaluation of all formulas in the dependency graph.
   *
   * Used for initial spreadsheet load or when dependencies have changed significantly.
   * Performs topological sort to determine evaluation order and handles any cycles.
   *
   * Complexity: O(V + E) for topological sort + O(I × C) for cycles where
   * V=vertices, E=edges, I=iterations, C=cycle size
   */
  public run(): void {
    this.stats.start(StatType.TOP_SORT)
    const {sorted, cycled} = this.dependencyGraph.topSortWithScc()
    this.stats.end(StatType.TOP_SORT)

    this.stats.measure(StatType.EVALUATION, () => {
      this.recomputeFormulas(cycled, sorted)
    })
  }

  /**
   * Performs incremental evaluation starting from a set of changed vertices.
   *
   * More efficient than `run()` when only a subset of cells have changed.
   * Traverses only the subgraph reachable from the changed vertices.
   *
   * Algorithm:
   * 1. Traverse subgraph from starting vertices in topological order
   * 2. Collect any cycles encountered during traversal
   * 3. Mark vertices that depend on cycles for deferred processing
   * 4. Process cycles via iterative calculation
   * 5. Cycle dependents are handled inside iterateCircularDependencies
   *
   * @param vertices - Starting vertices (typically cells that were directly modified)
   * @returns Content changes describing all value updates
   */
  public partialRun(vertices: Vertex[]): ContentChanges {
    const changes = ContentChanges.empty()
    const cycled: Vertex[] = []

    // Tracks vertices depending on cycles (direct or transitive)
    // These are deferred to updateNonCyclicDependents after cycle resolution
    const cycleDependentVertices = new Set<Vertex>()

    this.stats.measure(StatType.EVALUATION, () => {
      this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(vertices,
        // onVertex callback: process each vertex in topological order
        (vertex: Vertex) => {
          if (cycleDependentVertices.has(vertex)) {
            // Propagate cycle dependency to all dependents
            this.dependencyGraph.graph.adjacentNodes(vertex).forEach(dependent => {
              cycleDependentVertices.add(dependent)
            })
            return true // Signal potential changes for dependent propagation
          }
          return this.recomputeVertex(vertex, changes)
        },
        // onCycle callback: handle vertices discovered as part of a cycle
        (vertex: Vertex) => {
          if (vertex instanceof RangeVertex) {
            vertex.clearCache()
          } else if (vertex instanceof FormulaVertex) {
            cycled.push(vertex)
          }
          // Mark all direct dependents as cycle-dependent
          this.dependencyGraph.graph.adjacentNodes(vertex).forEach(dependent => {
            cycleDependentVertices.add(dependent)
          })
        },
      )
    })

    // Resolve cycles and update their dependents
    const cycledChanges = this.iterateCircularDependencies(cycled)
    changes.addAll(cycledChanges)

    return changes
  }

  /**
   * Evaluates a formula without persisting the result or modifying the graph.
   *
   * Used for one-off calculations like conditional formatting or data validation.
   * Temporarily creates range vertices if needed, then cleans them up.
   *
   * @param ast - Parsed formula AST to evaluate
   * @param address - Cell address context for relative references
   * @param dependencies - Relative dependencies extracted from the formula
   * @returns Computed value (number, string, boolean, error, or array)
   */
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
   * Recomputes a single vertex and records any value changes.
   *
   * Handles different vertex types:
   * - FormulaVertex: evaluates formula, updates column search index if changed
   * - RangeVertex: clears cached aggregate values
   * - Other (ValueVertex): no computation needed, always signals change
   *
   * @param vertex - The vertex to recompute (dependencies must be current)
   * @param changes - Accumulator for tracking all value changes
   * @returns True if value changed (used by graph traversal to propagate to dependents)
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
   * Evaluates all formulas in dependency order, handling cycles appropriately.
   *
   * Algorithm:
   * 1. Build set of vertices that depend on cycles (BFS from cycle members)
   * 2. Evaluate all non-cycle-dependent vertices in topological order
   * 3. Delegate cycle resolution and dependent updates to iterateCircularDependencies
   *
   * This separation ensures cycle cells have stable inputs before iteration begins.
   *
   * @param cycled - Vertices identified as part of cycles (from topological sort)
   * @param sorted - All vertices in topological order (excludes cycle members)
   */
  private recomputeFormulas(cycled: Vertex[], sorted: Vertex[]): void {
    const cyclicSet = new Set(cycled)

    // BFS to find all vertices transitively depending on cycles
    const dependsOnCycleSet = new Set<Vertex>()
    const queue: Vertex[] = []

    // Seed with direct dependents of cycle members
    for (let i = 0; i < cycled.length; i++) {
      this.dependencyGraph.graph.adjacentNodes(cycled[i]).forEach(dependent => {
        if (!cyclicSet.has(dependent) && !dependsOnCycleSet.has(dependent)) {
          dependsOnCycleSet.add(dependent)
          queue.push(dependent)
        }
      })
    }

    // Propagate: if X depends on cycle, all dependents of X also depend on cycle
    let queueIndex = 0
    while (queueIndex < queue.length) {
      const vertex = queue[queueIndex++]
      this.dependencyGraph.graph.adjacentNodes(vertex).forEach(dependent => {
        if (!cyclicSet.has(dependent) && !dependsOnCycleSet.has(dependent)) {
          dependsOnCycleSet.add(dependent)
          queue.push(dependent)
        }
      })
    }

    // Evaluate vertices that don't depend on cycles
    // (cycle-dependent vertices handled by updateNonCyclicDependents)
    for (let i = 0; i < sorted.length; i++) {
      const vertex = sorted[i]
      if (dependsOnCycleSet.has(vertex)) {
        continue
      }
      if (vertex instanceof FormulaVertex) {
        const newCellValue = this.recomputeFormulaVertexValue(vertex)
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        this.columnSearch.add(getRawValue(newCellValue), address)
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    }

    // Resolve cycles and evaluate their dependents
    this.iterateCircularDependencies(cycled)
  }

  /**
   * Sets #CYCLE! error on all cycle members when iterative calculation is disabled.
   *
   * Also removes old values from column search index to maintain consistency.
   * RangeVertices in cycles have their caches cleared.
   *
   * @param cycled - Vertices identified as part of circular dependencies
   */
  private blockCircularDependencies(cycled: Vertex[]): void {
    for (let i = 0; i < cycled.length; i++) {
      const vertex = cycled[i]
      if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      } else if (vertex instanceof FormulaVertex) {
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        this.columnSearch.remove(getRawValue(vertex.valueOrUndef()), address)
        const error = new CellError(ErrorType.CYCLE, undefined, vertex)
        vertex.setCellValue(error)
      }
    }
  }

  /**
   * Resolves circular dependencies using iterative calculation (Gauss-Seidel method).
   *
   * When iterative calculation is disabled, sets #CYCLE! error on all cycle members.
   * When enabled, iterates until convergence or max iterations reached.
   *
   * ## Gauss-Seidel Iteration
   * Each cell immediately uses updated values from cells earlier in the evaluation order
   * (within the same iteration). This typically converges faster than Jacobi iteration.
   *
   * ## Convergence Criteria
   * - Numeric values: |new - old| < threshold
   * - Non-numeric values: strict equality
   * - All cells must satisfy the criteria to stop early
   *
   * ## Performance Optimizations
   * - Addresses cached to avoid repeated getAddress() calls
   * - Affected ranges pre-computed once before iteration loop
   * - Previous values stored in pre-allocated array
   *
   * @param cycled - Vertices forming circular dependencies
   * @returns Content changes for all cycle members and their dependents
   */
  private iterateCircularDependencies(cycled: Vertex[]): ContentChanges {
    const changes = ContentChanges.empty()

    // Early return for empty cycles
    if (cycled.length === 0) {
      return changes
    }

    if (!this.config.iterativeCalculationEnable) {
      this.blockCircularDependencies(cycled)
      // Still need to update dependents (they'll see #CYCLE! errors)
      const dependentChanges = this.updateNonCyclicDependents(cycled)
      changes.addAll(dependentChanges)
      return changes
    }
    const maxIterations = this.config.iterativeCalculationMaxIterations
    const threshold = this.config.iterativeCalculationConvergenceThreshold
    const initialValue = this.config.iterativeCalculationInitialValue

    // Extract formula vertices and cache their addresses to avoid repeated getAddress() calls
    const formulaVerticesWithAddresses: {vertex: FormulaVertex, address: SimpleCellAddress}[] = []
    for (let i = 0; i < cycled.length; i++) {
      const vertex = cycled[i]
      if (vertex instanceof FormulaVertex) {
        formulaVerticesWithAddresses.push({
          vertex,
          address: vertex.getAddress(this.lazilyTransformingAstService)
        })
      }
    }

    // Sort by address for consistent evaluation order
    formulaVerticesWithAddresses.sort((a, b) => {
      if (a.address.sheet !== b.address.sheet) return a.address.sheet - b.address.sheet
      if (a.address.row !== b.address.row) return a.address.row - b.address.row
      return a.address.col - b.address.col
    })

    // Extract vertices and addresses in single pass
    const count = formulaVerticesWithAddresses.length
    const formulaVertices: FormulaVertex[] = new Array(count)
    const cachedAddresses: SimpleCellAddress[] = new Array(count)
    for (let i = 0; i < count; i++) {
      formulaVertices[i] = formulaVerticesWithAddresses[i].vertex
      cachedAddresses[i] = formulaVerticesWithAddresses[i].address
    }

    // Pre-compute affected ranges ONCE before iteration loop (performance optimization)
    const affectedRanges = this.findAffectedRanges(cachedAddresses)

    // Always initialize cycle vertices to initialValue (restart on recalculation)
    // Config validation ensures initialValue is never undefined/null
    // Date objects are converted to their numeric representation (days since epoch)
    let safeInitialValue: InterpreterValue
    if (initialValue instanceof Date) {
      safeInitialValue = initialValue.getTime() / 86400000 + 25569 // Convert to Excel serial date
    } else {
      safeInitialValue = initialValue ?? 0
    }
    for (let i = 0; i < formulaVertices.length; i++) {
      formulaVertices[i].setCellValue(safeInitialValue)
    }

    // Pre-allocate array for previous values to avoid Map overhead
    const previousValues: InterpreterValue[] = new Array(formulaVertices.length)

    // Convert Set to Array for faster iteration in the loop
    const affectedRangesArray = Array.from(affectedRanges)

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Clear affected range caches - O(affectedRanges) instead of O(ranges * cells)
      for (let i = 0; i < affectedRangesArray.length; i++) {
        affectedRangesArray[i].clearCache()
      }

      // Store previous values for convergence check
      for (let i = 0; i < formulaVertices.length; i++) {
        previousValues[i] = formulaVertices[i].getCellValue()
      }

      // Recompute all formula vertices in order (Gauss-Seidel style)
      for (let i = 0; i < formulaVertices.length; i++) {
        this.recomputeFormulaVertexValue(formulaVertices[i])
      }

      // Check for convergence: all changes must be strictly less than threshold
      let converged = true
      for (let i = 0; i < formulaVertices.length; i++) {
        if (!this.isConverged(previousValues[i], formulaVertices[i].getCellValue(), threshold)) {
          converged = false
          break
        }
      }

      if (converged) {
        break
      }
    }

    // Record final values in changes and column search (using cached addresses)
    for (let i = 0; i < formulaVertices.length; i++) {
      const finalValue = formulaVertices[i].getCellValue()
      const address = cachedAddresses[i]
      this.columnSearch.add(getRawValue(finalValue), address)
      changes.addChange(finalValue, address)
    }

    const dependentChanges = this.updateNonCyclicDependents(cycled)
    changes.addAll(dependentChanges)

    return changes
  }

  /**
   * Identifies range vertices whose cached values may be affected by cycle cells.
   *
   * A range is affected if it contains any cell involved in the cycle.
   * These ranges need their caches cleared on each iteration since their
   * aggregate values (SUM, AVERAGE, etc.) depend on the changing cycle values.
   *
   * Computed once before the iteration loop to avoid O(ranges × cells) work per iteration.
   *
   * @param cyclicAddresses - Addresses of formula vertices in the cycle
   * @returns Set of RangeVertices requiring cache invalidation each iteration
   */
  private findAffectedRanges(cyclicAddresses: SimpleCellAddress[]): Set<RangeVertex> {
    const affectedRanges = new Set<RangeVertex>()

    // Group addresses by sheet for efficient lookup
    const addressesBySheet = new Map<number, SimpleCellAddress[]>()

    for (let i = 0; i < cyclicAddresses.length; i++) {
      const address = cyclicAddresses[i]
      let cells = addressesBySheet.get(address.sheet)
      if (cells === undefined) {
        cells = []
        addressesBySheet.set(address.sheet, cells)
      }
      cells.push(address)
    }

    // Check each range in affected sheets
    addressesBySheet.forEach((cellsInSheet, sheet) => {
      for (const rangeVertex of this.dependencyGraph.rangeMapping.rangesInSheet(sheet)) {
        const range = rangeVertex.range
        // Check if range contains any cyclic cell
        for (let i = 0; i < cellsInSheet.length; i++) {
          if (range.addressInRange(cellsInSheet[i])) {
            affectedRanges.add(rangeVertex)
            break
          }
        }
      }
    })

    return affectedRanges
  }

  /**
   * Determines if a cell value has converged between iterations.
   *
   * Convergence rules:
   * - Numbers: |new - old| < threshold (strict inequality)
   * - Strings, booleans, errors: exact equality
   * - Undefined old value: not converged (first iteration)
   *
   * @param oldValue - Value from previous iteration (undefined if first iteration)
   * @param newValue - Value from current iteration
   * @param threshold - Maximum allowed change for numeric convergence
   * @returns True if the cell has stabilized
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
   * Recomputes all vertices that depend on cycle results.
   *
   * After cycle values stabilize, their dependents need to be updated.
   * Uses subgraph traversal starting from direct dependents of cycle members,
   * avoiding a full graph topological sort.
   *
   * Complexity: O(V' + E') where V' and E' are vertices/edges in the dependent subgraph
   *
   * @param cycled - Cycle member vertices (used to find their dependents)
   * @returns Content changes from all dependent updates
   */
  private updateNonCyclicDependents(cycled: Vertex[]): ContentChanges {
    const changes = ContentChanges.empty()
    const cyclicSet = new Set(cycled)

    // Collect unique direct dependents of cycled vertices (use Set to avoid duplicates)
    const directDependentsSet = new Set<Vertex>()
    for (let i = 0; i < cycled.length; i++) {
      this.dependencyGraph.graph.adjacentNodes(cycled[i]).forEach(dependent => {
        if (!cyclicSet.has(dependent)) {
          directDependentsSet.add(dependent)
        }
      })
    }

    if (directDependentsSet.size === 0) {
      return changes
    }

    const directDependents = Array.from(directDependentsSet)

    // Use subgraph traversal starting from direct dependents
    // This avoids full graph traversal - only visits reachable vertices
    this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(
      directDependents,
      (vertex: Vertex) => {
        if (vertex instanceof FormulaVertex) {
          const newCellValue = this.recomputeFormulaVertexValue(vertex)
          const address = vertex.getAddress(this.lazilyTransformingAstService)
          this.columnSearch.add(getRawValue(newCellValue), address)
          changes.addChange(newCellValue, address)
        } else if (vertex instanceof RangeVertex) {
          vertex.clearCache()
        }
        return true
      },
      (vertex: Vertex) => {
        // Handle any cycles in dependents (shouldn't normally happen)
        if (vertex instanceof RangeVertex) {
          vertex.clearCache()
        }
      },
    )

    return changes
  }

  /**
   * Evaluates a formula vertex and stores the result.
   *
   * Handles special cases:
   * - ArrayFormulaVertex: checks for available space, returns #SPILL! if blocked
   * - ScalarFormulaVertex: standard formula evaluation
   *
   * @param vertex - Formula vertex to evaluate
   * @returns The computed value (also stored in the vertex)
   */
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

  /**
   * Evaluates an AST and normalizes the result.
   *
   * Handles special cases:
   * - SimpleRangeValue: returned as-is (for array formulas)
   * - EmptyValue: converted to 0 if evaluateNullToZero config is set
   *
   * @param ast - Parsed formula AST
   * @param state - Interpreter state with address context and array mode
   * @returns Normalized cell value
   */
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
