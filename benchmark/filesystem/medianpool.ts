import {Config} from '../../src'
import {benchmark} from './benchmark'

async function start() {
  // console.info(' === MEDIANS 100/10 === ')
  // await benchmark('../HandsOnEnginePrivate/medianpool/median100_stride10', [{address: '$result.A1', value: 5.01915}], ";", { millisecondsPerThousandRows: 20000, numberOfRuns: 3, engineConfig: new Config({
  //     functionArgSeparator: ',',
  //     gpuMode: 'cpu',
  //   })
  // })

  // console.info('\n === MEDIANPOOL 100/10 - CPU === ')
  // await benchmark('../HandsOnEnginePrivate/medianpool/medianpool100_stride10', [{address: '$result.A1', value: 4.49536}], ";", { millisecondsPerThousandRows: 20000, numberOfRuns: 3, engineConfig: new Config({
  //     functionArgSeparator: ',',
  //     gpuMode: 'cpu',
  //   })
  // })

  // console.info('\n === MEDIANPOOL 100/10 - GPU === ')
  // await benchmark('../HandsOnEnginePrivate/medianpool/medianpool100_stride10', [{address: '$result.A1', value: 4.49536}], ";", { millisecondsPerThousandRows: 20000, numberOfRuns: 3, engineConfig: new Config({
  //     functionArgSeparator: ',',
  //     gpuMode: 'gpu',
  //   })
  // })

  console.info(' === MEDIANS 100/50 === ')
  await benchmark('../HandsOnEnginePrivate/medianpool/median100_stride50', [{address: '$result.A1', value: 4.91906}], ';', { millisecondsPerThousandRows: 20000, numberOfRuns: 3, engineConfig: new Config({
      functionArgSeparator: ',',
      gpuMode: 'cpu',
    }),
  })

  console.info('\n === MEDIANPOOL 100/50 - CPU === ')
  await benchmark('../HandsOnEnginePrivate/medianpool/medianpool100_stride50', [{address: '$result.A1', value: 4.90532}], ';', { millisecondsPerThousandRows: 20000, numberOfRuns: 3, engineConfig: new Config({
      functionArgSeparator: ',',
      gpuMode: 'cpu',
    }),
  })

  console.info('\n === MEDIANPOOL 100/50 - GPU === ')
  await benchmark('../HandsOnEnginePrivate/medianpool/medianpool100_stride50', [{address: '$result.A1', value: 4.90532}], ';', { millisecondsPerThousandRows: 20000, numberOfRuns: 3, engineConfig: new Config({
      functionArgSeparator: ',',
      gpuMode: 'gpu',
    }),
  })

  // console.info('\n === MEDIANPOOL 500/250 - CPU === ')
  // await benchmark('../HandsOnEnginePrivate/medianpool/medianpool500_stride250', [{address: '$result.A1', value: 4.99848}], ";", { millisecondsPerThousandRows: 20000, numberOfRuns: 3, engineConfig: new Config({
  //     functionArgSeparator: ',',
  //     gpuMode: 'cpu',
  //   })
  // })

  // console.info('\n === MEDIANPOOL 500/250 - GPU === ')
  // await benchmark('../HandsOnEnginePrivate/medianpool/medianpool500_stride250', [{address: '$result.A1', value: 4.99848}], ";", { millisecondsPerThousandRows: 20000, numberOfRuns: 3, engineConfig: new Config({
  //     functionArgSeparator: ',',
  //     gpuMode: 'gpu',
  //   })
  // })
}

start()
