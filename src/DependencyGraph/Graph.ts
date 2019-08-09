
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
  public specialNodesRecentlyChanged: Set<T> = new Set()

  /** Nodes adjacency mapping. */
  private edges: Map<T, Set<T>> = new Map()

  constructor(
    private readonly getDependenciesQuery: IGetDependenciesQuery<T>
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
    this.edges.delete(node)
    this.nodes.delete(node)
    this.specialNodes.delete(node)
    this.specialNodesRecentlyChanged.delete(node)
    this.removeDependencies(node)
  }

  public markNodeAsSpecial(node: T) {
    this.specialNodes.add(node)
  }

  public markNodeAsSpecialRecentlyChanged(node: T) {
    this.specialNodesRecentlyChanged.add(node)
  }

  public clearSpecialNodesRecentlyChanged() {
    this.specialNodesRecentlyChanged = new Set()
  }

  private removeDependencies(node: T) {
    const dependentNodes = this.getDependenciesQuery.call(node)
    if (!dependentNodes)
      return
    for (const dependentNode of dependentNodes) {
      this.softRemoveEdge(dependentNode, node)
    }
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

  /**
   * Returns topological order of nodes.
   *
   */
  public topologicalSort(): TopSortResult<T> {
    const incomingEdges = this.incomingEdges()
    const nodesWithNoIncomingEdge: T[] = []

    incomingEdges.forEach((currentCount, targetNode) => {
      if (currentCount === 0) {
        nodesWithNoIncomingEdge.push(targetNode)
      }
    })

    let currentNodeIndex = 0
    const topologicalOrdering: T[] = []
    while (currentNodeIndex < nodesWithNoIncomingEdge.length) {
      const currentNode = nodesWithNoIncomingEdge[currentNodeIndex] as T
      topologicalOrdering.push(currentNode)
      this.edges.get(currentNode)!.forEach((targetNode) => {
        incomingEdges.set(targetNode, incomingEdges.get(targetNode)! - 1)
        if (incomingEdges.get(targetNode) === 0) {
          nodesWithNoIncomingEdge.push(targetNode)
        }
      })
      ++currentNodeIndex
    }

    if (topologicalOrdering.length !== this.nodes.size) {
      const nodesOnCycle = new Set(this.nodes.values())
      for (let i = 0; i < topologicalOrdering.length; ++i) {
        nodesOnCycle.delete(topologicalOrdering[i])
      }
      return { sorted: topologicalOrdering, cycled: Array.from(nodesOnCycle) }
    }

    return { sorted: topologicalOrdering, cycled: [] }
  }

  public getTopologicallySortedSubgraphFrom(vertices: T[]): TopSortResult<T> {
    const subgraphNodes = this.computeSubgraphNodes(vertices)
    const incomingEdges = this.incomingEdgesForSubgraph(subgraphNodes)
    const nodesWithNoIncomingEdge = vertices

    let currentNodeIndex = 0
    const topologicalOrdering: T[] = []
    while (currentNodeIndex < nodesWithNoIncomingEdge.length) {
      const currentNode = nodesWithNoIncomingEdge[currentNodeIndex]!
      topologicalOrdering.push(currentNode)
      this.edges.get(currentNode)!.forEach((targetNode) => {
        if (subgraphNodes.has(targetNode)) {
          incomingEdges.set(targetNode, incomingEdges.get(targetNode)! - 1)
          if (incomingEdges.get(targetNode) === 0) {
            nodesWithNoIncomingEdge.push(targetNode)
          }
        }
      })
      ++currentNodeIndex
    }

    if (topologicalOrdering.length !== subgraphNodes.size) {
      const nodesOnCycle = new Set(subgraphNodes.values())
      for (let i = 0; i < topologicalOrdering.length; ++i) {
        nodesOnCycle.delete(topologicalOrdering[i])
      }
      return { sorted: topologicalOrdering, cycled: Array.from(nodesOnCycle) }
    }

    return { sorted: topologicalOrdering, cycled: [] }
  }

  public getTopologicallySortedSubgraphFrom2(vertices: T[], operatingFunction: (node: T) => boolean): T[] {
    const subgraphNodes = this.computeSubgraphNodes(vertices)
    const incomingEdges = this.incomingEdgesForSubgraph(subgraphNodes)
    const shouldBeUpdatedMapping = new Set(vertices)
    const nodesWithNoIncomingEdge: T[] = []
    incomingEdges.forEach((currentCount, targetNode) => {
      if (currentCount === 0) {
        nodesWithNoIncomingEdge.push(targetNode)
      }
    })

    let currentNodeIndex = 0
    while (currentNodeIndex < nodesWithNoIncomingEdge.length) {
      const currentNode = nodesWithNoIncomingEdge[currentNodeIndex]!
      let result: boolean
      if (shouldBeUpdatedMapping.has(currentNode)) {
        result = operatingFunction(currentNode)
      } else {
        result = false
      }
      this.edges.get(currentNode)!.forEach((targetNode) => {
        if (subgraphNodes.has(targetNode)) {
          if (result) {
            shouldBeUpdatedMapping.add(targetNode)
          }
          incomingEdges.set(targetNode, incomingEdges.get(targetNode)! - 1)
          if (incomingEdges.get(targetNode) === 0) {
            nodesWithNoIncomingEdge.push(targetNode)
          }
        }
      })
      ++currentNodeIndex
    }

    if (nodesWithNoIncomingEdge.length !== subgraphNodes.size) {
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

  public getDependecies(vertex: T): T[] {
    const result: T[] = []
    this.edges.forEach((adjacentNodes, sourceNode) => {
      if (adjacentNodes.has(vertex)) {
        result.push(sourceNode)
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
