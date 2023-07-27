/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {SimpleCellRange} from '../AbsoluteCellRange'
import {TopSort, TopSortResult} from './TopSort'

export type DependencyQuery<T> = (vertex: T) => [(SimpleCellAddress | SimpleCellRange), T][]

/**
 * Provides graph directed structure
 *
 * Invariants:
 * - this.edges(node) exists if and only if node is in the graph
 * - this.specialNodes* are always subset of this.nodes
 * - this.edges(node) is subset of this.nodes (i.e. it does not contain nodes not present in graph) -- this invariant DOES NOT HOLD right now
 */
export class Graph<T> {
  public nodes: Set<T> = new Set()
  public specialNodes: Set<T> = new Set()
  public specialNodesStructuralChanges: Set<T> = new Set()
  public specialNodesRecentlyChanged: Set<T> = new Set()
  public infiniteRanges: Set<T> = new Set()

  /** Nodes adjacency mapping. */
  private edges: Map<T, Set<T>> = new Map()

  constructor(
    private readonly dependencyQuery: DependencyQuery<T>
  ) {
  }

  /**
   * Adds node to a graph
   *
   * @param node - a node to be added
   */
  public addNode(node: T) {
    this.nodes.add(node)
    if (!this.edges.has(node)) {
      this.edges.set(node, new Set())
    }
  }

  /**
   * Adds edge between nodes.
   *
   * The nodes had to be added to the graph before, or the error will be raised
   *
   * @param fromNode - node from which edge is outcoming
   * @param toNode - node to which edge is incoming
   */
  public addEdge(fromNode: T, toNode: T) {
    if (!this.nodes.has(fromNode)) {
      throw new Error(`Unknown node ${fromNode}`)
    }
    if (!this.nodes.has(toNode)) {
      throw new Error(`Unknown node ${toNode}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.edges.get(fromNode)!.add(toNode)
  }

  public removeEdge(fromNode: T, toNode: T) {
    if (this.existsEdge(fromNode, toNode)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.edges.get(fromNode)!.delete(toNode)
    } else {
      throw new Error('Edge does not exist')
    }
  }

  public softRemoveEdge(fromNode: T, toNode: T) {
    this.edges.get(fromNode)?.delete(toNode)
  }

  public removeIncomingEdges(toNode: T) {
    this.edges.forEach((nodeEdges) => {
      nodeEdges.delete(toNode)
    })
  }

  /**
   * Returns nodes adjacent to given node
   *
   * @param node - node to which adjacent nodes we want to retrieve
   */
  public adjacentNodes(node: T): Set<T> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.edges.get(node)!
  }

  public adjacentNodesCount(node: T): number {
    return this.adjacentNodes(node).size
  }

  /**
   * Checks whether a node is present in graph
   *
   * @param node - node to check
   */
  public hasNode(node: T): boolean {
    return this.nodes.has(node)
  }

  /**
   * Returns number of nodes in graph
   */
  public nodesCount(): number {
    return this.nodes.size
  }

  /**
   * Returns number of edges in graph
   */
  public edgesCount(): number {
    let result = 0
    this.edges.forEach((edgesForNode) => (result += edgesForNode.size))
    return result
  }

  public removeNode(node: T): [(SimpleCellAddress | SimpleCellRange), T][] {
    for (const adjacentNode of this.adjacentNodes(node).values()) {
      this.markNodeAsSpecialRecentlyChanged(adjacentNode)
    }
    this.edges.delete(node)
    this.nodes.delete(node)
    this.specialNodes.delete(node)
    this.specialNodesRecentlyChanged.delete(node)
    this.specialNodesStructuralChanges.delete(node)
    this.infiniteRanges.delete(node)
    return this.removeDependencies(node)
  }

  public markNodeAsSpecial(node: T) {
    this.specialNodes.add(node)
  }

  public markNodeAsSpecialRecentlyChanged(node: T) {
    if (this.nodes.has(node)) {
      this.specialNodesRecentlyChanged.add(node)
    }
  }

  public markNodeAsChangingWithStructure(node: T) {
    this.specialNodesStructuralChanges.add(node)
  }

  public clearSpecialNodesRecentlyChanged() {
    this.specialNodesRecentlyChanged.clear()
  }

  public markNodeAsInfiniteRange(node: T) {
    this.infiniteRanges.add(node)
  }

  /**
   * Checks whether exists edge between nodes
   *
   * @param fromNode - node from which edge is outcoming
   * @param toNode - node to which edge is incoming
   */
  public existsEdge(fromNode: T, toNode: T): boolean {
    return this.adjacentNodes(fromNode)?.has(toNode) ?? false
  }

  /*
   * return a topological sort order, but separates vertices that exist in some cycle
   */
  public topSortWithScc(): TopSortResult<T> {
    return this.getTopSortedWithSccSubgraphFrom(Array.from(this.nodes), () => true, () => {
    })
  }

  /**
   *
   * an iterative implementation of Tarjan's algorithm for finding strongly connected compontents
   * returns vertices in order of topological sort, but vertices that are on cycles are kept separate
   *
   * @param modifiedNodes - seed for computation. During engine init run, all of the vertices of grap. In recomputation run, changed vertices.
   * @param operatingFunction - recomputes value of a node, and returns whether a change occured
   * @param onCycle - action to be performed when node is on cycle
   */
  public getTopSortedWithSccSubgraphFrom(modifiedNodes: T[], operatingFunction: (node: T) => boolean, onCycle: (node: T) => void): TopSortResult<T> {
    const topSortAlgorithm = new TopSort<T>(this.edges)
    return topSortAlgorithm.getTopSortedWithSccSubgraphFrom(modifiedNodes, operatingFunction, onCycle)
  }

  public getDependencies(vertex: T): T[] {
    const result: T[] = []
    this.edges.forEach((adjacentNodes, sourceNode) => {
      if (adjacentNodes.has(vertex)) {
        result.push(sourceNode)
      }
    })
    return result
  }

  private removeDependencies(node: T): [(SimpleCellAddress | SimpleCellRange), T][] {
    const dependencies = this.dependencyQuery(node)
    for (const [_, dependency] of dependencies) {
      this.softRemoveEdge(dependency, node)
    }
    return dependencies
  }
}
