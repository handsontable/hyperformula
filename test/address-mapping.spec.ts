import {AddressMapping} from '../src/AddressMapping'
import {relativeCellAddress, simpleCellAddress} from '../src/Cell'
import {RangeVertex, ValueCellVertex} from '../src/Vertex'

describe('AddressMapping', () => {
  it('simple set', () => {
    const mapping = new AddressMapping()
    const vertex = new ValueCellVertex(42)
    const address = relativeCellAddress(0, 0)

    mapping.setCell(address, vertex)

    expect(mapping.getCell(address)).toBe(vertex)
  })

  it('set and using different reference when get', () => {
    const mapping = new AddressMapping()
    const vertex = new ValueCellVertex(42)

    mapping.setCell(relativeCellAddress(0, 0), vertex)

    expect(mapping.getCell(relativeCellAddress(0, 0))).toBe(vertex)
  })

  it("get when there's even no column", () => {
    const mapping = new AddressMapping()

    expect(mapping.getCell(relativeCellAddress(0, 0))).toBe(null)
  })

  it('get when there was already something in that column', () => {
    const mapping = new AddressMapping()

    mapping.setCell(relativeCellAddress(0, 1), new ValueCellVertex(42))

    expect(mapping.getCell(relativeCellAddress(0, 0))).toBe(null)
  })

  it("set when there's already something in that column", () => {
    const mapping = new AddressMapping()
    const vertex0 = new ValueCellVertex(42)
    const vertex1 = new ValueCellVertex(42)
    mapping.setCell(relativeCellAddress(0, 0), vertex0)

    mapping.setCell(relativeCellAddress(0, 1), vertex1)

    expect(mapping.getCell(relativeCellAddress(0, 0))).toBe(vertex0)
    expect(mapping.getCell(relativeCellAddress(0, 1))).toBe(vertex1)
  })

  it('set overrides old value', () => {
    const mapping = new AddressMapping()
    const vertex0 = new ValueCellVertex(42)
    const vertex1 = new ValueCellVertex(42)
    mapping.setCell(relativeCellAddress(0, 0), vertex0)

    mapping.setCell(relativeCellAddress(0, 0), vertex1)

    expect(mapping.getCell(relativeCellAddress(0, 0))).toBe(vertex1)
  })

  it("has when there's even no column", () => {
    const mapping = new AddressMapping()

    expect(mapping.has(relativeCellAddress(0, 0))).toBe(false)
  })

  it('has when there was already something in that column', () => {
    const mapping = new AddressMapping()

    mapping.setCell(relativeCellAddress(0, 1), new ValueCellVertex(42))

    expect(mapping.has(relativeCellAddress(0, 0))).toBe(false)
  })

  it('has when there is a value', () => {
    const mapping = new AddressMapping()

    mapping.setCell(relativeCellAddress(0, 0), new ValueCellVertex(42))

    expect(mapping.has(relativeCellAddress(0, 0))).toBe(true)
  })

  it('range mapping when there is none', () => {
    const mapping = new AddressMapping()
    const start = simpleCellAddress(0, 0)
    const end = simpleCellAddress(20, 50)
    const vertex = new RangeVertex(start, end)

    expect(mapping.getRange(start, end)).toBe(null)
  })

  it('setting range mapping', () => {
    const mapping = new AddressMapping()
    const start = simpleCellAddress(0, 0)
    const end = simpleCellAddress(20, 50)
    const vertex = new RangeVertex(start, end)

    mapping.setRange(vertex)

    expect(mapping.getRange(start, end)).toBe(vertex)
  })
})
