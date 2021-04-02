/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {ArithmeticHelper} from '../interpreter/ArithmeticHelper'
import {rangeLowerBound} from '../interpreter/binarySearch'
import {getRawValue, RawNoErrorScalarValue} from '../interpreter/InterpreterValue'
import {AdvancedFind} from './AdvancedFind'
import {SearchStrategy} from './SearchStrategy'

export class RowSearchStrategy extends AdvancedFind implements SearchStrategy {
  constructor(
    private config: Config,
    private arithmeticHelper: ArithmeticHelper,
    protected dependencyGraph: DependencyGraph,
  ) {
    super(dependencyGraph)
  }

  public find(key: RawNoErrorScalarValue, range: AbsoluteCellRange, sorted: boolean): number {
    if(typeof key === 'string') {
      key = this.arithmeticHelper.normalizeString(key)
    }
    if (range.width() < this.config.binarySearchThreshold || !sorted) {
      const values = this.dependencyGraph.computeListOfValuesInRange(range).map(getRawValue).map(arg =>
        (typeof arg === 'string') ? this.arithmeticHelper.normalizeString(arg) : arg
      )
      const index =  values.indexOf(key)
      return index < 0 ? index : index + range.start.col
    } else {
      return rangeLowerBound(range, key, this.dependencyGraph, 'col')
    }
  }
}
