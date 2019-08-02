
import {simpleCellAddress} from '../src/Cell'
import {AddressMapping, DenseStrategy, EmptyCellVertex, SparseStrategy} from '../src/DependencyGraph'
import { ValueCellVertex} from '../src/DependencyGraph'

const sharedExamples = (builder: (width: number, height: number) => AddressMapping) => {
  it('simple set', () => {
    const mapping = builder(1, 1)
    const vertex = new ValueCellVertex(42)
    const address = simpleCellAddress(0, 0, 0)

    mapping.setCell(address, vertex)

    expect(mapping.fetchCell(address)).toBe(vertex)
  })

  it('set and using different reference when get', () => {
    const mapping = builder(1, 1)
    const vertex = new ValueCellVertex(42)

    mapping.setCell(simpleCellAddress(0, 0, 0), vertex)

    expect(mapping.fetchCell(simpleCellAddress(0, 0, 0))).toBe(vertex)
  })

  it("get when there's even no column", () => {
    const mapping = builder(1, 1)

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toBe(null)
  })

  it('get when there was already something in that column', () => {
    const mapping = builder(1, 2)

    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(42))

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toBe(null)
  })

  it('get when asking for out of the row bound cell', () => {
    const mapping = builder(1, 1)

    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(null)
  })

  it("set when there's already something in that column", () => {
    const mapping = builder(1, 2)
    const vertex0 = new ValueCellVertex(42)
    const vertex1 = new ValueCellVertex(42)
    mapping.setCell(simpleCellAddress(0, 0, 0), vertex0)

    mapping.setCell(simpleCellAddress(0, 0, 1), vertex1)

    expect(mapping.fetchCell(simpleCellAddress(0, 0, 0))).toBe(vertex0)
    expect(mapping.fetchCell(simpleCellAddress(0, 0, 1))).toBe(vertex1)
  })

  it('set overrides old value', () => {
    const mapping = builder(1, 1)
    const vertex0 = new ValueCellVertex(42)
    const vertex1 = new ValueCellVertex(42)
    mapping.setCell(simpleCellAddress(0, 0, 0), vertex0)

    mapping.setCell(simpleCellAddress(0, 0, 0), vertex1)

    expect(mapping.fetchCell(simpleCellAddress(0, 0, 0))).toBe(vertex1)
  })

  it("has when there's even no column", () => {
    const mapping = builder(1, 1)

    expect(mapping.has(simpleCellAddress(0, 0, 0))).toBe(false)
  })

  it("has when there's even no row", () => {
    const mapping = builder(1, 1)

    expect(mapping.has(simpleCellAddress(0, 0, 2))).toBe(false)
  })

  it('has when there was already something in that column', () => {
    const mapping = builder(1, 2)

    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(42))

    expect(mapping.has(simpleCellAddress(0, 0, 0))).toBe(false)
  })

  it('has when there is a value', () => {
    const mapping = builder(1, 1)

    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(42))

    expect(mapping.has(simpleCellAddress(0, 0, 0))).toBe(true)
  })

  it('addRows in the beginning of a mapping', () => {
    const mapping = builder(1, 1)

    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(42))

    mapping.addRows(0, 0, 1)

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toBe(null)
    expect(mapping.fetchCell(simpleCellAddress(0, 0, 1))).toEqual(new ValueCellVertex(42))
    expect(mapping.getHeight(0)).toEqual(2)
  })

  it('addRows in the middle of a mapping', () => {
    const mapping = builder(1, 2)

    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(42))
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(43))

    mapping.addRows(0, 1, 1)

    expect(mapping.fetchCell(simpleCellAddress(0, 0, 0))).toEqual(new ValueCellVertex(42))
    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(null)
    expect(mapping.fetchCell(simpleCellAddress(0, 0, 2))).toEqual(new ValueCellVertex(43))
    expect(mapping.getHeight(0)).toEqual(3)
  })

  it('addRows in the end of a mapping', () => {
    const mapping = builder(1, 1)

    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(42))

    mapping.addRows(0, 1, 1)

    expect(mapping.fetchCell(simpleCellAddress(0, 0, 0))).toEqual(new ValueCellVertex(42))
    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(null)
    expect(mapping.getHeight(0)).toEqual(2)
  })

  it('addRows more than one row', () => {
    const mapping = builder(1, 2)

    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(42))
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(43))

    mapping.addRows(0, 1, 3)

    expect(mapping.fetchCell(simpleCellAddress(0, 0, 0))).toEqual(new ValueCellVertex(42))
    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(null)
    expect(mapping.getCell(simpleCellAddress(0, 0, 2))).toBe(null)
    expect(mapping.getCell(simpleCellAddress(0, 0, 3))).toBe(null)
    expect(mapping.fetchCell(simpleCellAddress(0, 0, 4))).toEqual(new ValueCellVertex(43))
    expect(mapping.getHeight(0)).toEqual(5)
  })

  it('addRows when more than one column present', () => {
    const mapping = builder(2, 2)

    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(11))
    mapping.setCell(simpleCellAddress(0, 1, 0), new ValueCellVertex(12))
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(21))
    mapping.setCell(simpleCellAddress(0, 1, 1), new ValueCellVertex(22))

    mapping.addRows(0, 1, 1)

    expect(mapping.fetchCell(simpleCellAddress(0, 0, 0))).toEqual(new ValueCellVertex(11))
    expect(mapping.fetchCell(simpleCellAddress(0, 1, 0))).toEqual(new ValueCellVertex(12))
    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(null)
    expect(mapping.getCell(simpleCellAddress(0, 1, 1))).toBe(null)
    expect(mapping.fetchCell(simpleCellAddress(0, 0, 2))).toEqual(new ValueCellVertex(21))
    expect(mapping.fetchCell(simpleCellAddress(0, 1, 2))).toEqual(new ValueCellVertex(22))
    expect(mapping.getHeight(0)).toEqual(3)
  })

  it('removeRows - one row', () => {
    const mapping = builder(2, 2)
    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(11)) // to remove
    mapping.setCell(simpleCellAddress(0, 1, 0), new ValueCellVertex(12)) // to remove
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(21))
    mapping.setCell(simpleCellAddress(0, 1, 1), new ValueCellVertex(22))

    expect(mapping.getHeight(0)).toBe(2)
    mapping.removeRows(0, 0, 0)
    expect(mapping.getHeight(0)).toBe(1)
    expect(mapping.getCellValue(simpleCellAddress(0, 0, 0))).toBe(21)
    expect(mapping.getCellValue(simpleCellAddress(0, 1, 0))).toBe(22)
  })

  it('removeRows - more than one row', () => {
    const mapping = builder(2, 4)
    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(11))
    mapping.setCell(simpleCellAddress(0, 1, 0), new ValueCellVertex(12))
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(21)) // to
    mapping.setCell(simpleCellAddress(0, 1, 1), new ValueCellVertex(22)) // re
    mapping.setCell(simpleCellAddress(0, 0, 2), new ValueCellVertex(31)) // mo
    mapping.setCell(simpleCellAddress(0, 1, 2), new ValueCellVertex(32)) // ve
    mapping.setCell(simpleCellAddress(0, 0, 3), new ValueCellVertex(41))
    mapping.setCell(simpleCellAddress(0, 1, 3), new ValueCellVertex(42))

    expect(mapping.getHeight(0)).toBe(4)
    mapping.removeRows(0, 1, 2)
    expect(mapping.getHeight(0)).toBe(2)
    expect(mapping.getCellValue(simpleCellAddress(0, 0, 0))).toBe(11)
    expect(mapping.getCellValue(simpleCellAddress(0, 0, 1))).toBe(41)
  })

  it('removeRows - remove more rows thant mapping size', () => {
    const mapping = builder(2, 2)
    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(11))
    mapping.setCell(simpleCellAddress(0, 1, 0), new ValueCellVertex(12))
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(21))
    mapping.setCell(simpleCellAddress(0, 1, 1), new ValueCellVertex(22))

    expect(mapping.getHeight(0)).toBe(2)
    mapping.removeRows(0, 0, 5)
    expect(mapping.getHeight(0)).toBe(0)
    expect(mapping.has(simpleCellAddress(0, 0, 0))).toBe(false)
  })

  it('removeColumns - more than one col', () => {
    const mapping = builder(4, 2)
    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(11))
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(12))
    mapping.setCell(simpleCellAddress(0, 1, 0), new ValueCellVertex(21)) // to
    mapping.setCell(simpleCellAddress(0, 1, 1), new ValueCellVertex(22)) // re
    mapping.setCell(simpleCellAddress(0, 2, 0), new ValueCellVertex(31)) // mo
    mapping.setCell(simpleCellAddress(0, 2, 1), new ValueCellVertex(32)) // ve
    mapping.setCell(simpleCellAddress(0, 3, 0), new ValueCellVertex(41))
    mapping.setCell(simpleCellAddress(0, 3, 1), new ValueCellVertex(42))

    expect(mapping.getWidth(0)).toBe(4)
    mapping.removeColumns(0, 1, 2)
    expect(mapping.getWidth(0)).toBe(2)
    expect(mapping.getCellValue(simpleCellAddress(0, 0, 0))).toBe(11)
    expect(mapping.getCellValue(simpleCellAddress(0, 1, 0))).toBe(41)
  })

  it('removeColumns - remove more cols thant mapping size', () => {
    const mapping = builder(2, 2)
    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(11))
    mapping.setCell(simpleCellAddress(0, 1, 0), new ValueCellVertex(12))
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(21))
    mapping.setCell(simpleCellAddress(0, 1, 1), new ValueCellVertex(22))

    expect(mapping.getHeight(0)).toBe(2)
    mapping.removeColumns(0, 0, 5)
    expect(mapping.getWidth(0)).toBe(0)
    expect(mapping.has(simpleCellAddress(0, 0, 0))).toBe(false)
  })

  it ('should expand columns when adding cell', () => {
    const mapping = builder(2, 2)
    mapping.setCell(simpleCellAddress(0, 2, 0), new EmptyCellVertex())
    expect(mapping.getWidth(0)).toBe(3)
  })

  it ('should expand rows when adding cell', () => {
    const mapping = builder(2, 2)
    mapping.setCell(simpleCellAddress(0, 0, 2), new EmptyCellVertex())
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

    mapping.setCell(simpleCellAddress(0, 3, 15), new ValueCellVertex(42))

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
