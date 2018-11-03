import {GraphBuilder} from "../src/GraphBuilder";
import {Graph} from "../src/Graph";
import {Vertex, CellVertex, ValueCellVertex} from "../src/Vertex";
import {Statistics} from "../src/statistics/Statistics";
import {AddressMapping} from "../src/AddressMapping"
import {CellAddress, CellReferenceType, relativeCellAddress, simpleCellAddress} from "../src/Cell";

describe('GraphBuilder', () => {
  it("build sheet with simple number cell", () => {
    const graph = new Graph<Vertex>()
    const addressMapping = new AddressMapping()
    const graphBuilder = new GraphBuilder(graph, addressMapping, new Statistics())

    graphBuilder.buildGraph([['42']])

    const node = addressMapping.getCell(simpleCellAddress(0, 0))!
    expect(node).toBeInstanceOf(ValueCellVertex)
    expect(node.getCellValue()).toBe(42)
  })

  it("build sheet with simple string cell", () => {
    const graph = new Graph<Vertex>()
    const addressMapping = new AddressMapping()
    const graphBuilder = new GraphBuilder(graph, addressMapping, new Statistics())

    graphBuilder.buildGraph([['foo']])

    const node = addressMapping.getCell(simpleCellAddress(0, 0))!
    expect(node).toBeInstanceOf(ValueCellVertex)
    expect(node.getCellValue()).toBe('foo')
  })

  it('#buildGraph', () => {
    const graph = new Graph<Vertex>()
    const addressMapping = new AddressMapping()

    let graphBuilder = new GraphBuilder(graph, addressMapping, new Statistics())

    graphBuilder.buildGraph([
      ['1', 'A5', '2'],
      ['foo', 'bar', 'A2']
    ])

    expect(graph.nodesCount()).toBe(6)
  });

  it('#buildGraph works with ranges', () => {
    const graph = new Graph<Vertex>()
    const addressMapping = new AddressMapping()

    let graphBuilder = new GraphBuilder(graph, addressMapping, new Statistics())

    graphBuilder.buildGraph([
      ['1', '2', '0'],
      ['3', '4', '=A1:B2']
    ])

    expect(graph.nodesCount()).toBe(7)
    const nodesA1 = graph.adjacentNodes(addressMapping.getCell(relativeCellAddress(0, 0))!)!
    const nodesA2 = graph.adjacentNodes(addressMapping.getCell(relativeCellAddress(0, 1))!)!
    const nodesB1 = graph.adjacentNodes(addressMapping.getCell(relativeCellAddress(1, 0))!)!
    const nodesB2 = graph.adjacentNodes(addressMapping.getCell(relativeCellAddress(1, 1))!)!
    expect(nodesA1).toEqual(nodesA2)
    expect(nodesA2).toEqual(nodesB1)
    expect(nodesB1).toEqual(nodesB2)
    expect(nodesB1.size).toEqual(1)
    const rangeVertex = Array.from(nodesB2)[0]!
    expect(graph.adjacentNodes(rangeVertex)!).toEqual(new Set([addressMapping.getCell(relativeCellAddress(2, 1))!]))
  });

  it("#loadSheet - it should build graph with only one RangeVertex", () => {
    const graph = new Graph<Vertex>()
    const addressMapping = new AddressMapping()

    const graphBuilder = new GraphBuilder(graph, addressMapping, new Statistics())

    graphBuilder.buildGraph([
        ['1', '2', '0'],
        ['3', '4', '=A1:B2'],
        ['5', '6', '=A1:B2']
    ])

    expect(graph.nodesCount()).toBe(10)
  })

  it("build with range one row smaller", () => {
    const graph = new Graph<Vertex>()
    const addressMapping = new AddressMapping()
    const graphBuilder = new GraphBuilder(graph, addressMapping, new Statistics())

    graphBuilder.buildGraph([
      ['1', '0'],
      ['3', '=A1:A2'],
      ['5', '=A1:A3'],
    ])

    expect(graph.edgesCount()).toBe(
      2 + // from cells to range(A1:A2)
      2 + // from A3 and range(A1:A2) to range(A1:A3)
      2 // from range vertexes to formulas
    )
  })
});
