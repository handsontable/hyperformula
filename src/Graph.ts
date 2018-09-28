export class Graph<T> {
  private nodes : Set<T>;
  private edges : Map<T,Set<T>>;

  constructor() {
    this.nodes = new Set();
    this.edges = new Map();
  }

  addNode(id: T) {
    this.nodes.add(id);
    if (!this.edges.has(id)) {
      this.edges.set(id, new Set())
    }
  }

  addEdge(fromId: T, toId: T) {
    if (!this.nodes.has(fromId))
      throw new Error(`Unknown node ${fromId}`)
    if (!this.nodes.has(toId))
      throw new Error(`Unknown node ${toId}`)
    this.edges.get(fromId)!.add(toId);
  }

  adjacentNodes(id: T) {
    return this.edges.get(id);
  }

  nodesCount() {
    return this.nodes.size;
  }

  topologicalSort() : Array<T> {
    const reversedEdges = this.reversedEdges()
    const nodesWithNoIncomingEdge: Array<T> = []
    reversedEdges.forEach((sourceNodes, targetNode) => {
      if (sourceNodes.size === 0) {
        nodesWithNoIncomingEdge.push(targetNode)
      }
    })
    const topologicalOrdering: Array<T> = []
    while (nodesWithNoIncomingEdge.length > 0) {
      const currentNode = nodesWithNoIncomingEdge.shift() as T
      topologicalOrdering.push(currentNode)
      this.edges.get(currentNode)!.forEach((targetNode) => {
        reversedEdges.get(targetNode)!.delete(currentNode)
        if (reversedEdges.get(targetNode)!.size === 0) {
          nodesWithNoIncomingEdge.push(targetNode)
        }
      })
    }
    if (topologicalOrdering.length !== this.nodes.size) {
      throw new Error(`Graph has a cycle`)
    }
    return topologicalOrdering
  }

  reversedEdges() : Map<T, Set<T>> {
    const reversedEdges: Map<T, Set<T>> = new Map()
    this.nodes.forEach((node) => reversedEdges.set(node, new Set()))
    this.edges.forEach((adjacentNodes, sourceNode) => {
      adjacentNodes.forEach((targetNode) => {
        reversedEdges.get(targetNode)!.add(sourceNode)
      })
    });
    return reversedEdges;
  }
}
