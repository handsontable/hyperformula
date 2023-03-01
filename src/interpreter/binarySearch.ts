/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, simpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {EmptyValue, getRawValue, RawInterpreterValue, RawNoErrorScalarValue} from './InterpreterValue'

const NOT_FOUND = -1

/*
 * Searches for the searchKey in a sorted 1-D range.
 *
 * Options:
 * - searchCoordinate - must be set to either 'row' or 'col' to indicate the dimension of the search,
 * - orderingDirection - must be set to either 'asc' or 'desc' to indicate the ordering direction for the search range,
 * - matchExactly - when set to false, searches for the lower/upper bound.
 *
 * Semantics:
 * - If orderingDirection === 'asc', searches for the lower bound for the searchKey value (unless marchExactly === true).
 * - If orderingDirection === 'desc', searches for the upper bound for the searchKey value (unless marchExactly === true).
 * - If the search range contains duplicates, returns the last matching value.
 * - If no value in the range satisfies the above, returns -1.
 *
 * Note: this function does not normalize input strings.
 */
export function findLastOccurrenceInOrderedRange(
  searchKey: RawNoErrorScalarValue,
  range: AbsoluteCellRange,
  { searchCoordinate, orderingDirection, matchExactly }: { searchCoordinate: 'row' | 'col', orderingDirection: 'asc' | 'desc', matchExactly?: boolean },
  dependencyGraph: DependencyGraph,
): number {
  const start = range.start[searchCoordinate]
  const end = searchCoordinate === 'col' ? range.effectiveEndColumn(dependencyGraph) : range.effectiveEndRow(dependencyGraph)

  const getValueFromIndexFn = searchCoordinate === 'col'
    ? (index: number) => getRawValue(dependencyGraph.getCellValue(simpleCellAddress(range.sheet, index, range.start.row)))
    : (index: number) => getRawValue(dependencyGraph.getCellValue(simpleCellAddress(range.sheet, range.start.col, index)))

  const compareFn = orderingDirection === 'asc'
    ? (left: RawNoErrorScalarValue, right: RawInterpreterValue) => compare(left, right)
    : (left: RawNoErrorScalarValue, right: RawInterpreterValue) => -compare(left, right)

  const foundIndex = findLastMatchingIndex(index => compareFn(searchKey, getValueFromIndexFn(index)) >= 0, start, end)
  const foundValue = getValueFromIndexFn(foundIndex)

  if (foundIndex === NOT_FOUND || typeof foundValue !== typeof searchKey) {
    return NOT_FOUND
  }

  if (matchExactly && foundValue !== searchKey) {
    return NOT_FOUND
  }

  return foundIndex - start
}

/*
 * Searches for the searchKey in a sorted array.
 * Param orderingDirection must be set to either 'asc' or 'desc' to indicate the ordering direction of the array.
 *
 * Semantics:
 * - If orderingDirection === 'asc', searches for the lower bound for the searchKey value.
 * - If orderingDirection === 'desc', searches for the upper bound for the searchKey value.
 * - If the array contains duplicates, returns the last matching value.
 * - If no value in the range satisfies the above, returns -1.
 */
export function findLastOccurrenceInOrderedArray(searchKey: RawNoErrorScalarValue, array: RawInterpreterValue[], orderingDirection: 'asc' | 'desc' = 'asc'): number {
  const predicate = orderingDirection === 'asc'
    ? (index: number) => compare(searchKey, array[index]) >= 0
    : (index: number) => -compare(searchKey, array[index]) >= 0
  return findLastMatchingIndex(predicate, 0, array.length - 1)
}

/*
 * Returns:
 *   - the last element in the range for which predicate === true or,
 *   - value -1 if predicate === false for all elements.
 * Assumption: All elements for which predicate === true are before the elements for which predicate === false.
 */
export function findLastMatchingIndex(predicate: (index: number) => boolean, startRange: number, endRange: number): number {
  let start = startRange
  let end = endRange

  while(start < end) {
    const pivot = Math.ceil((start + end) / 2)

    if (predicate(pivot)) {
      start = pivot
    } else {
      end = pivot - 1
    }
  }

  if (start === end && predicate(start)) {
    return start
  }

  return NOT_FOUND
}

/*
 * numbers < strings < false < true
 */
export function compare(left: RawNoErrorScalarValue, right: RawInterpreterValue): number {
  if (typeof left === typeof right) {
    if (left === EmptyValue) {
      return 0
    }
    return (left < (right as string | number | boolean) ? -1 : (left > (right as string | number | boolean) ? 1 : 0))
  }
  if (left === EmptyValue) {
    return -1
  }
  if (right === EmptyValue) {
    return 1
  }
  if (right instanceof CellError) {
    return -1
  }
  if (typeof left === 'number' && typeof right === 'string') {
    return -1
  }
  if (typeof left === 'number' && typeof right === 'boolean') {
    return -1
  }
  if (typeof left === 'string' && typeof right === 'number') {
    return 1
  }
  if (typeof left === 'string' && typeof right === 'boolean') {
    return -1
  }
  return 1
}
