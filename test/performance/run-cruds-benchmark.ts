import { runCrudsBenchmark } from './cruds-benchmark'

(() => {
  const result = runCrudsBenchmark()
  console.table(result.map(e => ({
    name: e.name,
    totalTime: e.totalTime
  })))
})()
