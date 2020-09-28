/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {SearchStrategy} from './SearchStrategy'
import {InternalNoErrorCellValue} from '../Cell'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {rangeLowerBound} from '../interpreter/binarySearch'
import {Config} from '../Config'
import {DependencyGraph} from '../DependencyGraph'
import {AdvancedFind} from './AdvancedFind'

export class RowSearchStrategy extends AdvancedFind implements SearchStrategy {
  constructor(
    private config: Config,
    protected dependencyGraph: DependencyGraph,
  ) {
    super(dependencyGraph)
  }

  public find(key: InternalNoErrorCellValue, range: AbsoluteCellRange, sorted: boolean): number {
    if (range.width() < this.config.binarySearchThreshold || !sorted) {
      const values = this.dependencyGraph.computeListOfValuesInRange(range)
      const index =  values.indexOf(key)
      return index < 0 ? index : index + range.start.col
    } else {
      return rangeLowerBound(range, key, this.dependencyGraph, 'col')
    }
  }
}
