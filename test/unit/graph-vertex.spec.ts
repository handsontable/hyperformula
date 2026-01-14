import {Graph, ValueCellVertex, Vertex} from '../../src/DependencyGraph'

const dummyGetDependenciesQuery: () => any[] = () => []

describe('Graph with Vertex', () => {
  it('#addNodeIfNotExists works correctly with Vertex instances', () => {
    const graph = new Graph<Vertex>(dummyGetDependenciesQuery)

    const v1 = new ValueCellVertex("1'", "1'")
    const v2 = new ValueCellVertex('2', '2')
    graph.addNodeIfNotExists(v1)
    graph.addNodeIfNotExists(v1)
    graph.addNodeIfNotExists(v2)

    expect(graph.getNodes().length).toBe(2)
  })
})
