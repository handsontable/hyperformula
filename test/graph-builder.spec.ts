import {cellCoordinatesToLabel, GraphBuilder} from "../src/GraphBuilder";
import {Graph} from "../src/Graph";
import {Vertex, CellVertex, CellAddress} from "../src/Vertex";
import {Statistics} from "../src/statistics/Statistics";

const cellAddress = (col: number, row: number): CellAddress => ({ col, row })

describe('GraphBuilder', () => {
  it('#buildGraph', () => {
    const graph = new Graph<Vertex>()
    const addressMapping : Map<number, Map<number, CellVertex>> = new Map()

    let graphBuilder = new GraphBuilder(graph, addressMapping, new Statistics())

    graphBuilder.buildGraph([
        ['1', 'A5', '2'],
        ['foo', 'bar', '=A2']
    ])

    expect(graph.nodesCount()).toBe(6)
  });

  it('#buildGraph works with ranges', () => {
    const graph = new Graph<Vertex>()
    const addressMapping : Map<number, Map<number, CellVertex>> = new Map()

    let graphBuilder = new GraphBuilder(graph, addressMapping, new Statistics())

    graphBuilder.buildGraph([
      ['1', '2', '0'],
      ['3', '4', '=A1:B2']
    ])

    expect(graph.nodesCount()).toBe(7)
    const nodesA1 = graph.adjacentNodes(addressMapping.get(0)!.get(0)!)!
    const nodesA2 = graph.adjacentNodes(addressMapping.get(0)!.get(1)!)!
    const nodesB1 = graph.adjacentNodes(addressMapping.get(1)!.get(0)!)!
    const nodesB2 = graph.adjacentNodes(addressMapping.get(1)!.get(1)!)!
    expect(nodesA1).toEqual(nodesA2)
    expect(nodesA2).toEqual(nodesB1)
    expect(nodesB1).toEqual(nodesB2)
    expect(nodesB1.size).toEqual(1)
    const rangeVertex = Array.from(nodesB2)[0]!
    expect(graph.adjacentNodes(rangeVertex)!).toEqual(new Set([addressMapping.get(2)!.get(1)!]))
  });
});
