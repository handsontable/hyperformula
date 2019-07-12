import {Config} from '../../src'
import {benchmark} from '../benchmark'
import {expectedValues, sheet} from '../sheets/12-test-c'

(async () => {
  const s = sheet()

  console.info('\n === Sheet C (CPU) === ')
  await benchmark(s, expectedValues(s), {
    millisecondsPerThousandRows: 12000,
    numberOfRuns: 3,
    engineConfig: new Config({ gpuMode: 'cpu' }),
  })
})()
