import {CellAddress, relativeCellAddress, SimpleCellAddress} from '../src/Cell'
import {generateCellsFromRangeGenerator} from '../src/GraphBuilder'

const generateCellsFromRange = (rangeStart: SimpleCellAddress, rangeEnd: SimpleCellAddress): SimpleCellAddress[] => {
  const result = []
  for (const e of generateCellsFromRangeGenerator(rangeStart, rangeEnd)) {
    result.push(e)
  }
  return result
}

describe('generateCellsFromRange', () => {
  it('one element', () => {
    expect(generateCellsFromRange(relativeCellAddress(0, 0), relativeCellAddress(0, 0))).toEqual([
      relativeCellAddress(0, 0),
    ])
  })

  it('simple row', () => {
    expect(generateCellsFromRange(relativeCellAddress(0, 0), relativeCellAddress(1, 0))).toEqual([
      relativeCellAddress(0, 0),
      relativeCellAddress(1, 0),
    ])
  })

  it('simple column', () => {
    expect(generateCellsFromRange(relativeCellAddress(0, 0), relativeCellAddress(0, 1))).toEqual([
      relativeCellAddress(0, 0),
      relativeCellAddress(0, 1),
    ])
  })

  it('simple square', () => {
    expect(generateCellsFromRange(relativeCellAddress(0, 0), relativeCellAddress(1, 1))).toEqual([
      relativeCellAddress(0, 0),
      relativeCellAddress(1, 0),
      relativeCellAddress(0, 1),
      relativeCellAddress(1, 1),
    ])
  })
})
