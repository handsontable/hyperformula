import parse from 'csv-parse/lib/sync'
import * as fs from 'fs'
import * as path from 'path'
import {findBoundaries} from '../src'
import {sheetCellAddress, sheetCellAddressToString} from '../src/Cell'

// Config
const CSV_DELIMITER = ','
const FLOAT_ROUND = 2

if (process.argv.length < 5) {
  console.log('Usage:\nyarn ts-node bin/handsonengine-diff formulas.csv expected.csv ours.csv 1,2,3,4\nLast argument is optional and represents indexes of columns to ignore. Zero-based, comma-separated, no spaces.')
  process.exit(1)
}

const formulasCsvPath = path.resolve(process.cwd(), process.argv[2])
if (!fs.existsSync(formulasCsvPath)) {
  console.log(`File ${formulasCsvPath} does not exist.`)
  process.exit(1)
}

const expectedCsvPath = path.resolve(process.cwd(), process.argv[3])
if (!fs.existsSync(expectedCsvPath)) {
  console.log(`File ${expectedCsvPath} does not exist.`)
  process.exit(1)
}

const actualCsvPath = path.resolve(process.cwd(), process.argv[4])
if (!fs.existsSync(actualCsvPath)) {
  console.log(`File ${actualCsvPath} does not exist.`)
  process.exit(1)
}

let columnsToIgnore: number[] = []
if (process.argv[5]) {
  columnsToIgnore = process.argv[5].split(',').map((e: string) => Number(e))
}
console.log(`Will ignore columns: ${columnsToIgnore}`)

const formulasCsvString = fs.readFileSync(formulasCsvPath, { encoding: 'utf8' })
const expectedCsvString = fs.readFileSync(expectedCsvPath, { encoding: 'utf8' })
const actualCsvString = fs.readFileSync(actualCsvPath, { encoding: 'utf8' })

const formulasArray = parse(formulasCsvString, { delimiter: CSV_DELIMITER })
const expectedArray = parse(expectedCsvString, { delimiter: CSV_DELIMITER })
const actualArray = parse(actualCsvString, { delimiter: CSV_DELIMITER })

// errors on not matching size
const formulasArrayBoundaries = findBoundaries(formulasArray)
const expectedArrayBoundaries = findBoundaries(expectedArray)
const actualArrayBoundaries = findBoundaries(actualArray)
if (expectedArrayBoundaries.height !== actualArrayBoundaries.height || expectedArrayBoundaries.width !== actualArrayBoundaries.width || expectedArrayBoundaries.height !== formulasArrayBoundaries.height || expectedArrayBoundaries.width !== formulasArrayBoundaries.width) {
  console.log(`Different sheet boundaries.`)
  console.log(`Formulas sheet: width=${formulasArrayBoundaries.width}, height=${formulasArrayBoundaries.height}`)
  console.log(`Expected sheet: width=${expectedArrayBoundaries.width}, height=${expectedArrayBoundaries.height}`)
  console.log(`Actual sheet: width=${actualArrayBoundaries.width}, height=${actualArrayBoundaries.height}`)
  process.exit(1)
}
const {width, height} = expectedArrayBoundaries

const differences: Array<[number, number, string, string, string]> = []
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
      differences.push([currentRowIdx, currentColumnIdx, expectedValue, actualValue, formulasArray[currentRowIdx][currentColumnIdx]])
    }
  }
}

differences.forEach((e: [number, number, string, string, string]) => {
  const [currentRowIdx, currentColumnIdx, expectedValue, actualValue, formulaString] = e
  console.log(`In cell ${sheetCellAddressToString(sheetCellAddress(currentColumnIdx, currentRowIdx))} expected '${expectedValue}' but got '${actualValue}'. Original raw cell content: ${formulaString}`)
})

if (differences.length > 0) {
  process.exit(1)
}
