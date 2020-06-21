import {CellValue, ConfigParams, HyperFormula, Sheet} from '../../src'
import {
  average,
  EnrichedStatType,
  enrichStatistics,
  ExtStatType,
  measureCruds,
  reduceStats, statsTreePrint,
  statsTreePrintCruds
} from './utils/stats'
import {numberOfRows} from './utils/utils'

export interface Config {
  expectedTime?: number,
  numberOfRuns: number,
  engineConfig?: Partial<ConfigParams>,
}

export const defaultConfig: Config = {
  numberOfRuns: 1,
}

export interface ExpectedValue {
  address: string,
  value: CellValue,
}

export function benchmark(name: string, sheet: Sheet, expectedValues: ExpectedValue[], config: Partial<Config> = defaultConfig): HyperFormula {
  const runEngine = (engineConfig?: Partial<ConfigParams>) => HyperFormula.buildFromArray(sheet, engineConfig)
  return benchmarkBuild(name, runEngine, expectedValues, config)
}

function benchmarkBuild(name: string, runEngine: (engineConfig?: Partial<ConfigParams>) => HyperFormula, expectedValues: ExpectedValue[], userConfig: Partial<Config> = defaultConfig): HyperFormula {
  console.info(`=== Benchmark - ${name} === `)

  const config = Object.assign({}, defaultConfig, userConfig)
  const engineConfig = Object.assign({}, config.engineConfig, { useStats: true})

  const statistics: Map<EnrichedStatType, number>[] = []

  let currentRun = 0
  let engine: HyperFormula

  do {
    engine = runEngine(engineConfig)
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
  const time = Number(((averages.get(EnrichedStatType.BUILD_ENGINE_TOTAL) || 0) / (numberOfRows(engine) / 1000)).toFixed(3))
  checkExpectedTime('Average total time per 1000 rows', time, config.expectedTime)

  return engine
}

export function benchmarkCruds(name: string, sheet: Sheet, cruds: (engine: HyperFormula) => void, expectedValues: ExpectedValue[], userConfig: Partial<Config> = defaultConfig): HyperFormula {
  console.info(`=== Benchmark - ${name} === `)

  const config = Object.assign({}, defaultConfig, userConfig)
  const engineConfig = Object.assign({}, config.engineConfig, { useStats: true})

  const engine = HyperFormula.buildFromArray(sheet, engineConfig)

  const statistics = measureCruds(engine, name, cruds)

  if (!validate(engine, expectedValues)) {
    console.error('Sheet validation error')
    if (process.exit) {
      process.exit(1)
    }
    return engine
  }

  statsTreePrintCruds(statistics)
  checkExpectedTime('CRUDS total time', statistics.get(ExtStatType.CRUDS_TOTAL) || 0, config.expectedTime)

  console.info('\n')

  return engine
}

function validate(engine: HyperFormula, expectedValues: ExpectedValue[]) {
  let valid = true

  for (let i = 0; i < expectedValues.length; ++i) {
    let expectedValue = expectedValues[i].value

    const address = engine.simpleCellAddressFromString(expectedValues[i].address, 0)!
    let actualValue = engine.getCellValue(address)

    if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
      expectedValue = expectedValue.toPrecision(8)
      actualValue = actualValue.toPrecision(8)
    }

    if (actualValue !== expectedValue) {
      console.error(`expected ${expectedValue} but got`, actualValue)
      valid = false
      break
    }
  }

  return valid
}

function checkExpectedTime(name: string, totalTime: number, limit: number | undefined) {
  console.info(`${name}: ${totalTime}. Expected: ${limit}`)
  if (limit !== undefined && totalTime > limit) {
    console.error('Time exceeded')
    if (process.exit) {
      process.exit(1)
    }
  }
}