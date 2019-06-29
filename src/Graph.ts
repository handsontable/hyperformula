/**
 * Provides graph directed structure
 */
import {RangeVertex, Vertex} from "./Vertex";

export class Graph<T> {
  /** Set with nodes in graph. */
  public nodes: Set<T>

  /** Nodes adjacency mapping. */
  private edges: Map<T, Set<T>>


  constructor() {
    this.nodes = new Set()
    this.edges = new Map()
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
      this.edges.get(fromNode)!.delete(toNode);
    } else {
      throw new Error("Edge does not exist");
    }
  }

  public removeIncomingEdges(toNode: T) {
    this.edges.forEach(nodeEdges => {
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
    this.adjacentNodes(oldNode).forEach(adjacentNode => {
      this.addEdge(newNode, adjacentNode)
    })
    this.removeNode(oldNode)
  }

  public removeNode(node: T) {
    this.edges.delete(node)
    this.nodes.delete(node)
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
  public topologicalSort(): { sorted: T[], cycled: T[] } {
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

  public getTopologicallySortedSubgraphFrom(vertex: T): { sorted: T[], cycled: T[] } {
    const subgraphNodes = this.computeSubgraphNodes(vertex)
    const incomingEdges = this.incomingEdgesForSubgraph(subgraphNodes)
    const nodesWithNoIncomingEdge = [vertex]

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

  private computeSubgraphNodes(vertex: T): Set<T> {
    const result = new Set([vertex])
    const rec = (n: T) => {
      for (const adjacentNode of this.adjacentNodes(n)) {
        if (!result.has(adjacentNode)) {
          result.add(adjacentNode)
          rec(adjacentNode)
        }
      }
    }
    rec(vertex)
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

  public getDependecies(vertex: T): Array<T> {
    const result: Array<T> = []
    this.edges.forEach((adjacentNodes, sourceNode) => {
      if (adjacentNodes.has(vertex)) {
        result.push(sourceNode)
      }
    })
    return result
  }
}
