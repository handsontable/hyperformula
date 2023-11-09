import {AddressMapping, DenseStrategy, EmptyCellVertex, SparseStrategy, ValueCellVertex} from '../src/DependencyGraph'
import {
  AlwaysDense,
  AlwaysSparse,
  DenseSparseChooseBasedOnThreshold
} from '../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'
import {findBoundaries} from '../src/Sheet'
import {ColumnsSpan, RowsSpan} from '../src/Span'
import {adr} from './testUtils'

const sharedExamples = (builder: (width: number, height: number) => AddressMapping) => {
  it('simple set', () => {
    const mapping = builder(1, 1)
    const vertex = new ValueCellVertex(42, 42)
    const address = adr('A1')

    mapping.setCell(address, vertex)

    expect(mapping.fetchCell(address)).toBe(vertex)
  })

  it('set and using different reference when get', () => {
    const mapping = builder(1, 1)
    const vertex = new ValueCellVertex(42, 42)

    mapping.setCell(adr('A1'), vertex)

    expect(mapping.fetchCell(adr('A1'))).toBe(vertex)
  })

  it("get when there's even no column", () => {
    const mapping = builder(1, 1)

    expect(mapping.getCell(adr('A1'))).toBe(undefined)
  })

  it('get when there was already something in that column', () => {
    const mapping = builder(1, 2)

    mapping.setCell(adr('A2'), new ValueCellVertex(42, 42))

    expect(mapping.getCell(adr('A1'))).toBe(undefined)
  })

  it('get when asking for out of the row bound cell', () => {
    const mapping = builder(1, 1)

    expect(mapping.getCell(adr('A2'))).toBe(undefined)
  })

  it('get all entries', () => {
    const mapping = builder(1, 2)
    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2', 0), new ValueCellVertex(43, 43))

    const results = []
    for (const [simpleCellAddress, cellVertex] of mapping.sheetEntries(0)) {
      results.push([
        simpleCellAddress.sheet,
        simpleCellAddress.row,
        simpleCellAddress.col,
        String(cellVertex.getCellValue()),
      ])
    }

    expect(results).toEqual([
      [0, 0, 0, String(42)],
      [0, 1, 0, String(43)],
    ])
  })

  it('get all entries - from rows span', () => {
    const mapping = builder(3, 3)
    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2', 0), new ValueCellVertex(43, 43))
    mapping.setCell(adr('A3', 0), new ValueCellVertex(44, 44))
    mapping.setCell(adr('B1', 0), new ValueCellVertex(45, 45))
    mapping.setCell(adr('B2', 0), new ValueCellVertex(46, 46))
    mapping.setCell(adr('B3', 0), new ValueCellVertex(47, 47))
    mapping.setCell(adr('C1', 0), new ValueCellVertex(48, 48))
    mapping.setCell(adr('C2', 0), new ValueCellVertex(49, 49))
    mapping.setCell(adr('C3', 0), new ValueCellVertex(50, 50))

    const results = []
    for (const [simpleCellAddress, cellVertex] of mapping.entriesFromRowsSpan(new RowsSpan(0, 1, 2))) {
      results.push([
        simpleCellAddress.sheet,
        simpleCellAddress.row,
        simpleCellAddress.col,
        String(cellVertex.getCellValue()),
      ])
    }

    expect(results).toEqual([
      [0, 1, 0, String(43)],
      [0, 2, 0, String(44)],
      [0, 1, 1, String(46)],
      [0, 2, 1, String(47)],
      [0, 1, 2, String(49)],
      [0, 2, 2, String(50)],
    ])
  })

  it('get all entries - from columns span', () => {
    const mapping = builder(3, 3)
    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2', 0), new ValueCellVertex(43, 43))
    mapping.setCell(adr('A3', 0), new ValueCellVertex(44, 44))
    mapping.setCell(adr('B1', 0), new ValueCellVertex(45, 45))
    mapping.setCell(adr('B2', 0), new ValueCellVertex(46, 46))
    mapping.setCell(adr('B3', 0), new ValueCellVertex(47, 47))
    mapping.setCell(adr('C1', 0), new ValueCellVertex(48, 48))
    mapping.setCell(adr('C2', 0), new ValueCellVertex(49, 49))
    mapping.setCell(adr('C3', 0), new ValueCellVertex(50, 50))

    const results = []
    for (const [simpleCellAddress, cellVertex] of mapping.entriesFromColumnsSpan(new ColumnsSpan(0, 1, 2))) {
      results.push([
        simpleCellAddress.sheet,
        simpleCellAddress.row,
        simpleCellAddress.col,
        String(cellVertex.getCellValue()),
      ])
    }

    expect(results).toEqual([
      [0, 0, 1, String(45)],
      [0, 1, 1, String(46)],
      [0, 2, 1, String(47)],
      [0, 0, 2, String(48)],
      [0, 1, 2, String(49)],
      [0, 2, 2, String(50)],
    ])
  })

  it("set when there's already something in that column", () => {
    const mapping = builder(1, 2)
    const vertex0 = new ValueCellVertex(42, 42)
    const vertex1 = new ValueCellVertex(42, 42)
    mapping.setCell(adr('A1'), vertex0)

    mapping.setCell(adr('A2'), vertex1)

    expect(mapping.fetchCell(adr('A1'))).toBe(vertex0)
    expect(mapping.fetchCell(adr('A2'))).toBe(vertex1)
  })

  it('set overrides old value', () => {
    const mapping = builder(1, 1)
    const vertex0 = new ValueCellVertex(42, 42)
    const vertex1 = new ValueCellVertex(42, 42)
    mapping.setCell(adr('A1'), vertex0)

    mapping.setCell(adr('A1'), vertex1)

    expect(mapping.fetchCell(adr('A1'))).toBe(vertex1)
  })

  it("has when there's even no column", () => {
    const mapping = builder(1, 1)

    expect(mapping.has(adr('A1'))).toBe(false)
  })

  it("has when there's even no row", () => {
    const mapping = builder(1, 1)

    expect(mapping.has(adr('A3'))).toBe(false)
  })

  it('has when there was already something in that column', () => {
    const mapping = builder(1, 2)

    mapping.setCell(adr('A2'), new ValueCellVertex(42, 42))

    expect(mapping.has(adr('A1'))).toBe(false)
  })

  it('has when there is a value', () => {
    const mapping = builder(1, 1)

    mapping.setCell(adr('A1'), new ValueCellVertex(42, 42))

    expect(mapping.has(adr('A1'))).toBe(true)
  })

  it('addRows in the beginning of a mapping', () => {
    const mapping = builder(1, 1)

    mapping.setCell(adr('A1'), new ValueCellVertex(42, 42))

    mapping.addRows(0, 0, 1)

    expect(mapping.getCell(adr('A1'))).toBe(undefined)
    expect(mapping.fetchCell(adr('A2'))).toEqual(new ValueCellVertex(42, 42))
    expect(mapping.getHeight(0)).toEqual(2)
  })

  it('addRows in the middle of a mapping', () => {
    const mapping = builder(1, 2)

    mapping.setCell(adr('A1'), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2'), new ValueCellVertex(43, 43))

    mapping.addRows(0, 1, 1)

    expect(mapping.fetchCell(adr('A1'))).toEqual(new ValueCellVertex(42, 42))
    expect(mapping.getCell(adr('A2'))).toBe(undefined)
    expect(mapping.fetchCell(adr('A3'))).toEqual(new ValueCellVertex(43, 43))
    expect(mapping.getHeight(0)).toEqual(3)
  })

  it('addRows in the end of a mapping', () => {
    const mapping = builder(1, 1)

    mapping.setCell(adr('A1'), new ValueCellVertex(42, 42))

    mapping.addRows(0, 1, 1)

    expect(mapping.fetchCell(adr('A1'))).toEqual(new ValueCellVertex(42, 42))
    expect(mapping.getCell(adr('A2'))).toBe(undefined)
    expect(mapping.getHeight(0)).toEqual(2)
  })

  it('addRows more than one row', () => {
    const mapping = builder(1, 2)

    mapping.setCell(adr('A1'), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2'), new ValueCellVertex(43, 43))

    mapping.addRows(0, 1, 3)

    expect(mapping.fetchCell(adr('A1'))).toEqual(new ValueCellVertex(42, 42))
    expect(mapping.getCell(adr('A2'))).toBe(undefined)
    expect(mapping.getCell(adr('A3'))).toBe(undefined)
    expect(mapping.getCell(adr('A4'))).toBe(undefined)
    expect(mapping.fetchCell(adr('A5'))).toEqual(new ValueCellVertex(43, 43))
    expect(mapping.getHeight(0)).toEqual(5)
  })

  it('addRows when more than one column present', () => {
    const mapping = builder(2, 2)

    mapping.setCell(adr('A1'), new ValueCellVertex(11, 11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12, 12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21, 21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22, 22))

    mapping.addRows(0, 1, 1)

    expect(mapping.fetchCell(adr('A1'))).toEqual(new ValueCellVertex(11, 11))
    expect(mapping.fetchCell(adr('B1'))).toEqual(new ValueCellVertex(12, 12))
    expect(mapping.getCell(adr('A2'))).toBe(undefined)
    expect(mapping.getCell(adr('B2'))).toBe(undefined)
    expect(mapping.fetchCell(adr('A3'))).toEqual(new ValueCellVertex(21, 21))
    expect(mapping.fetchCell(adr('B3'))).toEqual(new ValueCellVertex(22, 22))
    expect(mapping.getHeight(0)).toEqual(3)
  })

  it('removeRows - one row', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11, 11)) // to remove
    mapping.setCell(adr('B1'), new ValueCellVertex(12, 12)) // to remove
    mapping.setCell(adr('A2'), new ValueCellVertex(21, 21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22, 22))

    expect(mapping.getHeight(0)).toBe(2)
    mapping.removeRows(new RowsSpan(0, 0, 0))
    expect(mapping.getHeight(0)).toBe(1)
    expect(mapping.getCellValue(adr('A1'))).toBe(21)
    expect(mapping.getCellValue(adr('B1'))).toBe(22)
  })

  it('removeRows - more than one row', () => {
    const mapping = builder(2, 4)
    mapping.setCell(adr('A1'), new ValueCellVertex(11, 11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12, 12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21, 21)) // to
    mapping.setCell(adr('B2'), new ValueCellVertex(22, 22)) // re
    mapping.setCell(adr('A3'), new ValueCellVertex(31, 31)) // mo
    mapping.setCell(adr('B3'), new ValueCellVertex(32, 32)) // ve
    mapping.setCell(adr('A4'), new ValueCellVertex(41, 41))
    mapping.setCell(adr('B4'), new ValueCellVertex(42, 42))

    expect(mapping.getHeight(0)).toBe(4)
    mapping.removeRows(new RowsSpan(0, 1, 2))
    expect(mapping.getHeight(0)).toBe(2)
    expect(mapping.getCellValue(adr('A1'))).toBe(11)
    expect(mapping.getCellValue(adr('A2'))).toBe(41)
  })

  it('removeRows - remove more rows thant mapping size', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11, 11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12, 12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21, 21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22, 22))

    expect(mapping.getHeight(0)).toBe(2)
    mapping.removeRows(new RowsSpan(0, 0, 5))
    expect(mapping.getHeight(0)).toBe(0)
    expect(mapping.has(adr('A1'))).toBe(false)
  })

  it('removeRows - remove more cols than size, but still something left', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11, 11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12, 12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21, 21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22, 22))

    mapping.removeRows(new RowsSpan(0, 1, 5))

    expect(mapping.getHeight(0)).toBe(1)
    expect(mapping.has(adr('A1'))).toBe(true)
    expect(mapping.has(adr('A2'))).toBe(false)
  })

  it('removeRows - sometimes nothing is removed', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11, 11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12, 12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21, 21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22, 22))

    mapping.removeRows(new RowsSpan(0, 2, 3))

    expect(mapping.getHeight(0)).toBe(2)
    expect(mapping.has(adr('A1'))).toBe(true)
    expect(mapping.has(adr('A2'))).toBe(true)
  })

  it('removeColumns - more than one col', () => {
    const mapping = builder(4, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11, 11))
    mapping.setCell(adr('A2'), new ValueCellVertex(12, 12))
    mapping.setCell(adr('B1'), new ValueCellVertex(21, 21)) // to
    mapping.setCell(adr('B2'), new ValueCellVertex(22, 22)) // re
    mapping.setCell(adr('C1'), new ValueCellVertex(31, 31)) // mo
    mapping.setCell(adr('C2'), new ValueCellVertex(32, 32)) // ve
    mapping.setCell(adr('D1'), new ValueCellVertex(41, 41))
    mapping.setCell(adr('D2'), new ValueCellVertex(42, 42))

    expect(mapping.getWidth(0)).toBe(4)
    mapping.removeColumns(new ColumnsSpan(0, 1, 2))
    expect(mapping.getWidth(0)).toBe(2)
    expect(mapping.getCellValue(adr('A1'))).toBe(11)
    expect(mapping.getCellValue(adr('B1'))).toBe(41)
  })

  it('removeColumns - remove more cols thant mapping size', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11, 11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12, 12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21, 21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22, 22))

    expect(mapping.getHeight(0)).toBe(2)
    mapping.removeColumns(new ColumnsSpan(0, 0, 5))
    expect(mapping.getWidth(0)).toBe(0)
    expect(mapping.has(adr('A1'))).toBe(false)
  })

  it('removeColumns - remove more cols than size, but still something left', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11, 11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12, 12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21, 21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22, 22))

    mapping.removeColumns(new ColumnsSpan(0, 1, 5))

    expect(mapping.getWidth(0)).toBe(1)
    expect(mapping.has(adr('A1'))).toBe(true)
    expect(mapping.has(adr('B1'))).toBe(false)
  })

  it('removeColumns - sometimes nothing is removed', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11, 11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12, 12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21, 21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22, 22))

    mapping.removeColumns(new ColumnsSpan(0, 2, 3))

    expect(mapping.getWidth(0)).toBe(2)
    expect(mapping.has(adr('A1'))).toBe(true)
    expect(mapping.has(adr('B1'))).toBe(true)
  })

  it('should expand columns when adding cell', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('C1'), new EmptyCellVertex())
    expect(mapping.getWidth(0)).toBe(3)
  })

  it('should expand rows when adding cell', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A3'), new EmptyCellVertex())
    expect(mapping.getHeight(0)).toBe(3)
  })

  it('should move cell from source to destination', () => {
    const mapping = builder(1, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(42, 42))

    mapping.moveCell(adr('A1'), adr('A2'))

    expect(mapping.has(adr('A1'))).toEqual(false)
    expect(mapping.has(adr('A2'))).toEqual(true)
  })

  it('should throw error when trying to move not existing vertex', () => {
    const mapping = builder(1, 2)

    expect(() => mapping.moveCell(adr('A1'), adr('A2'))).toThrowError('Cannot move cell. No cell with such address.')
  })

  it('should throw error when trying to move vertex onto occupied place', () => {
    const mapping = builder(1, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2'), new ValueCellVertex(42, 42))

    expect(() => mapping.moveCell(adr('A1'), adr('A2'))).toThrowError('Cannot move cell. Destination already occupied.')
  })

  it('should throw error when trying to move vertices between sheets', () => {
    const mapping = builder(1, 2)
    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))

    expect(() => mapping.moveCell(adr('A1', 0), adr('A2', 1))).toThrowError('Cannot move cells between sheets.')
  })

  it('should throw error when trying to move vertices in non-existing sheet', () => {
    const mapping = builder(1, 2)
    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))

    expect(() => mapping.moveCell(adr('A1', 3), adr('A2', 3))).toThrowError('Sheet not initialized.')
  })

  it('entriesFromColumnsSpan returns the same result regardless of the strategy', () => {
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
}

describe('SparseStrategy', () => {
  sharedExamples((maxCol: number, maxRow: number) => {
    const mapping = new AddressMapping(new AlwaysSparse())
    mapping.addSheet(0, new SparseStrategy(maxCol, maxRow))
    mapping.addSheet(1, new SparseStrategy(maxCol, maxRow))
    return mapping
  })

  it('returns maximum row/col for simplest case', () => {
    const mapping = new AddressMapping(new AlwaysSparse())
    mapping.addSheet(0, new SparseStrategy(4, 16))

    mapping.setCell(adr('D16'), new ValueCellVertex(42, 42))

    expect(mapping.getHeight(0)).toEqual(16)
    expect(mapping.getWidth(0)).toEqual(4)
  })

  it('get all vertices', () => {
    const mapping = new AddressMapping(new AlwaysSparse())
    const sparseStrategy = new SparseStrategy(3, 3)
    mapping.addSheet(0, sparseStrategy)

    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2', 0), new ValueCellVertex(43, 43))
    mapping.setCell(adr('A3', 0), new ValueCellVertex(44, 44))
    mapping.setCell(adr('B1', 0), new ValueCellVertex(45, 45))
    mapping.setCell(adr('B2', 0), new ValueCellVertex(46, 46))
    mapping.setCell(adr('B3', 0), new ValueCellVertex(47, 47))
    mapping.setCell(adr('C1', 0), new ValueCellVertex(48, 48))
    mapping.setCell(adr('C2', 0), new ValueCellVertex(49, 49))
    mapping.setCell(adr('C3', 0), new ValueCellVertex(50, 50))

    const results = []
    for (const cellVertex of sparseStrategy.vertices()) {
      results.push(String(cellVertex.getCellValue()))
    }

    expect(results).toEqual([
      '42', '43', '44', '45', '46', '47', '48', '49', '50'
    ])
  })

  it('get all vertices - from column', () => {
    const mapping = new AddressMapping(new AlwaysSparse())
    const sparseStrategy = new SparseStrategy(3, 3)
    mapping.addSheet(0, sparseStrategy)

    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2', 0), new ValueCellVertex(43, 43))
    mapping.setCell(adr('A3', 0), new ValueCellVertex(44, 44))
    mapping.setCell(adr('B1', 0), new ValueCellVertex(45, 45))
    mapping.setCell(adr('B2', 0), new ValueCellVertex(46, 46))
    mapping.setCell(adr('B3', 0), new ValueCellVertex(47, 47))
    mapping.setCell(adr('C1', 0), new ValueCellVertex(48, 48))
    mapping.setCell(adr('C2', 0), new ValueCellVertex(49, 49))
    mapping.setCell(adr('C3', 0), new ValueCellVertex(50, 50))

    const results = []
    for (const cellVertex of sparseStrategy.verticesFromColumn(2)) {
      results.push(String(cellVertex.getCellValue()))
    }

    const outOfRangeResults = []
    for (const cellVertex of sparseStrategy.verticesFromColumn(5)) {
      outOfRangeResults.push(String(cellVertex.getCellValue()))
    }

    expect(results).toEqual(['48', '49', '50'])
    expect(outOfRangeResults).toEqual([])
  })

  it('get all vertices - from row', () => {
    const mapping = new AddressMapping(new AlwaysSparse())
    const sparseStrategy = new SparseStrategy(3, 3)
    mapping.addSheet(0, sparseStrategy)

    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2', 0), new ValueCellVertex(43, 43))
    mapping.setCell(adr('A3', 0), new ValueCellVertex(44, 44))
    mapping.setCell(adr('B1', 0), new ValueCellVertex(45, 45))
    mapping.setCell(adr('B2', 0), new ValueCellVertex(46, 46))
    mapping.setCell(adr('B3', 0), new ValueCellVertex(47, 47))
    mapping.setCell(adr('C1', 0), new ValueCellVertex(48, 48))
    mapping.setCell(adr('C2', 0), new ValueCellVertex(49, 49))
    mapping.setCell(adr('C3', 0), new ValueCellVertex(50, 50))

    const results = []
    for (const cellVertex of sparseStrategy.verticesFromRow(1)) {
      results.push(String(cellVertex.getCellValue()))
    }

    const outOfRangeResults = []
    for (const cellVertex of sparseStrategy.verticesFromRow(5)) {
      outOfRangeResults.push(String(cellVertex.getCellValue()))
    }

    expect(results).toEqual(['43', '46', '49'])
    expect(outOfRangeResults).toEqual([])
  })
})

describe('DenseStrategy', () => {
  sharedExamples((maxCol, maxRow) => {
    const mapping = new AddressMapping(new AlwaysDense())
    mapping.addSheet(0, new DenseStrategy(maxCol, maxRow))
    mapping.addSheet(1, new DenseStrategy(maxCol, maxRow))
    return mapping
  })

  it('returns maximum row/col for simplest case', () => {
    const mapping = new AddressMapping(new AlwaysDense())
    mapping.addSheet(0, new DenseStrategy(1, 2))

    expect(mapping.getHeight(0)).toEqual(2)
    expect(mapping.getWidth(0)).toEqual(1)
  })

  it('get all vertices', () => {
    const mapping = new AddressMapping(new AlwaysDense())
    const denseStratgey = new DenseStrategy(3, 3)
    mapping.addSheet(0, denseStratgey)

    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2', 0), new ValueCellVertex(43, 43))
    mapping.setCell(adr('A3', 0), new ValueCellVertex(44, 44))
    mapping.setCell(adr('B1', 0), new ValueCellVertex(45, 45))
    mapping.setCell(adr('B2', 0), new ValueCellVertex(46, 46))
    mapping.setCell(adr('B3', 0), new ValueCellVertex(47, 47))
    mapping.setCell(adr('C1', 0), new ValueCellVertex(48, 48))
    mapping.setCell(adr('C2', 0), new ValueCellVertex(49, 49))
    mapping.setCell(adr('C3', 0), new ValueCellVertex(50, 50))

    const results = []
    for (const cellVertex of denseStratgey.vertices()) {
      results.push(String(cellVertex.getCellValue()))
    }

    expect(results).toEqual([
      '42', '45', '48', '43', '46', '49', '44', '47', '50'
    ])
  })

  it('get all vertices - from column', () => {
    const mapping = new AddressMapping(new AlwaysDense())
    const denseStratgey = new DenseStrategy(3, 3)
    mapping.addSheet(0, denseStratgey)

    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2', 0), new ValueCellVertex(43, 43))
    mapping.setCell(adr('A3', 0), new ValueCellVertex(44, 44))
    mapping.setCell(adr('B1', 0), new ValueCellVertex(45, 45))
    mapping.setCell(adr('B2', 0), new ValueCellVertex(46, 46))
    mapping.setCell(adr('B3', 0), new ValueCellVertex(47, 47))
    mapping.setCell(adr('C1', 0), new ValueCellVertex(48, 48))
    mapping.setCell(adr('C2', 0), new ValueCellVertex(49, 49))
    mapping.setCell(adr('C3', 0), new ValueCellVertex(50, 50))

    const results = []
    for (const cellVertex of denseStratgey.verticesFromColumn(2)) {
      results.push(String(cellVertex.getCellValue()))
    }

    const outOfRangeResults = []
    for (const cellVertex of denseStratgey.verticesFromColumn(5)) {
      outOfRangeResults.push(String(cellVertex.getCellValue()))
    }

    expect(results).toEqual(['48', '49', '50'])
    expect(outOfRangeResults).toEqual([])
  })

  it('get all vertices - from row', () => {
    const mapping = new AddressMapping(new AlwaysDense())
    const denseStratgey = new DenseStrategy(3, 3)
    mapping.addSheet(0, denseStratgey)

    mapping.setCell(adr('A1', 0), new ValueCellVertex(42, 42))
    mapping.setCell(adr('A2', 0), new ValueCellVertex(43, 43))
    mapping.setCell(adr('A3', 0), new ValueCellVertex(44, 44))
    mapping.setCell(adr('B1', 0), new ValueCellVertex(45, 45))
    mapping.setCell(adr('B2', 0), new ValueCellVertex(46, 46))
    mapping.setCell(adr('B3', 0), new ValueCellVertex(47, 47))
    mapping.setCell(adr('C1', 0), new ValueCellVertex(48, 48))
    mapping.setCell(adr('C2', 0), new ValueCellVertex(49, 49))
    mapping.setCell(adr('C3', 0), new ValueCellVertex(50, 50))

    const results = []
    for (const cellVertex of denseStratgey.verticesFromRow(1)) {
      results.push(String(cellVertex.getCellValue()))
    }

    const outOfRangeResults = []
    for (const cellVertex of denseStratgey.verticesFromRow(5)) {
      outOfRangeResults.push(String(cellVertex.getCellValue()))
    }

    expect(results).toEqual(['43', '46', '49'])
    expect(outOfRangeResults).toEqual([])
  })
})

describe('AddressMapping', () => {
  it('#buildAddresMapping - when sparse matrix', () => {
    const addressMapping = new AddressMapping(new DenseSparseChooseBasedOnThreshold(0.8))
    const sheet = [
      [null, null, null],
      [null, null, '1'],
    ]
    addressMapping.autoAddSheet(0, findBoundaries(sheet))

    expect(addressMapping.strategyFor(0)).toBeInstanceOf(SparseStrategy)
  })

  it('#buildAddresMapping - when dense matrix', () => {
    const addressMapping = new AddressMapping(new DenseSparseChooseBasedOnThreshold(0.8))
    const sheet = [
      ['1', '1'],
      ['1', '1'],
    ]
    addressMapping.autoAddSheet(0, findBoundaries(sheet))

    expect(addressMapping.strategyFor(0)).toBeInstanceOf(DenseStrategy)
  })
})
