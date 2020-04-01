import {equal, deepStrictEqual} from 'assert'
import {HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {SimpleCellAddress, simpleCellAddress} from '../src/Cell'
import {
  EmptyCellVertex,
  FormulaCellVertex,
  MatrixVertex,
  RangeVertex,
  ValueCellVertex,
  Vertex,
} from '../src/DependencyGraph'
import {simpleCellAddressToString} from '../src/parser'

export class EngineComparator {

  constructor(private expected: HyperFormula,
    private actual: HyperFormula) {
  }

  public compare() {
    const expectedNumberOfSheets = this.expected.sheetMapping.numberOfSheets()
    const numberOfSheets = this.actual.sheetMapping.numberOfSheets()

    if (expectedNumberOfSheets !== numberOfSheets) {
      throw Error(`Expected number of sheets ${expectedNumberOfSheets}, actual: ${numberOfSheets}`)
    }

    this.expected.dependencyGraph.forceApplyPostponedTransformations()
    this.actual.dependencyGraph.forceApplyPostponedTransformations()

    for (let sheet = 0; sheet < numberOfSheets; ++sheet) {
      this.compareSheet(sheet)
    }
  }

  private compareSheet(sheet: number = 0) {
    const expectedGraph = this.expected.graph
    const actualGraph = this.actual.graph

    const expectedSheetName = this.expected.getSheetName(sheet)
    const actualSheetName = this.actual.getSheetName(sheet)
    equal(expectedSheetName, actualSheetName, `Expected sheet name '${expectedSheetName}', actual '${actualSheetName}'`)

    const expectedWidth = this.expected.addressMapping.getWidth(sheet)
    const expectedHeight = this.expected.addressMapping.getHeight(sheet)
    const actualWidth = this.actual.addressMapping.getWidth(sheet)
    const actualHeight = this.actual.addressMapping.getHeight(sheet)

    if (expectedHeight !== actualHeight) {
      console.warn(`Expected sheet of height ${expectedHeight}, actual: ${actualHeight}`)
    }
    if (expectedWidth !== actualWidth) {
      console.warn(`Expected sheet of width ${expectedWidth}, actual: ${actualWidth}`)
    }

    for (let x = 0; x < Math.max(expectedWidth, actualWidth); ++x) {
      for (let y = 0; y < Math.max(expectedHeight, actualHeight); ++y) {
        const address = simpleCellAddress(sheet, x, y)
        const expectedVertex = this.expected.addressMapping.getCell(address)
        const actualVertex = this.actual.addressMapping.getCell(address)

        if (expectedVertex === null && actualVertex === null) {
          continue
        } else if (expectedVertex instanceof FormulaCellVertex && actualVertex instanceof FormulaCellVertex) {
          deepStrictEqual(actualVertex.address, expectedVertex.address, `Different addresses in formulas. expected: ${expectedVertex.address}, actual: ${actualVertex.address}`)
          deepStrictEqual(actualVertex.getFormula(this.actual.lazilyTransformingAstService), expectedVertex.getFormula(this.expected.lazilyTransformingAstService), 'Different AST in formulas')
          deepStrictEqual(actualVertex.getCellValue(), expectedVertex.getCellValue(), `Different values of formulas. expected: ${expectedVertex.getCellValue().toString()}, actual: ${actualVertex.getCellValue().toString()}`)
        } else if (expectedVertex instanceof ValueCellVertex && actualVertex instanceof ValueCellVertex) {
          deepStrictEqual(actualVertex.getCellValue(), expectedVertex.getCellValue(), `Different values. expected: ${expectedVertex.getCellValue().toString()}, actual: ${actualVertex.getCellValue().toString()}`)
        } else if (expectedVertex instanceof EmptyCellVertex && actualVertex instanceof EmptyCellVertex) {
          continue
        } else if (expectedVertex instanceof MatrixVertex && actualVertex instanceof MatrixVertex) {
          throw Error('Not implemented yet.')
        } else {
          throw Error('Different vertex types')
        }

        const expectedAdjacentAddresses = new Set<SimpleCellAddress | AbsoluteCellRange>()
        const actualAdjacentAddresses = new Set<SimpleCellAddress | AbsoluteCellRange>()

        for (const adjacentNode of expectedGraph.adjacentNodes(expectedVertex)) {
          expectedAdjacentAddresses.add(this.getAddressOfVertex(this.expected, adjacentNode))
        }
        for (const adjacentNode of actualGraph.adjacentNodes(actualVertex)) {
          actualAdjacentAddresses.add(this.getAddressOfVertex(this.actual, adjacentNode))
        }
        const sheetMapping = this.expected.sheetMapping
        deepStrictEqual(actualAdjacentAddresses, expectedAdjacentAddresses, `Dependent vertices of ${simpleCellAddressToString(sheetMapping.fetchDisplayName, address, 0)} (Sheet '${sheetMapping.fetchDisplayName(address.sheet)}') are not same`)
      }
    }
  }

  private getAddressOfVertex(engine: HyperFormula, vertex: Vertex): SimpleCellAddress | AbsoluteCellRange {
    if (vertex instanceof RangeVertex) {
      return vertex.range
    }
    for (const [address, v] of engine.addressMapping.entries()) {
      if (v === vertex) {
        return address
      }
    }
    throw Error('No such vertex in address mapping: ')
  }
}
