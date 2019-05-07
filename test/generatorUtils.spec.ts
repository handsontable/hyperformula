import { count, empty, filterWith, first, split, zip } from '../src/generatorUtils'

describe('empty', () => {
  it('works', () => {
    expect(Array.from(empty())).toEqual([])
  })
})

describe('split', () => {
  it('works for empty case', () => {
    const result = split(empty())

    expect(result.value).toBe(undefined)
    expect(Array.from(result.rest)).toEqual([])
  })

  it('works for one element case', () => {
    const arr = [42]

    const result = split(arr[Symbol.iterator]())

    expect(result.value).toBe(42)
    expect(Array.from(result.rest)).toEqual([])
  })

  it('works for more elements case', () => {
    const arr = [42, 43]

    const result = split(arr[Symbol.iterator]())

    expect(result.value).toBe(42)
    expect(Array.from(result.rest)).toEqual([43])
  })
})

describe('first', () => {
  it('works for empty case', () => {
    expect(first(empty())).toBe(undefined)
  })

  it('works for one element case', () => {
    const arr = [42]

    expect(first(arr[Symbol.iterator]())).toEqual(42)
  })

  it('works for more elements case', () => {
    const arr = [42, 43]

    expect(first(arr[Symbol.iterator]())).toEqual(42)
  })
})

describe('filterWith', () => {
  it('works for empty case', () => {
    const arr: number[] = []

    const result = filterWith((x) => (x % 2 == 0), arr[Symbol.iterator]())

    expect(Array.from(result)).toEqual([])
  })

  it('works for one element case', () => {
    const arr = [42]

    const result1 = filterWith((x) => (x % 2 == 0), arr[Symbol.iterator]())
    const result2 = filterWith((x) => (x % 2 == 1), arr[Symbol.iterator]())

    expect(Array.from(result1)).toEqual([42])
    expect(Array.from(result2)).toEqual([])
  })

  it('works for more elements case', () => {
    const arr = [42, 43]

    const result1 = filterWith((x) => (x % 2 == 0), arr[Symbol.iterator]())
    const result2 = filterWith((x) => (x % 2 == 1), arr[Symbol.iterator]())

    expect(Array.from(result1)).toEqual([42])
    expect(Array.from(result2)).toEqual([43])
  })
})

describe('count', () => {
  it('works', () => {
    expect(count([][Symbol.iterator]())).toBe(0)
    expect(count([42][Symbol.iterator]())).toBe(1)
    expect(count([42, 42][Symbol.iterator]())).toBe(2)
    expect(count([42, 42, 42][Symbol.iterator]())).toBe(3)
  })
})

describe('zip', () => {
  it('works for empty case', () => {
    const arr1: number[] = []
    const arr2: number[] = []

    const result = zip(arr1[Symbol.iterator](), arr2[Symbol.iterator]())

    expect(Array.from(result)).toEqual([])
  })

  it('is only as long as shorter list', () => {
    const arr1 = [1,2,3,4]
    const arr2 = [42]

    const result1 = zip(arr1[Symbol.iterator](), arr2[Symbol.iterator]())
    const result2 = zip(arr2[Symbol.iterator](), arr1[Symbol.iterator]())

    expect(Array.from(result1)).toEqual([[1, 42]])
    expect(Array.from(result2)).toEqual([[42, 1]])
  })

  it('works for more elements case', () => {
    const arr1 = [42, 43, 44]
    const arr2 = [1, 2, 3]

    const result = zip(arr1[Symbol.iterator](), arr2[Symbol.iterator]())

    expect(Array.from(result)).toEqual([
      [42, 1],
      [43, 2],
      [44, 3],
    ])
  })
})
