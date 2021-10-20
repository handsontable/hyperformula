import {Graph} from '../src/DependencyGraph'

const identifiableString = (id: number, str: string) => ({id, str})

const dummyGetDependenciesQuery: () => any[] = () => []

describe('Basic Graph manipulation', () => {
  it('#addNode', () => {
    const graph = new Graph(dummyGetDependenciesQuery)

    const node = identifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.nodesCount()).toBe(1)
  })

  it('#addNode for the second time', () => {
    const graph = new Graph(dummyGetDependenciesQuery)

    const node = identifiableString(0, 'foo')
    graph.addNode(node)
    graph.addNode(node)

    expect(graph.nodesCount()).toBe(1)
  })

  it('#addNode for the second time doesnt reset adjacent nodes', () => {
    const graph = new Graph(dummyGetDependenciesQuery)

    const node0 = identifiableString(0, 'foo')
    const node1 = identifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    graph.addNode(node0)

    expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
  })

  it('#hasNode when there is node', () => {
    const graph = new Graph(dummyGetDependenciesQuery)

    const node = identifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.hasNode(node)).toBe(true)
  })

  it('#hasNode when there is no node', () => {
    const graph = new Graph(dummyGetDependenciesQuery)

    expect(graph.hasNode(identifiableString(0, 'foo'))).toBe(false)
  })

  it('#adjacentNodes', () => {
    const graph = new Graph(dummyGetDependenciesQuery)

    const node0 = identifiableString(0, 'foo')
    const node1 = identifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
  })

  it('#addEdge removes multiple edges', () => {
    const graph = new Graph(dummyGetDependenciesQuery)

    const node0 = identifiableString(0, 'foo')
    const node1 = identifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)
    graph.addEdge(node0, node1)

    expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
  })

  it('#addEdge is raising an error when the origin node not present', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node = identifiableString(1, 'target')
    graph.addNode(node)

    expect(() => {
      graph.addEdge(identifiableString(0, 'origin'), node)
    }).toThrowError(/Unknown node/)
  })

  it('#addEdge is raising an error when the target node not present', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node = identifiableString(0, 'origin')
    graph.addNode(node)

    expect(() => {
      graph.addEdge(node, identifiableString(1, 'target'))
    }).toThrowError(/Unknown node/)
  })

  it('#existsEdge works', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node0 = identifiableString(0, 'foo')
    const node1 = identifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    expect(graph.existsEdge(node0, node1)).toBe(true)
  })

  it('#existsEdge when there is origin node but no edge', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node = identifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.existsEdge(node, identifiableString(1, 'bar'))).toBe(false)
  })

  it('#existsEdge when there is no node', () => {
    const graph = new Graph(dummyGetDependenciesQuery)

    expect(graph.existsEdge(identifiableString(0, 'foo'), identifiableString(1, 'bar'))).toBe(false)
  })

  it('#edgesCount when there is no nodes', () => {
    const graph = new Graph(dummyGetDependenciesQuery)

    expect(graph.edgesCount()).toBe(0)
  })

  it('#edgesCount counts edges from all nodes', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
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
    const graph = new Graph(dummyGetDependenciesQuery)

    expect(graph.topSortWithScc().sorted).toEqual([])
    expect(graph.topSortWithScc().cycled).toEqual([])
  })

  it('#topologicalSort node is included even if he is not connected to anything', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node = identifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.topSortWithScc().sorted).toEqual([node])
    expect(graph.topSortWithScc().cycled).toEqual([])
  })

  it('#topologicalSort for simple graph', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node0 = identifiableString(0, 'foo')
    const node1 = identifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node1, node0)

    expect(graph.topSortWithScc().sorted).toEqual([node1, node0])
    expect(graph.topSortWithScc().cycled).toEqual([])
  })

  it('#topologicalSort for more complex graph', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
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

    expect(graph.topSortWithScc().sorted).toEqual([node0, node1, node2, node4, node3])
    expect(graph.topSortWithScc().cycled).toEqual([])
  })

  it('#topologicalSort for not connected graph', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
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

    expect(graph.topSortWithScc().sorted).toEqual([node0, node1, node2, node3])
    expect(graph.topSortWithScc().cycled).toEqual([])
  })

  it('#topologicalSort returns vertices on trivial cycle', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node0 = identifiableString(0, 'x0')
    const node1 = identifiableString(1, 'x1')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)
    graph.addEdge(node1, node0)

    expect(graph.topSortWithScc().sorted).toEqual([])
    expect(new Set(graph.topSortWithScc().cycled)).toEqual(new Set([node0, node1]))
  })

  it('#topologicalSort returns vertices on cycle', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node0 = identifiableString(0, 'x0')
    const node1 = identifiableString(1, 'x1')
    const node2 = identifiableString(2, 'x2')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addNode(node2)
    graph.addEdge(node0, node1)
    graph.addEdge(node1, node2)
    graph.addEdge(node1, node1)

    expect(graph.topSortWithScc().sorted).toEqual([node0, node2])
    expect(graph.topSortWithScc().cycled).toEqual([node1])
  })

  it('#topologicalSort returns one-element cycle', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node = identifiableString(0, 'foo')
    graph.addNode(node)
    graph.addEdge(node, node)

    expect(graph.topSortWithScc().sorted).toEqual([])
    expect(graph.topSortWithScc().cycled).toEqual([node])
  })
})

describe('Graph#getTopologicallySortedSubgraphFrom', () => {
  it('case without edges', () => {
    const graph = new Graph<string>(dummyGetDependenciesQuery)
    const node0 = 'foo'
    const node1 = 'bar'
    graph.addNode(node0)
    graph.addNode(node1)

    const fn = jasmine.createSpy().and.returnValue(true)
    const fn2 = jasmine.createSpy()

    graph.getTopSortedWithSccSubgraphFrom([node0], fn, fn2)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn.calls.argsFor(0)).toContain(node0)
  })

  it('case with obvious edge', () => {
    const graph = new Graph<string>(dummyGetDependenciesQuery)
    const node0 = 'foo'
    const node1 = 'bar'

    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    const fn = jasmine.createSpy().and.returnValue(true)
    const fn2 = jasmine.createSpy()

    graph.getTopSortedWithSccSubgraphFrom([node0], fn, fn2)

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn.calls.argsFor(0)).toContain(node0)
    expect(fn.calls.argsFor(1)).toContain(node1)
  })

  it('it doesnt call other if didnt change', () => {
    const graph = new Graph<string>(dummyGetDependenciesQuery)
    const node0 = 'foo'
    const node1 = 'bar'

    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    const fn = jasmine.createSpy().and.returnValue(false)
    const fn2 = jasmine.createSpy()

    graph.getTopSortedWithSccSubgraphFrom([node0], fn, fn2)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn.calls.argsFor(0)).toContain(node0)
  })

  it('does call if some previous vertex marked as changed', () => {
    const graph = new Graph<string>(dummyGetDependenciesQuery)
    const nodes = ['foo', 'bar', 'baz']

    nodes.forEach((n) => graph.addNode(n))
    graph.addEdge(nodes[0], nodes[2])
    graph.addEdge(nodes[1], nodes[2])

    const fn = jasmine.createSpy().and.callFake((node: string) => node === nodes[0])
    const fn2 = jasmine.createSpy()

    graph.getTopSortedWithSccSubgraphFrom([nodes[0], nodes[1]], fn, fn2)

    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn.calls.argsFor(2)).toContain(nodes[2])
  })

  it('returns cycled vertices', () => {
    const graph = new Graph<string>(dummyGetDependenciesQuery)
    const nodes = ['foo', 'c0', 'c1', 'c2']

    nodes.forEach((n) => graph.addNode(n))
    graph.addEdge(nodes[0], nodes[1])
    graph.addEdge(nodes[1], nodes[2])
    graph.addEdge(nodes[2], nodes[3])
    graph.addEdge(nodes[3], nodes[1])

    const fn = jasmine.createSpy().and.returnValue(true)
    const fn2 = jasmine.createSpy()
    const cycled = graph.getTopSortedWithSccSubgraphFrom([nodes[0]], fn, fn2).cycled

    expect(fn).toHaveBeenCalledTimes(1)
    expect(cycled).toEqual(['c0', 'c1', 'c2'])
  })

  it('doesnt call first one of the given vertices if its on cycle', () => {
    const graph = new Graph<string>(dummyGetDependenciesQuery)
    const nodes = ['c0', 'c1', 'c2']
    nodes.forEach((n) => graph.addNode(n))
    graph.addEdge(nodes[0], nodes[1])
    graph.addEdge(nodes[1], nodes[2])
    graph.addEdge(nodes[2], nodes[0])

    const fn = jasmine.createSpy().and.returnValue(true)
    const fn2 = jasmine.createSpy()
    const cycled = graph.getTopSortedWithSccSubgraphFrom([nodes[0]], fn, fn2).cycled

    expect(fn).not.toHaveBeenCalled()
    expect(cycled).toEqual(['c0', 'c1', 'c2'])
  })

  it('returns cycled vertices even if they were not tried to be computed', () => {
    const graph = new Graph<string>(dummyGetDependenciesQuery)
    const nodes = ['foo', 'c0', 'c1', 'c2']
    nodes.forEach((n) => graph.addNode(n))
    graph.addEdge(nodes[0], nodes[1])
    graph.addEdge(nodes[1], nodes[2])
    graph.addEdge(nodes[2], nodes[3])
    graph.addEdge(nodes[3], nodes[1])

    const fn = jasmine.createSpy().and.returnValue(true)
    const fn2 = jasmine.createSpy()
    const cycled = graph.getTopSortedWithSccSubgraphFrom([nodes[0]], fn, fn2).cycled

    expect(fn).toHaveBeenCalledTimes(1)
    expect(cycled).toEqual(['c0', 'c1', 'c2'])
  })
})

describe('Graph cruds', () => {
  it('#removeEdge not existing edge', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node0 = identifiableString(0, 'x0')
    const node1 = identifiableString(1, 'x1')
    graph.addNode(node0)
    graph.addNode(node1)

    expect(() => graph.removeEdge(node0, node1)).toThrowError('Edge does not exist')
  })

  it('#removeEdge removes edge from graph', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node0 = identifiableString(0, 'x0')
    const node1 = identifiableString(1, 'x1')

    graph.addNode(node0)
    graph.addNode(node1)

    graph.addEdge(node0, node1)
    expect(graph.edgesCount()).toEqual(1)
    expect(graph.existsEdge(node0, node1)).toBe(true)

    graph.removeEdge(node0, node1)
    expect(graph.edgesCount()).toEqual(0)
    expect(graph.existsEdge(node0, node1)).toBe(false)
  })

  it('#removeIncomingEdges removes all edges incoming to given node', () => {
    const graph = new Graph(dummyGetDependenciesQuery)
    const node0 = identifiableString(0, 'x0')
    const node1 = identifiableString(1, 'x1')
    const node2 = identifiableString(1, 'x2')

    graph.addNode(node0)
    graph.addNode(node1)
    graph.addNode(node2)

    graph.addEdge(node1, node0)
    graph.addEdge(node2, node0)
    expect(graph.edgesCount()).toEqual(2)
    expect(graph.existsEdge(node1, node0)).toBe(true)
    expect(graph.existsEdge(node2, node0)).toBe(true)

    graph.removeIncomingEdges(node0)
    expect(graph.edgesCount()).toEqual(0)
  })
})
