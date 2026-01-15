/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {DependencyGraph} from '../DependencyGraph'
import {
  getRawValue,
  InternalScalarValue,
  RawInterpreterValue,
  RawNoErrorScalarValue,
  isExtendedNumber,
  getRawPrecisionValue,
  toNativeNumeric
} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {AdvancedFindOptions, SearchOptions} from './SearchStrategy'
import {forceNormalizeString} from '../interpreter/ArithmeticHelper'
import {compare, findLastOccurrenceInOrderedRange} from '../interpreter/binarySearch'

const NOT_FOUND = -1

/**
 *
 */
export abstract class AdvancedFind {
  protected constructor(
    protected dependencyGraph: DependencyGraph
  ) {
  }

  
  /**
   *
   */
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

  
  /**
   *
   */
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
   *
   */
  protected findNormalizedValue(searchKey: RawNoErrorScalarValue, searchArray: InternalScalarValue[], ifNoMatch: 'returnLowerBound' | 'returnUpperBound' | 'returnNotFound' = 'returnNotFound', returnOccurrence: 'first' | 'last' = 'first'): number {
    const normalizedArray = searchArray
      .map(getRawValue)
      .map(val => typeof val === 'string' ? forceNormalizeString(val) : val)

    if (ifNoMatch === 'returnNotFound') {
      // Custom comparison that handles Numeric
      const isEqual = (a: RawInterpreterValue, b: RawNoErrorScalarValue): boolean => {
        if (isExtendedNumber(a) && isExtendedNumber(b)) {
          return toNativeNumeric(getRawPrecisionValue(a as any)) === toNativeNumeric(getRawPrecisionValue(b as any))
        }
        return a === b
      }
      
      if (returnOccurrence === 'first') {
        return normalizedArray.findIndex(val => isEqual(val, searchKey))
      } else {
        // Find last occurrence
        for (let i = normalizedArray.length - 1; i >= 0; i--) {
          if (isEqual(normalizedArray[i], searchKey)) {
            return i
          }
        }
        return -1
      }
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
