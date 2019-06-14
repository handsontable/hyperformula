import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {AddressMapping, DenseStrategy, SparseStrategy} from '../src/AddressMapping'
import {simpleCellAddress} from '../src/Cell'
import {EmptyCellVertex, MatrixVertex, ValueCellVertex} from '../src/Vertex'

const sharedExamples = (builder: (width: number, height: number) => AddressMapping) => {
  it('simple set', () => {
    const mapping = builder(1, 1)
    const vertex = new ValueCellVertex(42)
    const address = simpleCellAddress(0, 0, 0)

    mapping.setCell(address, vertex)

    expect(mapping.getCell(address)).toBe(vertex)
  })

  it('set and using different reference when get', () => {
    const mapping = builder(1, 1)
    const vertex = new ValueCellVertex(42)

    mapping.setCell(simpleCellAddress(0, 0, 0), vertex)

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toBe(vertex)
  })

  it("get when there's even no column", () => {
    const mapping = builder(1, 1)

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toBe(EmptyCellVertex.getSingletonInstance())
  })

  it('get when there was already something in that column', () => {
    const mapping = builder(1, 2)

    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(42))

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toBe(EmptyCellVertex.getSingletonInstance())
  })

  it('get when asking for out of the row bound cell', () => {
    const mapping = builder(1, 1)

    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(EmptyCellVertex.getSingletonInstance())
  })

  it("set when there's already something in that column", () => {
    const mapping = builder(1, 2)
    const vertex0 = new ValueCellVertex(42)
    const vertex1 = new ValueCellVertex(42)
    mapping.setCell(simpleCellAddress(0, 0, 0), vertex0)

    mapping.setCell(simpleCellAddress(0, 0, 1), vertex1)

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toBe(vertex0)
    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(vertex1)
  })

  it('set overrides old value', () => {
    const mapping = builder(1, 1)
    const vertex0 = new ValueCellVertex(42)
    const vertex1 = new ValueCellVertex(42)
    mapping.setCell(simpleCellAddress(0, 0, 0), vertex0)

    mapping.setCell(simpleCellAddress(0, 0, 0), vertex1)

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toBe(vertex1)
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

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toBe(EmptyCellVertex.getSingletonInstance())
    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toEqual(new ValueCellVertex(42))
    expect(mapping.getHeight(0)).toEqual(2)
  })

  it('addRows in the middle of a mapping', () => {
    const mapping = builder(1, 2)

    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(42))
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(43))

    mapping.addRows(0, 1, 1)

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toEqual(new ValueCellVertex(42))
    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(EmptyCellVertex.getSingletonInstance())
    expect(mapping.getCell(simpleCellAddress(0, 0, 2))).toEqual(new ValueCellVertex(43))
    expect(mapping.getHeight(0)).toEqual(3)
  })

  it('addRows in the end of a mapping', () => {
    const mapping = builder(1, 1)

    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(42))

    mapping.addRows(0, 1, 1)

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toEqual(new ValueCellVertex(42))
    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(EmptyCellVertex.getSingletonInstance())
    expect(mapping.getHeight(0)).toEqual(2)
  })

  it('addRows more than one row', () => {
    const mapping = builder(1, 2)

    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(42))
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(43))

    mapping.addRows(0, 1, 3)

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toEqual(new ValueCellVertex(42))
    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(EmptyCellVertex.getSingletonInstance())
    expect(mapping.getCell(simpleCellAddress(0, 0, 2))).toBe(EmptyCellVertex.getSingletonInstance())
    expect(mapping.getCell(simpleCellAddress(0, 0, 3))).toBe(EmptyCellVertex.getSingletonInstance())
    expect(mapping.getCell(simpleCellAddress(0, 0, 4))).toEqual(new ValueCellVertex(43))
    expect(mapping.getHeight(0)).toEqual(5)
  })

  it('addRows when more than one column present', () => {
    const mapping = builder(2, 2)

    mapping.setCell(simpleCellAddress(0, 0, 0), new ValueCellVertex(11))
    mapping.setCell(simpleCellAddress(0, 1, 0), new ValueCellVertex(12))
    mapping.setCell(simpleCellAddress(0, 0, 1), new ValueCellVertex(21))
    mapping.setCell(simpleCellAddress(0, 1, 1), new ValueCellVertex(22))

    mapping.addRows(0, 1, 1)

    expect(mapping.getCell(simpleCellAddress(0, 0, 0))).toEqual(new ValueCellVertex(11))
    expect(mapping.getCell(simpleCellAddress(0, 1, 0))).toEqual(new ValueCellVertex(12))
    expect(mapping.getCell(simpleCellAddress(0, 0, 1))).toBe(EmptyCellVertex.getSingletonInstance())
    expect(mapping.getCell(simpleCellAddress(0, 1, 1))).toBe(EmptyCellVertex.getSingletonInstance())
    expect(mapping.getCell(simpleCellAddress(0, 0, 2))).toEqual(new ValueCellVertex(21))
    expect(mapping.getCell(simpleCellAddress(0, 1, 2))).toEqual(new ValueCellVertex(22))
    expect(mapping.getHeight(0)).toEqual(3)
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
