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

  /**
   * @param {number} sum - the sum of the values
   * @param {number} count - the number of values
   */
  constructor(
    public readonly sum: number,
    public readonly count: number,
  ) {}

  /**
   * The sum and the count of one value.
   *
   * @param {number} arg - the value
   * @returns {AverageResult} an aggregate of the single value
   */
  public static single(arg: number): AverageResult {
    return new AverageResult(arg, 1)
  }

  /**
   * Combines two aggregates by adding their sums and their counts.
   *
   * @param {AverageResult} other - the aggregate to add
   * @returns {AverageResult} the aggregate of the values of both
   */
  public compose(other: AverageResult) {
    return new AverageResult(this.sum + other.sum, this.count + other.count)
  }

  /**
   * The average: the sum divided by the count.
   *
   * @returns {Maybe<number>} the average, or `undefined` for no values
   */
  public averageValue(): Maybe<number> {
    if (this.count > 0) {
      return this.sum / this.count
    } else {
      return undefined
    }
  }
}
