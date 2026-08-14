/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {DependencyGraph} from '../DependencyGraph'
import {
  EmptyValue,
  getRawValue,
  InternalScalarValue,
  RawInterpreterValue,
  RawNoErrorScalarValue
} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {AdvancedFindOptions, SearchOptions} from './SearchStrategy'
import {forceNormalizeString} from '../interpreter/ArithmeticHelper'
import {compare, findLastOccurrenceInOrderedRange} from '../interpreter/binarySearch'

const NOT_FOUND = -1

export abstract class AdvancedFind {
  protected constructor(
    protected dependencyGraph: DependencyGraph
  ) {
  }

  public advancedFind(keyMatcher: (arg: RawInterpreterValue) => boolean, rangeValue: SimpleRangeValue, { returnOccurrence }: AdvancedFindOptions = { returnOccurrence: 'first' }): number {
    const range = rangeValue.range
    const values: InternalScalarValue[] = (range === undefined)
      ? rangeValue.valuesFromTopLeftCorner()
      : this.dependencyGraph.computeListOfValuesInRange(range)
    
    const initialIterationIndex = returnOccurrence === 'first' ? 0 : values.length-1
    const iterationCondition = returnOccurrence === 'first' ? (i: number) => i < values.length : (i: number) => i >= 0
    const incrementIndex = returnOccurrence === 'first' ? (i: number) => i+1 : (i: number) => i-1

    for (let i = initialIterationIndex; iterationCondition(i); i = incrementIndex(i)) {
      if (keyMatcher(getRawValue(values[i]))) {
        return i
      }
    }
    return NOT_FOUND
  }

  protected basicFind(searchKey: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, searchCoordinate: 'col' | 'row', { ordering, ifNoMatch, returnOccurrence }: SearchOptions): number {
    const normalizedSearchKey = typeof searchKey === 'string' ? forceNormalizeString(searchKey) : searchKey
    const range = rangeValue.range

    if (range === undefined) {
      return this.findNormalizedValue(normalizedSearchKey, rangeValue.valuesFromTopLeftCorner(), ifNoMatch, returnOccurrence)
    }

    if (ordering === 'none') {
      return this.findNormalizedValue(normalizedSearchKey, this.dependencyGraph.computeListOfValuesInRange(range), ifNoMatch, returnOccurrence)
    }

    return findLastOccurrenceInOrderedRange(
      normalizedSearchKey,
      range,
      { searchCoordinate, orderingDirection: ordering, ifNoMatch },
      this.dependencyGraph
    )
  }

  /**
   * Linear search over an in-memory array for the value equal to `searchKey`, or — when `ifNoMatch`
   * is `returnLowerBound`/`returnUpperBound` — the closest non-exceeding/non-preceding value.
   * Genuinely empty cells (`EmptyValue`) are skipped, consistent with `findLastOccurrenceInOrderedRange`
   * and with Excel/Google Sheets, which ignore empty cells (but not empty strings) in approximate search.
   * Returns the 0-based index into `searchArray`, or `NOT_FOUND` (-1) when nothing matches.
   */
  protected findNormalizedValue(searchKey: RawNoErrorScalarValue, searchArray: InternalScalarValue[], ifNoMatch: 'returnLowerBound' | 'returnUpperBound' | 'returnNotFound' = 'returnNotFound', returnOccurrence: 'first' | 'last' = 'first'): number {
    const normalizedArray = searchArray
      .map(getRawValue)
      .map(val => typeof val === 'string' ? forceNormalizeString(val) : val)

    if (ifNoMatch === 'returnNotFound') {
      return returnOccurrence === 'first' ? normalizedArray.indexOf(searchKey) : normalizedArray.lastIndexOf(searchKey)
    }

    const compareFn = ifNoMatch === 'returnLowerBound'
      ? (left: RawNoErrorScalarValue, right: RawInterpreterValue) => compare(left, right)
      : (left: RawNoErrorScalarValue, right: RawInterpreterValue) => -compare(left, right)

    let bestValue: RawNoErrorScalarValue = ifNoMatch === 'returnLowerBound' ? -Infinity : Infinity
    let bestIndex = NOT_FOUND

    const initialIterationIndex = returnOccurrence === 'first' ? 0 : normalizedArray.length-1
    const iterationCondition = returnOccurrence === 'first' ? (i: number) => i < normalizedArray.length : (i: number) => i >= 0
    const incrementIndex = returnOccurrence === 'first' ? (i: number) => i+1 : (i: number) => i-1

    for (let i = initialIterationIndex; iterationCondition(i); i = incrementIndex(i)) {
      const value = normalizedArray[i] as RawNoErrorScalarValue

      if (value === searchKey) {
        return i
      }

      // Skip empty cells in the approximate search, consistent with findLastOccurrenceInOrderedRange:
      // Excel/Google Sheets ignore genuinely empty cells (but not empty strings) when looking for the
      // lower/upper bound. EmptyValue would otherwise be ranked below every value by compare().
      if (value === EmptyValue) {
        continue
      }

      // Skip values of a different type than the key, consistent with findLastOccurrenceInOrderedRange:
      // compare() ranks every number below every string (and both below booleans) only to keep a
      // total order for sorting mixed-type arrays, not because cross-type values are comparable.
      // Without this guard a text key would treat every number as a valid "smaller" candidate (and
      // vice versa), so a lower-bound search over {10, 20} for "a" would return the largest number.
      if (typeof value !== typeof searchKey) {
        continue
      }

      if (compareFn(value, searchKey) > 0) {
        continue
      }
      
      if (compareFn(bestValue, value) < 0) {
        bestValue = value
        bestIndex = i
      }
    }

    return bestIndex
  }
}
