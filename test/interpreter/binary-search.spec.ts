import {compare, lowerBound} from '../../src/interpreter/binarySearch'

describe('Binary search', () => {
  const centerValueFn = (values: any[]) => (center: number) => values[center]

  it('should return -1 when empty array', () => {
    const values: number[] = []
    expect(lowerBound(centerValueFn(values), 1, 0, values.length - 1)).toBe(-1)
  })

  it('should work for one element', () => {
    const values: number[] = [1]
    expect(lowerBound(centerValueFn(values), 1, 0, values.length - 1)).toBe(0)
  })

  it('should return -1 when all elements are greater', () => {
    const values: number[] = [3, 5, 10]
    expect(lowerBound(centerValueFn(values), 1, 0, values.length - 1)).toBe(-1)
  })

  it('should find index of element in values of odd length', () => {
    const values: number[] = [3, 5, 10]
    expect(lowerBound(centerValueFn(values), 3, 0, values.length - 1)).toBe(0)
    expect(lowerBound(centerValueFn(values), 5, 0, values.length - 1)).toBe(1)
    expect(lowerBound(centerValueFn(values), 10, 0, values.length - 1)).toBe(2)
  })

  it('should find index of element in values of even length', () => {
    const values: number[] = [3, 5, 10, 11]
    expect(lowerBound(centerValueFn(values), 3, 0, values.length - 1)).toBe(0)
    expect(lowerBound(centerValueFn(values), 5, 0, values.length - 1)).toBe(1)
    expect(lowerBound(centerValueFn(values), 10, 0, values.length - 1)).toBe(2)
    expect(lowerBound(centerValueFn(values), 11, 0, values.length - 1)).toBe(3)
  })

  it('should find index of lower bound', () => {
    const values: number[] = [1, 2, 3, 7]
    expect(lowerBound(centerValueFn(values), 5, 0, values.length - 1)).toBe(2)
    expect(lowerBound(centerValueFn(values), 10, 0, values.length - 1)).toBe(3)
  })

  it('should work for strings', () => {
    const values: string[] = ['aaaa', 'bar', 'foo', 'xyz']
    expect(lowerBound(centerValueFn(values), 'foo', 0, values.length - 1)).toBe(2)
  })

  it('should work for bools', () => {
    const values: boolean[] = [false, false, false, true, true]
    expect(lowerBound(centerValueFn(values), true, 0, values.length - 1)).toBe(4)
  })

  it('should work for different types in array', () => {
    const values = [3, 5, 7, 'aaaa', 'bar', 'foo', false, false, true]
    expect(lowerBound(centerValueFn(values), 5, 0, values.length - 1)).toBe(1)
    expect(lowerBound(centerValueFn(values), 'foo', 0, values.length - 1)).toBe(5)
    expect(lowerBound(centerValueFn(values), false, 0, values.length - 1)).toBe(7)
    expect(lowerBound(centerValueFn(values), 10, 0, values.length - 1)).toBe(2)
    expect(lowerBound(centerValueFn(values), 'xyz', 0, values.length - 1)).toBe(5)
  })

  it('should return the last occurence', () => {
    const values = [1, 2, 2, 2, 2, 2, 3, 3, 3]
    expect(lowerBound(centerValueFn(values), 2, 0, values.length - 1)).toBe(5)
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
