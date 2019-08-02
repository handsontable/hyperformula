export function * empty<T>(): IterableIterator<T> { }

export function split<T>(iterable: IterableIterator<T>): { value?: T, rest: IterableIterator<T> } {
  const iterator = iterable[Symbol.iterator]()
  const { done, value } = iterator.next()

  if (done) {
    return { rest: empty() }
  } else {
    return { value, rest: iterator }
  }
}

export function first<T>(iterable: IterableIterator<T>): T | undefined {
  const iterator: Iterator<T> = iterable[Symbol.iterator]()
  const { done, value } = iterator.next()

  if (!done) {
    return value
  }
  return undefined
}

export function * map<T, R>(fn: ((x: T) => R), iterable: IterableIterator<T>): IterableIterator<R> {
  const asSplit = split(iterable)

  if (asSplit.hasOwnProperty('value')) {
    const value = asSplit.value as T

    yield fn(value)
    yield * map(fn, asSplit.rest)
  }
}

export function * filterWith<T>(fn: ((x: T) => boolean), iterable: IterableIterator<T>): IterableIterator<T> {
  const asSplit = split(iterable)

  if (asSplit.hasOwnProperty('value')) {
    const value = asSplit.value as T

    if (fn(value)) {
      yield value
    }
    yield * filterWith(fn, asSplit.rest)
  }
}

export function count<T>(iterable: IterableIterator<T>): number {
  let counter = 0
  for (const val of iterable) {
    counter++
  }
  return counter
}

export function * zip<T1, T2>(iterable1: IterableIterator<T1>, iterable2: IterableIterator<T2>): IterableIterator<[T1, T2]> {
  const asSplit1 = split(iterable1)
  const asSplit2 = split(iterable2)

  if (asSplit1.hasOwnProperty('value') && asSplit2.hasOwnProperty('value')) {
    yield [asSplit1.value as T1, asSplit2.value as T2]

    yield * zip(asSplit1.rest, asSplit2.rest)
  }
}
