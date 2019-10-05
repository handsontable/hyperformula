import {milestone} from "./vlookup/sheets";
import {Config, HandsOnEngine} from "../src";
import {Sheet} from "../src/GraphBuilder";
import {StatType} from "../src/statistics/Statistics";
import {average} from "./benchmark";
import {sheet as sheetBGenerator} from './sheets/10-sheet-b'
import {sheet as sheetAGenerator} from './sheets/09-sheet-a'
import {simpleCellAddress} from "../src/Cell";
import {averageStats, enrichStatistics, measure, statsToObject, statsTreePrint} from "./stats";

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
  const numberOfRuns = 10

  const sorted = milestone(10000, 100, false)
  const shuffled = milestone(10000, 100, true)

  console.log(`VLOOKUP, no. of runs: ${numberOfRuns}`)

  run("Sorted, naive         ", numberOfRuns, sorted, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: false }), stats)
  run("Sorted, binary search ", numberOfRuns, sorted, new Config({ matrixDetection: false, vlookupThreshold: 1, useColumnIndex: false }), stats)
  run("Sorted, index         ", numberOfRuns, sorted, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: true }), stats)
  run("Shuffled, naive       ", numberOfRuns, shuffled, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: false }), stats)
  run("Shuffled, index       ", numberOfRuns, shuffled, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: true }), stats)

  console.table(stats, ['NAME', ...Object.keys(stats[0])])
}

function run(name: string, times: number, sheet: Sheet, config: Config, stats: any[]): any {
  const rawStats = []
  for (let i = 0; i < times; ++i) {
    const engine = HandsOnEngine.buildFromArray(sheet, config)
    rawStats.push(enrichStatistics(engine.getStats()))
  }
  const averages = averageStats(rawStats)
  averages.set('NAME', name)

  const objectStats = statsToObject(averages)
  stats.push(objectStats)

  statsTreePrint(averages)

  return objectStats
}


export function start() {
  vlookup()
  // sheetA()
  // sheetB()
}

start()