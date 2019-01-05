import {AddressMapping} from '../src/AddressMapping'
import {ArrayAddressMapping} from '../src/ArrayAddressMapping'
import {simpleCellAddress} from '../src/Cell'
import {IAddressMapping} from '../src/IAddressMapping'
import {EmptyCellVertex, RangeVertex, ValueCellVertex} from '../src/Vertex'

const sharedExamples = (builder: (width: number, height: number) => IAddressMapping) => {
  it('simple set', () => {
    const mapping = builder(1, 1)
    const vertex = new ValueCellVertex(42)
    const address = simpleCellAddress(0, 0)

    mapping.setCell(address, vertex)

    expect(mapping.getCell(address)).toBe(vertex)
  })

  it('set and using different reference when get', () => {
    const mapping = builder(1, 1)
    const vertex = new ValueCellVertex(42)

    mapping.setCell(simpleCellAddress(0, 0), vertex)

    expect(mapping.getCell(simpleCellAddress(0, 0))).toBe(vertex)
  })

  it("get when there's even no column", () => {
    const mapping = builder(1, 1)

    expect(mapping.getCell(simpleCellAddress(0, 0))).toBe(EmptyCellVertex.getSingletonInstance())
  })

  it('get when there was already something in that column', () => {
    const mapping = builder(1, 2)

    mapping.setCell(simpleCellAddress(0, 1), new ValueCellVertex(42))

    expect(mapping.getCell(simpleCellAddress(0, 0))).toBe(EmptyCellVertex.getSingletonInstance())
  })

  it('get when asking for out of the row bound cell', () => {
    const mapping = builder(1, 1)

    expect(mapping.getCell(simpleCellAddress(0, 1))).toBe(EmptyCellVertex.getSingletonInstance())
  })

  it("set when there's already something in that column", () => {
    const mapping = builder(1, 2)
    const vertex0 = new ValueCellVertex(42)
    const vertex1 = new ValueCellVertex(42)
    mapping.setCell(simpleCellAddress(0, 0), vertex0)

    mapping.setCell(simpleCellAddress(0, 1), vertex1)

    expect(mapping.getCell(simpleCellAddress(0, 0))).toBe(vertex0)
    expect(mapping.getCell(simpleCellAddress(0, 1))).toBe(vertex1)
  })

  it('set overrides old value', () => {
    const mapping = builder(1, 1)
    const vertex0 = new ValueCellVertex(42)
    const vertex1 = new ValueCellVertex(42)
    mapping.setCell(simpleCellAddress(0, 0), vertex0)

    mapping.setCell(simpleCellAddress(0, 0), vertex1)

    expect(mapping.getCell(simpleCellAddress(0, 0))).toBe(vertex1)
  })

  it("has when there's even no column", () => {
    const mapping = builder(1, 1)

    expect(mapping.has(simpleCellAddress(0, 0))).toBe(false)
  })

  it("has when there's even no row", () => {
    const mapping = builder(1, 1)

    expect(mapping.has(simpleCellAddress(0, 2))).toBe(false)
  })

  it('has when there was already something in that column', () => {
    const mapping = builder(1, 2)

    mapping.setCell(simpleCellAddress(0, 1), new ValueCellVertex(42))

    expect(mapping.has(simpleCellAddress(0, 0))).toBe(false)
  })

  it('has when there is a value', () => {
    const mapping = builder(1, 1)

    mapping.setCell(simpleCellAddress(0, 0), new ValueCellVertex(42))

    expect(mapping.has(simpleCellAddress(0, 0))).toBe(true)
  })
}

describe('AddressMapping', () => {
  sharedExamples((maxCol, maxRow) => new AddressMapping())

  it('returns maximum row/col for simplest case', () => {
    const mapping = new AddressMapping()

    mapping.setCell(simpleCellAddress(3, 15), new ValueCellVertex(42))

    expect(mapping.getHeight()).toEqual(16)
    expect(mapping.getWidth()).toEqual(4)
  })
})

describe('ArrayAddressMapping', () => {
  sharedExamples((maxCol, maxRow) => new ArrayAddressMapping(maxCol, maxRow))

  it('returns maximum row/col for simplest case', () => {
    const mapping = new ArrayAddressMapping(1, 2)

    expect(mapping.getHeight()).toEqual(2)
    expect(mapping.getWidth()).toEqual(1)
  })
})
