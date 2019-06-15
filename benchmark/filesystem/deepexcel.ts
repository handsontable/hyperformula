import {Config} from '../../src'
import {benchmark} from './benchmark'

async function start() {
  console.info(' === DeepExcel default === ')
  await benchmark('../HandsOnEnginePrivate/deepexcel/default', [{address: '$resp7.A6', value: 0.9880945703}], ";", { millisecondsPerThousandRows: 200, numberOfRuns: 3, engineConfig: new Config({
      functionArgSeparator: ',',
      gpuMode: 'cpu',
    })
  })

  console.info('\n === DeepExcel - resp1/resp3 as maxpool - CPU === ')
  await benchmark('../HandsOnEnginePrivate/deepexcel/maxpool', [{address: '$resp7.A6', value: 0.9880945703}], ";", { millisecondsPerThousandRows: 200, numberOfRuns: 3, engineConfig: new Config({
      functionArgSeparator: ',',
      gpuMode: 'cpu',
    })
  })

  console.info('\n === DeepExcel - resp1/resp3 as maxpool - GPU === ')
  await benchmark('../HandsOnEnginePrivate/deepexcel/maxpool', [{address: '$resp7.A6', value: 0.9880945703}], ";", { millisecondsPerThousandRows: 200, numberOfRuns: 3, engineConfig: new Config({
      functionArgSeparator: ',',
      gpuMode: 'gpu',
    })
  })
}

start()
