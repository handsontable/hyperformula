import { count, empty, filterWith, first, split } from '../src/generatorUtils'

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
