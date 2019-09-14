import {benchmark} from "../benchmark";
import {Config as EngineConfig} from "../../src";
import {simpleSorted} from "./sheets";



(() => {
  const rows = 10000
  benchmark(simpleSorted(rows), [
    {address: `A${rows+1}`, value: 1},
    {address: `B${rows+1}`, value: Math.floor(rows / 2)},
    {address: `C${rows+1}`, value: rows},
  ], { millisecondsPerThousandRows: 10000, numberOfRuns: 3, engineConfig: new EngineConfig({ matrixDetection: false })  })
})()

