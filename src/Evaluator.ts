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
import {EmptyValue, getRawValue, InterpreterValue} from './interpreter/InterpreterValue'
import {SimpleRangeValue} from './SimpleRangeValue'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ColumnSearchStrategy} from './Lookup/SearchStrategy'
import {Ast, RelativeDependency} from './parser'
import {Statistics, StatType} from './statistics'

export class Evaluator {
  private readonly iterationCount = 100

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
            const firstCycleChanges = this.iterateCircularDependencies([vertex], 1)
            changes.addAll(firstCycleChanges)
            cycled.push(vertex)
          }
        },
      )
    })

    const cycledChanges = this.iterateCircularDependencies(cycled, this.iterationCount - 1)
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
  private recomputeFormulas(cycled: Vertex[], sorted: Vertex[]): void {
    this.iterateCircularDependencies(cycled)

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
   * Iterates over all circular dependencies (cycled vertices) for 100 iterations
   * Handles cascading dependencies by processing cycles in dependency order
   */
  private iterateCircularDependencies(cycled: Vertex[], cycles = this.iterationCount): ContentChanges {
    if (!this.config.allowCircularReferences) {
      return this.blockCircularDependencies(cycled)
    }
    
    const changes = ContentChanges.empty()
    cycled.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex && !vertex.isComputed()) {
        vertex.setCellValue(0)
      }
    })
    
    for (let i = 0; i < cycles; i++) {
      this.clearCachesForCyclicRanges(cycled)
      
      cycled.forEach((vertex: Vertex) => {
        if (!(vertex instanceof FormulaVertex)) {
          return
        }

        const address = vertex.getAddress(this.lazilyTransformingAstService)
        const newCellValue = this.recomputeFormulaVertexValue(vertex)

        if (i < this.iterationCount - 1) {
          return
        }
          
        this.columnSearch.add(getRawValue(newCellValue), address)
        changes.addChange(newCellValue, address)
      })
    }
    
    const dependentChanges = this.updateNonCyclicDependents(cycled)
    changes.addAll(dependentChanges)
    
    return changes
  }

  /**
   * Updates all non-cyclic cells that depend on the given cycled vertices
   * Uses topological sorting to ensure correct dependency order
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
   * Clears function caches for ranges that contain any of the given cyclic vertices
   * This ensures fresh computation during circular dependency iteration
   */
  private clearCachesForCyclicRanges(cycled: Vertex[]): void {
    const cyclicAddresses = new Set<string>()
    cycled.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex) {
        const address = vertex.getAddress(this.lazilyTransformingAstService)
        cyclicAddresses.add(`${address.sheet}:${address.col}:${address.row}`)
      }
    })
    
    const sheetsWithCycles = new Set<number>()
    cycled.forEach((vertex: Vertex) => {
      if (vertex instanceof FormulaVertex) {
        const address = vertex.getAddress(this.lazilyTransformingAstService)
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
