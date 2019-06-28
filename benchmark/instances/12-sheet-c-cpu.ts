import {sheet, expectedValues} from '../sheets/12-test-c'
import {benchmark} from '../benchmark'
import {Config} from '../../src'

(async () => {
  const s = sheet()

  console.info('\n === Sheet C (CPU) === ')
  await benchmark(s, expectedValues(s), {
    millisecondsPerThousandRows: 12000,
    numberOfRuns: 3,
    engineConfig: new Config({ gpuMode: 'cpu' })
  })
})()
