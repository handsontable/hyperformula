import {GraphBuilder} from "../src/GraphBuilder";
import {Graph} from "../src/Graph";
import {Vertex} from "../src/Vertex";

describe('GraphBuilder', () => {
  it('#buildGraph', () => {
    let graphBuilder = new GraphBuilder()

    let graph = graphBuilder.buildGraph([
        ['1', 'A5', '=SUM(1,2,3)'],
        ['foo', 'bar', '=A2']
    ])

    expect(graph.nodesCount()).toBe(6)
  });
});
