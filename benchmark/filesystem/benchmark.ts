import {benchmarkSheets, Config, defaultConfig, ExpectedValue} from "../benchmark";
import {Config as EngineConfig} from "../../src"
import {Sheets} from "../../src/GraphBuilder";
import {load} from "../../bin/handsonengine-multisheet";

export async function benchmark(inputDir: string, expectedValues: ExpectedValue[], engineConfig: EngineConfig, config: Config = defaultConfig) {
  const sheets: Sheets = await load(inputDir, engineConfig)
  return benchmarkSheets(sheets, expectedValues, config)
}
