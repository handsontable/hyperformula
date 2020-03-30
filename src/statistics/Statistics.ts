import {StatType} from './StatType'

/**
 * Provides tracking performance statistics to the engine
 */
export class Statistics {
  protected readonly stats: Map<StatType, number> = new Map<StatType, number>([
    [StatType.CRITERION_FUNCTION_FULL_CACHE_USED, 0],
    [StatType.CRITERION_FUNCTION_PARTIAL_CACHE_USED, 0],
  ])
  protected readonly startTimes: Map<StatType, number> = new Map<StatType, number>()

  public incrementCriterionFunctionFullCacheUsed() {
    const newValue = (this.stats.get(StatType.CRITERION_FUNCTION_FULL_CACHE_USED) || 0) + 1

    this.stats.set(StatType.CRITERION_FUNCTION_FULL_CACHE_USED, newValue)
  }

  public incrementCriterionFunctionPartialCacheUsed() {
    const newValue = (this.stats.get(StatType.CRITERION_FUNCTION_PARTIAL_CACHE_USED) || 0) + 1

    this.stats.set(StatType.CRITERION_FUNCTION_PARTIAL_CACHE_USED, newValue)
  }

  /**
   * Resets statistics
   */
  public reset(): void {
    this.stats.clear()
    this.startTimes.clear()
    this.stats.set(StatType.CRITERION_FUNCTION_FULL_CACHE_USED, 0)
    this.stats.set(StatType.CRITERION_FUNCTION_PARTIAL_CACHE_USED, 0)
  }

  /**
   * Starts tracking particular statistic.
   *
   * @param name - statistic to start tracking
   */
  public start(name: StatType): void {
    if (this.startTimes.get(name)) {
      throw Error(`Statistics ${name} already started`)
    } else {
      this.startTimes.set(name, Date.now())
    }
  }

  /**
   * Stops tracking particular statistic.
   * Raise error if tracking statistic wasn't started.
   *
   * @param name - statistic to stop tracking
   */
  public end(name: StatType): void {
    const now = Date.now()
    const startTime = this.startTimes.get(name)

    if (startTime) {
      let values = this.stats.get(name) || 0
      values += (now - startTime)
      this.stats.set(name, values)
      this.startTimes.delete(name)
    } else {
      throw Error(`Statistics ${name} not started`)
    }
  }

  /**
   * Measure given statistic as execution of given function.
   *
   * @param name - statistic to track
   * @param func - function to call
   * @returns result of the function call
   */
  public measure<T>(name: StatType, func: () => T): T {
    this.start(name)
    const result = func()
    this.end(name)
    return result
  }

  /**
   * Returns the snapshot of current results
   */
  public snapshot(): Map<StatType, number> {
    return new Map(this.stats)
  }

  public destroy() {
    this.stats.clear()
    this.startTimes.clear()
  }
}
