import {Graph} from '../src/DependencyGraph'
import {DependencyQuery} from '../src/DependencyGraph/Graph'
import {graphEdgesCount} from './testUtils'

class IdentifiableString {
  constructor(
    public id: number,
    public str: string) {}
}

const dummyDependencyQuery: DependencyQuery<any> = () => []

describe('Graph class', () => {
  it('#addNode', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

    const node = new IdentifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.getNodes().length).toBe(1)
  })

  it('#addNode for the second time', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

    const node = new IdentifiableString(0, 'foo')
    graph.addNode(node)
    graph.addNode(node)

    expect(graph.getNodes().length).toBe(1)
  })

  it('#addNode for the second time does not reset adjacent nodes', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

    const node0 = new IdentifiableString(0, 'foo')
    const node1 = new IdentifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    graph.addNode(node0)

    expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
  })

  it('#hasNode when there is node', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

    const node = new IdentifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.hasNode(node)).toBe(true)
  })

  it('#hasNode when there is no node', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

    const node = new IdentifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.hasNode(new IdentifiableString(1, 'foo'))).toBe(false)
  })

  it('#adjacentNodes', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

    const node0 = new IdentifiableString(0, 'foo')
    const node1 = new IdentifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
  })

  it('#addEdge removes multiple edges', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

    const node0 = new IdentifiableString(0, 'foo')
    const node1 = new IdentifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)
    graph.addEdge(node0, node1)

    expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
  })

  it('#addEdge is raising an error when the origin node not present', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node = new IdentifiableString(1, 'target')
    graph.addNode(node)

    expect(() => {
      graph.addEdge(new IdentifiableString(0, 'origin'), node)
    }).toThrowError(/Unknown node/)
  })

  it('#addEdge is raising an error when the target node not present', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node = new IdentifiableString(0, 'origin')
    graph.addNode(node)

    expect(() => {
      graph.addEdge(node, new IdentifiableString(1, 'target'))
    }).toThrowError(/Unknown node/)
  })

  it('#existsEdge works', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node0 = new IdentifiableString(0, 'foo')
    const node1 = new IdentifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)

    expect(graph.existsEdge(node0, node1)).toBe(true)
  })

  it('#existsEdge when there is origin node but no edge', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node = new IdentifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.existsEdge(node, new IdentifiableString(1, 'bar'))).toBe(false)
  })

  it('#existsEdge when there is no node', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

    expect(graph.existsEdge(new IdentifiableString(0, 'foo'), new IdentifiableString(1, 'bar'))).toBe(false)
  })

  it('#topologicalSort for empty graph', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

    expect(graph.topSortWithScc().sorted).toEqual([])
    expect(graph.topSortWithScc().cycled).toEqual([])
  })

  it('#topologicalSort node is included even if it is not connected to anything', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node = new IdentifiableString(0, 'foo')
    graph.addNode(node)

    expect(graph.topSortWithScc().sorted).toEqual([node])
    expect(graph.topSortWithScc().cycled).toEqual([])
  })

  it('#topologicalSort for simple graph', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node0 = new IdentifiableString(0, 'foo')
    const node1 = new IdentifiableString(1, 'bar')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node1, node0)

    expect(graph.topSortWithScc().sorted).toEqual([node1, node0])
    expect(graph.topSortWithScc().cycled).toEqual([])
  })

  it('#topologicalSort for more complex graph', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node0 = new IdentifiableString(0, 'x0')
    const node1 = new IdentifiableString(1, 'x1')
    const node2 = new IdentifiableString(2, 'x2')
    const node3 = new IdentifiableString(3, 'x3')
    const node4 = new IdentifiableString(4, 'x4')
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
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node0 = new IdentifiableString(0, 'x0')
    const node1 = new IdentifiableString(1, 'x1')
    const node2 = new IdentifiableString(2, 'x2')
    const node3 = new IdentifiableString(3, 'x3')
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
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node0 = new IdentifiableString(0, 'x0')
    const node1 = new IdentifiableString(1, 'x1')
    graph.addNode(node0)
    graph.addNode(node1)
    graph.addEdge(node0, node1)
    graph.addEdge(node1, node0)

    expect(graph.topSortWithScc().sorted).toEqual([])
    expect(new Set(graph.topSortWithScc().cycled)).toEqual(new Set([node0, node1]))
  })

  it('#topologicalSort returns vertices on cycle', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node0 = new IdentifiableString(0, 'x0')
    const node1 = new IdentifiableString(1, 'x1')
    const node2 = new IdentifiableString(2, 'x2')
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
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node = new IdentifiableString(0, 'foo')
    graph.addNode(node)
    graph.addEdge(node, node)

    expect(graph.topSortWithScc().sorted).toEqual([])
    expect(graph.topSortWithScc().cycled).toEqual([node])
  })

  it('#removeEdge not existing edge', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node0 = new IdentifiableString(0, 'x0')
    const node1 = new IdentifiableString(1, 'x1')
    graph.addNode(node0)
    graph.addNode(node1)

    expect(() => graph.removeEdge(node0, node1)).toThrowError('Edge does not exist')
  })

  it('#removeEdge removes edge from graph', () => {
    const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
    const node0 = new IdentifiableString(0, 'x0')
    const node1 = new IdentifiableString(1, 'x1')

    graph.addNode(node0)
    graph.addNode(node1)

    graph.addEdge(node0, node1)
    expect(graphEdgesCount(graph)).toEqual(1)
    expect(graph.existsEdge(node0, node1)).toBe(true)

    graph.removeEdge(node0, node1)
    expect(graphEdgesCount(graph)).toEqual(0)
    expect(graph.existsEdge(node0, node1)).toBe(false)
  })

describe('getTopSortedWithSccSubgraphFrom', () => {
  it('case without edges', () => {
    const graph = new Graph<string>(dummyDependencyQuery)
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
    const graph = new Graph<string>(dummyDependencyQuery)
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
    const graph = new Graph<string>(dummyDependencyQuery)
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
    const graph = new Graph<string>(dummyDependencyQuery)
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
    const graph = new Graph<string>(dummyDependencyQuery)
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
    const graph = new Graph<string>(dummyDependencyQuery)
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
    const graph = new Graph<string>(dummyDependencyQuery)
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
})
