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

  it('#addEdge removes multiple edges', () => {
    const graph = new Graph();

    graph.addNode("foo")
    graph.addNode("bar")
    graph.addEdge("foo", "bar")
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

  it("#topologicalSort node is included even if he is not connected to anything", () => {
    const graph = new Graph()
    graph.addNode("foo")

    expect(graph.topologicalSort()).toEqual(["foo"]);
  })

  it("#topologicalSort for simple graph", () => {
    const graph = new Graph()
    graph.addNode("foo")
    graph.addNode("bar")
    graph.addEdge("bar", "foo")

    expect(graph.topologicalSort()).toEqual(["bar", "foo"]);
  })

  it("#topologicalSort for more complex graph", () => {
    const graph = new Graph()
    graph.addNode("x0")
    graph.addNode("x1")
    graph.addNode("x2")
    graph.addNode("x3")
    graph.addNode("x4")
    graph.addEdge("x0", "x2")
    graph.addEdge("x1", "x2")
    graph.addEdge("x2", "x3")
    graph.addEdge("x4", "x3")

    expect(graph.topologicalSort()).toEqual(["x0", "x1", "x4", "x2", "x3"]);
  })

  it("#topologicalSort for not connected graph", () => {
    const graph = new Graph()
    graph.addNode("x0")
    graph.addNode("x1")
    graph.addNode("x2")
    graph.addNode("x3")
    graph.addEdge("x0", "x2")
    graph.addEdge("x1", "x3")

    expect(graph.topologicalSort()).toEqual(["x0", "x1", "x2", "x3"]);
  })

  it("#topologicalSort raise an error if has a trivial cycle", () => {
    const graph = new Graph()
    graph.addNode("x1")
    graph.addNode("x2")
    graph.addEdge("x1", "x2")
    graph.addEdge("x1", "x1")

    expect(() => {
      graph.topologicalSort()
    }).toThrowError(new Error('Graph has a cycle'))
  })

  it("#topologicalSort raise an error if has a cycle", () => {
    const graph = new Graph()
    graph.addNode("x0")
    graph.addNode("x1")
    graph.addNode("x2")
    graph.addEdge("x0", "x1")
    graph.addEdge("x1", "x2")
    graph.addEdge("x1", "x1")

    expect(() => {
      graph.topologicalSort()
    }).toThrowError(new Error('Graph has a cycle'))
  })
});
