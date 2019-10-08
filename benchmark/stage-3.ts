import {Config, HandsOnEngine} from '../src'
import {simpleCellAddress} from '../src/Cell'
import {Sheet} from '../src/GraphBuilder'
import {sheet as sheetAGenerator} from './sheets/09-sheet-a'
import {sheet as sheetBGenerator} from './sheets/10-sheet-b'
import {
  AdditionalStatTypes,
  averageStats,
  enrichStatistics,
  measureCruds,
  statsToObject,
  statsTreePrint,
} from './stats'
import {milestone} from './vlookup/sheets'

export function sheetA() {
  const name = 'Sheet A:  change value, add/remove row/column'
  const sheet = sheetAGenerator(10000)
  const stats: any[] = []

  const engine = HandsOnEngine.buildFromArray(sheet, new Config({ matrixDetection: false, vlookupThreshold: 1, useColumnIndex: false}))
  const buildStats = engine.getStats() as Map<string, any>
  buildStats.set(AdditionalStatTypes.NAME, name)
  statsTreePrint(enrichStatistics(buildStats))
  measureCruds(engine, stats, name, () => {
    engine.setCellContent(simpleCellAddress(0, 0, 0), '123')
    engine.addRows(0, 5000, 1)
    engine.removeRows(0, 8000, 8000)
    engine.addColumns(0, 0, 1)
    engine.removeColumns(0, 0, 0)
    // engine.forceApplyPostponedTransformations()
  })

  console.table(stats, Object.keys(stats[0]).filter(col => col !== 'NAME'))
}

export function sheetB() {
  const name = 'Sheet B: change value, add/remove row/column'
  const sheet = sheetBGenerator(5000)
  const stats: any[] = []

  const engine = HandsOnEngine.buildFromArray(sheet, new Config({ matrixDetection: false, vlookupThreshold: 1, useColumnIndex: false}))
  const buildStats = engine.getStats() as Map<string, any>
  buildStats.set(AdditionalStatTypes.NAME, name)
  statsTreePrint(enrichStatistics(buildStats))
  measureCruds(engine, stats, name, () => {
    engine.setCellContent(simpleCellAddress(0, 0, 0), '123')
    engine.addRows(0, 2000, 1)
    engine.removeRows(0, 3000, 3000)
    engine.addColumns(0, 0, 1)
    engine.removeColumns(0, 0, 0)
    // engine.forceApplyPostponedTransformations()
  })

  console.assert(engine.getCellValue('E50') === 1347)
  console.table(stats, Object.keys(stats[0]).filter(col => col !== 'NAME'))
}


export function vlookup(numberOfRuns = 10) {
  const stats: any[] = []

  const sorted = milestone(10000, 100, false)
  const shuffled = milestone(10000, 100, true)

  console.log(`VLOOKUP, no. of runs: ${numberOfRuns}`)

  run('Sorted, naive         ', numberOfRuns, sorted, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: false }), stats)
  run('Sorted, binary search ', numberOfRuns, sorted, new Config({ matrixDetection: false, vlookupThreshold: 1, useColumnIndex: false }), stats)
  run('Sorted, index         ', numberOfRuns, sorted, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: true }), stats)
  run('Shuffled, naive       ', numberOfRuns, shuffled, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: false }), stats)
  run('Shuffled, index       ', numberOfRuns, shuffled, new Config({ matrixDetection: false, vlookupThreshold: 1000000, useColumnIndex: true }), stats)

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
  sheetA()
  sheetB()
}
