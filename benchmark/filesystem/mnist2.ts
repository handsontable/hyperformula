import {Config} from '../../src'
import {benchmark} from './benchmark'

async function start() {
  console.info('=== MNIST 2 - CPU ===')
  await benchmark('../HandsOnEnginePrivate/mnist2/sheets', [
    {address: '$Configuration.B5', value: 3},
    {address: '$Configuration.B6', value: 3},
  ], {
    millisecondsPerThousandRows: 100000000, numberOfRuns: 3, engineConfig: new Config({
      csvDelimiter: ',',
      functionArgSeparator: ',',
      gpuMode: 'cpu',
    })
  })

  console.info('=== MNIST 2 - GPU ===')
  await benchmark('../HandsOnEnginePrivate/mnist2/sheets', [
    {address: '$Configuration.B5', value: 3},
    {address: '$Configuration.B6', value: 3},
  ], {
    millisecondsPerThousandRows: 100000000, numberOfRuns: 3, engineConfig: new Config({
      csvDelimiter: ',',
      functionArgSeparator: ',',
      gpuMode: 'gpu',
    })
  })
}

start()
