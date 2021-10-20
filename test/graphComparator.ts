import {deepStrictEqual, equal} from 'assert'
import {CellError, HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {SimpleCellAddress, simpleCellAddress} from '../src/Cell'
import {
  ArrayVertex,
  EmptyCellVertex,
  FormulaCellVertex,
  ParsingErrorVertex,
  RangeVertex,
  ValueCellVertex,
  Vertex,
} from '../src/DependencyGraph'
import {InterpreterValue} from '../src/interpreter/InterpreterValue'
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

  private compareSheet(sheet: number) {
    const expectedGraph = this.expected.graph
    const actualGraph = this.actual.graph

    const expectedSheetName = this.expected.getSheetName(sheet)
    const actualSheetName = this.actual.getSheetName(sheet)
    equal(expectedSheetName, actualSheetName, `Expected sheet name '${expectedSheetName}', actual '${actualSheetName}'`)

    const expectedWidth = this.expected.addressMapping.getWidth(sheet)
    const expectedHeight = this.expected.addressMapping.getHeight(sheet)
    const actualWidth = this.actual.addressMapping.getWidth(sheet)
    const actualHeight = this.actual.addressMapping.getHeight(sheet)

    this.compareMatrixMappings()

    for (let x = 0; x < Math.max(expectedWidth, actualWidth); ++x) {
      for (let y = 0; y < Math.max(expectedHeight, actualHeight); ++y) {
        const address = simpleCellAddress(sheet, x, y)
        const expectedVertex = this.expected.addressMapping.getCell(address)
        const actualVertex = this.actual.addressMapping.getCell(address)
        if (expectedVertex === undefined && actualVertex === undefined) {
          continue
        } else if (
          (expectedVertex instanceof FormulaCellVertex && actualVertex instanceof FormulaCellVertex) ||
          (expectedVertex instanceof ArrayVertex && actualVertex instanceof ArrayVertex)
        ) {
          const actualVertexAddress = actualVertex.getAddress(this.actual.dependencyGraph.lazilyTransformingAstService)
          const expectedVertexAddress = expectedVertex.getAddress(this.expected.dependencyGraph.lazilyTransformingAstService)
          deepStrictEqual(actualVertexAddress, expectedVertexAddress, `Different addresses in formulas. expected: ${actualVertexAddress}, actual: ${expectedVertexAddress}`)
          deepStrictEqual(actualVertex.getFormula(this.actual.lazilyTransformingAstService), expectedVertex.getFormula(this.expected.lazilyTransformingAstService), 'Different AST in formulas')
          deepStrictEqual(this.normalizeCellValue(actualVertex.getCellValue()), this.normalizeCellValue(expectedVertex.getCellValue()), `Different values of formulas. expected: ${expectedVertex.getCellValue().toString()}, actual: ${actualVertex.getCellValue().toString()}`)
        } else if (expectedVertex instanceof ValueCellVertex && actualVertex instanceof ValueCellVertex) {
          deepStrictEqual(actualVertex.getCellValue(), expectedVertex.getCellValue(), `Different values. expected: ${expectedVertex.getCellValue().toString()}, actual: ${actualVertex.getCellValue().toString()}`)
        } else if (expectedVertex instanceof EmptyCellVertex && actualVertex instanceof EmptyCellVertex) {
          continue
        } else if (expectedVertex instanceof ParsingErrorVertex && actualVertex instanceof ParsingErrorVertex) {
          deepStrictEqual(expectedVertex.rawInput, actualVertex.rawInput, `Different raw input. expected: ${expectedVertex.rawInput}, actual: ${actualVertex.rawInput}`)
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

  private normalizeCellValue(value: InterpreterValue): any {
    if (value instanceof CellError) {
      return {
        type: value.type,
        message: value.message,
        root: (value.root as any)?.cellAddress
      }
    }
    return value
  }

  private compareMatrixMappings() {
    const actual = this.actual.arrayMapping.arrayMapping
    const expected = this.expected.arrayMapping.arrayMapping

    expect(actual.size).toEqual(expected.size)

    for (const [key, value] of expected.entries()) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const actualEntry = actual.get(key)!
      expect(actualEntry).toBeDefined()
      expect(actualEntry.array.size.isRef).toBe(value.array.size.isRef)
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
