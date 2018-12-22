import {CellAddress, simpleCellAddress, SimpleCellAddress} from '../src/Cell'
import {generateCellsFromRangeGenerator} from '../src/GraphBuilder'

const generateCellsFromRange = (rangeStart: SimpleCellAddress, rangeEnd: SimpleCellAddress): SimpleCellAddress[] => {
  return Array.from(generateCellsFromRangeGenerator(rangeStart, rangeEnd))
}

describe('generateCellsFromRange', () => {
  it('one element', () => {
    expect(generateCellsFromRange(simpleCellAddress(0, 0), simpleCellAddress(0, 0))).toEqual([
      simpleCellAddress(0, 0),
    ])
  })

  it('simple row', () => {
    expect(generateCellsFromRange(simpleCellAddress(0, 0), simpleCellAddress(1, 0))).toEqual([
      simpleCellAddress(0, 0),
      simpleCellAddress(1, 0),
    ])
  })

  it('simple column', () => {
    expect(generateCellsFromRange(simpleCellAddress(0, 0), simpleCellAddress(0, 1))).toEqual([
      simpleCellAddress(0, 0),
      simpleCellAddress(0, 1),
    ])
  })

  it('simple square', () => {
    expect(generateCellsFromRange(simpleCellAddress(0, 0), simpleCellAddress(1, 1))).toEqual([
      simpleCellAddress(0, 0),
      simpleCellAddress(1, 0),
      simpleCellAddress(0, 1),
      simpleCellAddress(1, 1),
    ])
  })
})
