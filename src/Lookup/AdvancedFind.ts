/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {DependencyGraph} from '../DependencyGraph'
import {InternalScalarValue} from '../Cell'
import {AbsoluteCellRange} from '../AbsoluteCellRange'

export abstract class AdvancedFind {
  protected constructor(
    protected dependencyGraph: DependencyGraph
  ) {
  }

  public advancedFind(keyMatcher: (arg: InternalScalarValue) => boolean, range: AbsoluteCellRange): number {
    const values = this.dependencyGraph.computeListOfValuesInRange(range)
    for (let i = 0; i < values.length; i++) {
      if (keyMatcher(values[i])) {
        return i + range.start.col
      }
    }
    return -1
  }
}
