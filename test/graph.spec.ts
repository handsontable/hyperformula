import {Graph} from '../src/Graph'

const identifiableString = (id: number, str: string) => ({ id, str })

describe('Basic Graph manipulation', () => {
  it('#addNode', () => {
    const graph = new Graph()

    const node = identifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.nodesCount()).toBe(1)
  })

  it('#addNode for the second time', () => {
    const graph = new Graph()

    const node = identifiableString(0, 'foo')
    graph.addNode(node)
    graph.addNode(node)

    expect(graph.nodesCount()).toBe(1)
  })

  it('#addNode for the second time doesnt reset adjacent nodes', () => {
    const graph = new Graph()

    const node0 = identifiableString(0, 'foo')
    const node1 = identifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    graph.addNode(node0)

    expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
  })

  it('#hasNode when there is node', () => {
    const graph = new Graph()

    const node = identifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.hasNode(node)).toBe(true)
  })

  it('#hasNode when there is no node', () => {
    const graph = new Graph()

    expect(graph.hasNode(identifiableString(0, 'foo'))).toBe(false)
  })

  it('#adjacentNodes', () => {
    const graph = new Graph()

    const node0 = identifiableString(0, 'foo')
    const node1 = identifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
  })

  it('#addEdge removes multiple edges', () => {
    const graph = new Graph()

    const node0 = identifiableString(0, 'foo')
    const node1 = identifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)
    graph.addEdge(node0, node1)

    expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
  })

  it('#addEdge is raising an error when the origin node not present', () => {
    const graph = new Graph()
    const node = identifiableString(1, 'target')
    graph.addNode(node)

    expect(() => {
      graph.addEdge(identifiableString(0, 'origin'), node)
    }).toThrowError('Unknown node')
  })

  it('#addEdge is raising an error when the target node not present', () => {
    const graph = new Graph()
    const node = identifiableString(0, 'origin')
    graph.addNode(node)

    expect(() => {
      graph.addEdge(node, identifiableString(1, 'target'))
    }).toThrowError('Unknown node')
  })

  it('#existsEdge works', () => {
    const graph = new Graph()
    const node0 = identifiableString(0, 'foo')
    const node1 = identifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    expect(graph.existsEdge(node0, node1)).toBe(true)
  })

  it('#existsEdge when there is origin node but no edge', () => {
    const graph = new Graph()
    const node = identifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.existsEdge(node, identifiableString(1, 'bar'))).toBe(false)
  })

  it('#existsEdge when there is no node', () => {
    const graph = new Graph()

    expect(graph.existsEdge(identifiableString(0, 'foo'), identifiableString(1, 'bar'))).toBe(false)
  })

  it('#edgesCount when there is no nodes', () => {
    const graph = new Graph()

    expect(graph.edgesCount()).toBe(0)
  })

  it('#edgesCount counts edges from all nodes', () => {
    const graph = new Graph()
    const node0 = identifiableString(0, 'bar1')
    const node1 = identifiableString(1, 'bar2')
    graph.addNode(node0)
    graph.addNode(node1)
    const node2 = identifiableString(2, 'first')
    graph.addNode(node2)
    graph.addEdge(node2, node0)
    const node3 = identifiableString(2, 'second')
    graph.addNode(node3)
    graph.addEdge(node3, node0)
    graph.addEdge(node3, node1)

    expect(graph.edgesCount()).toBe(3)
  })

  it('#topologicalSort for empty graph', () => {
    const graph = new Graph()

    expect(graph.topologicalSort().sorted).toEqual([])
    expect(graph.topologicalSort().cycled).toEqual([])
  })

  it('#topologicalSort node is included even if he is not connected to anything', () => {
    const graph = new Graph()
    const node = identifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.topologicalSort().sorted).toEqual([node])
    expect(graph.topologicalSort().cycled).toEqual([])
  })

  it('#topologicalSort for simple graph', () => {
    const graph = new Graph()
    const node0 = identifiableString(0, 'foo')
    const node1 = identifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node1, node0)

    expect(graph.topologicalSort().sorted).toEqual([node1, node0])
    expect(graph.topologicalSort().cycled).toEqual([])
  })

  it('#topologicalSort for more complex graph', () => {
    const graph = new Graph()
    const node0 = identifiableString(0, 'x0')
    const node1 = identifiableString(1, 'x1')
    const node2 = identifiableString(2, 'x2')
    const node3 = identifiableString(3, 'x3')
    const node4 = identifiableString(4, 'x4')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addNode(node2)
    graph.addNode(node3)
    graph.addNode(node4)
    graph.addEdge(node0, node2)
    graph.addEdge(node1, node2)
    graph.addEdge(node2, node3)
    graph.addEdge(node4, node3)

    expect(graph.topologicalSort().sorted).toEqual([node0, node1, node4, node2, node3])
    expect(graph.topologicalSort().cycled).toEqual([])
  })

  it('#topologicalSort for not connected graph', () => {
    const graph = new Graph()
    const node0 = identifiableString(0, 'x0')
    const node1 = identifiableString(1, 'x1')
    const node2 = identifiableString(2, 'x2')
    const node3 = identifiableString(3, 'x3')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addNode(node2)
    graph.addNode(node3)
    graph.addEdge(node0, node2)
    graph.addEdge(node1, node3)

    expect(graph.topologicalSort().sorted).toEqual([node0, node1, node2, node3])
    expect(graph.topologicalSort().cycled).toEqual([])
  })

  it('#topologicalSort returns vertices on trivial cycle', () => {
    const graph = new Graph()
    const node0 = identifiableString(0, 'x0')
    const node1 = identifiableString(1, 'x1')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)
    graph.addEdge(node1, node0)

    expect(graph.topologicalSort().sorted).toEqual([])
    expect(graph.topologicalSort().cycled).toEqual([node0, node1])
  })

  it('#topologicalSort returns vertices on cycle', () => {
    const graph = new Graph()
    const node0 = identifiableString(0, 'x0')
    const node1 = identifiableString(1, 'x1')
    const node2 = identifiableString(2, 'x2')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addNode(node2)
    graph.addEdge(node0, node1)
    graph.addEdge(node1, node2)
    graph.addEdge(node1, node1)

    expect(graph.topologicalSort().sorted).toEqual([node0])
    expect(graph.topologicalSort().cycled).toEqual([node1, node2])
  })

  it('#topologicalSort returns one-element cycle', () => {
    const graph = new Graph()
    const node = identifiableString(0, 'foo')
    graph.addNode(node)
    graph.addEdge(node, node)

    expect(graph.topologicalSort().sorted).toEqual([])
    expect(graph.topologicalSort().cycled).toEqual([node])
  })
})
