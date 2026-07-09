/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
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
 * - ifNoMatch - must be set to 'returnLowerBound', 'returnUpperBound' or 'returnNotFound'
 *
 * If the search range contains duplicates, returns the last matching value. If no value found in the range satisfies the above, returns -1.
 *
 * Empty cells (EmptyValue) are skipped: they are not treated as ordered values during the
 * approximate search. This mirrors Excel/Google Sheets, where MATCH/VLOOKUP/HLOOKUP/XLOOKUP
 * ignore genuinely empty cells (but not empty strings) when looking for the lower/upper bound.
 * The returned offset is always relative to the original range, so empty cells keep their slots
 * and the position of the matched non-empty cell is reported unchanged.
 *
 * Note: this function does not normalize input strings.
 */
export function findLastOccurrenceInOrderedRange(
  searchKey: RawNoErrorScalarValue,
  range: AbsoluteCellRange,
  { searchCoordinate, orderingDirection, ifNoMatch }: { searchCoordinate: 'row' | 'col', orderingDirection: 'asc' | 'desc', ifNoMatch: 'returnLowerBound' | 'returnUpperBound' | 'returnNotFound' },
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

  // Exact-match mode (returnNotFound) reports a hit iff the searchKey is genuinely present in the
  // range, independent of ordering artifacts and interspersed empty cells. Fast path: run the binary
  // search directly over the original range (O(log n)). A range with no empty gaps is monotonic, so an
  // exact hit is found immediately and returned. Only when the direct search misses do we fall through
  // to the O(n) empty-skipping compaction below (shared with the bound modes), which recovers a match
  // that an interspersed blank would otherwise hide from the binary search. This keeps the common,
  // gap-free case O(log n) while making exact match gap-independent (HF-223): binary search over a
  // blank-containing range is non-monotonic, so a direct search alone can miss a value that is present.
  if (ifNoMatch === 'returnNotFound') {
    const directIndex = findLastMatchingIndex(index => compareFn(searchKey, getValueFromIndexFn(index)) >= 0, start, end)
    if (directIndex !== NOT_FOUND && getValueFromIndexFn(directIndex) === searchKey) {
      return directIndex - start
    }
    // Direct search missed — fall through to the empty-skipping compaction to recover a hidden match.
  }

  // Collect the original indices of the non-empty cells, preserving their order. Empty cells break
  // the sort invariant binary search relies on (compare() ranks EmptyValue below every other value),
  // so the bound search runs over the compacted, empty-free index list and the result is mapped back
  // to the original index space afterwards.
  //
  // This pre-scan is O(n) over the range, which trades away the binary search's O(log n) guarantee.
  // It is required for correctness in the bound modes: with empty cells interspersed the search
  // predicate is no longer monotonic, so the binary search cannot run directly on the original range.
  //
  // Two invariants this relies on: (1) genuinely empty cells surface here as the `EmptyValue` sentinel
  // (empty strings and 0 do not), so `!== EmptyValue` is an exact empties filter; (2) `compare()` ranks
  // `EmptyValue` below every non-empty value — which is precisely why an interspersed blank breaks the
  // monotonic ordering and forces this compaction instead of a direct search over the original range.
  const nonEmptyIndices: number[] = []
  for (let index = start; index <= end; index++) {
    if (getValueFromIndexFn(index) !== EmptyValue) {
      nonEmptyIndices.push(index)
    }
  }

  // With no non-empty cells there is nothing to match against. Return early so the
  // ifNoMatch branches below (which treat NOT_FOUND as "key past the edge of a non-empty
  // list" and may return offset 0) are not reached for an all-empty range.
  if (nonEmptyIndices.length === 0) {
    return NOT_FOUND
  }

  const foundCompactedIndex = findLastMatchingIndex(compactedIndex => compareFn(searchKey, getValueFromIndexFn(nonEmptyIndices[compactedIndex])) >= 0, 0, nonEmptyIndices.length - 1)
  const foundIndex = foundCompactedIndex === NOT_FOUND ? NOT_FOUND : nonEmptyIndices[foundCompactedIndex]
  const foundValue = foundIndex === NOT_FOUND ? EmptyValue : getValueFromIndexFn(foundIndex)

  if (foundValue === searchKey) {
    return foundIndex - start
  }

  if (ifNoMatch === 'returnLowerBound') {
    if (foundIndex === NOT_FOUND) {
      return orderingDirection === 'asc' ? NOT_FOUND : 0
    }

    if (typeof foundValue !== typeof searchKey) {
      return NOT_FOUND
    }

    // here: foundValue !== searchKey
    if (orderingDirection === 'asc') {
      return foundIndex - start
    }

    // orderingDirection === 'desc'
    const nextIndex = nonEmptyIndices[foundCompactedIndex + 1]
    return nextIndex !== undefined ? nextIndex - start : NOT_FOUND
  }

  if (ifNoMatch === 'returnUpperBound') {
    if (foundIndex === NOT_FOUND) {
      return orderingDirection === 'asc' ? 0 : NOT_FOUND
    }

    if (typeof foundValue !== typeof searchKey) {
      return NOT_FOUND
    }

    // here: foundValue !== searchKey
    if (orderingDirection === 'desc') {
      return foundIndex - start
    }

    // orderingDirection === 'asc'
    const nextIndex = nonEmptyIndices[foundCompactedIndex + 1]
    return nextIndex !== undefined ? nextIndex - start : NOT_FOUND
  }

  // ifNoMatch === 'returnNotFound'
  return NOT_FOUND
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
