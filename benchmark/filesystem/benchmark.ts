import {load} from '../../bin/handsonengine-multisheet'
import { HandsOnEngine} from '../../src'
import {Sheets} from '../../src/GraphBuilder'
import {benchmarkSheets, Config, defaultConfig, ExpectedValue} from '../benchmark'

export async function benchmark(inputDir: string, expectedValues: ExpectedValue[], csvDelimiter: string = ',', config: Config = defaultConfig): Promise<HandsOnEngine> {
  const sheets: Sheets = await load(inputDir, csvDelimiter)
  return benchmarkSheets(sheets, expectedValues, config)
}
