import {GraphBuilder} from "../src/GraphBuilder";
import {Graph} from "../src/Graph";
import {Vertex} from "../src/Vertex";

describe('GraphBuilder', () => {
  it('#buildGraph', () => {
    const graph = new Graph<Vertex>()
    const addressMapping : Map<string, Vertex> = new Map()

    let graphBuilder = new GraphBuilder(graph, addressMapping)

    graphBuilder.buildGraph([
        ['1', 'A5', '2'],
        ['foo', 'bar', '=A2']
    ])

    expect(graph.nodesCount()).toBe(6)
  });
});
