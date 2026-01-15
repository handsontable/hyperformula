import {empty, first, split} from '../../src/generatorUtils'

describe('empty', () => {
  it('works', () => {
    expect(Array.from(empty())).toEqual([])
  })
})

describe('split', () => {
  it('works for empty case', () => {
    const result = split(empty())

    expect(result.value).toBeUndefined()
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
    expect(first(empty())).toBeUndefined()
  })

  it('works for one element case', () => {
    const arr = [42]

    expect(first(arr[Symbol.iterator]())).toBe(42)
  })

  it('works for more elements case', () => {
    const arr = [42, 43]

    expect(first(arr[Symbol.iterator]())).toBe(42)
  })
})
