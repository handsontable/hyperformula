import {HandsOnEngine} from "../src";

export type Config = {
  millisecondsPerThousandRows: number,
  numberOfRuns: number
}

export function benchmark(sheet: string[][], config: Config = {
  millisecondsPerThousandRows: 100,
  numberOfRuns: 3
}) {
  const runsData = []
  const rows = sheet.length

  let currentRun = 0
  while (currentRun < config.numberOfRuns) {
    const engine = new HandsOnEngine()

    const timestampBefore = Date.now()
    engine.loadSheet(sheet)
    const timestampAfter = Date.now()

    runsData.push(timestampAfter - timestampBefore)

    currentRun++
  }

  runsData.sort()

  const medianRun = runsData[Math.trunc(config.numberOfRuns / 2)];
  console.warn(`Number of rows: ${rows}`)
  console.warn(`Runs: ${runsData.map((v) => (v / 1000))} (in seconds)`)
  console.warn(`Median run: ${medianRun / 1000}`)

  const resultMillisecondsPerThousandRows = medianRun / (rows / 1000)
  console.warn(`Expected to work in: ${config.millisecondsPerThousandRows} ms per 1000 rows`)
  console.warn(`Actual time: ${resultMillisecondsPerThousandRows} ms per 1000 rows`)
  if (resultMillisecondsPerThousandRows > config.millisecondsPerThousandRows) {
    process.exit(1)
  }
}