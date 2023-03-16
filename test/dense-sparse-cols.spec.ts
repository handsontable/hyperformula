import { adr } from './testUtils'
import { AddressMapping, SparseStrategy, DenseStrategy, ValueCellVertex } from '../src/DependencyGraph'
import { AlwaysDense, AlwaysSparse } from '../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import { ColumnsSpan } from '../src/Span'

describe('bug identify and fix', () => {

  it('values returned from AddressMapping.entriesFromColumnsSpan should be in the same order both Sparse and Dense strategies', () => {

    const denseMapping = new AddressMapping(new AlwaysDense())
    denseMapping.addSheet(0, new DenseStrategy(5, 5))

    const sparseMapping = new AddressMapping(new AlwaysSparse())
    sparseMapping.addSheet(0, new SparseStrategy(5, 5))

    const mappingsAndResults: { mapping: AddressMapping, results: String[][] }[] = [
      {
        mapping: denseMapping,
        results: [],
      },
      {
        mapping: sparseMapping,
        results: [],
      }
    ]

    mappingsAndResults.forEach((item) => {
      item.mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))
      item.mapping.setCell(adr('A2', 0), new ValueCellVertex(43, 43))
      item.mapping.setCell(adr('A3', 0), new ValueCellVertex(44, 44))
      item.mapping.setCell(adr('B1', 0), new ValueCellVertex(45, 45))
      item.mapping.setCell(adr('B2', 0), new ValueCellVertex(46, 46))
      item.mapping.setCell(adr('B3', 0), new ValueCellVertex(47, 47))
      item.mapping.setCell(adr('C1', 0), new ValueCellVertex(48, 48))
      item.mapping.setCell(adr('C2', 0), new ValueCellVertex(49, 49))
      item.mapping.setCell(adr('C3', 0), new ValueCellVertex(50, 50))
    })

    mappingsAndResults.forEach((item) => {
      for (const [simpleCellAddress, cellVertex] of item.mapping.entriesFromColumnsSpan(new ColumnsSpan(0, 1, 2))) {
        item.results.push([
          String(simpleCellAddress.sheet),
          String(simpleCellAddress.row),
          String(simpleCellAddress.col),
          String(cellVertex.getCellValue()),
        ])
      }
    })

    expect(mappingsAndResults[0].results).toEqual(mappingsAndResults[1].results)
  })
})
