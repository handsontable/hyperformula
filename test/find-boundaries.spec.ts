import {findSheetBoundaries} from '../src/Sheet'

describe('findSheetBoundaries', () => {
  it('find correct dimensions', () => {
    expect(findSheetBoundaries([
      ['1', '2'],
      ['1', '2', '3'],
    ])).toMatchObject({ height: 2, width: 3 })
  })

  it('returns sane dimensions for empty cases', () => {
    expect(findSheetBoundaries([])).toMatchObject({ height: 0, width: 0 })
    expect(findSheetBoundaries([[]])).toMatchObject({ height: 1, width: 0 })
  })

  it('calculate correct fill for array with different size', () => {
    expect(findSheetBoundaries([
      ['1', '2'],
      ['1', '2', '3'],
    ])).toMatchObject({ fill: 5 / 6 })
  })

  it('doesnt count empty string', () => {
    expect(findSheetBoundaries([
      ['1', ''],
      ['1', '2'],
    ])).toMatchObject({ fill: 3 / 4 })
  })

  it('calculate correct fill for empty arrays', () => {
    expect(findSheetBoundaries([]).fill).toBe(0)
    expect(findSheetBoundaries([[]]).fill).toBe(0)
  })

  it('calculate correct fill for array with one element', () => {
    expect(findSheetBoundaries([['']]).fill).toBe(0)
    expect(findSheetBoundaries([['x']]).fill).toBe(1)
  })
})
