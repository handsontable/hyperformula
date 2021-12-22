import {CellValue, ConfigParams, HyperFormula, Sheet} from '../../src'
import {Maybe} from '../../src/Maybe'
import {
  average,
  EnrichedStatType,
  enrichStatistics,
  ExtStatType,
  measureCruds,
  reduceStats,
  Stats,
  statsTreePrint,
  statsTreePrintCruds
} from './utils/stats'

export interface Config {
  expectedTime?: number,
  numberOfRuns: number,
  engineConfig?: Partial<ConfigParams>,
}

export const defaultConfig: Config = {
  numberOfRuns: 1,
}

export const defaultEngineConfig: Partial<ConfigParams> = {
  useStats: true,
  licenseKey: 'gpl-v3'
}

export interface ExpectedValue {
  address: string,
  value: CellValue,
}

export interface BenchmarkResult {
  name: string,
  engine: HyperFormula,
  totalTime: number,
  statistics: Stats,
}

export function benchmark(name: string, sheet: Sheet, expectedValues: ExpectedValue[], config: Partial<Config> = defaultConfig): Maybe<BenchmarkResult> {
  const runEngine = (engineConfig?: Partial<ConfigParams>) => HyperFormula.buildFromArray(sheet, engineConfig)
  return benchmarkBuild(name, runEngine, expectedValues, config)
}

export function benchmarkCruds(name: string, sheet: Sheet, cruds: (engine: HyperFormula) => void,
                               expectedValues: ExpectedValue[], userConfig: Partial<Config> = defaultConfig): Maybe<BenchmarkResult> {
  console.info(`=== Benchmark - ${name} === `)

  const config = Object.assign({}, defaultConfig, userConfig)
  const engineConfig = Object.assign({}, config.engineConfig, defaultEngineConfig)

  const [engine] = HyperFormula.buildFromArray(sheet, engineConfig)

  const statistics = measureCruds(engine, name, cruds)

  if (!validate(engine, expectedValues)) {
    console.error('Sheet validation error')
    if (process.exit) {
      process.exit(1)
    }
    return
  }

  const totalTime = statistics.get(ExtStatType.CRUDS_TOTAL) || 0
  statsTreePrintCruds(statistics)

  return {
    name: name,
    engine: engine,
    totalTime: totalTime,
    statistics: statistics,
  }
}

export function batch(stats: BenchmarkResult[], ...benchmarks: (() => Maybe<BenchmarkResult>)[]): void {
  for (const benchmark of benchmarks) {
    const result = benchmark()
    if (result !== undefined) {
      stats.push(result)
    }
  }
}

function benchmarkBuild(name: string, runEngine: (engineConfig?: Partial<ConfigParams>) => HyperFormula,
                        expectedValues: ExpectedValue[], userConfig: Partial<Config> = defaultConfig): Maybe<BenchmarkResult> {
  console.info(`=== Benchmark - ${name} === `)

  const config = Object.assign({}, defaultConfig, userConfig)
  const engineConfig = Object.assign({}, config.engineConfig, defaultEngineConfig)

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
      return
    }
  } while (currentRun < config.numberOfRuns)

  const averages = reduceStats(statistics, average)
  statsTreePrint(averages)
  const totalTime = averages.get(EnrichedStatType.BUILD_ENGINE_TOTAL) || 0

  return {
    name: name,
    engine: engine,
    statistics: averages,
    totalTime: totalTime
  }
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
