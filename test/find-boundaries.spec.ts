import {findBoundaries} from '../src/Sheet'
import {EmptyValue} from '../src'

describe('findBoundaries', () => {
  it('find correct dimensions', () => {
    expect(findBoundaries([
      ['1', '2'],
      ['1', '2', '3'],
    ])).toMatchObject({height: 2, width: 3})
  })

  it('find correct dimensions when empty cell at the end of row', () => {
    expect(findBoundaries([
      ['1', '2'],
      ['1', '2', null],
    ])).toMatchObject({height: 2, width: 2})
  })

  it('find correct dimensions when empty cell in the middle of the row', () => {
    expect(findBoundaries([
      ['1', '2'],
      ['1', '2', EmptyValue, '4'],
    ])).toMatchObject({height: 2, width: 4})
  })

  it('find correct dimensions when empty row', () => {
    expect(findBoundaries([
      ['1', '2'],
      ['1', '2'],
      [EmptyValue],
      [],
    ])).toMatchObject({height: 2, width: 2})
  })

  it('returns sane dimensions for empty cases', () => {
    expect(findBoundaries([])).toMatchObject({height: 0, width: 0})
    expect(findBoundaries([[]])).toMatchObject({height: 0, width: 0})
  })

  it('calculate correct fill for array with different size', () => {
    expect(findBoundaries([
      ['1', '2'],
      ['1', '2', '3'],
    ])).toMatchObject({fill: 5 / 6})
  })

  it('calculate correct fill for empty arrays', () => {
    expect(findBoundaries([]).fill).toBe(0)
    expect(findBoundaries([[]]).fill).toBe(0)
  })

  it('calculate correct fill for array with one element', () => {
    expect(findBoundaries([[null]]).fill).toBe(0)
    expect(findBoundaries([['x']]).fill).toBe(1)
  })

  it('does count empty string', () => {
    expect(findBoundaries([
      ['1', ''],
      ['1', '2'],
    ])).toMatchObject({fill: 1})
  })

  it('does not count empty value', () => {
    expect(findBoundaries([
      ['1', EmptyValue],
      ['1', '2'],
    ])).toMatchObject({fill: 3 / 4})
  })

  it('does not count null', () => {
    expect(findBoundaries([
      ['1', null],
      ['1', '2'],
    ])).toMatchObject({fill: 3 / 4})
  })

  it('does not count undefined', () => {
    expect(findBoundaries([
      ['1', undefined],
      ['1', '2'],
    ])).toMatchObject({fill: 3 / 4})
  })
})
