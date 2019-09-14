import {benchmark} from "../benchmark";
import {Config as EngineConfig} from "../../src";
import {topdown} from "./sheets";


(() => {
  const rows = 10000
  benchmark(topdown(rows, 1000), [
    {address: `A${rows}`, value: 1},
  ], { millisecondsPerThousandRows: 10000, numberOfRuns: 3, engineConfig: new EngineConfig({ matrixDetection: false, vlookupThreshold: 10000000 })  })
})()
