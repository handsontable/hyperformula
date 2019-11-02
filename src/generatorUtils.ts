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

export function count<T>(iterable: IterableIterator<T>): number {
  let counter = 0
  for (const val of iterable) {
    counter++
  }
  return counter
}
