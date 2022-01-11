/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {DependencyGraph} from '../DependencyGraph'
import {getRawValue, InternalScalarValue, RawInterpreterValue} from '../interpreter/InterpreterValue'
import {SimpleRangeValue} from '../interpreter/SimpleRangeValue'

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
}
