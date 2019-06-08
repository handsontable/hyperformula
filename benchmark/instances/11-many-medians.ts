import {sheets, expectedValues} from '../sheets/11-many-medians'
import {benchmarkSheets} from '../benchmark'
import {Config} from '../../src'

(async () => {
  const s = sheets()

  console.info('\n === Sheet ManyMedians === ')
  await benchmarkSheets(s, expectedValues(), {
    millisecondsPerThousandRows: 10000,
    numberOfRuns: 3,
  })
})()
