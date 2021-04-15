/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {DependencyGraph} from '../DependencyGraph'
import {getRawValue, RawInterpreterValue} from '../interpreter/InterpreterValue'

export abstract class AdvancedFind {
  protected constructor(
    protected dependencyGraph: DependencyGraph
  ) {
  }

  public advancedFind(keyMatcher: (arg: RawInterpreterValue) => boolean, range: AbsoluteCellRange): number {
    const values = this.dependencyGraph.computeListOfValuesInRange(range)
    for (let i = 0; i < values.length; i++) {
      if (keyMatcher(getRawValue(values[i]))) {
        return i + range.start.col
      }
    }
    return -1
  }
}
