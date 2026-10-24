/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange, simpleCellRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {CellVertex, DependencyGraph, RangeVertex, Vertex} from './DependencyGraph'
import {FormulaVertex, RuntimeDependency} from './DependencyGraph/FormulaVertex'
import {TopSortPass} from './DependencyGraph/Graph'

const NO_DEPENDENCIES: RuntimeDependency[] = []

/**
 * Context of the formula evaluations in one top-sort pass.
 * Lets functions that discover references at runtime (e.g., INDIRECT) record them and check whether a cell is current.
 */
export class EvaluationPass {
  private currentDependent?: FormulaVertex
  private currentRecorded?: RuntimeDependency[]

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly topSortPass: TopSortPass<Vertex>,
  ) {
  }

  /**
   * The formula being evaluated, or undefined between evaluations.
   */
  public get dependent(): FormulaVertex | undefined {
    return this.currentDependent
  }

  /**
   * Starts recording runtime dependencies for an evaluation of the given formula.
   */
  public begin(dependent: FormulaVertex): void {
    this.currentDependent = dependent
    this.currentRecorded = undefined
  }

  /**
   * Ends the current evaluation and returns the runtime dependencies it recorded, in reading order, without duplicates.
   */
  public end(): RuntimeDependency[] {
    const recorded = this.currentRecorded ?? NO_DEPENDENCIES
    this.currentDependent = undefined
    this.currentRecorded = undefined
    return recorded
  }

  /**
   * Returns true if the vertex may still be recomputed later in this pass, i.e., its value is not current yet.
   */
  public isPending(vertex: Vertex): boolean {
    return this.topSortPass.isPending(vertex)
  }

  /**
   * Requests that a pending vertex is computed before the evaluated formula is retried.
   * Call it right before throwing {@link EVALUATION_DEFERRED}.
   */
  public requestPull(vertex: Vertex): void {
    this.topSortPass.requestPull(vertex)
  }

  /**
   * Records that the evaluated formula reads the given range, and adds an edge from the range's vertex to the graph,
   * creating the range vertex if needed.
   *
   * @returns the range vertex
   */
  public recordRangeDependency(range: AbsoluteCellRange): RangeVertex {
    if (this.currentDependent === undefined) {
      throw new Error('No formula is being evaluated.')
    }
    const vertex = this.dependencyGraph.addRuntimeRangeDependency(this.currentDependent, range)
    this.currentRecorded = this.currentRecorded ?? []
    if (!this.currentRecorded.some(dependency => dependency.vertex === vertex)) {
      this.currentRecorded.push({address: simpleCellRange(range.start, range.end), vertex})
    }
    return vertex
  }

  /**
   * Records that the evaluated formula reads the cell at the given address, and adds the corresponding edge to the graph.
   *
   * @returns the vertex of the cell that was read
   */
  public recordDependency(address: SimpleCellAddress): CellVertex {
    if (this.currentDependent === undefined) {
      throw new Error('No formula is being evaluated.')
    }
    const vertex = this.dependencyGraph.addRuntimeDependency(this.currentDependent, address)
    this.currentRecorded = this.currentRecorded ?? []
    if (!this.currentRecorded.some(dependency => dependency.vertex === vertex)) {
      this.currentRecorded.push({address, vertex})
    }
    return vertex
  }
}
