import {AbsoluteCellRange, AbsoluteColumnRange} from '../src/AbsoluteCellRange'
import {RangeMapping, RangeVertex} from '../src/DependencyGraph'
import {adr, colEnd, colStart} from './testUtils'

describe('RangeMapping', () => {
  it('range mapping when there is none', () => {
    const mapping = new RangeMapping()
    const start = adr('A1')
    const end = adr('U50')

    expect(mapping.getRange(start, end)).toBe(null)
  })

  it('setting range mapping', () => {
    const mapping = new RangeMapping()
    const start = adr('A1')
    const end = adr('U50')
    const vertex = new RangeVertex(new AbsoluteCellRange(start, end))

    mapping.setRange(vertex)

    expect(mapping.getRange(start, end)).toBe(vertex)
  })

  it('set column range', () => {
    const mapping = new RangeMapping()
    const start = colStart('A')
    const end = colEnd('U')
    const vertex = new RangeVertex(new AbsoluteColumnRange(start, end))

    mapping.setRange(vertex)

    expect(mapping.getRange(start, end)).toBe(vertex)
  })
})
