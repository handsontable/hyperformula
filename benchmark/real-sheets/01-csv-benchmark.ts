import * as fs from 'fs'
import {benchmarkCSV} from '../benchmark'

fs.readFile('/home/voodoo11/Dokumenty/1-transactions.csv', 'utf8', (err, data: string) => {
  benchmarkCSV(data, { millisecondsPerThousandRows: 100, numberOfRuns: 3, csvDump: true })
})
