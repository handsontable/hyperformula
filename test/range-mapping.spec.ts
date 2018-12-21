import {simpleCellAddress} from '../src/Cell'
import {RangeMapping} from '../src/RangeMapping'
import {RangeVertex} from '../src/Vertex'

describe('RangeMapping', () => {
  it('range mapping when there is none', () => {
    const mapping = new RangeMapping()
    const start = simpleCellAddress(0, 0)
    const end = simpleCellAddress(20, 50)

    expect(mapping.getRange(start, end)).toBe(null)
  })

  it('setting range mapping', () => {
    const mapping = new RangeMapping()
    const start = simpleCellAddress(0, 0)
    const end = simpleCellAddress(20, 50)
    const vertex = new RangeVertex(start, end)

    mapping.setRange(vertex)

    expect(mapping.getRange(start, end)).toBe(vertex)
  })
})
