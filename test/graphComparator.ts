import {
  AddressMapping, CellVertex, DependencyGraph,
  EmptyCellVertex,
  FormulaCellVertex,
  MatrixVertex, RangeVertex,
  ValueCellVertex, Vertex
} from "../src/DependencyGraph";
import {SimpleCellAddress, simpleCellAddress} from "../src/Cell";
import {deepStrictEqual, strictEqual} from "assert";
import {HandsOnEngine} from "../src";
import {AbsoluteCellRange} from "../src/AbsoluteCellRange";

export class EngineComparator {

  constructor(private expected: HandsOnEngine,
              private actual: HandsOnEngine) {}

  public compare(sheet: number = 0) {
    const expectedAddressMapping = this.expected.addressMapping!
    const actualAddressMapping = this.actual.addressMapping!
    const expectedGraph = this.expected.graph
    const actualGraph = this.actual.graph

    // if (expectedAddressMapping.getHeight(sheet) !== actualAddressMapping.getHeight(sheet)) {
    //   throw Error("Different height")
    // }
    // if (expectedAddressMapping.getWidth(sheet) !== actualAddressMapping.getWidth(sheet)) {
    //   throw Error("Different width")
    // }

    for (let x=0; x<expectedAddressMapping.getWidth(sheet); ++x) {
      for (let y = 0; y < expectedAddressMapping.getWidth(sheet); ++y) {
        const address = simpleCellAddress(sheet, x, y)
        const expectedVertex = expectedAddressMapping.getCell(address)
        const actualVertex = actualAddressMapping.getCell(address)

        if (expectedVertex === null && actualVertex === null) {
          continue
        } else if (expectedVertex instanceof FormulaCellVertex && actualVertex instanceof FormulaCellVertex) {
          deepStrictEqual(expectedVertex.address, actualVertex.address, `Different addresses in formulas: expected ${expectedVertex.address}, actual ${actualVertex.address}`)
          deepStrictEqual(expectedVertex.getFormula(), actualVertex.getFormula(), "Different AST in formulas")
          strictEqual(expectedVertex.getCellValue(), actualVertex.getCellValue(), `Different values of formulas: expected ${expectedVertex.getCellValue().toString()}, actual ${actualVertex.getCellValue().toString()}`)
        } else if (expectedVertex instanceof ValueCellVertex && actualVertex instanceof ValueCellVertex) {
          strictEqual(expectedVertex.getCellValue(), actualVertex.getCellValue(), `Different values: expected ${expectedVertex.getCellValue().toString()}, actual:${actualVertex.getCellValue().toString()}`)
        } else if (expectedVertex instanceof EmptyCellVertex && actualVertex instanceof EmptyCellVertex) {

        } else if (expectedVertex instanceof MatrixVertex && actualVertex instanceof MatrixVertex) {
          throw Error("Not implemented yet.")
        } else {
          throw Error("Different vertex types")
        }

        const expectedDependencies = new Set<SimpleCellAddress | AbsoluteCellRange>()
        const actualDependencies = new Set<SimpleCellAddress | AbsoluteCellRange>()

        for (const adjacentNode of expectedGraph.adjacentNodes(expectedVertex)) {
          expectedDependencies.add(this.getAddressOfVertex(this.expected, adjacentNode, sheet))
        }
        for (const adjacentNode of actualGraph.adjacentNodes(actualVertex)) {
          actualDependencies.add(this.getAddressOfVertex(this.actual, adjacentNode, sheet))
        }
        deepStrictEqual(expectedDependencies, actualDependencies, "Dependencies of vertices are not same")
      }
    }
  }

  private getAddressOfVertex(engine: HandsOnEngine, vertex: Vertex, sheet: number): SimpleCellAddress | AbsoluteCellRange {
    if (vertex instanceof RangeVertex) {
      return vertex.range
    }
    for (const [address, v] of engine.addressMapping!.entriesFromSheet(sheet)) {
      if (v === vertex) {
        return address
      }
    }
    throw Error("No such vertex in address mapping: ")
  }
}
