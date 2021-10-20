/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {Maybe} from './Maybe'

export function* empty<T>(): IterableIterator<T> {
}

export function split<T>(iterable: IterableIterator<T>): { value?: T, rest: IterableIterator<T> } {
  const iterator = iterable[Symbol.iterator]()
  const {done, value} = iterator.next()

  if (done) {
    return {rest: empty()}
  } else {
    return {value, rest: iterator}
  }
}

export function first<T>(iterable: IterableIterator<T>): Maybe<T> {
  const iterator: Iterator<T> = iterable[Symbol.iterator]()
  const {done, value} = iterator.next()

  if (!done) {
    return value
  }
  return undefined
}
