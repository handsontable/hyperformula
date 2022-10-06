/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {forceNormalizeString} from '../interpreter/ArithmeticHelper'
import {findLastOccurrenceInOrderedRange} from '../interpreter/binary-search'
import {getRawValue, RawNoErrorScalarValue} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../interpreter/SimpleRangeValue'
import {AdvancedFind} from './AdvancedFind'
import {SearchStrategy} from './SearchStrategy'

export class RowSearchStrategy extends AdvancedFind implements SearchStrategy {
  constructor(
    private config: Config,
    protected dependencyGraph: DependencyGraph,
  ) {
    super(dependencyGraph)
  }

  public find(key: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, sorted: boolean): number {
    if (typeof key === 'string') {
      key = forceNormalizeString(key)
    }
    const range = rangeValue.range
    if (range === undefined) {
      return rangeValue.valuesFromTopLeftCorner().map(getRawValue).indexOf(key)
    } else if (!sorted) {
      return this.dependencyGraph.computeListOfValuesInRange(range).findIndex(arg => {
        arg = getRawValue(arg)
        arg = (typeof arg === 'string') ? forceNormalizeString(arg) : arg
        return arg === key
      })
    } else {
      return findLastOccurrenceInOrderedRange(key, range, { searchCoordinate: 'col', orderingDirection: 'asc' }, this.dependencyGraph)
    }
  }
}
