import {Graph} from '../src/DependencyGraph'
import {DependencyQuery} from '../src/DependencyGraph/Graph'
import {graphEdgesCount} from './testUtils'

class IdentifiableString {
  constructor(
    public id: number,
    public str: string) {
  }
}

const dummyDependencyQuery: DependencyQuery<any> = () => []

describe('Graph class', () => {
  describe('addNodeAndReturnId', () => {
    it('adds a node to the empty graph', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node = new IdentifiableString(0, 'foo')
      graph.addNodeAndReturnId(node)

      expect(graph.getNodes().length).toBe(1)
    })

    it('does not add duplicate nodes', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node = new IdentifiableString(0, 'foo')
      graph.addNodeAndReturnId(node)
      graph.addNodeAndReturnId(node)

      expect(graph.getNodes().length).toBe(1)
    })

    it('keeps existing edges when dealing with duplicates', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node0 = new IdentifiableString(0, 'foo')
      const node1 = new IdentifiableString(1, 'bar')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      expect(graph.adjacentNodes(node0)).toEqual(new Set([]))

      graph.addEdge(node0, node1)
      expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))

      graph.addNodeAndReturnId(node0)

      expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
    })
  })

  describe('removeNode', () => {
    it('removes a node if it exists', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node = new IdentifiableString(0, 'foo')
      graph.addNodeAndReturnId(node)
      graph.removeNode(node)

      expect(graph.getNodes().length).toBe(0)
    })

    it('throws error when node does not exist', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      expect(() => graph.removeNode(new IdentifiableString(0, 'foo'))).toThrowError(/Unknown node/)
    })
  })

  describe('hasNode', () => {
    it('returns false when graph is empty', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      expect(graph.hasNode(new IdentifiableString(0, 'foo'))).toBe(false)
    })

    it('returns true if node exists', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node = new IdentifiableString(0, 'foo')
      graph.addNodeAndReturnId(node)

      expect(graph.hasNode(node)).toBe(true)
    })

    it('returns false if node does not exist', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node = new IdentifiableString(0, 'foo')
      graph.addNodeAndReturnId(node)

      expect(graph.hasNode(new IdentifiableString(1, 'foo'))).toBe(false)
    })

    it('returns false if node was removed', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node = new IdentifiableString(0, 'foo')
      graph.addNodeAndReturnId(node)
      graph.removeNode(node)

      expect(graph.hasNode(node)).toBe(false)
    })
  })

  describe('addEdge', () => {
    it('does not add duplicated edges', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node0 = new IdentifiableString(0, 'foo')
      const node1 = new IdentifiableString(1, 'bar')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addEdge(node0, node1)
      graph.addEdge(node0, node1)

      expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
    })

    it('throws error when the origin node is not present', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node = new IdentifiableString(1, 'target')
      graph.addNodeAndReturnId(node)

      expect(() => {
        graph.addEdge(new IdentifiableString(0, 'origin'), node)
      }).toThrowError(/Unknown node/)
    })

    it('throws error when the target node is not present', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node = new IdentifiableString(0, 'origin')
      graph.addNodeAndReturnId(node)

      expect(() => {
        graph.addEdge(node, new IdentifiableString(1, 'target'))
      }).toThrowError(/Unknown node/)
    })
  })

  describe('removeEdge', () => {
    it('throws error when source node does not exist', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'x0')
      const node1 = new IdentifiableString(1, 'x1')
      graph.addNodeAndReturnId(node1)

      expect(() => graph.removeEdge(node0, node1)).toThrowError(/Unknown node/)
    })

    it('throws error when target node does not exist', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'x0')
      const node1 = new IdentifiableString(1, 'x1')
      graph.addNodeAndReturnId(node0)

      expect(() => graph.removeEdge(node0, node1)).toThrowError(/Unknown node/)
    })

    it('throws error when edge does not exist', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'x0')
      const node1 = new IdentifiableString(1, 'x1')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)

      expect(() => graph.removeEdge(node0, node1)).toThrowError('Edge does not exist')
    })

    it('removes an edge it it exists', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'x0')
      const node1 = new IdentifiableString(1, 'x1')

      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      expect(graphEdgesCount(graph)).toEqual(0)

      graph.addEdge(node0, node1)
      expect(graphEdgesCount(graph)).toEqual(1)
      expect(graph.existsEdge(node0, node1)).toBe(true)

      graph.removeEdge(node0, node1)
      expect(graphEdgesCount(graph)).toEqual(0)
      expect(graph.existsEdge(node0, node1)).toBe(false)
    })
  })

  describe('existsEdge', () => {
    it('returns true if edge is present in the graph', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'foo')
      const node1 = new IdentifiableString(1, 'bar')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addEdge(node0, node1)

      expect(graph.existsEdge(node0, node1)).toBe(true)
    })

    it('returns false if edge is not present', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'foo')
      const node1 = new IdentifiableString(1, 'bar')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)

      expect(graph.existsEdge(node0, node1)).toBe(false)
    })

    it('returns false if nodes are not present in the graph', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      expect(graph.existsEdge(new IdentifiableString(0, 'foo'), new IdentifiableString(1, 'bar'))).toBe(false)
    })
  })

  describe('adjacentNodes', () => {
    it('returns all target nodes adjacent to the given node', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node0 = new IdentifiableString(0, 'foo')
      const node1 = new IdentifiableString(1, 'bar')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addEdge(node0, node1)

      expect(graph.adjacentNodes(node0)).toEqual(new Set([node1]))
    })

    it('throws error if the source node is not present in the graph', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node0 = new IdentifiableString(0, 'foo')
      const node1 = new IdentifiableString(1, 'bar')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addEdge(node0, node1)

      expect(() => graph.adjacentNodes(new IdentifiableString(42, 'baz'))).toThrowError(/Unknown node/)
    })
  })

  describe('adjacentNodesCount', () => {
    it('returns number of outgoing edges from a given node', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node0 = new IdentifiableString(0, 'foo')
      const node1 = new IdentifiableString(1, 'bar')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addEdge(node0, node1)

      expect(graph.adjacentNodesCount(node0)).toEqual(1)
    })

    it('throws error if the source node is not present in the graph', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      const node0 = new IdentifiableString(0, 'foo')
      const node1 = new IdentifiableString(1, 'bar')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addEdge(node0, node1)

      expect(() => graph.adjacentNodesCount(new IdentifiableString(42, 'baz'))).toThrowError(/Unknown node/)
    })
  })

  describe('topSortWithScc', () => {
    it('works for empty graph', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)

      expect(graph.topSortWithScc().sorted).toEqual([])
      expect(graph.topSortWithScc().cycled).toEqual([])
    })

    it('returns isolated vertices', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node = new IdentifiableString(0, 'foo')
      graph.addNodeAndReturnId(node)

      expect(graph.topSortWithScc().sorted).toEqual([node])
      expect(graph.topSortWithScc().cycled).toEqual([])
    })

    it('returns vertices in order corresponding to the edge direction', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'foo')
      const node1 = new IdentifiableString(1, 'bar')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addEdge(node1, node0)

      expect(graph.topSortWithScc().sorted).toEqual([node1, node0])
      expect(graph.topSortWithScc().cycled).toEqual([])
    })

    it('works for 4-edges acyclic graph', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'x0')
      const node1 = new IdentifiableString(1, 'x1')
      const node2 = new IdentifiableString(2, 'x2')
      const node3 = new IdentifiableString(3, 'x3')
      const node4 = new IdentifiableString(4, 'x4')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addNodeAndReturnId(node2)
      graph.addNodeAndReturnId(node3)
      graph.addNodeAndReturnId(node4)
      graph.addEdge(node0, node2)
      graph.addEdge(node1, node2)
      graph.addEdge(node2, node3)
      graph.addEdge(node4, node3)

      expect(graph.topSortWithScc().sorted).toEqual([node0, node1, node2, node4, node3])
      expect(graph.topSortWithScc().cycled).toEqual([])
    })

    it('works for a graph with multiple connected components', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'x0')
      const node1 = new IdentifiableString(1, 'x1')
      const node2 = new IdentifiableString(2, 'x2')
      const node3 = new IdentifiableString(3, 'x3')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addNodeAndReturnId(node2)
      graph.addNodeAndReturnId(node3)
      graph.addEdge(node0, node2)
      graph.addEdge(node1, node3)

      expect(graph.topSortWithScc().sorted).toEqual([node0, node1, node2, node3])
      expect(graph.topSortWithScc().cycled).toEqual([])
    })

    it('detects cycles', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'x0')
      const node1 = new IdentifiableString(1, 'x1')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addEdge(node0, node1)
      graph.addEdge(node1, node0)

      expect(graph.topSortWithScc().sorted).toEqual([])
      expect(new Set(graph.topSortWithScc().cycled)).toEqual(new Set([node0, node1]))
    })

    it('detects 1-node cycles', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node0 = new IdentifiableString(0, 'x0')
      const node1 = new IdentifiableString(1, 'x1')
      const node2 = new IdentifiableString(2, 'x2')
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addNodeAndReturnId(node2)
      graph.addEdge(node0, node1)
      graph.addEdge(node1, node2)
      graph.addEdge(node1, node1)

      expect(graph.topSortWithScc().sorted).toEqual([node0, node2])
      expect(graph.topSortWithScc().cycled).toEqual([node1])
    })
  })

  describe('getTopSortedWithSccSubgraphFrom', () => {
    it('calls the operatingFunction callback for sorted nodes', () => {
      const graph = new Graph<string>(dummyDependencyQuery)
      const node0 = 'foo'
      const node1 = 'bar'
      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)

      const operatingFunction = jasmine.createSpy().and.returnValue(true)
      const onCycle = jasmine.createSpy()

      graph.getTopSortedWithSccSubgraphFrom([node0], operatingFunction, onCycle)

      expect(operatingFunction).toHaveBeenCalledTimes(1)
      expect(operatingFunction.calls.argsFor(0)).toContain(node0)
    })

    it('works for graph with an edge', () => {
      const graph = new Graph<string>(dummyDependencyQuery)
      const node0 = 'foo'
      const node1 = 'bar'

      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addEdge(node0, node1)

      const operatingFunction = jasmine.createSpy().and.returnValue(true)
      const onCycle = jasmine.createSpy()

      graph.getTopSortedWithSccSubgraphFrom([node0], operatingFunction, onCycle)

      expect(operatingFunction).toHaveBeenCalledTimes(2)
      expect(operatingFunction.calls.argsFor(0)).toContain(node0)
      expect(operatingFunction.calls.argsFor(1)).toContain(node1)
    })

    it('omits nodes not reachable from the "modifiedNodes" array', () => {
      const graph = new Graph<string>(dummyDependencyQuery)
      const node0 = 'foo'
      const node1 = 'bar'

      graph.addNodeAndReturnId(node0)
      graph.addNodeAndReturnId(node1)
      graph.addEdge(node0, node1)

      const operatingFunction = jasmine.createSpy().and.returnValue(false)
      const onCycle = jasmine.createSpy()

      graph.getTopSortedWithSccSubgraphFrom([node0], operatingFunction, onCycle)

      expect(operatingFunction).toHaveBeenCalledTimes(1)
      expect(operatingFunction.calls.argsFor(0)).toContain(node0)
    })

    it('calls the operatingFunction for a node not included but reachable from the "modifiedNodes" array', () => {
      const graph = new Graph<string>(dummyDependencyQuery)
      const nodes = ['foo', 'bar', 'baz']

      nodes.forEach((n) => graph.addNodeAndReturnId(n))
      graph.addEdge(nodes[0], nodes[2])
      graph.addEdge(nodes[1], nodes[2])

      const operatingFunction = jasmine.createSpy().and.callFake((node: string) => node === nodes[0])
      const onCycle = jasmine.createSpy()

      graph.getTopSortedWithSccSubgraphFrom([nodes[0], nodes[1]], operatingFunction, onCycle)

      expect(operatingFunction).toHaveBeenCalledTimes(3)
      expect(operatingFunction.calls.argsFor(2)).toContain(nodes[2])
    })

    it('calls onCycle callback for nodes that are on cycle', () => {
      const graph = new Graph<string>(dummyDependencyQuery)
      const nodes = ['foo', 'c0', 'c1', 'c2']

      nodes.forEach((n) => graph.addNodeAndReturnId(n))
      graph.addEdge(nodes[0], nodes[1])
      graph.addEdge(nodes[1], nodes[2])
      graph.addEdge(nodes[2], nodes[3])
      graph.addEdge(nodes[3], nodes[1])

      const operatingFunction = jasmine.createSpy().and.returnValue(true)
      const onCycle = jasmine.createSpy()
      const cycled = graph.getTopSortedWithSccSubgraphFrom([nodes[0]], operatingFunction, onCycle).cycled

      expect(operatingFunction).toHaveBeenCalledTimes(1)
      expect(onCycle).toHaveBeenCalledTimes(3)
      expect(cycled).toEqual(['c0', 'c1', 'c2'])
    })

    it('does not call operatingFunction callback for nodes that are on cycle', () => {
      const graph = new Graph<string>(dummyDependencyQuery)
      const nodes = ['c0', 'c1', 'c2']
      nodes.forEach((n) => graph.addNodeAndReturnId(n))
      graph.addEdge(nodes[0], nodes[1])
      graph.addEdge(nodes[1], nodes[2])
      graph.addEdge(nodes[2], nodes[0])

      const operatingFunction = jasmine.createSpy().and.returnValue(true)
      const onCycle = jasmine.createSpy()
      const cycled = graph.getTopSortedWithSccSubgraphFrom([nodes[0]], operatingFunction, onCycle).cycled

      expect(operatingFunction).not.toHaveBeenCalled()
      expect(cycled).toEqual(['c0', 'c1', 'c2'])
    })

    it('detects a cycle consisting of nodes not included but reachable from the "modifiedNodes" array', () => {
      const graph = new Graph<string>(dummyDependencyQuery)
      const nodes = ['foo', 'c0', 'c1', 'c2']
      nodes.forEach((n) => graph.addNodeAndReturnId(n))
      graph.addEdge(nodes[0], nodes[1])
      graph.addEdge(nodes[1], nodes[2])
      graph.addEdge(nodes[2], nodes[3])
      graph.addEdge(nodes[3], nodes[1])

      const operatingFunction = jasmine.createSpy().and.returnValue(true)
      const onCycle = jasmine.createSpy()
      const cycled = graph.getTopSortedWithSccSubgraphFrom([nodes[0]], operatingFunction, onCycle).cycled

      expect(operatingFunction).toHaveBeenCalledTimes(1)
      expect(cycled).toEqual(['c0', 'c1', 'c2'])
    })
  })

  describe('markNodeAsVolatile', () => {
    it('adds a node to volatile nodes array', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node = new IdentifiableString(0, 'foo')

      graph.addNodeAndReturnId(node)
      graph.markNodeAsVolatile(node)

      expect(graph.getDirtyAndVolatileNodes()).toEqual([node])
    })

    it('does nothing if node is not in a graph', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node = new IdentifiableString(0, 'foo')

      graph.markNodeAsVolatile(node)
      expect(graph.getDirtyAndVolatileNodes()).toEqual([])
    })
  })

  describe('markNodeAsChangingWithStructure', () => {
    it('adds a node to special nodes structural changes array', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node = new IdentifiableString(0, 'foo')

      graph.addNodeAndReturnId(node)
      graph.markNodeAsChangingWithStructure(node)
      graph.markChangingWithStructureNodesAsDirty()

      expect(graph.getDirtyAndVolatileNodes()).toEqual([node])
    })

    it('does nothing if node is not in a graph', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node = new IdentifiableString(0, 'foo')

      graph.markNodeAsChangingWithStructure(node)
      graph.markChangingWithStructureNodesAsDirty()

      expect(graph.getDirtyAndVolatileNodes()).toEqual([])
    })
  })

  describe('markNodeAsInfiniteRange', () => {
    it('adds a node to the infinite ranges array', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node = new IdentifiableString(0, 'foo')

      graph.addNodeAndReturnId(node)
      graph.markNodeAsInfiniteRange(node)

      expect(graph.getInfiniteRanges().map(({ node }) => node)).toEqual([node])
    })

    it('does nothing if node is not in a graph', () => {
      const graph = new Graph<IdentifiableString>(dummyDependencyQuery)
      const node = new IdentifiableString(0, 'foo')

      graph.markNodeAsInfiniteRange(node)
      expect(graph.getInfiniteRanges()).toEqual([])
    })
  })
})
