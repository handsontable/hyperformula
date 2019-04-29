import {Array2d, findMatrices, GraphBuilderMatrixHeuristic} from "../src/GraphBuilderMatrixHeuristic";
import {Size} from "../src/Matrix";
import {AbsoluteCellRange} from "../src/AbsoluteCellRange";

function gen(arr: number[][]): string[][] {
  let result: string[][] = []
  arr.forEach(row => {
    let newrow: string[] = []
    row.forEach(elem => {
      if (elem !== 0)
        newrow.push(`=${elem}`)
      else
        newrow.push("")
    })
    result.push(newrow)
  })
  return result
}


describe('GraphBuilderMatrixHeuristic', () => {
  it('find - simple', () => {
    let input = Array2d.fromArray(gen([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ]))

    let output = findMatrices(1, input)

    expect(output.length).toEqual(1)

    let matrix = output[0]

    expect([matrix.width(), matrix.height()]).toEqual([3, 3])
    expect(matrix).toEqual(AbsoluteCellRange.fromCooridinates(1, 0, 0, 2, 2))
  })

  it('find - different formulas', () => {
    let input = Array2d.fromArray(gen([
      [1, 1, 0, 0],
      [1, 1, 0, 0],
      [2, 2, 2, 2],
      [2, 2, 2, 2],
    ]))

    let output = findMatrices(1, input)

    expect(output.length).toEqual(2)

    let matrix = output[1]
    expect([matrix.width(), matrix.height()]).toEqual([2, 2])
    expect(matrix).toEqual(AbsoluteCellRange.fromCooridinates(1, 0, 0, 1, 1))
    matrix = output[0]
    expect([matrix.width(), matrix.height()]).toEqual([4, 2])
    expect(matrix).toEqual(AbsoluteCellRange.fromCooridinates(1, 0, 2, 3, 3))
  })

  it('find - same formula', () => {
    let input = Array2d.fromArray(gen([
      [1, 1, 0, 0, 1, 1],
      [1, 1, 0, 0, 1, 1],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
    ]))

    let output = findMatrices(1, input)

    expect(output.length).toEqual(3)

    let matrix = output[2]
    expect([matrix.width(), matrix.height()]).toEqual([2, 2])
    expect(matrix).toEqual(AbsoluteCellRange.fromCooridinates(1, 0, 0, 1, 1))
    matrix = output[1]
    expect([matrix.width(), matrix.height()]).toEqual([2, 2])
    expect(matrix).toEqual(AbsoluteCellRange.fromCooridinates(1, 4, 0, 5, 1))
    matrix = output[0]
    expect([matrix.width(), matrix.height()]).toEqual([2, 2])
    expect(matrix).toEqual(AbsoluteCellRange.fromCooridinates(1, 2, 2, 3, 3))
  })

  it('fail 1', () => {
    let input = Array2d.fromArray(gen([
      [2, 3, 1],
      [1, 1, 1],
    ]))

    let output = findMatrices(1, input)

    expect(output.length).toEqual(0)
  })

  it('fail 2', () => {
    let input = Array2d.fromArray(gen([
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1]
    ]))

    let output = findMatrices(1, input)

    expect(output.length).toEqual(0)
  })

  it('fail 3', () => {
    let input = Array2d.fromArray(gen([
      [0, 0, 1],
      [1, 1, 1],
      [1, 1, 1]
    ]))

    let output = findMatrices(1, input)

    expect(output.length).toEqual(0)
  })

  it('fail 4', () => {
    let input = Array2d.fromArray(gen([
      [1, 1, 1, 0],
      [1, 1, 1, 1],
      [1, 1, 1, 0]
    ]))

    let output = findMatrices(1, input)

    expect(output.length).toEqual(0)
  })
})
