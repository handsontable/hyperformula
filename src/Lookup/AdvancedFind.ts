/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {DependencyGraph} from '../DependencyGraph'
import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {getRawValue, InternalScalarValue, RawInterpreterValue} from '../interpreter/InterpreterValue'

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
