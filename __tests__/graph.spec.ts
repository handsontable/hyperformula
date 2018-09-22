import {Graph} from "../src/Graph";

describe('Basic Graph manipulation', () => {
  it('#addNode', () => {
    const graph = new Graph()

    graph.addNode("foo")

    expect(graph.nodesCount()).toBe(1);
  });

  it('#adjacentNodes', () => {
    const graph = new Graph();

    graph.addNode("foo")
    graph.addNode("bar")
    graph.addEdge("foo", "bar")

    expect(graph.adjacentNodes("foo")).toEqual(new Set(["bar"]))
  })
});
