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
              private actual: HandsOnEngine) {
  }

  public compare(sheet: number = 0) {
    const expectedGraph = this.expected.graph
    const actualGraph = this.actual.graph

    const expectedWidth = this.expected.addressMapping!.getWidth(sheet)
    const expectedHeight = this.expected.addressMapping!.getHeight(sheet)
    const actualWidth = this.actual.addressMapping!.getWidth(sheet)
    const actualHeight = this.actual.addressMapping!.getHeight(sheet)

    if (expectedHeight !== actualHeight) {
      console.warn(`Expected sheet of height ${expectedHeight}, actual: ${actualHeight}`)
    }
    if (expectedWidth !== actualWidth) {
      console.warn(`Expected sheet of width ${expectedWidth}, actual: ${actualWidth}`)
    }

    for (let x = 0; x < Math.max(expectedWidth, actualWidth); ++x) {
      for (let y = 0; y < Math.max(expectedHeight, actualHeight); ++y) {
        const address = simpleCellAddress(sheet, x, y)
        const expectedVertex = this.expected.addressMapping!.getCell(address)
        const actualVertex = this.actual.addressMapping!.getCell(address)

        if (expectedVertex === null && actualVertex === null) {
          continue
        } else if (expectedVertex instanceof FormulaCellVertex && actualVertex instanceof FormulaCellVertex) {
          deepStrictEqual(expectedVertex.address, actualVertex.address, `Different addresses in formulas. expected: ${expectedVertex.address}, actual: ${actualVertex.address}`)
          deepStrictEqual(expectedVertex.getFormula(), actualVertex.getFormula(), "Different AST in formulas")
          strictEqual(expectedVertex.getCellValue(), actualVertex.getCellValue(), `Different values of formulas. expected: ${expectedVertex.getCellValue().toString()}, actual: ${actualVertex.getCellValue().toString()}`)
        } else if (expectedVertex instanceof ValueCellVertex && actualVertex instanceof ValueCellVertex) {
          strictEqual(expectedVertex.getCellValue(), actualVertex.getCellValue(), `Different values. expected: ${expectedVertex.getCellValue().toString()}, actual: ${actualVertex.getCellValue().toString()}`)
        } else if (expectedVertex instanceof EmptyCellVertex && actualVertex instanceof EmptyCellVertex) {
          continue
        } else if (expectedVertex instanceof MatrixVertex && actualVertex instanceof MatrixVertex) {
          throw Error("Not implemented yet.")
        } else {
          throw Error("Different vertex types")
        }

        const expectedAdjacentAddresses = new Set<SimpleCellAddress | AbsoluteCellRange>()
        const actualAdjacentAddresses = new Set<SimpleCellAddress | AbsoluteCellRange>()

        for (const adjacentNode of expectedGraph.adjacentNodes(expectedVertex)) {
          expectedAdjacentAddresses.add(this.getAddressOfVertex(this.expected, adjacentNode, sheet))
        }
        for (const adjacentNode of actualGraph.adjacentNodes(actualVertex)) {
          actualAdjacentAddresses.add(this.getAddressOfVertex(this.actual, adjacentNode, sheet))
        }
        deepStrictEqual(expectedAdjacentAddresses, actualAdjacentAddresses, "Dependent vertices are not same")
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
