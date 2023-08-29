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
 * - nodesSparseArray is a sparse array. nodesSparseArray[n] exists if and only if node n is in the graph
 * - nodesIds is a mapping from node to its id. nodesIds.get(node) exists if and only if node is in the graph
 * - edgesSparseArray is a sparse array. edgesSparseArray[n] exists if and only if node n is in the graph
 * - edgesSparseArray[n] is a sparse array. edgesSparseArray[n] may contain removed nodes. To make sure check nodesSparseArray.
 *
 */
export class Graph<T> {
  private nodesSparseArray: T[] = []
  private edgesSparseArray: number[][] = [] // TODO: try using Set<T>[]
  private nodesIds: Map<T, number> = new Map()
  private nextId: number = 0

  // TODO: try using number[] for these collections
  public specialNodes: Set<T> = new Set()
  public specialNodesStructuralChanges: Set<T> = new Set()
  public specialNodesRecentlyChanged: Set<T> = new Set()
  public infiniteRanges: Set<T> = new Set()

  constructor(
    private readonly dependencyQuery: DependencyQuery<T>
  ) {}

  /**
   * Iterate over all nodes the in graph
   */
  public getNodes(): T[] {
    return this.nodesSparseArray.filter((node: T) => node !== undefined)
  }

  /**
   * Checks whether a node is present in graph
   *
   * @param node - node to check
   */
  public hasNode(node: T): boolean {
    return this.nodesIds.has(node)
  }

  /**
   * Checks whether exists edge between nodes. If one or both of nodes are not present in graph, returns false.
   *
   * @param fromNode - node from which edge is outcoming
   * @param toNode - node to which edge is incoming
   */
  public existsEdge(fromNode: T, toNode: T): boolean {
    const fromId = this.nodesIds.get(fromNode)
    const toId = this.nodesIds.get(toNode)

    if (fromId === undefined || toId === undefined) {
      return false
    }

    return this.edgesSparseArray[fromId].includes(toId)
  }

  /**
   * Returns nodes adjacent to given node. May contain removed nodes.
   *
   * @param node - node to which adjacent nodes we want to retrieve
   */
  public adjacentNodes(node: T): Set<T> { // TODO: try returning array
    const id = this.nodesIds.get(node)

    if (id === undefined) {
      throw this.missingNodeError(node)
    }

    return new Set(this.edgesSparseArray[id].filter(id => id !== undefined).map(id => this.nodesSparseArray[id]))
  }

  /**
   * Returns number of nodes adjacent to given node. Contrary to adjacentNodes(), this method returns only nodes that are present in graph.
   *
   * @param node - node to which adjacent nodes we want to retrieve
   */
  public adjacentNodesCount(node: T): number {
    const id = this.nodesIds.get(node)

    if (id === undefined) {
      throw this.missingNodeError(node)
    }

    return this.cleanupAdjacentNodeIds(id).length
  }

  /**
   * Adds node to a graph
   *
   * @param node - a node to be added
   */
  public addNode(node: T): void {
    if (this.hasNode(node)) {
      return
    }

    this.nodesSparseArray[this.nextId] = node
    this.edgesSparseArray[this.nextId] = []
    this.nodesIds.set(node, this.nextId)
    this.nextId++
  }

  /**
   * Adds edge between nodes.
   *
   * The nodes had to be added to the graph before, or the error will be raised
   *
   * @param fromNode - node from which edge is outcoming
   * @param toNode - node to which edge is incoming
   */
  public addEdge(fromNode: T, toNode: T): void {
    const fromId = this.nodesIds.get(fromNode)
    const toId = this.nodesIds.get(toNode)

    if (fromId === undefined) {
      throw this.missingNodeError(fromNode)
    }

    if (toId === undefined) {
      throw this.missingNodeError(toNode)
    }

    if (this.edgesSparseArray[fromId].includes(toId)) {
      return
    }

    this.edgesSparseArray[fromId].push(toId)
  }

  public removeNode(node: T): [(SimpleCellAddress | SimpleCellRange), T][] {
    const id = this.nodesIds.get(node)

    if (id === undefined) {
      throw this.missingNodeError(node)
    }

    this.edgesSparseArray[id]
      .filter(adjacentId => adjacentId !== undefined)
      .map(adjacentId => this.nodesSparseArray[adjacentId])
      .forEach(adjacentNode => this.markNodeAsSpecialRecentlyChanged(adjacentNode))

    const dependencies = this.removeDependencies(node)

    delete this.nodesSparseArray[id]
    delete this.edgesSparseArray[id]
    this.nodesIds.delete(node)

    this.specialNodes.delete(node)
    this.specialNodesRecentlyChanged.delete(node)
    this.specialNodesStructuralChanges.delete(node)
    this.infiniteRanges.delete(node)
    return dependencies
  }

  public removeEdge(fromNode: T, toNode: T): void {
    const fromId = this.nodesIds.get(fromNode)
    const toId = this.nodesIds.get(toNode)

    if (fromId === undefined) {
      throw this.missingNodeError(fromNode)
    }

    if (toId === undefined) {
      throw this.missingNodeError(toNode)
    }

    const indexOfToId = this.edgesSparseArray[fromId].indexOf(toId)

    if (indexOfToId === -1) {
      throw new Error('Edge does not exist')
    }

    delete this.edgesSparseArray[fromId][indexOfToId]
  }

  public removeEdgeIfExists(fromNode: T, toNode: T): void {
    const fromId = this.nodesIds.get(fromNode)
    const toId = this.nodesIds.get(toNode)

    if (fromId === undefined) {
      return
    }

    if (toId === undefined) {
      return
    }

    const indexOfToId = this.edgesSparseArray[fromId].indexOf(toId)

    if (indexOfToId === -1) {
      return
    }

    delete this.edgesSparseArray[fromId][indexOfToId]
  }

  /*
   * return a topological sort order, but separates vertices that exist in some cycle
   */
  public topSortWithScc(): TopSortResult<T> {
    return this.getTopSortedWithSccSubgraphFrom(this.getNodes(), () => true, () => {
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
    const topSortAlgorithm = new TopSort<T>(this.nodesSparseArray, this.edgesSparseArray)
    const modifiedNodesIds = modifiedNodes.map(node => this.nodesIds.get(node)).filter(id => id !== undefined) as number[]
    return topSortAlgorithm.getTopSortedWithSccSubgraphFrom(modifiedNodesIds, operatingFunction, onCycle)
  }

  public markNodeAsSpecial(node: T): void {
    if (!this.hasNode(node)) {
      return
    }

    this.specialNodes.add(node)
  }

  public markNodeAsSpecialRecentlyChanged(node: T): void {
    if (!this.hasNode(node)) {
      return
    }

    this.specialNodesRecentlyChanged.add(node)
  }

  public markNodeAsChangingWithStructure(node: T): void {
    if (!this.hasNode(node)) {
      return
    }

    this.specialNodesStructuralChanges.add(node)
  }

  public markNodeAsInfiniteRange(node: T): void {
    if (!this.hasNode(node)) {
      return
    }

    this.infiniteRanges.add(node)
  }

  public clearSpecialNodesRecentlyChanged(): void {
    this.specialNodesRecentlyChanged.clear()
  }

  private cleanupAdjacentNodeIds(id: number): number[] {
    const adjacentNodeIds = this.edgesSparseArray[id]
    this.edgesSparseArray[id] = adjacentNodeIds.filter(adjacentId => adjacentId !== undefined && this.nodesSparseArray[adjacentId])
    return this.edgesSparseArray[id]
  }

  private removeDependencies(node: T): [(SimpleCellAddress | SimpleCellRange), T][] {
    const dependencies = this.dependencyQuery(node)
    for (const [_, dependency] of dependencies) {
      this.removeEdgeIfExists(dependency, node)
    }
    return dependencies
  }

  private missingNodeError(node: T): Error {
    return new Error(`Unknown node ${node}`)
  }
}
