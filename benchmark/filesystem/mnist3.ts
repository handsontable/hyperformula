import {Config} from '../../src'
import {benchmark} from './benchmark'
import {save} from "../../bin/handsonengine-multisheet";

async function start() {
  console.info('=== MNIST 3 - CPU / matrix detection ===')
  await benchmark('../HandsOnEnginePrivate/mnist3/sheets', [
    {address: '$Configuration.B5', value: 3},
    {address: '$Configuration.B6', value: 3},
  ], {
    millisecondsPerThousandRows: 100000000, numberOfRuns: 3, engineConfig: new Config({
      csvDelimiter: ',',
      functionArgSeparator: ',',
      gpuMode: 'gpu',
      matrixDetection: true
    })
  })

  console.info('=== MNIST 3 - CPU / matrix detection ===')
  await benchmark('../HandsOnEnginePrivate/mnist3/sheets', [
    {address: '$Configuration.B5', value: 3},
    {address: '$Configuration.B6', value: 3},
  ], {
    millisecondsPerThousandRows: 100000000, numberOfRuns: 3, engineConfig: new Config({
      csvDelimiter: ',',
      functionArgSeparator: ',',
      gpuMode: 'cpu',
      matrixDetection: true
    })
  })
}

start()
