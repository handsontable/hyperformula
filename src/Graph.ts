export class Graph {
  private nodes : Set<string>;
  private edges : Map<string,Set<string>>;

  constructor() {
    this.nodes = new Set();
    this.edges = new Map();
  }

  addNode(id: string) {
    this.nodes.add(id);
    this.edges.set(id, new Set());
  }

  addEdge(fromId: string, toId: string) {
    return this.edges.get(fromId)!.add(toId)
  }

  adjacentNodes(id: string) {
    return this.edges.get(id);
  }

  nodesCount() {
    return this.nodes.size;
  }
}
