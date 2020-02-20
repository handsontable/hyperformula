
export interface IGetDependenciesQuery<T> {
  call(node: T): Set<T> | null
}

export interface TopSortResult<T> { sorted: T[], cycled: T[] }

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

  /** Nodes adjacency mapping. */
  private edges: Map<T, Set<T>> = new Map()

  constructor(
    private readonly getDependenciesQuery: IGetDependenciesQuery<T>,
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
    this.edges.get(fromNode)!.add(toNode)
  }

  public removeEdge(fromNode: T, toNode: T) {
    if (this.existsEdge(fromNode, toNode)) {
      this.edges.get(fromNode)!.delete(toNode)
    } else {
      throw new Error('Edge does not exist')
    }
  }

  public softRemoveEdge(fromNode: T, toNode: T) {
    const edges = this.edges.get(fromNode)
    if (edges) {
      edges.delete(toNode)
    }
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

  public exchangeNode(oldNode: T, newNode: T) {
    this.addNode(newNode)
    this.adjacentNodes(oldNode).forEach((adjacentNode) => {
      this.addEdge(newNode, adjacentNode)
    })
    this.removeNode(oldNode)
  }

  public exchangeOrAddNode(oldNode: T | null, newNode: T) {
    if (oldNode) {
      this.exchangeNode(oldNode, newNode)
    } else {
      this.addNode(newNode)
    }
  }

  public removeNode(node: T) {
    for (const adjacentNode of this.adjacentNodes(node).values()) {
      this.markNodeAsSpecialRecentlyChanged(adjacentNode)
    }
    this.edges.delete(node)
    this.nodes.delete(node)
    this.specialNodes.delete(node)
    this.specialNodesRecentlyChanged.delete(node)
    this.specialNodesStructuralChanges.delete(node)
    this.removeDependencies(node)
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

  /**
   * Checks whether exists edge between nodes
   *
   * @param fromNode - node from which edge is outcoming
   * @param toNode - node to which edge is incoming
   */
  public existsEdge(fromNode: T, toNode: T): boolean {
    const nodeEdges = this.edges.get(fromNode)
    if (nodeEdges) {
      return nodeEdges.has(toNode)
    }
    return false
  }

  /*
   * return a topological sort order, but separates vertices that exist in some cycle
   */
  public topSortWithScc(): TopSortResult<T> {
    return this.getTopSortedWithSccSubgraphFrom(this.nodes, (node: T) => true, (node: T) => {})
  }

  public getTopSortedWithSccSubgraphFrom(vertices: Set<T>, operatingFunction: (node: T) => boolean, onCycle: (node: T) => void): TopSortResult<T> {

    const disc: Map<T, number> = new Map()
    const low: Map<T, number> = new Map()
    const parent: Map<T, T | null> = new Map()
    const processed: Set<T> = new Set()
    const onStack: Set<T> = new Set()
    const flatOrder: T[] = []
    const deepOrder: T[][] = []

    let time: number = 0

    vertices.forEach( (v: T) => {
      if (processed.has(v)) {
        return
      }
      const shortOrder: T[] = []
      disc.set(v, time)
      flatOrder.push(v)
      shortOrder.push(v)
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
            low.set(pu!, Math.min(low.get(pu!)!, low.get(u)!))
          }
          DFSstack.pop()
          onStack.delete(u)
        } else {
          this.adjacentNodes(u).forEach( (t: T) => {
            if (disc.get(t) !== undefined) { // forward edge or backward edge
              if (onStack.has(t)) { // backward edge
                low.set(u, Math.min(low.get(u)!, disc.get(t)!))
              }
            } else {
              disc.set(t, time)
              flatOrder.push(t)
              shortOrder.push(t)
              low.set(t, time)
              parent.set(t, u)
              DFSstack.push(t)
              onStack.add(t)
              time++
            }
          })
          processed.add(u)
        }
      }
      deepOrder.push(shortOrder)
    })

    const sccMap: Map<T, T> = new Map()
    const sccInnerEdgeCnt: Map<T, number> = new Map()
    flatOrder.forEach( (v: T) => {
      if (disc.get(v) === low.get(v)) {
        sccMap.set(v, v)
        sccInnerEdgeCnt.set(v, 0)
      } else {
        sccMap.set(v, sccMap.get(parent.get(v) as T)!)
      }
    })

    this.edges.forEach( (targets: Set<T>, v: T) => {
      targets.forEach( (u: T) => {
        const uRepr = sccMap.get(u)!
        const vRepr = sccMap.get(v)!
        if (uRepr === vRepr) {
          sccInnerEdgeCnt.set(uRepr, sccInnerEdgeCnt.get(uRepr)! + 1)
        }
      })
    })

    const shouldBeUpdatedMapping = new Set(vertices)

    const sorted: T[] = []
    const cycled: T[] = []
    deepOrder.reverse().forEach( (arr: T[]) =>
      arr.forEach( (t: T) => {
        const tRepr = sccMap.get(t)!
        if (sccInnerEdgeCnt.get(tRepr) === 0) {
          sorted.push(t)
          if ( shouldBeUpdatedMapping.has(t) && operatingFunction(t)) {
            this.adjacentNodes(t).forEach( (s: T) => shouldBeUpdatedMapping.add(s) )
          }
        } else {
          cycled.push(t)
          // operatingFunction(t)
          onCycle(t)
          this.adjacentNodes(t).forEach( (s: T) => shouldBeUpdatedMapping.add(s) )
        }
      }),
    )
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

  private removeDependencies(node: T) {
    const dependentNodes = this.getDependenciesQuery.call(node)
    if (!dependentNodes) {
      return
    }
    for (const dependentNode of dependentNodes) {
      this.softRemoveEdge(dependentNode, node)
    }
  }

  private findCycles(nodes: Set<T>, nodesWithNoIncomingEdge: T[], incomingEdges: Map<T, number>): T[] {
    if (nodesWithNoIncomingEdge.length !== nodes.size) {
      const nodesOnCycle: T[] = []
      for (const [node, incomingEdgesCount] of incomingEdges) {
        if (incomingEdgesCount !== 0) {
          nodesOnCycle.push(node)
        }
      }
      return nodesOnCycle
    } else {
      return []
    }
  }

  private nodesWithNoIncomingEdge(incomingEdges: Map<T, number>): T[] {
    const result: T[] = []
    incomingEdges.forEach((currentCount, targetNode) => {
      if (currentCount === 0) {
        result.push(targetNode)
      }
    })
    return result
  }

  private computeSubgraphNodes(vertices: T[]): Set<T> {
    const result = new Set(vertices)
    const queue = Array.from(vertices)
    let currentNodeIndex = 0
    while (currentNodeIndex < queue.length) {
      const vertex = queue[currentNodeIndex]
      for (const adjacentNode of this.adjacentNodes(vertex)) {
        if (!result.has(adjacentNode)) {
          result.add(adjacentNode)
          queue.push(adjacentNode)
        }
      }
      currentNodeIndex++
    }
    return result
  }

  /**
   * Builds a mapping from nodes to the count of their incoming edges.
   */
  private incomingEdges(): Map<T, number> {
    const incomingEdges: Map<T, number> = new Map()
    this.nodes.forEach((node, id) => (incomingEdges.set(node, 0)))
    this.edges.forEach((adjacentNodes, sourceNode) => {
      adjacentNodes.forEach((targetNode) => {
        incomingEdges.set(targetNode, incomingEdges.get(targetNode)! + 1)
      })
    })
    return incomingEdges
  }

  private incomingEdgesForSubgraph(subgraphNodes: Set<T>): Map<T, number> {
    const incomingEdges: Map<T, number> = new Map()
    subgraphNodes.forEach((node) => (incomingEdges.set(node, 0)))
    subgraphNodes.forEach((sourceNode) => {
      const adjacentNodes = this.edges.get(sourceNode)!
      adjacentNodes.forEach((targetNode) => {
        if (subgraphNodes.has(targetNode) && subgraphNodes.has(sourceNode)) {
          incomingEdges.set(targetNode, incomingEdges.get(targetNode)! + 1)
        }
      })
    })
    return incomingEdges
  }
}
