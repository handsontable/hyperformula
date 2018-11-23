import {FormulaCellVertex} from "./Vertex";

export class Graph<T> {
  private nodes: Set<T>
  private edges: Map<T, Set<T>>

  constructor() {
    this.nodes = new Set()
    this.edges = new Map()
  }

  public addNode(id: T) {
    this.nodes.add(id)
    if (!this.edges.has(id)) {
      this.edges.set(id, new Set())
    }
  }

  public addEdge(fromId: T, toId: T) {
    if (!this.nodes.has(fromId)) {
      throw new Error(`Unknown node ${fromId}`)
    }
    if (!this.nodes.has(toId)) {
      throw new Error(`Unknown node ${toId}`)
    }
    this.edges.get(fromId)!.add(toId)
  }

  public adjacentNodes(id: T): Set<T> {
    return this.edges.get(id)!
  }

  public hasNode(id: T): boolean {
    return this.nodes.has(id)
  }

  public nodesCount(): number {
    return this.nodes.size
  }

  public edgesCount(): number {
    let result = 0
    this.edges.forEach((edgesForNode) => (result += edgesForNode.size))
    return result
  }

  public existsEdge(fromNode: T, toNode: T): boolean {
    const nodeEdges = this.edges.get(fromNode)
    if (nodeEdges) {
      return nodeEdges.has(toNode)
    }
    return false
  }

  public topologicalSort(): [T[], T[]] {
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
      return [topologicalOrdering, Array.from(nodesOnCycle)]
    }

    return [topologicalOrdering, []]
  }

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
