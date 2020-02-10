import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import { SimpleCellAddress} from '../src/Cell'
import {adr, detailedError} from './testUtils'

describe('generateCellsFromRange', () => {
  const generateCellsFromRange = (range: AbsoluteCellRange): SimpleCellAddress[] => {
    return Array.from(range.addresses())
  }

  it('one element', () => {
    expect(generateCellsFromRange(new AbsoluteCellRange(adr('A1'), adr('A1')))).toEqual([
      adr('A1'),
    ])
  })

  it('simple row', () => {
    expect(generateCellsFromRange(new AbsoluteCellRange(adr('A1'), adr('B1')))).toEqual([
      adr('A1'),
      adr('B1'),
    ])
  })

  it('simple column', () => {
    expect(generateCellsFromRange(new AbsoluteCellRange(adr('A1'), adr('A2')))).toEqual([
      adr('A1'),
      adr('A2'),
    ])
  })

  it('simple square', () => {
    expect(generateCellsFromRange(new AbsoluteCellRange(adr('A1'), adr('B2')))).toEqual([
      adr('A1'),
      adr('B1'),
      adr('A2'),
      adr('B2'),
    ])
  })
})

describe('AbsoluteCellRange#sameDimensions', () => {
  it('same width and height', () => {
    const range1 = new AbsoluteCellRange(adr('B1'), adr('C4'))
    const range2 = new AbsoluteCellRange(adr('L11'), adr('M14'))
    expect(range1.sameDimensionsAs(range2)).toBe(true)
  })

  it('different width', () => {
    const range1 = new AbsoluteCellRange(adr('B1'), adr('C4'))
    const range2 = new AbsoluteCellRange(adr('L11'), adr('N14'))
    expect(range1.sameDimensionsAs(range2)).toBe(false)
  })

  it('different height', () => {
    const range1 = new AbsoluteCellRange(adr('B1'), adr('C4'))
    const range2 = new AbsoluteCellRange(adr('L11'), adr('M15'))
    expect(range1.sameDimensionsAs(range2)).toBe(false)
  })
})

describe('AbsoluteCellRange#doesOverlap', () => {
  it('exactly the same', () => {
    const range1 = new AbsoluteCellRange(adr('B1'), adr('C4'))
    const range2 = new AbsoluteCellRange(adr('B1'), adr('C4'))
    expect(range1.doesOverlap(range2)).toBe(true)
  })

  it('different sheets', () => {
    const range1 = new AbsoluteCellRange(adr('B1'), adr('C4'))
    const range2 = new AbsoluteCellRange(adr('B1', 1), adr('C4', 1))
    expect(range1.doesOverlap(range2)).toBe(false)
  })

  it('second on the right side of the first', () => {
    const range1 = new AbsoluteCellRange(adr('B1'), adr('C4'))
    const range2 = new AbsoluteCellRange(adr('D1'), adr('E4'))
    expect(range1.doesOverlap(range2)).toBe(false)
  })

  it('second on the left side of the first', () => {
    const range1 = new AbsoluteCellRange(adr('B1'), adr('C4'))
    const range2 = new AbsoluteCellRange(adr('A1'), adr('A4'))
    expect(range1.doesOverlap(range2)).toBe(false)
  })

  it('second on the top of the first', () => {
    const range1 = new AbsoluteCellRange(adr('B3'), adr('C4'))
    const range2 = new AbsoluteCellRange(adr('B1'), adr('C2'))
    expect(range1.doesOverlap(range2)).toBe(false)
  })

  it('second on the bottom of the first', () => {
    const range1 = new AbsoluteCellRange(adr('B3'), adr('C4'))
    const range2 = new AbsoluteCellRange(adr('B5'), adr('C6'))
    expect(range1.doesOverlap(range2)).toBe(false)
  })
})

describe('AbsoluteCellRange#width', () => {
  it('a column', () => {
    expect(new AbsoluteCellRange(adr('B1'), adr('B11')).width()).toBe(1)
  })

  it('more columns', () => {
    expect(new AbsoluteCellRange(adr('B1'), adr('D11')).width()).toBe(3)
  })
})

describe('AbsoluteCellRange#height', () => {
  it('a row', () => {
    expect(new AbsoluteCellRange(adr('B2'), adr('K2')).height()).toBe(1)
  })

  it('more rows', () => {
    expect(new AbsoluteCellRange(adr('B2'), adr('K4')).height()).toBe(3)
  })
})

describe('AbsoluteCellRange#removeRows', () => {
  it('rows below', () => {
    const range = new AbsoluteCellRange(adr('A1'), adr('A4'))
    range.removeRows(4, 5)
    expect(range.start.row).toBe(0)
    expect(range.end.row).toBe(3)
  })

  it('rows above', () => {
    const range = new AbsoluteCellRange(adr('A3'), adr('A5'))
    range.removeRows(0, 1)
    expect(range.start.row).toBe(0)
    expect(range.end.row).toBe(2)
  })

  it('middle of the range', () => {
    const range = new AbsoluteCellRange(adr('A1'), adr('A5'))
    range.removeRows(1, 2)
    expect(range.start.row).toBe(0)
    expect(range.end.row).toBe(2)
  })

  it('start above range', () => {
    const range = new AbsoluteCellRange(adr('A3'), adr('A5'))
    range.removeRows(0, 3)
    expect(range.start.row).toBe(0)
    expect(range.end.row).toBe(0)
  })

  it('end below range', () => {
    const range = new AbsoluteCellRange(adr('A1'), adr('A5'))
    range.removeRows(2, 5)
    expect(range.start.row).toBe(0)
    expect(range.end.row).toBe(1)
  })

  it('whole range', () => {
    const range = new AbsoluteCellRange(adr('A3'), adr('A5'))
    range.removeRows(0, 5)
    expect(range.start.row).toBe(0)
    expect(range.end.row).toBe(-1)
    expect(range.height()).toBe(0)
  })
})
