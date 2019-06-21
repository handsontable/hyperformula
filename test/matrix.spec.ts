
import {Matrix} from '../src/Matrix'

describe('Matrix', () => {
  it ('fill', () => {
    const matrix  = new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    expect(matrix.raw()).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  it('Matrix align with window - no padding', () => {
    const matrix = new Matrix([[1, 2, 3], [1, 2, 3], [1, 2, 3]])
    const aligned = matrix.alignWithWindow(3)

    expect(aligned.raw()).toEqual([
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3],
    ])
  })

  it('Matrix align with window', () => {
    const matrix = new Matrix([[1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]])
    const aligned = matrix.alignWithWindow(2)

    expect(aligned.raw()).toEqual([
        [1, 2, 3, 4, 5, 0],
        [1, 2, 3, 4, 5, 0],
        [1, 2, 3, 4, 5, 0],
        [1, 2, 3, 4, 5, 0],
        [1, 2, 3, 4, 5, 0],
        [0, 0, 0, 0, 0, 0],
    ])
  })

  it('Matrix align with bigger window', () => {
    const matrix = new Matrix([[1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]])
    const aligned = matrix.alignWithWindow(6)

    expect(aligned.raw()).toEqual([
      [1, 2, 3, 4, 5, 0],
      [1, 2, 3, 4, 5, 0],
      [1, 2, 3, 4, 5, 0],
      [1, 2, 3, 4, 5, 0],
      [1, 2, 3, 4, 5, 0],
      [0, 0, 0, 0, 0, 0],
    ])
  })

  it('add zero rows', () => {
    const matrix = new Matrix([
        [1,2,3],
        [4,5,6],
        [7,8,9]
    ])
    matrix.addRows(1, 3)
    expect(matrix.raw()).toEqual([
      [1,2,3],
      [0,0,0],
      [0,0,0],
      [0,0,0],
      [4,5,6],
      [7,8,9]
    ])
    expect(matrix.height()).toEqual(6)
  })
})
