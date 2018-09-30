import {cellCoordinatesToLabel, GraphBuilder} from "../src/GraphBuilder";
import {Graph} from "../src/Graph";
import {Vertex} from "../src/Vertex";

describe('GraphBuilder', () => {
  it('#buildGraph', () => {
    const graph = new Graph<Vertex>()
    const addressMapping : Map<string, Vertex> = new Map()

    let graphBuilder = new GraphBuilder(graph, addressMapping)

    graphBuilder.buildGraph([
        ['1', 'A5', '2'],
        ['foo', 'bar', '=A2']
    ])

    expect(graph.nodesCount()).toBe(6)
  });

  it ("#cellCoordinatesToLabel should return correct labels ", () => {
    expect(cellCoordinatesToLabel(0, 0)).toBe('A1')
    expect(cellCoordinatesToLabel(0, 1)).toBe('B1')
    expect(cellCoordinatesToLabel(1, 0)).toBe('A2')
    expect(cellCoordinatesToLabel(0, 46)).toBe('AU1')
    expect(cellCoordinatesToLabel(0, 702)).toBe('AAA1')
  })
});
