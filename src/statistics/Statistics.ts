export enum StatType {
  OVERALL = "OVERALL",
  PARSER = "PARSER",
  GRAPH_BUILD = "GRAPH_BUILD",
  EVALUATION = "EVALUATION",
  TOP_SORT = "TOP_SORT"
}

export class Statistics {
  private stats: Map<StatType, number[]>

  private startTimes: Map<StatType, number>

  constructor() {
    this.stats = new Map<StatType, any>();
    this.startTimes = new Map<StatType, any>();
  }

  reset() {
    this.stats.clear()
  }

  start(name: StatType) {
    if (this.startTimes.get(name)) {
      throw Error(`Statistics ${name} already started`)
    } else {
      const now = Date.now()
      this.startTimes.set(name, now)
    }
  }

  end(name: StatType) {
    const now = Date.now()
    const startTime = this.startTimes.get(name)

    if (startTime) {
      const values = this.stats.get(name) || []
      values.push(now - startTime)
      this.stats.set(name, values)
      this.startTimes.delete(name)
    } else {
      throw Error(`Statistics ${name} not started`)
    }
  }

  measure(name: StatType, func: () => any) {
    this.start(name)
    func()
    this.end(name)
  }

  snapshot(): Map<StatType, number[]> {
    return new Map(this.stats)
  }

}