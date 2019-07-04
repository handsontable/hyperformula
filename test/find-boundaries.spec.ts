import {findBoundaries} from '../src/DependencyGraph'

describe('findBoundaries', () => {
  it('find correct dimensions', () => {
    expect(findBoundaries([
      ['1', '2'],
      ['1', '2', '3'],
    ])).toMatchObject({ height: 2, width: 3 })
  })

  it('returns sane dimensions for empty cases', () => {
    expect(findBoundaries([])).toMatchObject({ height: 0, width: 0 })
    expect(findBoundaries([[]])).toMatchObject({ height: 1, width: 0 })
  })

  it('calculate correct fill for array with different size', () => {
    expect(findBoundaries([
      ['1', '2'],
      ['1', '2', '3'],
    ])).toMatchObject({ fill: 5 / 6 })
  })

  it('doesnt count empty string', () => {
    expect(findBoundaries([
      ['1', ''],
      ['1', '2'],
    ])).toMatchObject({ fill: 3 / 4 })
  })

  it('calculate correct fill for empty arrays', () => {
    expect(findBoundaries([]).fill).toBe(0)
    expect(findBoundaries([[]]).fill).toBe(0)
  })

  it('calculate correct fill for array with one element', () => {
    expect(findBoundaries([['']]).fill).toBe(0)
    expect(findBoundaries([['x']]).fill).toBe(1)
  })
})
