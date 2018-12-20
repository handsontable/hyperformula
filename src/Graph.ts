import {FormulaCellVertex} from './Vertex'

/**
 * Provides graph structure
 */
export class Graph<T> {
  private nodes: Set<T>
  private edges: Map<T, Set<T>>

  constructor() {
    this.nodes = new Set()
    this.edges = new Map()
  }

  /**
   * Adds node to a graph
   *
   * @param id - a node to be added
   */
  public addNode(id: T) {
    this.nodes.add(id)
    if (!this.edges.has(id)) {
      this.edges.set(id, new Set())
    }
  }

  /**
   * Adds edge between nodes.
   *
   * The nodes had to be added to the graph before, or the error will be raised
   *
   * @param fromId - node from which edge is outcoming
   * @param toId - node to which edge is incoming
   */
  public addEdge(fromId: T, toId: T) {
    if (!this.nodes.has(fromId)) {
      throw new Error(`Unknown node ${fromId}`)
    }
    if (!this.nodes.has(toId)) {
      throw new Error(`Unknown node ${toId}`)
    }
    this.edges.get(fromId)!.add(toId)
  }

  /**
   * Returns nodes adjacent to given node
   *
   * @param id - node to which adjacent nodes we want to retrieve
   */
  public adjacentNodes(id: T): Set<T> {
    return this.edges.get(id)!
  }

  /**
   * Checks whether a node is present in graph
   *
   * @param id - node to check
   */
  public hasNode(id: T): boolean {
    return this.nodes.has(id)
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
      const nodesOnCycle = new Set(this.nodes)
      for (let i = 0; i < topologicalOrdering.length; ++i) {
        nodesOnCycle.delete(topologicalOrdering[i])
      }
      return { sorted: topologicalOrdering, cycled: Array.from(nodesOnCycle) }
    }

    return { sorted: topologicalOrdering, cycled: [] }
  }

  /**
   * Builds a mapping from nodes to the count of their incoming edges.
   */
  public incomingEdges(): Map<T, number> {
    const incomingEdges: Map<T, number> = new Map()
    this.nodes.forEach((node) => (incomingEdges.set(node, 0)))
    this.edges.forEach((adjacentNodes, sourceNode) => {
      adjacentNodes.forEach((targetNode) => {
        incomingEdges.set(targetNode, incomingEdges.get(targetNode)! + 1)
      })
    })
    return incomingEdges
  }
}
