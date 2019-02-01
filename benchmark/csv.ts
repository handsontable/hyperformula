import * as fs from 'fs'
import * as path from 'path'
import {benchmarkCSV} from './benchmark'

if (process.argv.length < 3) {
  console.log('Specify csv file path')
  process.exit(1)
}

const csvPath = path.resolve(process.cwd(), process.argv[2])

fs.readFile(csvPath, 'utf8', (err, data: string) => {
  benchmarkCSV(data, { millisecondsPerThousandRows: 100, numberOfRuns: 3, csvDump: true })
})
