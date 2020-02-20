import {Matrix} from '../src/Matrix'

describe('Matrix', () => {
  it('fill', () => {
    const matrix  = new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    expect(matrix.raw()).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  it('add zero rows', () => {
    const matrix = new Matrix([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    matrix.addRows(1, 3)
    expect(matrix.raw()).toEqual([
      [1, 2, 3],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [4, 5, 6],
      [7, 8, 9],
    ])
    expect(matrix.height()).toEqual(6)
  })

  it('remove rows', () => {
    const matrix = new Matrix([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
    ])
    matrix.removeRows(1, 2)
    expect(matrix.height()).toEqual(2)
    expect(matrix.raw()).toEqual([
      [1, 2],
      [7, 8],
    ])
  })

  it('remove rows out of bound', () => {
    const matrix = new Matrix([
      [1, 2],
    ])
    expect(() => {
      matrix.removeRows(1, 1)
    }).toThrowError('Matrix index out of bound')
  })
})
