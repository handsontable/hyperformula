import { ArraySize } from '../src/ArraySize'
import { ArrayValue, NotComputedArray } from '../src/ArrayValue'
import { EmptyValue } from '../src/interpreter/InterpreterValue'

describe('Matrix', () => {
  it('fill', () => {
    const matrix = new ArrayValue([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    expect(matrix.raw()).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  it('fill - zero sized rows', () => {
    expect(() => {
      new ArrayValue([])
    }).toThrowError('Incorrect array size')
  })

  it('fill - zero sized columns', () => {
    expect(() => {
      new ArrayValue([[], [], []])
    }).toThrowError('Incorrect array size')
  })

  it('add rows', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    matrix.addRows(1, 3)
    expect(matrix.raw()).toEqual([
      [1, 2, 3],
      [EmptyValue, EmptyValue, EmptyValue],
      [EmptyValue, EmptyValue, EmptyValue],
      [EmptyValue, EmptyValue, EmptyValue],
      [4, 5, 6],
      [7, 8, 9],
    ])
    expect(matrix.height()).toEqual(6)
  })

  it('remove rows', () => {
    const matrix = new ArrayValue([
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
    const matrix = new ArrayValue([
      [1, 2],
    ])
    expect(() => {
      matrix.removeRows(1, 1)
    }).toThrowError('Array index out of bound')
  })

  it('add columns', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    matrix.addColumns(1, 2)
    expect(matrix.width()).toEqual(5)
    expect(matrix.raw()).toEqual([
      [1, EmptyValue, EmptyValue, 2, 3],
      [4, EmptyValue, EmptyValue, 5, 6],
      [7, EmptyValue, EmptyValue, 8, 9],
    ])
  })

  it('remove columns', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    matrix.removeColumns(1, 2)
    expect(matrix.width()).toEqual(1)
    expect(matrix.raw()).toEqual([
      [1],
      [4],
      [7],
    ])
  })

  it('remove columns - out of bounds', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    expect(() => {
      matrix.removeColumns(3, 2)
    }).toThrowError('Array index out of bound')
  })

  it('resize dimensions - increase height', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    const newSize = new ArraySize(3, 5)
    matrix.resize(newSize)
    expect(matrix.height()).toEqual(5)
    expect(matrix.raw()).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [EmptyValue, EmptyValue, EmptyValue],
      [EmptyValue, EmptyValue, EmptyValue],
    ])
  })

  it('resize dimensions - reduce height', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    expect(() => {
      const newSize = new ArraySize(3, 1)
      matrix.resize(newSize)
    }).toThrowError('Resizing to smaller array')
  })

  it('resize dimensions - increase width', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    const newSize = new ArraySize(5, 3)
    matrix.resize(newSize)
    expect(matrix.width()).toEqual(5)
    expect(matrix.raw()).toEqual([
      [1, 2, 3, EmptyValue, EmptyValue],
      [4, 5, 6, EmptyValue, EmptyValue],
      [7, 8, 9, EmptyValue, EmptyValue],
    ])
  })

  it('resize dimensions - reduce width', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    expect(() => {
      const newSize = new ArraySize(1, 3)
      matrix.resize(newSize)
    }).toThrowError('Resizing to smaller array')
  })

  it('resize dimensions - increase height and width', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    const newSize = new ArraySize(5, 5)
    matrix.resize(newSize)
    expect(matrix.width()).toEqual(5)
    expect(matrix.height()).toEqual(5)
    expect(matrix.raw()).toEqual([
      [1, 2, 3, EmptyValue, EmptyValue],
      [4, 5, 6, EmptyValue, EmptyValue],
      [7, 8, 9, EmptyValue, EmptyValue],
      [EmptyValue, EmptyValue, EmptyValue, EmptyValue, EmptyValue],
      [EmptyValue, EmptyValue, EmptyValue, EmptyValue, EmptyValue],
    ])
  })

  it('get value', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    expect(matrix.get(0, 0)).toEqual(1)
    expect(matrix.get(1, 0)).toEqual(2)
    expect(matrix.get(2, 0)).toEqual(3)
    expect(matrix.get(0, 1)).toEqual(4)
    expect(matrix.get(1, 1)).toEqual(5)
    expect(matrix.get(2, 1)).toEqual(6)
    expect(matrix.get(0, 2)).toEqual(7)
    expect(matrix.get(1, 2)).toEqual(8)
    expect(matrix.get(2, 2)).toEqual(9)
  })

  it('get value - out of bounds', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    expect(() => {
      matrix.get(3, 0)
    }).toThrowError('Array index out of bound')
    expect(() => {
      matrix.get(0, 3)
    }).toThrowError('Array index out of bound')
    expect(() => {
      matrix.get(3, 3)
    }).toThrowError('Array index out of bound')
    expect(() => {
      matrix.get(-1, 0)
    }).toThrowError('Array index out of bound')
    expect(() => {
      matrix.get(0, -1)
    }).toThrowError('Array index out of bound')
    expect(() => {
      matrix.get(-1, -1)
    }).toThrowError('Array index out of bound')
  })

  it('set value', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    expect(matrix.set(0, 0, 11))
    expect(matrix.set(1, 0, 12))
    expect(matrix.set(2, 0, 13))
    expect(matrix.set(0, 1, 14))
    expect(matrix.set(1, 1, 15))
    expect(matrix.set(2, 1, 16))
    expect(matrix.set(0, 2, 17))
    expect(matrix.set(1, 2, 18))
    expect(matrix.set(2, 2, 19))
    expect(matrix.raw()).toEqual([
      [11, 12, 13],
      [14, 15, 16],
      [17, 18, 19],
    ])
  })

  it('set value - out of bounds', () => {
    const matrix = new ArrayValue([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
    expect(() => {
      matrix.set(3, 0, 99)
    }).toThrowError('Array index out of bound')
    expect(() => {
      matrix.set(0, 3, 99)
    }).toThrowError('Array index out of bound')
    expect(() => {
      matrix.set(3, 3, 99)
    }).toThrowError('Array index out of bound')
    expect(() => {
      matrix.set(-1, 0, 99)
    }).toThrowError('Array index out of bound')
    expect(() => {
      matrix.set(0, -1, 99)
    }).toThrowError('Array index out of bound')
    expect(() => {
      matrix.set(-1, -1, 99)
    }).toThrowError('Array index out of bound')
  })
})

describe('NotComputedArray', () => {
  it('width', () => {
    const ncArraySize = new ArraySize(3, 2)
    const ncArray = new NotComputedArray(ncArraySize)
    expect(ncArray.width()).toEqual(3)
  })

  it('height', () => {
    const ncArraySize = new ArraySize(3, 2)
    const ncArray = new NotComputedArray(ncArraySize)
    expect(ncArray.height()).toEqual(2)
  })

  it('get', () => {
    const ncArraySize = new ArraySize(3, 2)
    const ncArray = new NotComputedArray(ncArraySize)
    expect(() => {
      ncArray.get(0, 0)
    }).toThrowError('Array not computed yet.')
  })

  it('simpleRangeValue', () => {
    const ncArraySize = new ArraySize(3, 2)
    const ncArray = new NotComputedArray(ncArraySize)
    expect(() => {
      ncArray.simpleRangeValue()
    }).toThrowError('Array not computed yet.')
  })
})
