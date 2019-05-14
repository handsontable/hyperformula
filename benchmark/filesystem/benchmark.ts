import {load} from '../../bin/handsonengine-multisheet'
import {Config as EngineConfig} from '../../src'
import {Sheets} from '../../src/GraphBuilder'
import {benchmarkSheets, Config, defaultConfig, ExpectedValue} from '../benchmark'

export async function benchmark(inputDir: string, expectedValues: ExpectedValue[], engineConfig: EngineConfig, config: Config = defaultConfig) {
  const sheets: Sheets = await load(inputDir, engineConfig)
  return benchmarkSheets(sheets, expectedValues, config)
}
