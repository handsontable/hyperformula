import * as fs from 'fs'
import {benchmarkCSV} from '../benchmark'

fs.readFile('/tmp/money-manager.csv', 'utf8', (err, data: string) => {
  benchmarkCSV(data, { millisecondsPerThousandRows: 100, numberOfRuns: 3, csvDump: true })
})
