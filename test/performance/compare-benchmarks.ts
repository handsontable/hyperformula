import fs = require('fs')

interface ResultSuite {
  suiteName: string,
  results: { testName: string, time: number }[],
}

(() => {
  const filenames = process.argv.slice(2)

  if (!filenames || !filenames.length) {
    console.log('Usage:\n$ npm run benchmark:compare-benchmarks file1.json file2.json file3.json ...')
    return
  }

  const resultSuites: ResultSuite[] = filenames.map(readResultSuiteFromFile)
  const benchmarkTable = buildBenchmarkTable(resultSuites)
  console.table(benchmarkTable)
})()

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
    console.error(`Cannot read results from ${filename}`, err)
    return []
  }
}

function buildBenchmarkTable(resultSuites: ResultSuite[]): { [key: string]: string | number }[] {
  const testNames = resultSuites[0].results.map(bm => bm.testName)
  return testNames.map(testName => buildBenchmarkTableRow(testName, resultSuites))
}

function buildBenchmarkTableRow(testName: string, resultSuites: ResultSuite[]): { [key: string]: string | number } {
  const testResultsArr = resultSuites.map(resultSuite => findTestResultInSuite(testName, resultSuite))
  const testResults = testResultsArr.reduce((acc, item) => ({ ...acc, ...item }), {})
  return { testName, ...testResults }
}

function findTestResultInSuite(testName: string, resultSuites: ResultSuite): { [key: string]: number } {
  const resultItem = resultSuites.results.find(res => res.testName === testName)

  if (!resultItem) {
    console.error(`Cannot find result for test '${testName}' in suite ${resultSuites.suiteName}`)
    return {}
  }

  return { [resultSuites.suiteName]: resultItem.time }
}
