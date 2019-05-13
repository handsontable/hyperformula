import {Config} from '../../src'
import {benchmark} from './benchmark'

async function start() {
  console.info(' === DeepExcel default === ')
  await benchmark('../HandsOnEnginePrivate/deepexcel/default', [{address: '$resp7.A6', value: 0.9880945703}], new Config({
    csvDelimiter: ';',
    functionArgSeparator: ',',
    gpuMode: 'cpu',
  }), { millisecondsPerThousandRows: 200, numberOfRuns: 3})

  console.info('\n === DeepExcel - resp1/resp3 as maxpool - CPU === ')
  await benchmark('../HandsOnEnginePrivate/deepexcel/maxpool', [{address: '$resp7.A6', value: 0.9880945703}], new Config({
    csvDelimiter: ';',
    functionArgSeparator: ',',
    gpuMode: 'cpu',
  }), { millisecondsPerThousandRows: 200, numberOfRuns: 3})

  console.info('\n === DeepExcel - resp1/resp3 as maxpool - GPU === ')
  await benchmark('../HandsOnEnginePrivate/deepexcel/maxpool', [{address: '$resp7.A6', value: 0.9880945703}], new Config({
    csvDelimiter: ';',
    functionArgSeparator: ',',
    gpuMode: 'gpu',
  }), { millisecondsPerThousandRows: 200, numberOfRuns: 3})
}

start()
