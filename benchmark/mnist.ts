import {Config} from '../src'
import {benchmark, benchmarkMultiSheets} from './benchmark'

async function start() {
  console.info('=== MNIST - CPU ===')
  await benchmarkMultiSheets('../HandsOnEnginePrivate/mnist/sheets', [
    {address: '$Control2.B5', value: 4},
    {address: '$Control2.B6', value: 4},
  ], new Config({
    csvDelimiter: ',',
    functionArgSeparator: ',',
    gpuMode: 'cpu',
  }))

  console.info('=== MNIST - GPU ===')
  await benchmarkMultiSheets('../HandsOnEnginePrivate/mnist/sheets', [
    {address: '$Control2.B5', value: 4},
    {address: '$Control2.B6', value: 4},
  ], new Config({
    csvDelimiter: ',',
    functionArgSeparator: ',',
    gpuMode: 'gpu',
  }))
}

start()
