import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {Array2d, findMatrices} from '../src/GraphBuilderMatrixHeuristic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gen(arr: number[][]): any[][] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any[][] = []
  arr.forEach((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newrow: any[] = []
    row.forEach((elem) => {
      if (elem !== 0) {
        newrow.push(`=${elem}`)
      } else {
        newrow.push(null)
      }
    })
    result.push(newrow)
  })
  return result
}

describe('GraphBuilderMatrixHeuristic', () => {
  it('find - simple', () => {
    const input = Array2d.fromArray(gen([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ]))

    const output = [...findMatrices(1, input)].filter((m) => m.isMatrix)

    expect(output.length).toEqual(1)

    const matrix = output[0]

    expect([matrix.range.width(), matrix.range.height()]).toEqual([3, 3])
    expect(matrix.range).toEqual(AbsoluteCellRange.fromCoordinates(1, 0, 0, 2, 2))
  })

  it('find - different formulas', () => {
    const input = Array2d.fromArray(gen([
      [1, 1, 0, 0],
      [1, 1, 0, 0],
      [2, 2, 2, 2],
      [2, 2, 2, 2],
    ]))

    const output = [...findMatrices(1, input)].filter((m) => m.isMatrix)

    expect(output.length).toEqual(2)

    let range = output[1].range
    expect([range.width(), range.height()]).toEqual([2, 2])
    expect(range).toEqual(AbsoluteCellRange.fromCoordinates(1, 0, 0, 1, 1))
    range = output[0].range
    expect([range.width(), range.height()]).toEqual([4, 2])
    expect(range).toEqual(AbsoluteCellRange.fromCoordinates(1, 0, 2, 3, 3))
  })

  it('find - same formula', () => {
    const input = Array2d.fromArray(gen([
      [1, 1, 0, 0, 1, 1],
      [1, 1, 0, 0, 1, 1],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
    ]))

    const output = [...findMatrices(1, input)].filter((m) => m.isMatrix)

    expect(output.length).toEqual(3)

    let range = output[2].range
    expect([range.width(), range.height()]).toEqual([2, 2])
    expect(range).toEqual(AbsoluteCellRange.fromCoordinates(1, 0, 0, 1, 1))
    range = output[1].range
    expect([range.width(), range.height()]).toEqual([2, 2])
    expect(range).toEqual(AbsoluteCellRange.fromCoordinates(1, 4, 0, 5, 1))
    range = output[0].range
    expect([range.width(), range.height()]).toEqual([2, 2])
    expect(range).toEqual(AbsoluteCellRange.fromCoordinates(1, 2, 2, 3, 3))
  })

  it('fail 1', () => {
    const input = Array2d.fromArray(gen([
      [2, 3, 1],
      [1, 1, 1],
    ]))

    const output = [...findMatrices(1, input)].filter((m) => m.isMatrix && m.range.size() > 1)

    expect(output.length).toEqual(0)
  })

  it('fail 2', () => {
    const input = Array2d.fromArray(gen([
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ]))

    const output = [...findMatrices(1, input)].filter((m) => m.isMatrix && m.range.size() > 1)

    expect(output.length).toEqual(0)
  })

  it('fail 3', () => {
    const input = Array2d.fromArray(gen([
      [0, 0, 1],
      [1, 1, 1],
      [1, 1, 1],
    ]))

    const output = [...findMatrices(1, input)].filter((m) => m.isMatrix && m.range.size() > 1)

    expect(output.length).toEqual(0)
  })

  it('fail 4', () => {
    const input = Array2d.fromArray(gen([
      [1, 1, 1, 0],
      [1, 1, 1, 1],
      [1, 1, 1, 0],
    ]))

    const output = [...findMatrices(1, input)].filter((m) => m.isMatrix && m.range.size() > 1)

    expect(output.length).toEqual(0)
  })
})
