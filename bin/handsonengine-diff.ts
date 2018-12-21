import parse from 'csv-parse/lib/sync'
import * as fs from 'fs'
import * as path from 'path'
import {findBoundaries} from '../src'
import {cellAddressToString, simpleCellAddress} from '../src/Cell'

// Config
const CSV_DELIMITER = ','
const FLOAT_ROUND = 2

if (process.argv.length < 4) {
  console.warn('Usage:\nyarn ts-node bin/handsonengine-diff expected.csv ours.csv 1,2,3,4\nLast argument is optional and represents indexes of columns to ignore. Zero-based, comma-separated, no spaces.')
  process.exit(1)
}
const expectedCsvPath = path.resolve(process.cwd(), process.argv[2])
if (!fs.existsSync(expectedCsvPath)) {
  console.warn(`File ${expectedCsvPath} does not exist.`)
  process.exit(1)
}

const actualCsvPath = path.resolve(process.cwd(), process.argv[3])
if (!fs.existsSync(actualCsvPath)) {
  console.warn(`File ${actualCsvPath} does not exist.`)
  process.exit(1)
}

let columnsToIgnore: number[] = []
if (process.argv[4]) {
  columnsToIgnore = process.argv[4].split(',').map((e: string) => Number(e))
}
console.warn(`Will ignore columns: ${columnsToIgnore}`)

const expectedCsvString = fs.readFileSync(expectedCsvPath, { encoding: 'utf8' })
const actualCsvString = fs.readFileSync(actualCsvPath, { encoding: 'utf8' })

const expectedArray = parse(expectedCsvString, { delimiter: CSV_DELIMITER })
const actualArray = parse(actualCsvString, { delimiter: CSV_DELIMITER })

// errors on not matching size
const expectedArrayBoundaries = findBoundaries(expectedArray)
const actualArrayBoundaries = findBoundaries(actualArray)
if (expectedArrayBoundaries.height !== actualArrayBoundaries.height || expectedArrayBoundaries.width !== actualArrayBoundaries.width) {
  console.warn(`Different sheet boundaries.`)
  console.warn(`Expected sheet: width=${expectedArrayBoundaries.width}, height=${expectedArrayBoundaries.height}`)
  console.warn(`Actual sheet: width=${actualArrayBoundaries.width}, height=${actualArrayBoundaries.height}`)
  process.exit(1)
}
const {width, height} = expectedArrayBoundaries

const differences: Array<[number, number, string, string]> = []
for (let currentRowIdx = 0; currentRowIdx < height; currentRowIdx++) {
  for (let currentColumnIdx = 0; currentColumnIdx < width; currentColumnIdx++) {
    const expectedRawValue = expectedArray[currentRowIdx][currentColumnIdx]
    const actualRawValue = actualArray[currentRowIdx][currentColumnIdx]
    if (columnsToIgnore.indexOf(currentColumnIdx) >= 0) {
      continue
    }
    let expectedValue = expectedRawValue
    let actualValue = actualRawValue
    if (!isNaN(Number(expectedValue)) && expectedValue !== '') {
      expectedValue = Number(expectedValue).toFixed(FLOAT_ROUND)
    }
    if (!isNaN(Number(actualValue)) && actualValue !== '') {
      actualValue = Number(actualValue).toFixed(FLOAT_ROUND)
    }
    if (expectedValue !== actualValue) {
      differences.push([currentRowIdx, currentColumnIdx, expectedValue, actualValue])
    }
  }
}

differences.forEach((e: [number, number, string, string]) => {
  const [currentRowIdx, currentColumnIdx, expectedValue, actualValue] = e
  console.warn(`In cell ${cellAddressToString(simpleCellAddress(currentColumnIdx, currentRowIdx))} expected '${expectedValue}' but got '${actualValue}'`)
})

if (differences.length > 0) {
  process.exit(1)
}
