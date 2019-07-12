import {Config} from '../../src'
import {benchmarkCsvSheets} from '../benchmark'
import {expectedValues, sheets} from '../sheets/13-sheet-d'

(async () => {
  const s = sheets()

  console.info('\n === Sheet D (GPU) === ')
  await benchmarkCsvSheets(s, expectedValues(), {
    millisecondsPerThousandRows: 15000,
    numberOfRuns: 3,
    engineConfig: new Config({ gpuMode: 'gpu' }),
  })
})()
