/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {SimpleCellRange} from '../AbsoluteCellRange'
import {TopSort, TopSortResult} from './TopSort'
import {ProcessableValue} from './ProcessableValue'

export type NodeId = number
export type NodeAndId<Node> = { node: Node, id: NodeId }
export type DependencyQuery<Node> = (vertex: Node) => [(SimpleCellAddress | SimpleCellRange), Node][]

/**
 * Provides directed graph structure.
 *
 * Idea for performance improvement:
 * - use Set<Node>[] instead of NodeId[][] for edgesSparseArray
 */
export class Graph<Node> {
  /**
   * A sparse array. The value nodesSparseArray[n] exists if and only if node n is in the graph.
   * @private
   */
  private nodesSparseArray: Node[] = []

  /**
   * A sparse array. The value edgesSparseArray[n] exists if and only if node n is in the graph.
   * The edgesSparseArray[n] is also a sparse array. It may contain removed nodes. To make sure check nodesSparseArray.
   * @private
   */
  private edgesSparseArray: NodeId[][] = []

  /**
   * A mapping from node to its id. The value nodesIds.get(node) exists if and only if node is in the graph.
   * @private
   */
  private nodesIds: Map<Node, NodeId> = new Map()

  /**
   * A ProcessableValue object.
   * @private
   */
  private dirtyAndVolatileNodeIds = new ProcessableValue<{ dirty: NodeId[], volatile: NodeId[] }, Node[]>(
    { dirty: [], volatile: [] },
    r => this.processDirtyAndVolatileNodeIds(r),
  )

  /**
   * A set of node ids. The value infiniteRangeIds.get(nodeId) exists if and only if node is in the graph.
   * @private
   */
  private infiniteRangeIds: Set<NodeId> = new Set()

  /**
   * A dense array. It may contain duplicates and removed nodes.
   * @private
   */
  private changingWithStructureNodeIds: NodeId[] = []

  private nextId: NodeId = 0

  constructor(
    private readonly dependencyQuery: DependencyQuery<Node>
  ) {}

  /**
   * Iterate over all nodes the in graph
   */
  public getNodes(): Node[] {
    return this.nodesSparseArray.filter((node: Node) => node !== undefined)
  }

  /**
   * Checks whether a node is present in graph
   *
   * @param node - node to check
   */
  public hasNode(node: Node): boolean {
    return this.nodesIds.has(node)
  }

  /**
   * Checks whether exists edge between nodes. If one or both of nodes are not present in graph, returns false.
   *
   * @param fromNode - node from which edge is outcoming
   * @param toNode - node to which edge is incoming
   */
  public existsEdge(fromNode: Node, toNode: Node): boolean {
    const fromId = this.getNodeId(fromNode)
    const toId = this.getNodeId(toNode)

    if (fromId === undefined || toId === undefined) {
      return false
    }

    return this.edgesSparseArray[fromId].includes(toId)
  }

  /**
   * Returns nodes adjacent to given node. May contain removed nodes.
   *
   * @param node - node to which adjacent nodes we want to retrieve
   *
   * Idea for performance improvement:
   * - return an array instead of set
   */
  public adjacentNodes(node: Node): Set<Node> {
    const id = this.getNodeId(node)

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
  public adjacentNodesCount(node: Node): number {
    const id = this.getNodeId(node)

    if (id === undefined) {
      throw this.missingNodeError(node)
    }

    return this.fixEdgesArrayForNode(id).length
  }

  /**
   * Adds node to a graph
   *
   * @param node - a node to be added
   */
  public addNodeAndReturnId(node: Node): NodeId {
    const idOfExistingNode = this.nodesIds.get(node)

    if (idOfExistingNode !== undefined) {
      return idOfExistingNode
    }

    const newId = this.nextId
    this.nextId++

    this.nodesSparseArray[newId] = node
    this.edgesSparseArray[newId] = []
    this.nodesIds.set(node, newId)
    return newId
  }

  /**
   * Adds edge between nodes.
   *
   * The nodes had to be added to the graph before, or the error will be raised
   *
   * @param fromNode - node from which edge is outcoming
   * @param toNode - node to which edge is incoming
   */
  public addEdge(fromNode: Node | NodeId, toNode: Node | NodeId): void {
    const fromId = this.getNodeIdIfNotNumber(fromNode)
    const toId = this.getNodeIdIfNotNumber(toNode)

    if (fromId === undefined) {
      throw this.missingNodeError(fromNode as Node)
    }

    if (toId === undefined) {
      throw this.missingNodeError(toNode as Node)
    }

    if (this.edgesSparseArray[fromId].includes(toId)) {
      return
    }

    this.edgesSparseArray[fromId].push(toId)
  }

  /**
   * Removes node from graph
   */
  public removeNode(node: Node): [(SimpleCellAddress | SimpleCellRange), Node][] {
    const id = this.getNodeId(node)

    if (id === undefined) {
      throw this.missingNodeError(node)
    }

    if (this.edgesSparseArray[id].length > 0) {
      this.edgesSparseArray[id].forEach(adjacentId => this.dirtyAndVolatileNodeIds.rawValue.dirty.push(adjacentId))
      this.dirtyAndVolatileNodeIds.markAsModified()
    }

    const dependencies = this.removeDependencies(node)

    delete this.nodesSparseArray[id]
    delete this.edgesSparseArray[id]
    this.infiniteRangeIds.delete(id)
    this.nodesIds.delete(node)

    return dependencies
  }

  /**
   * Removes edge between nodes.
   */
  public removeEdge(fromNode: Node | NodeId, toNode: Node | NodeId): void {
    const fromId = this.getNodeIdIfNotNumber(fromNode)
    const toId = this.getNodeIdIfNotNumber(toNode)

    if (fromId === undefined) {
      throw this.missingNodeError(fromNode as Node)
    }

    if (toId === undefined) {
      throw this.missingNodeError(toNode as Node)
    }

    const indexOfToId = this.edgesSparseArray[fromId].indexOf(toId)

    if (indexOfToId === -1) {
      throw new Error('Edge does not exist')
    }

    delete this.edgesSparseArray[fromId][indexOfToId]
  }

  /**
   * Removes edge between nodes if it exists.
   */
  public removeEdgeIfExists(fromNode: Node, toNode: Node): void {
    const fromId = this.getNodeId(fromNode)
    const toId = this.getNodeId(toNode)

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

  /**
   * Sorts the whole graph topologically. Nodes that are on cycles are kept separate.
   */
  public topSortWithScc(): TopSortResult<Node> {
    return this.getTopSortedWithSccSubgraphFrom(this.getNodes(), () => true, () => {})
  }

  /**
   * Sorts the graph topologically. Nodes that are on cycles are kept separate.
   *
   * @param modifiedNodes - seed for computation. The algorithm assumes that only these nodes have changed since the last run.
   * @param operatingFunction - recomputes value of a node, and returns whether a change occurred
   * @param onCycle - action to be performed when node is on cycle
   */
  public getTopSortedWithSccSubgraphFrom(
    modifiedNodes: Node[],
    operatingFunction: (node: Node) => boolean,
    onCycle: (node: Node) => void
  ): TopSortResult<Node> {
    const topSortAlgorithm = new TopSort<Node>(this.nodesSparseArray, this.edgesSparseArray)
    const modifiedNodesIds = modifiedNodes.map(node => this.getNodeId(node)).filter(id => id !== undefined) as NodeId[]
    return topSortAlgorithm.getTopSortedWithSccSubgraphFrom(modifiedNodesIds, operatingFunction, onCycle)
  }

  /**
   * Marks node as volatile.
   */
  public markNodeAsVolatile(node: Node): void {
    const id = this.getNodeId(node)

    if (id === undefined) {
      return
    }

    this.dirtyAndVolatileNodeIds.rawValue.volatile.push(id)
    this.dirtyAndVolatileNodeIds.markAsModified()
  }

  /**
   * Marks node as dirty.
   */
  public markNodeAsDirty(node: Node): void {
    const id = this.getNodeId(node)

    if (id === undefined) {
      return
    }

    this.dirtyAndVolatileNodeIds.rawValue.dirty.push(id)
    this.dirtyAndVolatileNodeIds.markAsModified()
  }

  /**
   * Returns an array of nodes that are marked as dirty and/or volatile.
   */
  public getDirtyAndVolatileNodes(): Node[] {
    return this.dirtyAndVolatileNodeIds.getProcessedValue()
  }

  /**
   * Clears dirty nodes.
   */
  public clearDirtyNodes(): void {
    this.dirtyAndVolatileNodeIds.rawValue.dirty = []
    this.dirtyAndVolatileNodeIds.markAsModified()
  }

  /**
   * Marks node as changingWithStructure.
   */
  public markNodeAsChangingWithStructure(node: Node): void {
    const id = this.getNodeId(node)

    if (id === undefined) {
      return
    }

    this.changingWithStructureNodeIds.push(id)
  }

  /**
   * Marks all nodes marked as changingWithStructure as dirty.
   */
  public markChangingWithStructureNodesAsDirty(): void {
    if (this.changingWithStructureNodeIds.length <= 0) {
      return
    }

    this.dirtyAndVolatileNodeIds.rawValue.dirty = [ ...this.dirtyAndVolatileNodeIds.rawValue.dirty, ...this.changingWithStructureNodeIds ]
    this.dirtyAndVolatileNodeIds.markAsModified()
  }

  /**
   * Marks node as infinite range.
   */
  public markNodeAsInfiniteRange(node: Node | NodeId): void {
    const id = this.getNodeIdIfNotNumber(node)

    if (id === undefined) {
      return
    }

    this.infiniteRangeIds.add(id)
  }

  /**
   * Returns an array of nodes marked as infinite ranges
   */
  public getInfiniteRanges(): NodeAndId<Node>[] {
    return [ ...this.infiniteRangeIds].map(id => ({ node: this.nodesSparseArray[id], id }))
  }

  /**
   * Returns the internal id of a node.
   */
  public getNodeId(node: Node): NodeId | undefined {
    return this.nodesIds.get(node)
  }

  /**
   *
   */
  private getNodeIdIfNotNumber(node: Node | NodeId): NodeId | undefined {
    return typeof node === 'number' ? node : this.nodesIds.get(node)
  }

  /**
   * Removes invalid neighbors of a given node from the edges array and returns adjacent nodes for the input node.
   */
  private fixEdgesArrayForNode(id: NodeId): NodeId[] {
    const adjacentNodeIds = this.edgesSparseArray[id]
    this.edgesSparseArray[id] = adjacentNodeIds.filter(adjacentId => adjacentId !== undefined && this.nodesSparseArray[adjacentId])
    return this.edgesSparseArray[id]
  }

  /**
   * Removes edges from the given node to its dependencies based on the dependencyQuery function.
   */
  private removeDependencies(node: Node): [(SimpleCellAddress | SimpleCellRange), Node][] {
    const dependencies = this.dependencyQuery(node)

    dependencies.forEach(([_, dependency]) => {
      this.removeEdgeIfExists(dependency, node)
    })

    return dependencies
  }

  /**
   * processFn for dirtyAndVolatileNodeIds ProcessableValue instance
   * @private
   */
  private processDirtyAndVolatileNodeIds({ dirty, volatile }: { dirty: NodeId[], volatile: NodeId[] }): Node[] {
    return [ ...new Set([ ...dirty, ...volatile]) ]
    .map(id => this.nodesSparseArray[id])
    .filter(node => node !== undefined)
  }

  /**
   * Returns error for missing node.
   */
  private missingNodeError(node: Node): Error {
    return new Error(`Unknown node ${node}`)
  }
}
