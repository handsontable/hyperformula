import {CellValue, ConfigParams, HyperFormula, Sheet} from '../src'
import {average, EnrichedStatType, enrichStatistics, reduceStats, statsTreePrint} from './utils/stats'

export interface Config {
  millisecondsPerThousandRows?: number,
  numberOfRuns: number,
  engineConfig?: Partial<ConfigParams>,
}

export const defaultConfig: Config = {
  numberOfRuns: 1,
  engineConfig: {useStats: true}
}

export interface ExpectedValue {
  address: string,
  value: CellValue,
}

export function benchmark(name: string, sheet: Sheet, expectedValues: ExpectedValue[], config: Config = defaultConfig): HyperFormula {
  const runEngine = (engineConfig?: Partial<ConfigParams>) => HyperFormula.buildFromArray(sheet, engineConfig)
  return benchmarked(name, runEngine, expectedValues, config)
}

function benchmarked(name: string, runEngine: (engineConfig?: Partial<ConfigParams>) => HyperFormula, expectedValues: ExpectedValue[], userConfig: Config = defaultConfig): HyperFormula {
  console.info(`=== Benchmark - ${name} === `)
  const config = Object.assign({}, defaultConfig, userConfig)

  const statistics: Map<EnrichedStatType, number>[] = []

  let currentRun = 0
  let engine: HyperFormula

  do {
    engine = runEngine(config.engineConfig)
    statistics.push(enrichStatistics(engine.getStats()))

    currentRun++

    if (!validate(engine, expectedValues)) {
      console.error('Sheet validation error')
      if (process.exit) {
        process.exit(1)
      }
      return engine
    }
  } while (currentRun < config.numberOfRuns)

  const averages = reduceStats(statistics, average)

  statsTreePrint(averages)
  checkExpectedTime(averages.get(EnrichedStatType.BUILD_ENGINE_TOTAL) || 0, numberOfRows(engine), config.millisecondsPerThousandRows)
  console.info('\n')

  return engine
}

function numberOfRows(engine: HyperFormula) {
  const dimensions = engine.getAllSheetsDimensions()
  let sum = 0
  const sheetNames = Object.getOwnPropertyNames(dimensions)
  for (const sheet of sheetNames) {
    sum += dimensions[sheet].height
  }
  return sum
}

function validate(engine: HyperFormula, expectedValues: ExpectedValue[]) {
  let valid = true

  for (let i = 0; i < expectedValues.length; ++i) {
    let expectedValue = expectedValues[i].value

    const address = engine.simpleCellAddressFromString(expectedValues[i].address, 0)!
    let actualValue = engine.getCellValue(address)

    if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
      expectedValue = expectedValue.toPrecision(6)
      actualValue = actualValue.toPrecision(6)
    }

    if (actualValue !== expectedValue) {
      console.error(`expected ${expectedValue} but got`, actualValue)
      valid = false
      break
    }
  }

  return valid
}

function checkExpectedTime(totalTime: number, rows: number, limit: number | undefined) {
  const totalTimePer1000Rows = Number((totalTime / (rows / 1000)).toFixed(3))
  if (limit !== undefined && totalTimePer1000Rows > limit) {
    console.error(`Average total time per 1000 rows exceeded. Took: ${totalTimePer1000Rows}, expected: ${limit}`)
  } else {
    console.info(`Average total time per 1000 rows: ${totalTimePer1000Rows}`)
  }
}