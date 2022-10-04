import {compare, findLastMatchingIndex} from '../../src/interpreter/findInOrderedRange'
import {RawInterpreterValue, RawNoErrorScalarValue} from '../../src/interpreter/InterpreterValue'

describe('findLastMatchingIndex', () => {
  function findInArray(searchKey: RawNoErrorScalarValue, array: RawInterpreterValue[]): number {
    return findLastMatchingIndex(index => compare(searchKey, array[index]) >= 0, 0, array.length - 1)
  }
  
  it('should return -1 when empty array', () => {
    const values: number[] = []
    expect(findInArray(1, values)).toBe(-1)
  })

  it('should work for one element', () => {
    const values: number[] = [1]
    expect(findInArray(1, values)).toBe(0)
  })

  it('should return -1 when all elements are greater', () => {
    const values: number[] = [3, 5, 10]
    expect(findInArray(1, values)).toBe(-1)
  })

  it('should find index of element in values of odd length', () => {
    const values: number[] = [3, 5, 10]
    expect(findInArray(3, values)).toBe(0)
    expect(findInArray(5, values)).toBe(1)
    expect(findInArray(10, values)).toBe(2)
  })

  it('should find index of element in values of even length', () => {
    const values: number[] = [3, 5, 10, 11]
    expect(findInArray(3, values)).toBe(0)
    expect(findInArray(5, values)).toBe(1)
    expect(findInArray(10, values)).toBe(2)
    expect(findInArray(11, values)).toBe(3)
  })

  it('should find index of lower bound', () => {
    const values: number[] = [1, 2, 3, 7]
    expect(findInArray(5, values)).toBe(2)
    expect(findInArray(10, values)).toBe(3)
  })

  it('should work for strings', () => {
    const values: string[] = ['aaaa', 'bar', 'foo', 'xyz']
    expect(findInArray('foo', values)).toBe(2)
  })

  it('should work for bools', () => {
    const values: boolean[] = [false, false, false, true, true]
    expect(findInArray(true, values)).toBe(4)
  })

  it('should work for different types in array', () => {
    const values = [3, 5, 7, 'aaaa', 'bar', 'foo', false, false, true]
    expect(findInArray(5, values)).toBe(1)
    expect(findInArray('foo', values)).toBe(5)
    expect(findInArray(false, values)).toBe(7)
    expect(findInArray(10, values)).toBe(2)
    expect(findInArray('xyz', values)).toBe(5)
  })

  it('should return the last occurence', () => {
    const values = [1, 2, 2, 2, 2, 2, 3, 3, 3]
    expect(findInArray(2, values)).toBe(5)
  })
})

describe('compare', () => {
  it('number < string', () => {
    expect(compare(42, 'foobar')).toBe(-1)
    expect(compare('foobar', 42)).toBe(1)
  })

  it('number < boolean', () => {
    expect(compare(42, false)).toBe(-1)
    expect(compare(false, 42)).toBe(1)
  })

  it('string < boolean', () => {
    expect(compare('foobar', false)).toBe(-1)
    expect(compare(false, 'foobar')).toBe(1)
  })

  it('numbers', () => {
    expect(compare(1, 2)).toBe(-1)
    expect(compare(2, 2)).toBe(0)
    expect(compare(3, 2)).toBe(1)
  })

  it('bool', () => {
    expect(compare(false, true)).toBe(-1)
    expect(compare(true, true)).toBe(0)
    expect(compare(true, false)).toBe(1)
  })

  it('string', () => {
    expect(compare('a', 'b')).toBe(-1)
    expect(compare('a', 'a')).toBe(0)
    expect(compare('b', 'a')).toBe(1)
  })

  it('string length', () => {
    expect(compare('a', 'aa')).toBe(-1)
  })
})
