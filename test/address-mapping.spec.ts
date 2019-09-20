
import {ColumnsSpan} from '../src/ColumnsSpan'
import {AddressMapping, DenseStrategy, EmptyCellVertex, SparseStrategy, ValueCellVertex} from '../src/DependencyGraph'
import {RowsSpan} from '../src/RowsSpan'
import {adr} from './testUtils'

const sharedExamples = (builder: (width: number, height: number) => AddressMapping) => {
  it('simple set', () => {
    const mapping = builder(1, 1)
    const vertex = new ValueCellVertex(42)
    const address = adr('A1')

    mapping.setCell(address, vertex)

    expect(mapping.fetchCell(address)).toBe(vertex)
  })

  it('set and using different reference when get', () => {
    const mapping = builder(1, 1)
    const vertex = new ValueCellVertex(42)

    mapping.setCell(adr('A1'), vertex)

    expect(mapping.fetchCell(adr('A1'))).toBe(vertex)
  })

  it("get when there's even no column", () => {
    const mapping = builder(1, 1)

    expect(mapping.getCell(adr('A1'))).toBe(null)
  })

  it('get when there was already something in that column', () => {
    const mapping = builder(1, 2)

    mapping.setCell(adr('A2'), new ValueCellVertex(42))

    expect(mapping.getCell(adr('A1'))).toBe(null)
  })

  it('get when asking for out of the row bound cell', () => {
    const mapping = builder(1, 1)

    expect(mapping.getCell(adr('A2'))).toBe(null)
  })

  it("set when there's already something in that column", () => {
    const mapping = builder(1, 2)
    const vertex0 = new ValueCellVertex(42)
    const vertex1 = new ValueCellVertex(42)
    mapping.setCell(adr('A1'), vertex0)

    mapping.setCell(adr('A2'), vertex1)

    expect(mapping.fetchCell(adr('A1'))).toBe(vertex0)
    expect(mapping.fetchCell(adr('A2'))).toBe(vertex1)
  })

  it('set overrides old value', () => {
    const mapping = builder(1, 1)
    const vertex0 = new ValueCellVertex(42)
    const vertex1 = new ValueCellVertex(42)
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

    mapping.setCell(adr('A2'), new ValueCellVertex(42))

    expect(mapping.has(adr('A1'))).toBe(false)
  })

  it('has when there is a value', () => {
    const mapping = builder(1, 1)

    mapping.setCell(adr('A1'), new ValueCellVertex(42))

    expect(mapping.has(adr('A1'))).toBe(true)
  })

  it('addRows in the beginning of a mapping', () => {
    const mapping = builder(1, 1)

    mapping.setCell(adr('A1'), new ValueCellVertex(42))

    mapping.addRows(0, 0, 1)

    expect(mapping.getCell(adr('A1'))).toBe(null)
    expect(mapping.fetchCell(adr('A2'))).toEqual(new ValueCellVertex(42))
    expect(mapping.getHeight(0)).toEqual(2)
  })

  it('addRows in the middle of a mapping', () => {
    const mapping = builder(1, 2)

    mapping.setCell(adr('A1'), new ValueCellVertex(42))
    mapping.setCell(adr('A2'), new ValueCellVertex(43))

    mapping.addRows(0, 1, 1)

    expect(mapping.fetchCell(adr('A1'))).toEqual(new ValueCellVertex(42))
    expect(mapping.getCell(adr('A2'))).toBe(null)
    expect(mapping.fetchCell(adr('A3'))).toEqual(new ValueCellVertex(43))
    expect(mapping.getHeight(0)).toEqual(3)
  })

  it('addRows in the end of a mapping', () => {
    const mapping = builder(1, 1)

    mapping.setCell(adr('A1'), new ValueCellVertex(42))

    mapping.addRows(0, 1, 1)

    expect(mapping.fetchCell(adr('A1'))).toEqual(new ValueCellVertex(42))
    expect(mapping.getCell(adr('A2'))).toBe(null)
    expect(mapping.getHeight(0)).toEqual(2)
  })

  it('addRows more than one row', () => {
    const mapping = builder(1, 2)

    mapping.setCell(adr('A1'), new ValueCellVertex(42))
    mapping.setCell(adr('A2'), new ValueCellVertex(43))

    mapping.addRows(0, 1, 3)

    expect(mapping.fetchCell(adr('A1'))).toEqual(new ValueCellVertex(42))
    expect(mapping.getCell(adr('A2'))).toBe(null)
    expect(mapping.getCell(adr('A3'))).toBe(null)
    expect(mapping.getCell(adr('A4'))).toBe(null)
    expect(mapping.fetchCell(adr('A5'))).toEqual(new ValueCellVertex(43))
    expect(mapping.getHeight(0)).toEqual(5)
  })

  it('addRows when more than one column present', () => {
    const mapping = builder(2, 2)

    mapping.setCell(adr('A1'), new ValueCellVertex(11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22))

    mapping.addRows(0, 1, 1)

    expect(mapping.fetchCell(adr('A1'))).toEqual(new ValueCellVertex(11))
    expect(mapping.fetchCell(adr('B1'))).toEqual(new ValueCellVertex(12))
    expect(mapping.getCell(adr('A2'))).toBe(null)
    expect(mapping.getCell(adr('B2'))).toBe(null)
    expect(mapping.fetchCell(adr('A3'))).toEqual(new ValueCellVertex(21))
    expect(mapping.fetchCell(adr('B3'))).toEqual(new ValueCellVertex(22))
    expect(mapping.getHeight(0)).toEqual(3)
  })

  it('removeRows - one row', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11)) // to remove
    mapping.setCell(adr('B1'), new ValueCellVertex(12)) // to remove
    mapping.setCell(adr('A2'), new ValueCellVertex(21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22))

    expect(mapping.getHeight(0)).toBe(2)
    mapping.removeRows(new RowsSpan(0, 0, 0))
    expect(mapping.getHeight(0)).toBe(1)
    expect(mapping.getCellValue(adr('A1'))).toBe(21)
    expect(mapping.getCellValue(adr('B1'))).toBe(22)
  })

  it('removeRows - more than one row', () => {
    const mapping = builder(2, 4)
    mapping.setCell(adr('A1'), new ValueCellVertex(11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21)) // to
    mapping.setCell(adr('B2'), new ValueCellVertex(22)) // re
    mapping.setCell(adr('A3'), new ValueCellVertex(31)) // mo
    mapping.setCell(adr('B3'), new ValueCellVertex(32)) // ve
    mapping.setCell(adr('A4'), new ValueCellVertex(41))
    mapping.setCell(adr('B4'), new ValueCellVertex(42))

    expect(mapping.getHeight(0)).toBe(4)
    mapping.removeRows(new RowsSpan(0, 1, 2))
    expect(mapping.getHeight(0)).toBe(2)
    expect(mapping.getCellValue(adr('A1'))).toBe(11)
    expect(mapping.getCellValue(adr('A2'))).toBe(41)
  })

  it('removeRows - remove more rows thant mapping size', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22))

    expect(mapping.getHeight(0)).toBe(2)
    mapping.removeRows(new RowsSpan(0, 0, 5))
    expect(mapping.getHeight(0)).toBe(0)
    expect(mapping.has(adr('A1'))).toBe(false)
  })

  it('removeRows - remove more cols than size, but still something left', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22))

    mapping.removeRows(new RowsSpan(0, 1, 5))

    expect(mapping.getHeight(0)).toBe(1)
    expect(mapping.has(adr('A1'))).toBe(true)
    expect(mapping.has(adr('A2'))).toBe(false)
  })

  it('removeRows - sometimes nothing is removed', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22))

    mapping.removeRows(new RowsSpan(0, 2, 3))

    expect(mapping.getHeight(0)).toBe(2)
    expect(mapping.has(adr('A1'))).toBe(true)
    expect(mapping.has(adr('A2'))).toBe(true)
  })

  it('removeColumns - more than one col', () => {
    const mapping = builder(4, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11))
    mapping.setCell(adr('A2'), new ValueCellVertex(12))
    mapping.setCell(adr('B1'), new ValueCellVertex(21)) // to
    mapping.setCell(adr('B2'), new ValueCellVertex(22)) // re
    mapping.setCell(adr('C1'), new ValueCellVertex(31)) // mo
    mapping.setCell(adr('C2'), new ValueCellVertex(32)) // ve
    mapping.setCell(adr('D1'), new ValueCellVertex(41))
    mapping.setCell(adr('D2'), new ValueCellVertex(42))

    expect(mapping.getWidth(0)).toBe(4)
    mapping.removeColumns(new ColumnsSpan(0, 1, 2))
    expect(mapping.getWidth(0)).toBe(2)
    expect(mapping.getCellValue(adr('A1'))).toBe(11)
    expect(mapping.getCellValue(adr('B1'))).toBe(41)
  })

  it('removeColumns - remove more cols thant mapping size', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22))

    expect(mapping.getHeight(0)).toBe(2)
    mapping.removeColumns(new ColumnsSpan(0, 0, 5))
    expect(mapping.getWidth(0)).toBe(0)
    expect(mapping.has(adr('A1'))).toBe(false)
  })

  it('removeColumns - remove more cols than size, but still something left', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22))

    mapping.removeColumns(new ColumnsSpan(0, 1, 5))

    expect(mapping.getWidth(0)).toBe(1)
    expect(mapping.has(adr('A1'))).toBe(true)
    expect(mapping.has(adr('B1'))).toBe(false)
  })

  it('removeColumns - sometimes nothing is removed', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A1'), new ValueCellVertex(11))
    mapping.setCell(adr('B1'), new ValueCellVertex(12))
    mapping.setCell(adr('A2'), new ValueCellVertex(21))
    mapping.setCell(adr('B2'), new ValueCellVertex(22))

    mapping.removeColumns(new ColumnsSpan(0, 2, 3))

    expect(mapping.getWidth(0)).toBe(2)
    expect(mapping.has(adr('A1'))).toBe(true)
    expect(mapping.has(adr('B1'))).toBe(true)
  })

  it ('should expand columns when adding cell', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('C1'), new EmptyCellVertex())
    expect(mapping.getWidth(0)).toBe(3)
  })

  it ('should expand rows when adding cell', () => {
    const mapping = builder(2, 2)
    mapping.setCell(adr('A3'), new EmptyCellVertex())
    expect(mapping.getHeight(0)).toBe(3)
  })
}

describe('SparseStrategy', () => {
  sharedExamples((maxCol: number, maxRow: number) => {
    const mapping = new AddressMapping(1.0)
    mapping.addSheet(0, new SparseStrategy(maxCol, maxRow))
    return mapping
  })

  it('returns maximum row/col for simplest case', () => {
    const mapping = new AddressMapping(1.0)
    mapping.addSheet(0, new SparseStrategy(4, 16))

    mapping.setCell(adr('D16'), new ValueCellVertex(42))

    expect(mapping.getHeight(0)).toEqual(16)
    expect(mapping.getWidth(0)).toEqual(4)
  })
})

describe('DenseStrategy', () => {
  sharedExamples((maxCol, maxRow) => {
    const mapping = new AddressMapping(1.0)
    mapping.addSheet(0, new DenseStrategy(maxCol, maxRow))
    return mapping
  })

  it('returns maximum row/col for simplest case', () => {
    const mapping = new AddressMapping(1.0)
    mapping.addSheet(0, new DenseStrategy(1, 2))

    expect(mapping.getHeight(0)).toEqual(2)
    expect(mapping.getWidth(0)).toEqual(1)
  })
})

describe('AddressMapping', () => {
  it('#buildAddresMapping - when sparse matrix', () => {
    const addressMapping = AddressMapping.build(0.8)
    addressMapping.autoAddSheet(0, [
      ['', '', ''],
      ['', '', '1'],
    ])

    expect(addressMapping.strategyFor(0)).toBeInstanceOf(SparseStrategy)
  })

  it('#buildAddresMapping - when dense matrix', () => {
    const addressMapping = AddressMapping.build(0.8)
    addressMapping.autoAddSheet(0, [
      ['1', '1'],
      ['1', '1'],
    ])

    expect(addressMapping.strategyFor(0)).toBeInstanceOf(DenseStrategy)
  })
})
