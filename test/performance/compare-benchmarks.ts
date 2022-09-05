import fs = require('fs')
import asTable = require('as-table')

interface ResultSuite {
  suiteName: string,
  results: { testName: string, time: number }[],
}

(() => {
  try {
    const args = process.argv.slice(2)

    if (!args || args.length !== 3) {
      console.log('Usage:\n$ npm run benchmark:compare-benchmarks base-benchmarks.json current-change-benchmarks.json output-file.md')
      return
    }

    const inputFilenames = args.slice(0, 2)
    const outputFilename = args[2]

    const resultSuites: ResultSuite[] = inputFilenames.map(readResultSuiteFromFile)
    const benchmarkTable = buildBenchmarkTable(resultSuites)
    writeTableToFile(benchmarkTable, outputFilename)
  } catch (err) {
    console.error(err)
  }
})()

function writeTableToFile(tableData: { [key: string]: string | number }[], filename: string): void {
  const tableRenderer = asTable.configure({ delimiter: ' | ', right: true })
  const renderedTable = `\n\n\`\`\`\n${tableRenderer(tableData)}\n\`\`\`\n`

  try {
    fs.writeFileSync(filename, renderedTable)
    console.log(`Output written to file ${filename}`)
  } catch (err) {
    throw new Error(`Cannot write data to file ${filename}\n${err}`)
  }
}

function readResultSuiteFromFile(filename: string): ResultSuite {
  const suiteName = filenameWithNoExtension(filename)
  const resultsFromFile = readResultsFromFile(filename)
  const results = resultsFromFile.map(item => ({ testName: item.name, time: item.totalTime }))
  return { suiteName, results }
}

function filenameWithNoExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '')
}

function readResultsFromFile(filename: string): { name: string, totalTime: number }[] {
  try {
    const rawFileContent = fs.readFileSync(filename)
    return JSON.parse(rawFileContent.toString())
  } catch (err) {
    throw new Error(`Cannot read results from ${filename}\n${err}`)
  }
}

function buildBenchmarkTable(resultSuites: ResultSuite[]): { [key: string]: string | number }[] {
  const testNames = resultSuites[0].results.map(bm => bm.testName)
  return testNames.map(testName => buildBenchmarkTableRow(testName, resultSuites))
}

function buildBenchmarkTableRow(testName: string, resultSuites: ResultSuite[]): { [key: string]: string | number } {
  const testResultsEntries = resultSuites.map(resultSuite => findTestResultInSuite(testName, resultSuite))
  const changeEntries = calculateChangeFromBase(testResultsEntries)
  const testResultsObj = (Object as any).fromEntries([ ...testResultsEntries, ...changeEntries ])
  return { testName, ...testResultsObj }
}

function calculateChangeFromBase(testResultsEntries: [string, number][]): [string, string][] {
  const [baseSuiteName, baseSuiteResult] = testResultsEntries[0]
  const resultsWithoutBase = testResultsEntries.filter(([currSuiteName, _]) => currSuiteName !== baseSuiteName)
  return resultsWithoutBase.map(currResultEntry => buildChangeEntry(currResultEntry, baseSuiteResult))
}

function buildChangeEntry([_, currSuiteResult]: [string, number], baseSuiteResult: number): [string, string] {
  const change = (currSuiteResult - baseSuiteResult) / baseSuiteResult * 100.0
  const formattedChange = `${change > 0.0 ? '+' : ''}${change.toFixed(2)}%`
  return ['change', formattedChange]
}

function findTestResultInSuite(testName: string, resultSuite: ResultSuite): [string, number] {
  const resultItem = resultSuite.results.find(res => res.testName === testName)

  if (!resultItem) {
    throw new Error(`Cannot find result for test '${testName}' in suite ${resultSuite.suiteName}`)
  }

  return [resultSuite.suiteName, resultItem.time]
}
