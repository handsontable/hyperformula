/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {DependencyGraph} from '../DependencyGraph'
import {RawNoErrorScalarValue} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'
import {AdvancedFind} from './AdvancedFind'
import {SearchOptions, SearchStrategy} from './SearchStrategy'

export class RowSearchStrategy extends AdvancedFind implements SearchStrategy {
  constructor(protected dependencyGraph: DependencyGraph) {
    super(dependencyGraph)
  }

  /*
   * WARNING: Finding lower/upper bounds in unordered ranges is not supported. When ordering === 'none', assumes matchExactly === true
   */
  public find(searchKey: RawNoErrorScalarValue, rangeValue: SimpleRangeValue, searchOptions: SearchOptions): number {
    return this.basicFind(searchKey, rangeValue, 'col', searchOptions)
  }
}
