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
    const nodesWithNoIncomingEdge = [] as Array<T>
    reversedEdges.forEach((sourceNodes, targetNode) => {
      if (sourceNodes.size === 0) {
        nodesWithNoIncomingEdge.push(targetNode)
      }
    })
    const topologicalOrdering = [] as Array<T>;
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
    return topologicalOrdering
  }

  reversedEdges() {
    const reversedEdges = new Map() as Map<T, Set<T>>
    this.nodes.forEach((node) => reversedEdges.set(node, new Set()))
    this.edges.forEach((adjacentNodes, sourceNode) => {
      adjacentNodes.forEach((targetNode) => {
        reversedEdges.get(targetNode)!.add(sourceNode)
      })
    });
    return reversedEdges;
  }
}
