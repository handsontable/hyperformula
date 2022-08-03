import { runBasicBenchmark } from './basic-benchmark'
import { runCrudsBenchmark } from './cruds-benchmark'

(() => {
  const basicResult = runBasicBenchmark()
  const crudsResult = runCrudsBenchmark()
  const allBenchmarksResult = [ ...basicResult, ...crudsResult ].map(e => ({
      name: e.name,
      totalTime: e.totalTime
    }))

  console.log(allBenchmarksResult)
})()