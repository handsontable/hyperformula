/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

export type DependencyQuery<T> = (vertex: T) => T[]

export interface TopSortResult<T> {
  sorted: T[],
  cycled: T[],
}

enum NodeVisitStatus {
  ON_STACK,
  PROCESSED,
  POPPED,
}

/**
 * Provides graph directed structure
 *
 * Invariants:
 * - this.edges(node) exists if and only if node is in the graph
 * - this.specialNodes* are always subset of this.nodes
 * - this.edges(node) is subset of this.nodes (i.e. it does not contain nodes not present in graph) -- this invariant DOES NOT HOLD right now
 */
export class Graph<T> {
  /** Set with nodes in graph. */
  public nodes: Set<T> = new Set()

  public dependencyIndexes: Map<T, number> = new Map()
  public specialNodes: Set<T> = new Set()
  public specialNodesAsync: Map<T, T> = new Map()
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

  public removeNode(node: T): T[] {
    for (const adjacentNode of this.adjacentNodes(node).values()) {
      this.markNodeAsSpecialRecentlyChanged(adjacentNode)
    }
    this.edges.delete(node)
    this.nodes.delete(node)
    this.specialNodes.delete(node)
    this.specialNodesAsync.delete(node)
    this.specialNodesRecentlyChanged.delete(node)
    this.specialNodesStructuralChanges.delete(node)
    this.infiniteRanges.delete(node)
    this.dependencyIndexes.delete(node)

    return this.removeDependencies(node)
  }

  public markNodeAsSpecial(node: T) {
    this.specialNodes.add(node)
  }

  public markNodeAsSpecialAsync(node: T) {
    this.specialNodesAsync.set(node, node)
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

  public clearSpecialNodesAsync() {
    this.specialNodesAsync.clear()
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
    return this.edges.get(fromNode)?.has(toNode) ?? false
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

    const entranceTime: Map<T, number> = new Map()
    const low: Map<T, number> = new Map()
    const parent: Map<T, T> = new Map()
    const inSCC: Set<T> = new Set()

    // node status life cycle:
    // undefined -> ON_STACK -> PROCESSED -> POPPED
    const nodeStatus: Map<T, NodeVisitStatus> = new Map()
    const order: T[] = []

    let time: number = 0

    const sccNonSingletons: Set<T> = new Set()

    modifiedNodes.reverse()
    modifiedNodes.forEach((v: T) => {
      if (nodeStatus.get(v) !== undefined) {
        return
      }
      const DFSstack: T[] = [v]
      const SCCstack: T[] = []
      nodeStatus.set(v, NodeVisitStatus.ON_STACK)
      while (DFSstack.length > 0) {
        const u = DFSstack[DFSstack.length - 1]
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        switch (nodeStatus.get(u)!) {
          case NodeVisitStatus.ON_STACK: {
            entranceTime.set(u, time)
            low.set(u, time)
            SCCstack.push(u)
            time++
            this.adjacentNodes(u).forEach((t: T) => {
              if (entranceTime.get(t) === undefined) {
                DFSstack.push(t)
                parent.set(t, u)
                nodeStatus.set(t, NodeVisitStatus.ON_STACK)
              }
            })
            nodeStatus.set(u, NodeVisitStatus.PROCESSED)
            break
          }
          case NodeVisitStatus.PROCESSED: { // leaving this DFS subtree
            let uLow: number
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            uLow = entranceTime.get(u)!
            this.adjacentNodes(u).forEach((t: T) => {
              if (!inSCC.has(t)) {
                if (parent.get(t) === u) {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  uLow = Math.min(uLow, low.get(t)!)
                } else {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  uLow = Math.min(uLow, entranceTime.get(t)!)
                }
              }
            })
            low.set(u, uLow)
            if (uLow === entranceTime.get(u)) {
              const currentSCC: T[] = []
              do {
                currentSCC.push(SCCstack[SCCstack.length - 1])
                SCCstack.pop()
              } while (currentSCC[currentSCC.length - 1] !== u)
              currentSCC.forEach((t) => {
                inSCC.add(t)
              })
              order.push(...currentSCC)
              if (currentSCC.length > 1) {
                currentSCC.forEach((t) => {
                  sccNonSingletons.add(t)
                })
              }
            }
            DFSstack.pop()
            nodeStatus.set(u, NodeVisitStatus.POPPED)
            break
          }
          case NodeVisitStatus.POPPED: { // it's a 'shadow' copy, we already processed this vertex and can ignore it
            DFSstack.pop()
            break
          }
        }
      }
    })

    const shouldBeUpdatedMapping = new Set(modifiedNodes)

    const sorted: T[] = []
    const cycled: T[] = []
    order.reverse()
    order.forEach((t: T) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (sccNonSingletons.has(t) || this.adjacentNodes(t).has(t)) {
        cycled.push(t)
        onCycle(t)
        this.adjacentNodes(t).forEach((s: T) => shouldBeUpdatedMapping.add(s))
      } else {
        sorted.push(t)
        if (shouldBeUpdatedMapping.has(t) && operatingFunction(t)) {
          this.adjacentNodes(t).forEach((s: T) => shouldBeUpdatedMapping.add(s))
        }
      }
    })
    return {sorted, cycled}
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

  private removeDependencies(node: T): T[] {
    const dependencies = this.dependencyQuery(node)
    for (const dependency of dependencies) {
      this.softRemoveEdge(dependency, node)
    }
    return dependencies
  }
}
