import {milestone} from "./vlookup/sheets";
import {Config, HandsOnEngine} from "../src";
import {measure, statsToObject} from "./cruds/operations";
import {Sheet} from "../src/GraphBuilder";
import {StatType} from "../src/statistics/Statistics";
import {average} from "./benchmark";
import {sheet as sheetBGenerator} from './sheets/10-sheet-b'
import {sheet as sheetAGenerator} from './sheets/09-sheet-a'
import {simpleCellAddress} from "../src/Cell";

function sheetA() {
  const sheet = sheetAGenerator(10000)
  const stats: any[] = []

  const engine = HandsOnEngine.buildFromArray(sheet, new Config({ matrixDetection: false, vlookupThreshold: 1, useColumnIndex: false}))
  measure(engine, stats, 'Sheet A:  change value, add/remove row/column', () => {
    engine.setCellContent(simpleCellAddress(0, 0, 0), "123")
    engine.addRows(0, 5000, 1)
    engine.removeRows(0, 8000, 8000)
    engine.addColumns(0, 0, 1)
    engine.removeColumns(0, 0, 0)
    // engine.forceApplyPostponedTransformations()
  })

  console.table(stats)
}

function sheetB() {
  const sheet = sheetBGenerator(5000)
  const stats: any[] = []

  const engine = HandsOnEngine.buildFromArray(sheet, new Config({ matrixDetection: false, vlookupThreshold: 1, useColumnIndex: false}))
  measure(engine, stats, 'Sheet B: change value, add/remove row/column', () => {
    engine.setCellContent(simpleCellAddress(0, 0, 0), "123")
    engine.addRows(0, 2000, 1)
    engine.removeRows(0, 3000, 3000)
    engine.addColumns(0, 0, 1)
    engine.removeColumns(0, 0, 0)
    // engine.forceApplyPostponedTransformations()
  })

  console.assert(engine.getCellValue("E50") === 1347)
  console.table(stats)
}

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
  sheetA()
  sheetB()
})()
