import {AbsoluteCellRange, CellAddress, simpleCellAddress, SimpleCellAddress} from '../src/Cell'
import {generateCellsFromRangeGenerator} from '../src/GraphBuilder'

const generateCellsFromRange = (range: AbsoluteCellRange): SimpleCellAddress[] => {
  return Array.from(generateCellsFromRangeGenerator(range))
}

describe('generateCellsFromRange', () => {
  it('one element', () => {
    expect(generateCellsFromRange(new AbsoluteCellRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 0)))).toEqual([
      simpleCellAddress(0, 0, 0),
    ])
  })

  it('simple row', () => {
    expect(generateCellsFromRange(new AbsoluteCellRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 1, 0)))).toEqual([
      simpleCellAddress(0, 0, 0),
      simpleCellAddress(0, 1, 0),
    ])
  })

  it('simple column', () => {
    expect(generateCellsFromRange(new AbsoluteCellRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 1)))).toEqual([
      simpleCellAddress(0, 0, 0),
      simpleCellAddress(0, 0, 1),
    ])
  })

  it('simple square', () => {
    expect(generateCellsFromRange(new AbsoluteCellRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 1, 1)))).toEqual([
      simpleCellAddress(0, 0, 0),
      simpleCellAddress(0, 1, 0),
      simpleCellAddress(0, 0, 1),
      simpleCellAddress(0, 1, 1),
    ])
  })
})
