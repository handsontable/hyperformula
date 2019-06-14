import {HandsOnEngine} from '../src'
import {CellValue} from '../src/Cell'
import {Config as EngineConfig} from '../src/Config'
import {Sheet, Sheets, CsvSheets} from '../src/GraphBuilder'
import {StatType} from '../src/statistics/Statistics'

export interface Config {
  millisecondsPerThousandRows: number,
  numberOfRuns: number,
  engineConfig?: EngineConfig,
}

export const defaultConfig = {
  millisecondsPerThousandRows: 50,
  numberOfRuns: 1,
  engineConfig: new EngineConfig(),
}

export interface ExpectedValue {
  address: string,
  value: CellValue
}

export function benchmark(sheet: Sheet, expectedValues: ExpectedValue[], config: Config = defaultConfig): HandsOnEngine {
  const runEngine = (engineConfig: EngineConfig) => HandsOnEngine.buildFromArray(sheet, engineConfig)
  return benchmarked(runEngine, expectedValues, config)
}

export function benchmarkSheets(sheets: Sheets, expectedValues: ExpectedValue[], config: Config = defaultConfig): HandsOnEngine {
  const runEngine = (engineConfig: EngineConfig) => HandsOnEngine.buildFromSheets(sheets, engineConfig)
  return benchmarked(runEngine, expectedValues, config)
}

export function benchmarkCsvSheets(sheets: CsvSheets, expectedValues: ExpectedValue[], config: Config = defaultConfig): HandsOnEngine {
  const runEngine = (engineConfig: EngineConfig) => HandsOnEngine.buildFromCsvSheets(sheets, engineConfig)
  return benchmarked(runEngine, expectedValues, config)
}

function benchmarked(runEngine: (engineConfig: EngineConfig) => HandsOnEngine, expectedValues: ExpectedValue[], userConfig: Config = defaultConfig): HandsOnEngine {
  const config = Object.assign({}, defaultConfig, userConfig)

  const stats: Array<Map<StatType, number>> = []

  let currentRun = 0
  let engine: HandsOnEngine

  do {
    engine = runEngine(config.engineConfig)
    stats.push(engine.getStats())
    currentRun++

    if (currentRun === config.numberOfRuns && !validate(engine, expectedValues)) {
      console.error('Sheet validation error')
      if (process.exit) {
        process.exit(1)
      }
    }
  } while (currentRun < config.numberOfRuns)

  printStats(stats, config, rowsFromSheetsDimensions(engine.getSheetsDimensions()))
  return engine
}

function rowsFromSheetsDimensions(sheetsDimensions: Map<string, { width: number, height: number }>) {
  let sum = 0
  for (const dims of sheetsDimensions.values()) {
    sum += dims.height
  }
  return sum
}

function printStats(stats: Array<Map<StatType, number>>, config: Config, rows?: number) {
  const overall = stats.map((s) => s.get(StatType.OVERALL)!).sort()
  const evaluation = stats.map((s) => s.get(StatType.EVALUATION)!).sort()
  const medianRun = overall[Math.trunc(config.numberOfRuns / 2)]
  const parsing = stats.map((s) => s.get(StatType.PARSER)!).sort()
  const topSort = stats.map((s) => s.get(StatType.TOP_SORT)!).sort()
  const buildGraph = stats.map((s) => s.get(StatType.GRAPH_BUILD)!).sort()
  const matrixDetection = stats.map((s) => s.get(StatType.MATRIX_DETECTION)!).sort()
  const averageOverall = average(overall)
  const stdDevOverall = standardDeviation(overall)

  if (rows) {
    console.info(`Number of rows: ${rows}`)
    console.info('---')
  }

  console.info(`Median            : ${medianRun / 1000}`)
  console.info(`Average           : ${(averageOverall / 1000).toFixed(3)}`)
  console.info(`Standard deviation: ${(stdDevOverall / 1000).toFixed(3)}`)
  console.info('---')
  console.info(`Evaluation Median: ${evaluation[Math.trunc(config.numberOfRuns / 2)] / 1000}`)
  console.info(`Parsing Median   : ${parsing[Math.trunc(config.numberOfRuns / 2)] / 1000}`)
  console.info(`TopSort Median   : ${topSort[Math.trunc(config.numberOfRuns / 2)] / 1000}`)
  console.info(`BuildGraph Median: ${buildGraph[Math.trunc(config.numberOfRuns / 2)] / 1000}`)
  console.info(`Matrix detection: ${matrixDetection[Math.trunc(config.numberOfRuns / 2)] / 1000}`)

  if (rows) {
    const resultMillisecondsPerThousandRows = medianRun / (rows / 1000)
    console.info('---')
    console.info(`Expected to work in: ${config.millisecondsPerThousandRows} ms per 1000 rows`)
    console.info(`Median time  : ${resultMillisecondsPerThousandRows.toFixed(3)} ms per 1000 rows`)
    console.info(`Average time : ${(averageOverall / (rows / 1000)).toFixed(3)} ms per 1000 rows`)
    console.info(`Std deviation: ${(stdDevOverall / (rows / 1000)).toFixed(3)} ms per 1000 rows`)

    if (resultMillisecondsPerThousandRows > config.millisecondsPerThousandRows) {
      console.error('Expected time exceeded')
      process.exit(1)
    }
  }
}

function validate(engine: HandsOnEngine, expectedValues: ExpectedValue[]) {
  let valid = true

  for (let i = 0; i < expectedValues.length; ++i) {
    let actualValue = engine.getCellValue(expectedValues[i].address)
    let expectedValue = expectedValues[i].value

    if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
      expectedValue = (expectedValues[i].value as number).toPrecision(6)
      actualValue = actualValue.toPrecision(6)
    }

    if (actualValue !== expectedValue) {
      console.error(`expected ${expectedValues[i].value} but got`, actualValue)
      valid = false
      break
    }
  }

  return valid
}

function average(values: number[]): number {
  const sum = values.reduce((sum, value) => {
    return sum + value
  }, 0)
  return sum / values.length
}

function squareDiffs(values: number[], avg: number): number[] {
  return values.map((value) => {
    const diff = value - avg
    return diff * diff
  })
}

function standardDeviation(values: number[]): number {
  const avg = average(values)
  const sqrDiffs = squareDiffs(values, avg)
  const avgSquareDiffs = average(sqrDiffs)

  return Math.sqrt(avgSquareDiffs)
}
