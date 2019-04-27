import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {simpleCellAddress, SimpleCellAddress} from '../src/Cell'
import { CellAddress } from '../src/CellAddress'

describe('generateCellsFromRange', () => {
  const generateCellsFromRange = (range: AbsoluteCellRange): SimpleCellAddress[] => {
    return Array.from(range.generateCellsFromRangeGenerator())
  }

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

describe("AbsoluteCellRange#sameDimensions", () => {
  it('same width and height', () => {
    const range1 = new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 2, 3))
    const range2 = new AbsoluteCellRange(simpleCellAddress(0, 11, 10), simpleCellAddress(0, 12, 13))
    expect(range1.sameDimensionsAs(range2)).toBe(true)
  })

  it('different width', () => {
    const range1 = new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 2, 3))
    const range2 = new AbsoluteCellRange(simpleCellAddress(0, 11, 10), simpleCellAddress(0, 13, 13))
    expect(range1.sameDimensionsAs(range2)).toBe(false)
  })

  it('different height', () => {
    const range1 = new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 2, 3))
    const range2 = new AbsoluteCellRange(simpleCellAddress(0, 11, 10), simpleCellAddress(0, 12, 14))
    expect(range1.sameDimensionsAs(range2)).toBe(false)
  })
})


describe("AbsoluteCellRange#doesOverlap", () => {
  it('exactly the same', () => {
    const range1 = new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 2, 3))
    const range2 = new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 2, 3))
    expect(range1.doesOverlap(range2)).toBe(true)
  })

  it('different sheets', () => {
    const range1 = new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 2, 3))
    const range2 = new AbsoluteCellRange(simpleCellAddress(1, 1, 0), simpleCellAddress(1, 2, 3))
    expect(range1.doesOverlap(range2)).toBe(false)
  })

  it('second on the right side of the first', () => {
    const range1 = new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 2, 3))
    const range2 = new AbsoluteCellRange(simpleCellAddress(0, 3, 0), simpleCellAddress(0, 4, 3))
    expect(range1.doesOverlap(range2)).toBe(false)
  })

  it('second on the left side of the first', () => {
    const range1 = new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 2, 3))
    const range2 = new AbsoluteCellRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 0, 3))
    expect(range1.doesOverlap(range2)).toBe(false)
  })

  it('second on the top of the first', () => {
    const range1 = new AbsoluteCellRange(simpleCellAddress(0, 1, 2), simpleCellAddress(0, 2, 3))
    const range2 = new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 2, 1))
    expect(range1.doesOverlap(range2)).toBe(false)
  })

  it('second on the bottom of the first', () => {
    const range1 = new AbsoluteCellRange(simpleCellAddress(0, 1, 2), simpleCellAddress(0, 2, 3))
    const range2 = new AbsoluteCellRange(simpleCellAddress(0, 1, 4), simpleCellAddress(0, 2, 5))
    expect(range1.doesOverlap(range2)).toBe(false)
  })
})

describe("AbsoluteCellRange#width", () => {
  it('a column', () => {
    expect(new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 1, 10)).width()).toBe(1)
  })

  it('more columns', () => {
    expect(new AbsoluteCellRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 3, 10)).width()).toBe(3)
  })
})

describe("AbsoluteCellRange#height", () => {
  it('a row', () => {
    expect(new AbsoluteCellRange(simpleCellAddress(0, 1, 1), simpleCellAddress(0, 10, 1)).height()).toBe(1)
  })

  it('more rows', () => {
    expect(new AbsoluteCellRange(simpleCellAddress(0, 1, 1), simpleCellAddress(0, 10, 3)).height()).toBe(3)
  })
})
