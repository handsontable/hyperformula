/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {Maybe} from '../../Maybe'

/**
 * The sum and the count of a set of numbers, composable so that the value of a range can be cached
 * and reused for a larger range.
 */
export class AverageResult {
  public static empty = new AverageResult(0, 0)

  constructor(
    public readonly sum: number,
    public readonly count: number,
  ) {}

  public static single(arg: number): AverageResult {
    return new AverageResult(arg, 1)
  }

  public compose(other: AverageResult) {
    return new AverageResult(this.sum + other.sum, this.count + other.count)
  }

  public averageValue(): Maybe<number> {
    if (this.count > 0) {
      return this.sum / this.count
    } else {
      return undefined
    }
  }
}
