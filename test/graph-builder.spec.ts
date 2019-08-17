import {simpleCellAddress} from '../src/Cell'
import {Config} from '../src/Config'
import {
  AddressMapping,
  DependencyGraph,
  EmptyCellVertex,
  Graph,
  MatrixVertex,
  RangeMapping,
  SheetMapping,
  ValueCellVertex,
  Vertex,
} from '../src/DependencyGraph'
import {MatrixMapping} from '../src/DependencyGraph/MatrixMapping'
import {GraphBuilder} from '../src/GraphBuilder'
import {ParserWithCaching} from '../src/parser'
import {DummyGetDependenciesQuery} from './DummyGetDependenciesQuery'
import './testConfig.ts'
import {adr} from "./testUtils";

describe('GraphBuilder', () => {
  it('', () => {})
  // it('build sheet with simple number cell', () => {
  //   const sheet = [['42']]
  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)
  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser)

  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   const node = addressMapping.fetchCell(adr('A1'))!
  //   expect(node).toBeInstanceOf(ValueCellVertex)
  //   expect(node.getCellValue()).toBe(42)
  // })

  // it('build sheet with simple string cell', () => {
  //   const sheet = [['foo']]
  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)
  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser)

  //   graphBuilder.buildGraph({ Sheet1: sheet})

  //   const node = addressMapping.fetchCell(adr('A1'))!
  //   expect(node).toBeInstanceOf(ValueCellVertex)
  //   expect(node.getCellValue()).toBe('foo')
  // })

  // it('building for cell with empty string should give empty vertex', () => {
  //   const sheet = [['', '=A1']]
  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)
  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser)

  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   const node = addressMapping.fetchCell(adr('A1'))
  //   expect(node).toBeInstanceOf(EmptyCellVertex)
  // })

  // it('#buildGraph', () => {
  //   const sheet = [
  //     ['1', 'A5', '2'],
  //     ['foo', 'bar', 'A2'],
  //   ]

  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)

  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser)

  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   expect(graph.nodesCount()).toBe(6)
  // })

  // it('#buildGraph works with ranges', () => {
  //   const sheet = [
  //     ['1', '2', '0'],
  //     ['3', '4', '=A1:B2'],
  //   ]

  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)

  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser)

  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   expect(graph.nodesCount()).toBe(
  //     6 + // for cells above
  //     1,   // for range vertex
  //   )
  //   const nodesA1 = graph.adjacentNodes(addressMapping.fetchCell(adr('A1'))!)!
  //   const nodesA2 = graph.adjacentNodes(addressMapping.fetchCell(adr('A2'))!)!
  //   const nodesB1 = graph.adjacentNodes(addressMapping.fetchCell(adr('B1'))!)!
  //   const nodesB2 = graph.adjacentNodes(addressMapping.fetchCell(adr('B2'))!)!
  //   expect(nodesA1).toEqual(nodesA2)
  //   expect(nodesA2).toEqual(nodesB1)
  //   expect(nodesB1).toEqual(nodesB2)
  //   expect(nodesB1.size).toEqual(1)
  //   const rangeVertex = Array.from(nodesB2)[0]!
  //   expect(graph.adjacentNodes(rangeVertex)!).toEqual(new Set([addressMapping.fetchCell(adr('C2'))!]))
  // })

  // it('#loadSheet - it should build graph with only one RangeVertex', () => {
  //   const sheet = [
  //     ['1', '2', '0'],
  //     ['3', '4', '=A1:B2'],
  //     ['5', '6', '=A1:B2'],
  //   ]

  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)

  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser)

  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   expect(graph.nodesCount()).toBe(
  //     9 + // for cells above
  //     1,   // for both ranges (reuse same ranges)
  //   )
  // })

  // it('build with range one row smaller', () => {
  //   const sheet = [
  //     ['1', '0'],
  //     ['3', '=A1:A2'],
  //     ['5', '=A1:A3'],
  //   ]

  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)
  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser)

  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   expect(graph.edgesCount()).toBe(
  //     2 + // from cells to range(A1:A2)
  //     2 + // from A3 and range(A1:A2) to range(A1:A3)
  //     2, // from range vertexes to formulas
  //   )
  // })

  // it('#buildGraph should work even if range dependencies are empty', () => {
  //   const sheet = [['1', '2', '=SUM(A1:B2)']]
  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)

  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser)
  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   expect(graph.nodesCount()).toBe(
  //     3 + // for cells above
  //     1 + // for range vertex
  //     2,   // for 2 EmptyCellVertex instances
  //   )
  //   expect(graph.edgesCount()).toBe(
  //     2 + // from cells to range vertex
  //     2 + // from EmptyCellVertex instances to range vertices
  //     1, // from range to cell with SUM
  //   )
  // })

  // it("optimization doesn't work if smaller range is after bigger", () => {
  //   const sheet = [
  //     ['1', '0'],
  //     ['3', '=A1:A3'],
  //     ['5', '=A1:A2'],
  //   ]

  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)
  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser)

  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   expect(graph.edgesCount()).toBe(
  //     3 + // from 3 cells to range(A1:A2)
  //     2 + // from 2 cells to range(A1:A2)
  //     2, // from range vertexes to formulas
  //   )
  // })

  // it('matrix cause next cells to be ignored', () => {
  //   const sheet = [
  //     ['1', '2', '8'],
  //     ['3', '4', '9'],
  //     ['{=mmult(A1:B2,C1:C2)}'],
  //     ['{=mmult(A1:B2,C1:C2)}'],
  //   ]

  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)
  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser)

  //   graphBuilder.buildGraph({ Sheet1: sheet })
  //   expect(addressMapping.fetchCell(adr('A3'))).toBeInstanceOf(MatrixVertex)
  //   expect(addressMapping.fetchCell(adr('A4'))).toBeInstanceOf(MatrixVertex)
  //   expect(addressMapping.isEmpty(adr('A5'))).toBe(true)
  // })
})

describe('GraphBuilder with matrix detection', () => {
  // it('matrix with plain numbers', () => {
  //   const sheet = [
  //     ['1', '2'],
  //     ['3', '4'],
  //   ]

  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)
  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser, new Config({ matrixDetection: true, matrixDetectionThreshold: 4 }))

  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   expect(addressMapping.fetchCell(adr('A1'))).toBeInstanceOf(MatrixVertex)
  //   expect(addressMapping.getCellValue(adr('A1'))).toEqual(1)
  //   expect(addressMapping.getCellValue(adr('B1'))).toEqual(2)
  //   expect(addressMapping.getCellValue(adr('A2'))).toEqual(3)
  //   expect(addressMapping.getCellValue(adr('B2'))).toEqual(4)
  // })

  // it('matrix detection strategy and regular values', () => {
  //   const sheet = [
  //     ['1', 'foobar'],
  //   ]

  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)
  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser, new Config({ matrixDetection: true, matrixDetectionThreshold: 2  }))

  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   expect(addressMapping.fetchCell(adr('A1'))).toBeInstanceOf(ValueCellVertex)
  //   expect(addressMapping.fetchCell(adr('B1'))).toBeInstanceOf(ValueCellVertex)
  // })

  // it('matrix detection threshold', () => {
  //   const sheet = [
  //     ['1', '2'],
  //     ['3', '4'],
  //     ['', ''],
  //     ['1', '2'],
  //     ['3', '4'],
  //     ['5', '6'],
  //   ]

  //   const graph = new Graph<Vertex>(new DummyGetDependenciesQuery())
  //   const addressMapping = new AddressMapping(0.5)
  //   addressMapping.autoAddSheet(0, sheet)
  //   const sheetMapping = new SheetMapping()
  //   sheetMapping.addSheet('Sheet1')
  //   const parser = new ParserWithCaching(new Config, sheetMapping.fetch)
  //   const dependencyGraph = new DependencyGraph(addressMapping, new RangeMapping(), graph, sheetMapping, new MatrixMapping())
  //   const graphBuilder = new GraphBuilder(dependencyGraph, parser, new Config({ matrixDetection: true, matrixDetectionThreshold: 6 }))

  //   graphBuilder.buildGraph({ Sheet1: sheet })

  //   expect(addressMapping.fetchCell(adr('A1'))).toBeInstanceOf(ValueCellVertex)
  //   expect(addressMapping.fetchCell(adr('B2'))).toBeInstanceOf(ValueCellVertex)
  //   expect(addressMapping.fetchCell(adr('A4'))).toBeInstanceOf(MatrixVertex)

  // })
})
