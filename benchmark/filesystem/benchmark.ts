import {load} from '../../bin/handsonengine-multisheet'
import {Config as EngineConfig, HandsOnEngine} from '../../src'
import {Sheets} from '../../src/GraphBuilder'
import {benchmarkSheets, Config, defaultConfig, ExpectedValue} from '../benchmark'

export async function benchmark(inputDir: string, expectedValues: ExpectedValue[], config: Config = defaultConfig): Promise<HandsOnEngine> {
  const sheets: Sheets = await load(inputDir, config.engineConfig || new EngineConfig())
  return benchmarkSheets(sheets, expectedValues, config)
}
