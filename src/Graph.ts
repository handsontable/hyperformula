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

  nodesCount(): number {
    return this.nodes.size;
  }

  edgesCount(): number {
    let result = 0
    this.edges.forEach((edgesForNode) => (result += edgesForNode.size))
    return result
  }

  existsEdge(fromNode: T, toNode: T) {
    const nodeEdges = this.edges.get(fromNode)
    if (nodeEdges) {
      return nodeEdges.has(toNode)
    }
    return false
  }

  topologicalSort() : Array<T> {
    const incomingEdges = this.incomingEdges()
    const nodesWithNoIncomingEdge: Array<T> = []

    incomingEdges.forEach((currentCount, targetNode) => {
      if (currentCount === 0) {
        nodesWithNoIncomingEdge.push(targetNode)
      }
    })

    let currentNodeIndex = 0;
    const topologicalOrdering: Array<T> = []
    while (currentNodeIndex < nodesWithNoIncomingEdge.length) {
      const currentNode = nodesWithNoIncomingEdge[currentNodeIndex] as T
      topologicalOrdering.push(currentNode)
      this.edges.get(currentNode)!.forEach((targetNode) => {
        incomingEdges.set(targetNode, incomingEdges.get(targetNode)! - 1)
        if (incomingEdges.get(targetNode) === 0) {
          nodesWithNoIncomingEdge.push(targetNode)
        }
      })
      ++currentNodeIndex;
    }

    if (topologicalOrdering.length !== this.nodes.size) {
      throw new Error(`Graph has a cycle`)
    }

    return topologicalOrdering
  }

  incomingEdges() : Map<T, number> {
    const incomingEdges: Map<T, number> = new Map()
    this.nodes.forEach((node) => (incomingEdges.set(node, 0)))
    this.edges.forEach((adjacentNodes, sourceNode) => {
      adjacentNodes.forEach((targetNode) => {
        incomingEdges.set(targetNode, incomingEdges.get(targetNode)! + 1)
      })
    });
    return incomingEdges;
  }
}
