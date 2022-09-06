import { runBasicBenchmark } from './basic-benchmark'

(() => {
  const result = runBasicBenchmark()
  console.table(result.map(e => ({
    name: e.name,
    totalTime: e.totalTime
  })))
})()
