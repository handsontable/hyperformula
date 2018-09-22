import {Graph} from "../src/Graph";
import {Vertex} from "../src/Vertex";

describe('Graph with Vertex', () => {
  it('#addNode works correctly with Vertex instances', () => {
    const graph = new Graph<Vertex>()

    const v1 = new Vertex();
    const v2 = new Vertex();
    graph.addNode(v1)
    graph.addNode(v1)
    graph.addNode(v2)

    expect(graph.nodesCount()).toBe(2);
  });
});
