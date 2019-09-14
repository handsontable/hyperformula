import {benchmark} from "../benchmark";
import {Config as EngineConfig} from "../../src";
import {repeating} from "./sheets";

(() => {
  const rows = 10000
  const differentValues = 4
  const vlookupLines = 1000
  benchmark(repeating(rows, differentValues, vlookupLines), [], { millisecondsPerThousandRows: 10000, numberOfRuns: 10, engineConfig: new EngineConfig({ matrixDetection: false, vlookupThreshold: 10000000 })  })
})()
