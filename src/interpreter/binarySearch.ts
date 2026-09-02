/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, simpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {ApproximateMatchPolicy} from '../Lookup/SearchStrategy'
import {EmptyValue, getRawValue, RawInterpreterValue, RawNoErrorScalarValue} from './InterpreterValue'

const NOT_FOUND = -1

/**
 * Searches for the searchKey in a sorted 1-D range.
 *
 * If the search range contains duplicates, returns the last matching value, with one caveat: in the
 * 'returnNotFound' mode, when the range contains both duplicates of the searchKey and interspersed
 * empty cells, the search may report any of the duplicated positions (Excel's binary-search modes
 * likewise leave this unspecified).
 *
 * If no value found in the range satisfies the above, returns -1.
 *
 * Empty cells (EmptyValue) are skipped: they are not treated as ordered values during the
 * approximate search. This mirrors Google Sheets and Excel's linear approximate lookups, which
 * ignore genuinely empty cells (but not empty strings) when looking for the lower/upper bound;
 * for Excel's explicit binary search modes (XLOOKUP search_mode ±2) the result on a range with
 * interspersed empty cells is unspecified — see docs/guide/list-of-differences.md.
 * The returned offset is always relative to the original range, so empty cells keep their slots
 * and the position of the matched non-empty cell is reported unchanged.
 *
 * Complexity: O(log n) as long as the binary-search descent probes no empty cell — in particular
 * for ranges without empty cells. Only when the descent touches an empty cell does the search fall
 * back to an O(n) scan that compacts the non-empty indices and re-runs the binary search over them.
 *
 * Note: this function does not normalize input strings.
 *
 * @param {RawNoErrorScalarValue} searchKey - Lookup value.
 * @param {AbsoluteCellRange} range - Sorted one-dimensional cell range.
 * @param {object} options - Search direction, requested miss result, and approximate-match policy.
 * @param {('row'|'col')} options.searchCoordinate - Dimension containing the one-dimensional lookup values.
 * @param {('asc'|'desc')} options.orderingDirection - Ascending or descending ordering assumed by the binary search.
 * @param {('returnLowerBound'|'returnUpperBound'|'returnNotFound')} options.ifNoMatch - Whether an absent exact value requests a lower bound, upper bound, or no result.
 * @param {ApproximateMatchPolicy} options.approximateMatchPolicy - Cross-type candidate policy for approximate bounds.
 * @param {DependencyGraph} dependencyGraph - Source of current cell values for the range.
 * @returns {number} The range-relative index of the match, or `NOT_FOUND` when no valid result exists.
 *
 * Approximate result invariant:
 *
 * Exact equality is resolved before approximate policy validation. Every approximate exit path,
 * including candidates reached by stepping over empty cells, is finalized through the same policy
 * check so linear and binary lookup routes cannot assign different cross-type semantics.
 *
 * @internal
 */
export function findLastOccurrenceInOrderedRange(
  searchKey: RawNoErrorScalarValue,
  range: AbsoluteCellRange,
  { searchCoordinate, orderingDirection, ifNoMatch, approximateMatchPolicy }: { searchCoordinate: 'row' | 'col', orderingDirection: 'asc' | 'desc', ifNoMatch: 'returnLowerBound' | 'returnUpperBound' | 'returnNotFound', approximateMatchPolicy: ApproximateMatchPolicy },
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

  /*
   * Returns the original index of the first non-empty cell at or after fromIndex, or undefined if
   * all the remaining cells are empty. Costs O(gap length), which the search pays only when it
   * actually needs to step over empty slots.
   */
  const findNextNonEmptyIndex = (fromIndex: number): number | undefined => {
    for (let index = fromIndex; index <= end; index++) {
      if (getValueFromIndexFn(index) !== EmptyValue) {
        return index
      }
    }
    return undefined
  }

  // Fast path: binary search directly over the original range, tracking whether the descent ever
  // probed an empty cell. Within the sorted-input contract, empty cells are the only source of
  // non-monotonicity in the search predicate: compare() ranks EmptyValue below every non-empty
  // value, and genuinely empty cells surface as the EmptyValue sentinel — empty strings and 0 do
  // not. (Error values also break the ordering, but a range containing errors is outside the
  // contract, and the compaction fallback keeps them too.) In a descent that never probes an empty
  // cell every probed pivot is a correctly-ordered non-empty value, so each discarded half is
  // justified by the monotonicity of the non-empty values, and the landing index — which is always
  // probed — is the same one the compacted search below would return: the result can be trusted
  // as-is. This keeps the search O(log n) unless an empty cell actually interferes.
  let probedEmptyCell = false
  const directIndex = findLastMatchingIndex(index => {
    const value = getValueFromIndexFn(index)
    if (value === EmptyValue) {
      probedEmptyCell = true
    }
    return compareFn(searchKey, value) >= 0
  }, start, end)

  let foundIndex: number

  if (!probedEmptyCell) {
    foundIndex = directIndex
  } else if (ifNoMatch === 'returnNotFound' && directIndex !== NOT_FOUND && getValueFromIndexFn(directIndex) === searchKey) {
    // Exact-match mode: a misdirected descent cannot produce a false positive, because the landing
    // value is re-checked for equality here. Accept the hit and skip the O(n) fallback.
    return directIndex - start
  } else {
    // The descent probed an empty cell, so its result cannot be trusted (HF-223): collect the
    // original indices of the non-empty cells (O(n)) and re-run the binary search over the
    // compacted, empty-free index list. The result maps back to the original index space, so empty
    // cells keep their slots and the matched non-empty cell's original position is reported
    // unchanged. On an all-empty range the compacted list has no elements and the search reports
    // NOT_FOUND, which the ifNoMatch branches below preserve.
    const nonEmptyIndices: number[] = []
    for (let index = start; index <= end; index++) {
      if (getValueFromIndexFn(index) !== EmptyValue) {
        nonEmptyIndices.push(index)
      }
    }

    const foundCompactedIndex = findLastMatchingIndex(compactedIndex => compareFn(searchKey, getValueFromIndexFn(nonEmptyIndices[compactedIndex])) >= 0, 0, nonEmptyIndices.length - 1)
    foundIndex = foundCompactedIndex === NOT_FOUND ? NOT_FOUND : nonEmptyIndices[foundCompactedIndex]
  }

  const foundValue = foundIndex === NOT_FOUND ? EmptyValue : getValueFromIndexFn(foundIndex)

  /**
   * Validates and converts an absolute approximate candidate index into a range-relative result.
   *
   * @param {(number|undefined)} index - Absolute candidate index, or `undefined` when no non-empty candidate exists.
   * @returns {number} The range-relative index, or `NOT_FOUND` when the candidate is absent or disallowed.
   *
   * @internal
   */
  const returnApproximateResult = (index: number | undefined): number => {
    if (index === undefined || index === NOT_FOUND) {
      return NOT_FOUND
    }

    if (approximateMatchPolicy === 'sameType' && typeof getValueFromIndexFn(index) !== typeof searchKey) {
      return NOT_FOUND
    }

    return index - start
  }

  if (foundValue === searchKey) {
    return foundIndex - start
  }

  if (ifNoMatch === 'returnLowerBound') {
    if (foundIndex === NOT_FOUND) {
      if (orderingDirection === 'asc') {
        return NOT_FOUND
      }

      // orderingDirection === 'desc': the key exceeds every value in the range, so the lower bound
      // is the first (largest) non-empty value — never an empty leading cell, and NOT_FOUND on an
      // all-empty range.
      const firstNonEmptyIndex = findNextNonEmptyIndex(start)
      return returnApproximateResult(firstNonEmptyIndex)
    }

    // here: foundValue !== searchKey
    if (orderingDirection === 'asc') {
      return returnApproximateResult(foundIndex)
    }

    // orderingDirection === 'desc': step to the next non-empty cell, so skipped empty slots never
    // shift the reported position.
    const nextIndex = findNextNonEmptyIndex(foundIndex + 1)
    return returnApproximateResult(nextIndex)
  }

  if (ifNoMatch === 'returnUpperBound') {
    if (foundIndex === NOT_FOUND) {
      if (orderingDirection === 'desc') {
        return NOT_FOUND
      }

      // orderingDirection === 'asc': the key precedes every value in the range, so the upper bound
      // is the first (smallest) non-empty value — never an empty leading cell, and NOT_FOUND on an
      // all-empty range.
      const firstNonEmptyIndex = findNextNonEmptyIndex(start)
      return returnApproximateResult(firstNonEmptyIndex)
    }

    // here: foundValue !== searchKey
    if (orderingDirection === 'desc') {
      return returnApproximateResult(foundIndex)
    }

    // orderingDirection === 'asc': step to the next non-empty cell, so skipped empty slots never
    // shift the reported position.
    const nextIndex = findNextNonEmptyIndex(foundIndex + 1)
    return returnApproximateResult(nextIndex)
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
