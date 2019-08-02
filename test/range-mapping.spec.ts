import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {simpleCellAddress} from '../src/Cell'
import {RangeMapping, RangeVertex} from '../src/DependencyGraph'
import {adr} from "./testUtils";

describe('RangeMapping', () => {
  it('range mapping when there is none', () => {
    const mapping = new RangeMapping()
    const start = adr('A1')
    const end = adr("U50")

    expect(mapping.getRange(start, end)).toBe(null)
  })

  it('setting range mapping', () => {
    const mapping = new RangeMapping()
    const start = adr('A1')
    const end = adr("U50")
    const vertex = new RangeVertex(new AbsoluteCellRange(start, end))

    mapping.setRange(vertex)

    expect(mapping.getRange(start, end)).toBe(vertex)
  })
})
