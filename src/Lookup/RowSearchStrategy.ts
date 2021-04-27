/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {forceNormalizeString} from '../interpreter/ArithmeticHelper'
import {rangeLowerBound} from '../interpreter/binarySearch'
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
    if(typeof key === 'string') {
      key = forceNormalizeString(key)
    }
    const range = rangeValue.range
    if(range === undefined) {
      return rangeValue.valuesFromTopLeftCorner().map(getRawValue).indexOf(key)
    } else if (range.width() < this.config.binarySearchThreshold || !sorted) {
      return this.dependencyGraph.computeListOfValuesInRange(range).map(getRawValue).map(arg =>
        (typeof arg === 'string') ? forceNormalizeString(arg) : arg
      ).indexOf(key)
    } else {
      return rangeLowerBound(range, key, this.dependencyGraph, 'col')
    }
  }
}
