import {benchmark} from "../benchmark";
import {Config as EngineConfig, CsvExporter} from "../../src";
import {randomVlookups} from "./sheets";

(() => {
  const rows = 10000
  const cols = 10
  const vlookupLines = 100
  benchmark(randomVlookups(rows, cols, vlookupLines), [], { millisecondsPerThousandRows: 10000, numberOfRuns: 10, engineConfig: new EngineConfig({ matrixDetection: false, vlookupThreshold: 10000000 })  })
})()
