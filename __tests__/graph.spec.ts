import {Graph} from "../src/Graph";

describe('Basic Graph manipulation', () => {
  it('#addNode', () => {
    const graph = new Graph()

    graph.addNode("foo")

    expect(graph.nodesCount()).toBe(1);
  });
});
