/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

export type DependencyQuery<T> = (vertex: T) => Set<T> | null

export interface TopSortResult<T> {
  sorted: T[], cycled: T[], 
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

  public specialNodes: Set<T> = new Set()
  public specialNodesStructuralChanges: Set<T> = new Set()
  public specialNodesRecentlyChanged: Set<T> = new Set()
  public infiniteRanges: Set<T> = new Set()

  /** Nodes adjacency mapping. */
  private edges: Map<T, Set<T>> = new Map()

  constructor(
    // private readonly getDependenciesQuery: IGetDependenciesQuery<T>,
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

  public removeNode(node: T): Set<T> {
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
    return this.edges.get(fromNode)?.has(toNode) ?? false
  }

  /*
   * return a topological sort order, but separates vertices that exist in some cycle
   */
  public topSortWithScc(): TopSortResult<T> {
    return this.getTopSortedWithSccSubgraphFrom(Array.from(this.nodes), (_node: T) => true, (_node: T) => {})
  }

  /**
   *
   * computes topological sort order, but vertices that are on cycles are kept separate
   *
   * @param modifiedNodes - seed for computation. During engine init run, all of the vertices of grap. In recomputation run, changed vertices.
   * @param operatingFunction - recomputes value of a node, and returns whether a change occured
   * @param onCycle - action to be performed when node is on cycle
   */
  public getTopSortedWithSccSubgraphFrom(modifiedNodes: T[], operatingFunction: (node: T) => boolean, onCycle: (node: T) => void): TopSortResult<T> {

    const entranceTime: Map<T, number> = new Map()
    const low: Map<T, number> = new Map()
    const parent: Map<T, T | null> = new Map()
    const processed: Set<T> = new Set()
    const onStack: Set<T> = new Set()
    const order: T[] = []

    let time: number = 0

    modifiedNodes.reverse().forEach( (v: T) => {
      if (processed.has(v)) {
        return
      }
      entranceTime.set(v, time)
      // order.push(v)
      low.set(v, time)
      parent.set(v, null)
      time++
      const DFSstack: T[] = [v]
      onStack.add(v)
      while ( DFSstack.length > 0 ) {
        const u = DFSstack[ DFSstack.length - 1 ]
        if ( processed.has(u) ) { // leaving this DFS subtree
          const pu = parent.get(u)
          if ( pu !==  null ) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            low.set(pu!, Math.min(low.get(pu!)!, low.get(u)!))
          }
          DFSstack.pop()
          onStack.delete(u)
          order.push(u)
        } else {
          processed.add(u)
          entranceTime.set(u, time)
          low.set(u, time)
          this.adjacentNodes(u).forEach( (t: T) => {
            if (entranceTime.get(t) !== undefined) { // forward edge or backward edge
              if (onStack.has(t)) { // backward edge
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                low.set(u, Math.min(low.get(u)!, entranceTime.get(t)!))
              }
            } else {
              parent.set(t, u)
              DFSstack.push(t)
              onStack.add(t)
              time++
            }
          })
        }
      }
    })

    const sccMap: Map<T, T> = new Map()
    const sccNonSingletons: Set<T> = new Set()
    order.reverse()
    order.forEach( (v: T) => {
      if (entranceTime.get(v) === low.get(v)) {
        sccMap.set(v, v)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        sccMap.set(v, sccMap.get(parent.get(v) as T)!)
      }
    })

    this.edges.forEach( (targets: Set<T>, v: T) => {
      targets.forEach( (u: T) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const uRepr = sccMap.get(u)!
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const vRepr = sccMap.get(v)!
        if (uRepr === vRepr) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          sccNonSingletons.add(uRepr)
        }
      })
    })

    const shouldBeUpdatedMapping = new Set(modifiedNodes)

    const sorted: T[] = []
    const cycled: T[] = []
    order.forEach( (t: T) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (!sccNonSingletons.has(sccMap.get(t)!)) {
          sorted.push(t)
          if ( shouldBeUpdatedMapping.has(t) && operatingFunction(t)) {
            this.adjacentNodes(t).forEach( (s: T) => shouldBeUpdatedMapping.add(s) )
          }
        } else {
          cycled.push(t)
          onCycle(t)
          this.adjacentNodes(t).forEach( (s: T) => shouldBeUpdatedMapping.add(s) )
        }
      })
    return { sorted, cycled }
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

  public destroy(): void {
    this.edges.clear()
    this.nodes.clear()
    this.specialNodes.clear()
    this.specialNodesStructuralChanges.clear()
    this.clearSpecialNodesRecentlyChanged()
  }

  private removeDependencies(node: T): Set<T> {
    const dependentNodes = this.dependencyQuery(node)
    if (!dependentNodes) {
      return new Set()
    }
    for (const dependentNode of dependentNodes) {
      this.softRemoveEdge(dependentNode, node)
    }
    return dependentNodes
  }
}
