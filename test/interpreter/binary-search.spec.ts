import {compare, findLastOccurrenceInOrderedArray} from '../../src/interpreter/binarySearch'
import {EmptyValue} from '../../src/interpreter/InterpreterValue'
import {CellError, ErrorType} from '../../src'

describe('findLastOccurrenceInOrderedArray', () => {
  it('should return -1 when empty array', () => {
    const values: number[] = []
    expect(findLastOccurrenceInOrderedArray(1, values)).toBe(-1)
  })

  it('should work for one element', () => {
    const values: number[] = [1]
    expect(findLastOccurrenceInOrderedArray(1, values)).toBe(0)
  })

  it('should return -1 when all elements are greater', () => {
    const values: number[] = [3, 5, 10]
    expect(findLastOccurrenceInOrderedArray(1, values)).toBe(-1)
  })

  it('should find index of element in values of odd length', () => {
    const values: number[] = [3, 5, 10]
    expect(findLastOccurrenceInOrderedArray(3, values)).toBe(0)
    expect(findLastOccurrenceInOrderedArray(5, values)).toBe(1)
    expect(findLastOccurrenceInOrderedArray(10, values)).toBe(2)
  })

  it('should find index of element in values of even length', () => {
    const values: number[] = [3, 5, 10, 11]
    expect(findLastOccurrenceInOrderedArray(3, values)).toBe(0)
    expect(findLastOccurrenceInOrderedArray(5, values)).toBe(1)
    expect(findLastOccurrenceInOrderedArray(10, values)).toBe(2)
    expect(findLastOccurrenceInOrderedArray(11, values)).toBe(3)
  })

  it('should find index of lower bound', () => {
    const values: number[] = [1, 2, 3, 7]
    expect(findLastOccurrenceInOrderedArray(5, values)).toBe(2)
    expect(findLastOccurrenceInOrderedArray(10, values)).toBe(3)
  })

  it('should work for strings', () => {
    const values: string[] = ['aaaa', 'bar', 'foo', 'xyz']
    expect(findLastOccurrenceInOrderedArray('foo', values)).toBe(2)
  })

  it('should work for bools', () => {
    const values: boolean[] = [false, false, false, true, true]
    expect(findLastOccurrenceInOrderedArray(true, values)).toBe(4)
  })

  it('should work for different types in array', () => {
    const values = [3, 5, 7, 'aaaa', 'bar', 'foo', false, false, true]
    expect(findLastOccurrenceInOrderedArray(5, values)).toBe(1)
    expect(findLastOccurrenceInOrderedArray('foo', values)).toBe(5)
    expect(findLastOccurrenceInOrderedArray(false, values)).toBe(7)
    expect(findLastOccurrenceInOrderedArray(10, values)).toBe(2)
    expect(findLastOccurrenceInOrderedArray('xyz', values)).toBe(5)
  })

  it('should return the last occurence', () => {
    const values = [1, 2, 2, 2, 2, 2, 3, 3, 3]
    expect(findLastOccurrenceInOrderedArray(2, values)).toBe(5)
  })

  it('should work for arrays ordered descending', () => {
    const values: number[] = [11, 10, 5, 3]
    expect(findLastOccurrenceInOrderedArray(3, values, 'desc')).toBe(3)
    expect(findLastOccurrenceInOrderedArray(5, values, 'desc')).toBe(2)
    expect(findLastOccurrenceInOrderedArray(10, values, 'desc')).toBe(1)
    expect(findLastOccurrenceInOrderedArray(11, values, 'desc')).toBe(0)
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

  it('empty value', () => {
    expect(compare(EmptyValue, EmptyValue)).toBe(0)
    expect(compare(EmptyValue, 'foo')).toBe(-1)
    expect(compare('foo', EmptyValue)).toBe(1)
  })

  it('error', () => {
    expect(compare('foo', new CellError(ErrorType.DIV_BY_ZERO))).toBe(-1)
  })
})
