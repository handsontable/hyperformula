export enum StatType {
  OVERALL = 'OVERALL',
  PARSER = 'PARSER',
  GRAPH_BUILD = 'GRAPH_BUILD',
  EVALUATION = 'EVALUATION',
  TOP_SORT = 'TOP_SORT',
  SERIALIZATION = 'SERIALIZATION',
  DESERIALIZATION = 'DESERIALIZATION',
}

/**
 * Provides tracking performance statistics to the engine
 */
export class Statistics {
  private readonly stats: Map<StatType, number> = new Map<StatType, number>()
  private readonly startTimes: Map<StatType, number> = new Map<StatType, number>()

  /**
   * Resets statistics
   */
  public reset(): void {
    this.stats.clear()
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
      const now = Date.now()
      this.startTimes.set(name, now)
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
}
