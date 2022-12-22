/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {DependencyGraph} from '../DependencyGraph'
import {
  getRawValue,
  InternalScalarValue,
  RawInterpreterValue,
  RawNoErrorScalarValue
} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {SearchOptions} from './SearchStrategy'
import {forceNormalizeString} from '../interpreter/ArithmeticHelper'
import {findLastOccurrenceInOrderedRange} from '../interpreter/binarySearch'

export abstract class AdvancedFind {
  protected constructor(
    protected dependencyGraph: DependencyGraph
  ) {
  }

  public advancedFind(keyMatcher: (arg: RawInterpreterValue) => boolean, rangeValue: SimpleRangeValue): number {
    let values: InternalScalarValue[]
    const range = rangeValue.range
    if (range === undefined) {
      values = rangeValue.valuesFromTopLeftCorner()
    } else {
      values = this.dependencyGraph.computeListOfValuesInRange(range)
    }
    for (let i = 0; i < values.length; i++) {
      if (keyMatcher(getRawValue(values[i]))) {
        return i
      }
    }
    return -1
  }

  /*
   * WARNING: Finding lower/upper bounds in unordered ranges is not supported. When ordering === 'none', assumes matchExactly === true
   */
  protected basicFind(searchKey: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, searchCoordinate: 'col' | 'row', { ordering, matchExactly }: SearchOptions): number {
    const normalizedSearchKey = typeof searchKey === 'string' ? forceNormalizeString(searchKey) : searchKey
    const range = rangeValue.range

    if (range === undefined) {
      return this.findNormalizedValue(normalizedSearchKey, rangeValue.valuesFromTopLeftCorner())
    }

    if (ordering === 'none') {
      return this.findNormalizedValue(normalizedSearchKey, this.dependencyGraph.computeListOfValuesInRange(range))
    }

    return findLastOccurrenceInOrderedRange(
      normalizedSearchKey,
      range,
      { searchCoordinate, orderingDirection: ordering, matchExactly },
      this.dependencyGraph
    )
  }

  protected findNormalizedValue(searchKey: RawNoErrorScalarValue, searchArray: InternalScalarValue[]): number {
    return searchArray
    .map(getRawValue)
    .map(val => typeof val === 'string' ? forceNormalizeString(val) : val)
    .indexOf(searchKey)
  }
}
