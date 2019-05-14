import {Config} from '../../src'
import {benchmark} from './benchmark'

async function start() {
  console.info('=== MNIST - CPU ===')
  await benchmark('../HandsOnEnginePrivate/mnist/sheets', [
    {address: '$Control2.B5', value: 4},
    {address: '$Control2.B6', value: 4},
  ], new Config({
    csvDelimiter: ',',
    functionArgSeparator: ',',
    gpuMode: 'cpu',
  }), { millisecondsPerThousandRows: 1000, numberOfRuns: 3})

  console.info('=== MNIST - GPU ===')
  await benchmark('../HandsOnEnginePrivate/mnist/sheets', [
    {address: '$Control2.B5', value: 4},
    {address: '$Control2.B6', value: 4},
  ], new Config({
    csvDelimiter: ',',
    functionArgSeparator: ',',
    gpuMode: 'gpu',
    matrixDetection: false,
  }), { millisecondsPerThousandRows: 1000, numberOfRuns: 3})

  console.info('=== MNIST - GPU matrix detection ===')
  await benchmark('../HandsOnEnginePrivate/mnist/sheets', [
    {address: '$Control2.B5', value: 4},
    {address: '$Control2.B6', value: 4},
  ], new Config({
    csvDelimiter: ',',
    functionArgSeparator: ',',
    gpuMode: 'gpu',
    matrixDetection: true,
  }), { millisecondsPerThousandRows: 1000, numberOfRuns: 3})
}

start()
