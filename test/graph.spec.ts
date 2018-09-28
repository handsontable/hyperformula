import {Graph} from "../src/Graph";

describe('Basic Graph manipulation', () => {
  it('#addNode', () => {
    const graph = new Graph()

    graph.addNode("foo")

    expect(graph.nodesCount()).toBe(1);
  });

  it('#addNode for the second time', () => {
    const graph = new Graph()

    graph.addNode("foo")
    graph.addNode("foo")

    expect(graph.nodesCount()).toBe(1);
  })

  it('#addNode for the second time doesnt reset adjacent nodes', () => {
    const graph = new Graph()

    graph.addNode("foo")
    graph.addNode("bar")
    graph.addEdge("foo", "bar")

    graph.addNode("foo")

    expect(graph.adjacentNodes("foo")).toEqual(new Set(["bar"]))
  })

  it('#adjacentNodes', () => {
    const graph = new Graph();

    graph.addNode("foo")
    graph.addNode("bar")
    graph.addEdge("foo", "bar")

    expect(graph.adjacentNodes("foo")).toEqual(new Set(["bar"]))
  })

  it('#addEdge is raising an error when the origin node not present', () => {
    const graph = new Graph()
    graph.addNode('target')

    expect(() => {
      graph.addEdge('origin', 'target')
    }).toThrowError(new Error('Unknown node origin'))
  })

  it('#addEdge is raising an error when the target node not present', () => {
    const graph = new Graph()
    graph.addNode('origin')

    expect(() => {
      graph.addEdge('origin', 'target')
    }).toThrowError(new Error('Unknown node target'))
  })

  it("#topologicalSort for empty graph", () => {
    const graph = new Graph()

    expect(graph.topologicalSort()).toEqual([]);
  })
});
