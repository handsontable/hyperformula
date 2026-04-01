/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
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
import {EmptyValue, getRawValue, InterpreterValue, isExtendedNumber} from './interpreter/InterpreterValue'
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
      this.recomputeFormulas(cycled, sorted, true)
    })
  }

  public partialRun(vertices: Vertex[]): ContentChanges {
    const changes = ContentChanges.empty()
    const cycled: Vertex[] = []

    this.stats.measure(StatType.EVALUATION, () => {
      this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(vertices,
        (vertex: Vertex) => {
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
        },
        (vertex: Vertex) => {
          if (vertex instanceof RangeVertex) {
            vertex.clearCache()
          } else if (vertex instanceof FormulaVertex) {
            const firstCycleChanges = this.iterateCircularDependencies([vertex], 1, false, true)
            changes.addAll(firstCycleChanges)
            cycled.push(vertex)
          }
        },
      )
    })

    const cycledChanges = this.iterateCircularDependencies(cycled, this.config.maxIterations - 1)
    changes.addAll(cycledChanges)

    return changes
  }

  public runAndForget(ast: Ast, address: SimpleCellAddress, dependencies: RelativeDependency[]): InterpreterValue {
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
    const ret = this.evaluateAstToCellValue(ast, new InterpreterState(address, this.config.useArrayArithmetic))

    tmpRanges.forEach((rangeVertex) => {
      this.dependencyGraph.rangeMapping.removeRange(rangeVertex)
    })

    return ret
  }

  /**
   * Recalculates formulas in the topological sort order
   */
  private recomputeFormulas(cycled: Vertex[], sorted: Vertex[], isInitial: boolean): void {
    this.iterateCircularDependencies(cycled, undefined, isInitial)

    sorted.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex) {
        const newCellValue = this.recomputeFormulaVertexValue(vertex)
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        this.columnSearch.add(getRawValue(newCellValue), address)
      } else if (vertex instanceof RangeVertex) {
        vertex.clearCache()
      }
    })
  }

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
   * Iterates over all circular dependencies (cycled vertices) with early convergence detection.
   * Handles cascading dependencies by processing cycles in dependency order.
   *
   * @param skipDependentUpdate - When true, skips updateNonCyclicDependents. Used during Phase 1
   *   of partialRun where the graph traversal handles non-cyclic dependents via the visit callback.
   */
  private iterateCircularDependencies(cycled: Vertex[], cycles = this.config.maxIterations, isInitial = false, skipDependentUpdate = false): ContentChanges {
    if (!this.config.allowCircularReferences) {
      return this.blockCircularDependencies(cycled)
    }

    if (isInitial) {
      cycled.forEach((vertex: Vertex) => {
        if (vertex instanceof FormulaVertex && !vertex.isComputed()) {
          const address = vertex.getAddress(this.lazilyTransformingAstService)

          const sheetName = this.dependencyGraph.sheetMapping.fetchDisplayName(address.sheet)
          const sheetData = this.config.initialComputedValues?.[sheetName] || []
          const cellValue = (sheetData[address.row] || [])[address.col]

          vertex.setCellValue(cellValue !== undefined ? cellValue : 0)
        }
      })

      return ContentChanges.empty()
    }

    // Initialize uncomputed vertices to 0
    cycled.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex && !vertex.isComputed()) {
        vertex.setCellValue(0)
      }
    })

    // Collect formula vertices once to avoid repeated instanceof checks
    const formulaVertices = cycled.filter((v): v is FormulaVertex => v instanceof FormulaVertex)

    // Pre-compute cyclic range vertices to clear (doesn't change between iterations)
    const cyclicRangeVertices = this.findCyclicRangeVertices(formulaVertices)

    // Iteration loop with convergence check
    for (let i = 0; i < cycles; i++) {
      cyclicRangeVertices.forEach(rv => rv.clearCache())

      // Snapshot current values before recomputation
      const snapshot = new Map<FormulaVertex, InterpreterValue>()
      for (const vertex of formulaVertices) {
        snapshot.set(vertex, vertex.getCellValue())
      }

      // Recompute all formula vertices
      for (const vertex of formulaVertices) {
        this.recomputeFormulaVertexValue(vertex)
      }

      // Check convergence
      let converged = true
      for (const vertex of formulaVertices) {
        const oldValue = snapshot.get(vertex)!
        const newValue = vertex.getCellValue()
        if (!this.hasValueConverged(oldValue, newValue)) {
          converged = false
          break
        }
      }

      if (converged) {
        break
      }
    }

    // Recording pass: register final values
    const changes = ContentChanges.empty()
    for (const vertex of formulaVertices) {
      const address = vertex.getAddress(this.lazilyTransformingAstService)
      const cellValue = vertex.getCellValue()
      this.columnSearch.add(getRawValue(cellValue), address)
      changes.addChange(cellValue, address)
    }

    if (!skipDependentUpdate) {
      const dependentChanges = this.updateNonCyclicDependents(cycled)
      changes.addAll(dependentChanges)
    }

    return changes
  }

  private hasValueConverged(oldValue: InterpreterValue, newValue: InterpreterValue): boolean {
    if (isExtendedNumber(oldValue) && isExtendedNumber(newValue)) {
      return Math.abs((getRawValue(newValue) as number) - (getRawValue(oldValue) as number)) <= this.config.convergenceThreshold
    }
    if (oldValue instanceof CellError && newValue instanceof CellError) {
      return oldValue.type === newValue.type
    }
    return oldValue === newValue
  }

  /**
   * Updates all non-cyclic cells that depend on the given cycled vertices.
   * Uses topological sorting to ensure correct dependency order.
   */
  private updateNonCyclicDependents(cycled: Vertex[]): ContentChanges {
    const changes = ContentChanges.empty()
    const cyclicSet = new Set(cycled)

    const dependents: Vertex[] = []
    for (const vertex of cycled) {
      for (const dependent of this.dependencyGraph.graph.adjacentNodes(vertex)) {
        if (!cyclicSet.has(dependent)) {
          dependents.push(dependent)
        }
      }
    }

    if (dependents.length === 0) {
      return changes
    }

    this.dependencyGraph.graph.getTopSortedWithSccSubgraphFrom(
      dependents,
      (vertex: Vertex) => {
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
      },
      (vertex: Vertex) => {
        if (vertex instanceof RangeVertex) {
          vertex.clearCache()
        }
      }
    )

    return changes
  }

  /**
   * Finds all range vertices that contain any of the given cyclic formula vertices.
   * Called once before the iteration loop so the result can be reused each iteration.
   */
  private findCyclicRangeVertices(formulaVertices: FormulaVertex[]): RangeVertex[] {
    const cyclicAddresses = new Set<string>()
    const sheetsWithCycles = new Set<number>()

    for (const vertex of formulaVertices) {
      const address = vertex.getAddress(this.lazilyTransformingAstService)
      cyclicAddresses.add(`${address.sheet}:${address.col}:${address.row}`)
      sheetsWithCycles.add(address.sheet)
    }

    const result: RangeVertex[] = []
    for (const sheet of sheetsWithCycles) {
      for (const rangeVertex of this.dependencyGraph.rangeMapping.rangesInSheet(sheet)) {
        for (const address of rangeVertex.range.addresses(this.dependencyGraph)) {
          if (cyclicAddresses.has(`${address.sheet}:${address.col}:${address.row}`)) {
            result.push(rangeVertex)
            break
          }
        }
      }
    }

    return result
  }

  private recomputeFormulaVertexValue(vertex: FormulaVertex): InterpreterValue {
    const address = vertex.getAddress(this.lazilyTransformingAstService)
    if (vertex instanceof ArrayVertex && (vertex.array.size.isRef || !this.dependencyGraph.isThereSpaceForArray(vertex))) {
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
