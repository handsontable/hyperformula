/**
 * @license
 * Copyright (c) 2024 Handsoncode. All rights reserved.
 */

import {DependencyGraph} from '../DependencyGraph'
import {
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

  public advancedFind(keyMatcher: (arg: RawInterpreterValue) => boolean, rangeValue: SimpleRangeValue, { returnOccurence }: AdvancedFindOptions = { returnOccurence: 'first' }): number {
    const range = rangeValue.range
    const values: InternalScalarValue[] = (range === undefined)
      ? rangeValue.valuesFromTopLeftCorner()
      : this.dependencyGraph.computeListOfValuesInRange(range)
    
    const initialIterationIndex = returnOccurence === 'first' ? 0 : values.length-1
    const iterationCondition = returnOccurence === 'first' ? (i: number) => i < values.length : (i: number) => i >= 0
    const incrementIndex = returnOccurence === 'first' ? (i: number) => i+1 : (i: number) => i-1

    for (let i = initialIterationIndex; iterationCondition(i); i = incrementIndex(i)) {
      if (keyMatcher(getRawValue(values[i]))) {
        return i
      }
    }
    return NOT_FOUND
  }

  protected basicFind(searchKey: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, searchCoordinate: 'col' | 'row', { ordering, ifNoMatch, returnOccurence }: SearchOptions): number {
    const normalizedSearchKey = typeof searchKey === 'string' ? forceNormalizeString(searchKey) : searchKey
    const range = rangeValue.range

    if (range === undefined) {
      return this.findNormalizedValue(normalizedSearchKey, rangeValue.valuesFromTopLeftCorner(), ifNoMatch, returnOccurence)
    }

    if (ordering === 'none') {
      return this.findNormalizedValue(normalizedSearchKey, this.dependencyGraph.computeListOfValuesInRange(range), ifNoMatch, returnOccurence)
    }

    return findLastOccurrenceInOrderedRange(
      normalizedSearchKey,
      range,
      { searchCoordinate, orderingDirection: ordering, ifNoMatch },
      this.dependencyGraph
    )
  }

  protected findNormalizedValue(searchKey: RawNoErrorScalarValue, searchArray: InternalScalarValue[], ifNoMatch: 'returnLowerBound' | 'returnUpperBound' | 'returnNotFound' = 'returnNotFound', returnOccurence: 'first' | 'last' = 'first'): number {
    const normalizedArray = searchArray
      .map(getRawValue)
      .map(val => typeof val === 'string' ? forceNormalizeString(val) : val)

    if (ifNoMatch === 'returnNotFound') {
      return returnOccurence === 'first' ? normalizedArray.indexOf(searchKey) : normalizedArray.lastIndexOf(searchKey)
    }

    const compareFn = ifNoMatch === 'returnLowerBound'
      ? (left: RawNoErrorScalarValue, right: RawInterpreterValue) => compare(left, right)
      : (left: RawNoErrorScalarValue, right: RawInterpreterValue) => -compare(left, right)

    let bestValue: RawNoErrorScalarValue = ifNoMatch === 'returnLowerBound' ? -Infinity : Infinity
    let bestIndex = NOT_FOUND

    const initialIterationIndex = returnOccurence === 'first' ? 0 : normalizedArray.length-1
    const iterationCondition = returnOccurence === 'first' ? (i: number) => i < normalizedArray.length : (i: number) => i >= 0
    const incrementIndex = returnOccurence === 'first' ? (i: number) => i+1 : (i: number) => i-1

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
