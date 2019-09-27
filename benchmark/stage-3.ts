import {milestone} from "./vlookup/sheets";
import {Config, HandsOnEngine} from "../src";
import {statsToObject} from "./cruds/operations";
import {Sheet} from "../src/GraphBuilder";
import {StatType} from "../src/statistics/Statistics";
import {average} from "./benchmark";


function vlookup() {
  const stats: any[] = []

  const sorted = milestone(10000, 100, false)
  const shuffled = milestone(10000, 100, false)

  run("Sorted, naive         ", 10, sorted, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: false }), stats)
  run("Sorted, binary search ", 10, sorted, new Config({ matrixDetection: false, vlookupThreshold: 1, useColumnIndex: false }), stats)
  run("Sorted, index         ", 10, sorted, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: true }), stats)
  run("Shuffled, naive       ", 10, shuffled, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: false }), stats)
  run("Shuffled, index       ", 10, shuffled, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: true }), stats)

  console.table(stats)
}

function run(name: string, times: number, sheet: Sheet, config: Config, stats: any[]): any {
  const rawStats = []
  for (let i = 0; i < times; ++i) {
    const engine = HandsOnEngine.buildFromArray(sheet, config)
    rawStats.push(engine.getStats())
  }
  const averages = averageStats(rawStats)
  averages.set('NAME', name)
  averages.set('No. RUNS', times)

  const objectStats = statsToObject(averages)
  stats.push(objectStats)
  return objectStats
}

export function averageStats(stats: Map<string, number>[]): any {
  const averages = new Map<string, number>()

  for (const key of stats[0].keys()) {
    averages.set(key, average(stats.map(stats => stats.get(key)!)))
  }

  return averages
}
(() => {
  vlookup()
})()
