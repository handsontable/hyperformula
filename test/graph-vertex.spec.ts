import {Graph, ValueCellVertex, Vertex} from '../src/DependencyGraph'

const dummyGetDependenciesQuery = () => null

describe('Graph with Vertex', () => {
  it('#addNode works correctly with Vertex instances', () => {
    const graph = new Graph<Vertex>(dummyGetDependenciesQuery)

    const v1 = new ValueCellVertex("1'")
    const v2 = new ValueCellVertex('2')
    graph.addNode(v1)
    graph.addNode(v1)
    graph.addNode(v2)

    expect(graph.nodesCount()).toBe(2)
  })
})
