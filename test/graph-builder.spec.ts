import {cellCoordinatesToLabel, GraphBuilder} from "../src/GraphBuilder";
import {Graph} from "../src/Graph";
import {Vertex, CellVertex} from "../src/Vertex";

describe('GraphBuilder', () => {
  it('#buildGraph', () => {
    const graph = new Graph<Vertex>()
    const addressMapping : Map<string, CellVertex> = new Map()

    let graphBuilder = new GraphBuilder(graph, addressMapping)

    graphBuilder.buildGraph([
        ['1', 'A5', '2'],
        ['foo', 'bar', '=A2']
    ])

    expect(graph.nodesCount()).toBe(6)
  });

  it('#buildGraph works with ranges', () => {
    const graph = new Graph<Vertex>()
    const addressMapping : Map<string, CellVertex> = new Map()

    let graphBuilder = new GraphBuilder(graph, addressMapping)

    graphBuilder.buildGraph([
      ['1', '2', '0'],
      ['3', '4', '=A1:B2']
    ])

    expect(graph.nodesCount()).toBe(7)
    const nodesA1 = graph.adjacentNodes(addressMapping.get('A1')!)!
    const nodesA2 = graph.adjacentNodes(addressMapping.get('A2')!)!
    const nodesB1 = graph.adjacentNodes(addressMapping.get('B1')!)!
    const nodesB2 = graph.adjacentNodes(addressMapping.get('B2')!)!
    expect(nodesA1).toEqual(nodesA2)
    expect(nodesA2).toEqual(nodesB1)
    expect(nodesB1).toEqual(nodesB2)
    expect(nodesB1.size).toEqual(1)
    const rangeVertex = Array.from(nodesB2)[0]!
    expect(graph.adjacentNodes(rangeVertex)!).toEqual(new Set([addressMapping.get('C2')!]))
  });

  it ("#cellCoordinatesToLabel should return correct labels ", () => {
    expect(cellCoordinatesToLabel(0, 0)).toBe('A1')
    expect(cellCoordinatesToLabel(0, 1)).toBe('B1')
    expect(cellCoordinatesToLabel(1, 0)).toBe('A2')
    expect(cellCoordinatesToLabel(0, 46)).toBe('AU1')
    expect(cellCoordinatesToLabel(0, 702)).toBe('AAA1')
  })
});
