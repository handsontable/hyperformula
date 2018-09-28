export class Graph<T> {
  private nodes : Set<T>
  private edges : Map<T,Set<T>>

  constructor() {
    this.nodes = new Set()
    this.edges = new Map()
  }

  addNode(id: T) {
    this.nodes.add(id)
    if (!this.edges.has(id)) {
      this.edges.set(id, new Set())
    }
  }

  addEdge(fromId: T, toId: T) {
    if (!this.nodes.has(fromId))
      throw new Error(`Unknown node ${fromId}`)
    if (!this.nodes.has(toId))
      throw new Error(`Unknown node ${toId}`)
    this.edges.get(fromId)!.add(toId)
  }

  adjacentNodes(id: T) {
    return this.edges.get(id)
  }

  nodesCount() {
    return this.nodes.size
  }
}
