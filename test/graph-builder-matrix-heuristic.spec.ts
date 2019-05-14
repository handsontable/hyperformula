import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {Array2d, findMatrices, GraphBuilderMatrixHeuristic} from '../src/GraphBuilderMatrixHeuristic'
import {Size} from '../src/Matrix'

function gen(arr: number[][]): any[][] {
  const result: any[][] = []
  arr.forEach((row) => {
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

    const output = findMatrices(1, input)

    expect(output.length).toEqual(1)

    const matrix = output[0]

    expect([matrix.width(), matrix.height()]).toEqual([3, 3])
    expect(matrix).toEqual(AbsoluteCellRange.fromCoordinates(1, 0, 0, 2, 2))
  })

  it('find - different formulas', () => {
    const input = Array2d.fromArray(gen([
      [1, 1, 0, 0],
      [1, 1, 0, 0],
      [2, 2, 2, 2],
      [2, 2, 2, 2],
    ]))

    const output = findMatrices(1, input)

    expect(output.length).toEqual(2)

    let matrix = output[1]
    expect([matrix.width(), matrix.height()]).toEqual([2, 2])
    expect(matrix).toEqual(AbsoluteCellRange.fromCoordinates(1, 0, 0, 1, 1))
    matrix = output[0]
    expect([matrix.width(), matrix.height()]).toEqual([4, 2])
    expect(matrix).toEqual(AbsoluteCellRange.fromCoordinates(1, 0, 2, 3, 3))
  })

  it('find - same formula', () => {
    const input = Array2d.fromArray(gen([
      [1, 1, 0, 0, 1, 1],
      [1, 1, 0, 0, 1, 1],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
    ]))

    const output = findMatrices(1, input)

    expect(output.length).toEqual(3)

    let matrix = output[2]
    expect([matrix.width(), matrix.height()]).toEqual([2, 2])
    expect(matrix).toEqual(AbsoluteCellRange.fromCoordinates(1, 0, 0, 1, 1))
    matrix = output[1]
    expect([matrix.width(), matrix.height()]).toEqual([2, 2])
    expect(matrix).toEqual(AbsoluteCellRange.fromCoordinates(1, 4, 0, 5, 1))
    matrix = output[0]
    expect([matrix.width(), matrix.height()]).toEqual([2, 2])
    expect(matrix).toEqual(AbsoluteCellRange.fromCoordinates(1, 2, 2, 3, 3))
  })

  it('fail 1', () => {
    const input = Array2d.fromArray(gen([
      [2, 3, 1],
      [1, 1, 1],
    ]))

    const output = findMatrices(1, input)

    expect(output.length).toEqual(0)
  })

  it('fail 2', () => {
    const input = Array2d.fromArray(gen([
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ]))

    const output = findMatrices(1, input)

    expect(output.length).toEqual(0)
  })

  it('fail 3', () => {
    const input = Array2d.fromArray(gen([
      [0, 0, 1],
      [1, 1, 1],
      [1, 1, 1],
    ]))

    const output = findMatrices(1, input)

    expect(output.length).toEqual(0)
  })

  it('fail 4', () => {
    const input = Array2d.fromArray(gen([
      [1, 1, 1, 0],
      [1, 1, 1, 1],
      [1, 1, 1, 0],
    ]))

    const output = findMatrices(1, input)

    expect(output.length).toEqual(0)
  })
})
