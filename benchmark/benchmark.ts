import parse from 'csv-parse/lib/sync'
import * as fs from 'fs'
import {HandsOnEngine} from '../src'
import {CellValue} from '../src/Cell'
import {Config as EngineConfig} from '../src/Config'
import {StatType} from '../src/statistics/Statistics'

export interface Config {
  millisecondsPerThousandRows: number,
  numberOfRuns: number,
  csvDump?: boolean
}

const defaultConfig = {
  millisecondsPerThousandRows: 50,
  numberOfRuns: 3,
  csvDump: false,
}

export interface ExpectedValue { address: string, value: CellValue}

export function benchmarkCSV(csvString: string, config: Config) {
  benchmark(parse(csvString, {  delimiter: EngineConfig.CSV_DELIMITER }), [], config)
}

export function benchmark(sheet: string[][], expectedValues: ExpectedValue[], config: Config = defaultConfig) {
  config = Object.assign({}, defaultConfig, config)

  const stats = []
  const rows = sheet.length

  let currentRun = 0
  let engine: HandsOnEngine | null = null

  while (currentRun < config.numberOfRuns) {
    engine = HandsOnEngine.buildFromArray(sheet)
    stats.push(engine.getStats())
    currentRun++

    if (currentRun == config.numberOfRuns - 1 && !validate(engine, expectedValues)) {
      console.error('Sheet validation error')
      process.exit(1)
    }
  }

  const overall = stats.map((s) => s.get(StatType.OVERALL)!).sort()
  const evaluation = stats.map((s) => s.get(StatType.EVALUATION)!).sort()
  const medianRun = overall[Math.trunc(config.numberOfRuns / 2)]
  const parsing = stats.map((s) => s.get(StatType.PARSER)!).sort()
  const topSort = stats.map((s) => s.get(StatType.TOP_SORT)!).sort()
  const buildGraph = stats.map((s) => s.get(StatType.GRAPH_BUILD)!).sort()

  console.warn(`Number of rows: ${rows}`)
  console.warn(`Overall: ${overall.map((v) => (v / 1000))} (in seconds)`)
  console.warn(`Median overall: ${medianRun / 1000}`)
  console.warn(`Evaluation: ${evaluation.map((v) => (v / 1000))} (in seconds)`)
  console.warn(`Median evaluation: ${evaluation[Math.trunc(config.numberOfRuns / 2)] / 1000}`)
  console.warn(`Parsing: ${parsing.map((v) => (v / 1000))}`)
  console.warn(`Median parsing: ${parsing[Math.trunc(config.numberOfRuns / 2)] / 1000}`)
  console.warn(`TopSort: ${topSort.map((v) => (v / 1000))}`)
  console.warn(`Median TopSort: ${topSort[Math.trunc(config.numberOfRuns / 2)] / 1000}`)
  console.warn(`Build Graph: ${buildGraph.map((v) => (v / 1000))}`)
  console.warn(`Median BuildGraph: ${buildGraph[Math.trunc(config.numberOfRuns / 2)] / 1000}`)

  if (config.csvDump && engine !== null) {
    const csvString = engine.exportAsCSV()
    fs.writeFileSync('/tmp/dump.csv', csvString)
  }

  const resultMillisecondsPerThousandRows = medianRun / (rows / 1000)
  console.warn(`Expected to work in: ${config.millisecondsPerThousandRows} ms per 1000 rows`)
  console.warn(`Actual time: ${resultMillisecondsPerThousandRows} ms per 1000 rows`)
  if (resultMillisecondsPerThousandRows > config.millisecondsPerThousandRows) {
    process.exit(1)
  }
}

function validate(engine: HandsOnEngine, expectedValues: ExpectedValue[]) {
  let valid = true

  for (let i = 0; i < expectedValues.length; ++i) {
    let  actualValue = engine.getCellValue(expectedValues[i].address)
    let  expectedValue = expectedValues[i].value

    if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
      expectedValue = (expectedValues[i].value as number).toPrecision(10)
      actualValue = actualValue.toPrecision(10)
    }

    if (actualValue !== expectedValue) {
      console.error(`expected ${expectedValues[i].value} but got ${actualValue}`)
      valid = false
      break
    }
  }

  return valid
}
