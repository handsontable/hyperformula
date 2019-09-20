import {lowerBound} from '../../src/interpreter/binarySearch'

describe('Binary search', () => {
  it('should return -1 when empty array', () => {
    expect(lowerBound([], 1)).toBe(-1)
  })

  it('should work for one element', () => {
    expect(lowerBound([1], 1)).toBe(0)
  })

  it('should return -1 when all elements are greater', () => {
    expect(lowerBound([3, 5, 10], 0)).toBe(-1)
  })

  it('should find index of element in array of odd length', () => {
    expect(lowerBound([3, 5, 10], 3)).toBe(0)
    expect(lowerBound([3, 5, 10], 5)).toBe(1)
    expect(lowerBound([3, 5, 10], 10)).toBe(2)
  })

  it('should find index of element in array of even length', () => {
    expect(lowerBound([3, 5, 10, 11], 3)).toBe(0)
    expect(lowerBound([3, 5, 10, 11], 5)).toBe(1)
    expect(lowerBound([3, 5, 10, 11], 10)).toBe(2)
    expect(lowerBound([3, 5, 10, 11], 11)).toBe(3)
  })

  it('should find index of lower bound', () => {
    expect(lowerBound([1, 2, 3, 7], 5)).toBe(2)
    expect(lowerBound([1, 2, 3, 7], 10)).toBe(3)
  })

  it('should work for strings', () => {
    expect(lowerBound(['aaaa', 'bar', 'foo', 'xyz'], 'foo')).toBe(2)
  })

  it('should work for bools', () => {
    expect(lowerBound([false, false, false, true, true], true)).toBe(3)
  })

  it('should work for different types in array', () => {
    const values = [3, 5, 7, 'aaaa', 'bar', 'foo', false, false, true]
    expect(lowerBound(values, 5)).toBe(1)
    expect(lowerBound(values, 'foo')).toBe(5)
    expect(lowerBound(values, false)).toBe(6)
    expect(lowerBound(values, 10)).toBe(2)
    expect(lowerBound(values, 'xyz')).toBe(5)
  })

  it('should return first occurence', () => {
    expect(lowerBound([1, 2, 2, 2, 2, 2, 3, 3, 3], 2)).toBe(1)
  })
})
