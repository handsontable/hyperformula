
import {benchmarkSheets} from '../benchmark'
import {expectedValues, sheets} from '../sheets/11-many-medians'

(async () => {
  const s = sheets()

  console.info('\n === Sheet ManyMedians === ')
  await benchmarkSheets(s, expectedValues(), {
    millisecondsPerThousandRows: 10000,
    numberOfRuns: 3,
  })
})()
