import {GraphBuilder, Sheet} from "./GraphBuilder";
import {Vertex} from "./Vertex";
import {Graph} from "./Graph";


export class HandsOnEngine {
  private addressMapping: Map<string, Vertex> = new Map()
  private graph: Graph<Vertex> = new Graph()

  loadSheet(sheet : Sheet) {
    const graphBuilder = new GraphBuilder(this.graph, this.addressMapping)
  }
}
