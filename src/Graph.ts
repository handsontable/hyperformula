export class Graph {
  private nodes : Set<string>;
  private edges : Map<string,Set<string>>;

  constructor() {
    this.nodes = new Set();
    this.edges = new Map();
  }

  addNode(id: string) {
    this.nodes.add(id);
    if (!this.edges.has(id)) {
      this.edges.set(id, new Set())
    }
  }

  addEdge(fromId: string, toId: string) {
    if (!this.nodes.has(fromId))
      throw new Error(`Unknown node ${fromId}`)
    if (!this.nodes.has(toId))
      throw new Error(`Unknown node ${toId}`)
    this.edges.get(fromId)!.add(toId);
  }

  adjacentNodes(id: string) {
    return this.edges.get(id);
  }

  nodesCount() {
    return this.nodes.size;
  }
}
